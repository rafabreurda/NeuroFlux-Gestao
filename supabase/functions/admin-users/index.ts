// Admin users management v4 - case-insensitive, plans dashboard
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim().replace(/\s+/g, '.')}@neuroflux.app`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Sem permissão de administrador" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    // ============ CREATE USER ============
    if (action === "create-user") {
      const { username, password, nome, cpf, telefone, endereco, bairro, cidade, estado, empresa, cnpj } = params;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Usuário e senha são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const email = usernameToEmail(username);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { nome: nome || username, username: username.toLowerCase().trim() },
      });
      if (createError) {
        const msg = createError.message.includes("already been registered") ? "Este nome de usuário já está em uso" : createError.message;
        return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabaseAdmin.from("profiles").update({
        nome: nome || username, cpf: cpf || "", cnpj: cnpj || "", telefone: telefone || "",
        endereco: endereco || "", bairro: bairro || "", cidade: cidade || "", estado: estado || "",
        empresa: empresa || "", senha_texto: password,
      }).eq("user_id", newUser.user!.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user!.id, role: "user" });
      return new Response(JSON.stringify({ success: true, user: { id: newUser.user!.id, username, nome } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ LIST USERS ============
    if (action === "list-users") {
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const { data: planos } = await supabaseAdmin.from("planos_usuarios").select("*").order("data_vencimento", { ascending: true });
      const { data: contratos } = await supabaseAdmin.from("contratos_usuarios").select("*").order("created_at", { ascending: false });

      const enriched = (profiles || []).map((p: any) => {
        const authUser = authUsers?.users?.find((u: any) => u.id === p.user_id);
        const username = authUser?.user_metadata?.username || authUser?.email?.split("@")[0] || "";
        return {
          ...p, username,
          role: roles?.find((r: any) => r.user_id === p.user_id)?.role || "user",
          planos: (planos || []).filter((pl: any) => pl.user_id === p.user_id),
          contratos: (contratos || []).filter((c: any) => c.user_id === p.user_id),
        };
      });
      return new Response(JSON.stringify({ users: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ RESET PASSWORD ============
    if (action === "reset-password") {
      const { userId, newPassword } = params;
      if (!newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabaseAdmin.from("profiles").update({ senha_texto: newPassword }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ DELETE USER ============
    if (action === "delete-user") {
      const { userId } = params;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ UPDATE USER PROFILE ============
    if (action === "update-user-profile") {
      const { userId, ...profileData } = params;
      const { error } = await supabaseAdmin.from("profiles").update(profileData).eq("user_id", userId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ ADD PLAN ============
    if (action === "add-plano") {
      const { userId, nomePlano, valor, dataInicio, dataVencimento, observacoes } = params;
      const { data, error } = await supabaseAdmin.from("planos_usuarios").insert({
        user_id: userId, nome_plano: nomePlano, valor: valor || 0,
        data_inicio: dataInicio, data_vencimento: dataVencimento, observacoes: observacoes || '',
      }).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, plano: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ DELETE PLAN ============
    if (action === "delete-plano") {
      const { planoId } = params;
      const { error } = await supabaseAdmin.from("planos_usuarios").delete().eq("id", planoId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ ADD CONTRACT ============
    if (action === "add-contrato") {
      const { userId, nomeArquivo, storagePath } = params;
      const { data, error } = await supabaseAdmin.from("contratos_usuarios").insert({
        user_id: userId, nome_arquivo: nomeArquivo, storage_path: storagePath,
      }).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, contrato: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ DELETE CONTRACT ============
    if (action === "delete-contrato") {
      const { contratoId, storagePath } = params;
      await supabaseAdmin.storage.from("contratos").remove([storagePath]);
      const { error } = await supabaseAdmin.from("contratos_usuarios").delete().eq("id", contratoId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ GET CONTRACT URL ============
    if (action === "get-contrato-url") {
      const { storagePath } = params;
      const { data, error } = await supabaseAdmin.storage.from("contratos").createSignedUrl(storagePath, 3600);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, url: data.signedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ SET ADMIN PASSWORD ============
    if (action === "set-admin-password") {
      const { userId, password } = params;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabaseAdmin.from("profiles").update({ senha_texto: password }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
