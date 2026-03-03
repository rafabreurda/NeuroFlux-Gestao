import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin already exists
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (existingRoles && existingRoles.length > 0) {
      return new Response(JSON.stringify({ message: "Admin já existe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user
    const { data: adminUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@neuroflux.com",
      password: "607652",
      email_confirm: true,
      user_metadata: { nome: "NeuroFlux Admin" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile
    await supabaseAdmin.from("profiles").update({
      nome: "NeuroFlux Admin",
    }).eq("user_id", adminUser.user!.id);

    // Assign admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: adminUser.user!.id,
      role: "admin",
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Admin criado com sucesso",
      email: "admin@neuroflux.com",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
