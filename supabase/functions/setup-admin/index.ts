import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Delete old admin if exists
    const { data: oldUsers } = await supabaseAdmin.auth.admin.listUsers();
    const oldAdmin = oldUsers?.users?.find((u: any) => u.email === "admin@neuroflux.com");
    if (oldAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(oldAdmin.id);
    }

    // Check if new admin already exists
    const newAdmin = oldUsers?.users?.find((u: any) => u.email === "neuroflux@neuroflux.app");
    if (newAdmin) {
      // Ensure role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", newAdmin.id)
        .eq("role", "admin")
        .single();
      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: newAdmin.id, role: "admin" });
      }
      // Ensure password is correct and stored
      await supabaseAdmin.auth.admin.updateUserById(newAdmin.id, { password: "607652" });
      await supabaseAdmin.from("profiles").update({ senha_texto: "607652" }).eq("user_id", newAdmin.id);
      return new Response(JSON.stringify({ message: "Admin atualizado", email: "neuroflux@neuroflux.app" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user with username-based email
    const { data: adminUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "neuroflux@neuroflux.app",
      password: "607652",
      email_confirm: true,
      user_metadata: { nome: "NeuroFlux Admin", username: "NeuroFlux" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with password stored
    await supabaseAdmin.from("profiles").update({
      nome: "NeuroFlux Admin",
      senha_texto: "607652",
    }).eq("user_id", adminUser.user!.id);

    // Assign admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: adminUser.user!.id,
      role: "admin",
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Admin criado com sucesso",
      login: "NeuroFlux",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
