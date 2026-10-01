import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createSchoolAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      school_id: z.string().uuid(),
      full_name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(255),
      password: z.string().min(8).max(72),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: owner } = await context.supabase.rpc("is_owner");
    if (!owner) throw new Error("Only the owner can create school administrators.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");
    const uid = created.user.id;

    await supabaseAdmin.from("profiles").upsert({ id: uid, full_name: data.full_name, email: data.email, active_school_id: data.school_id });
    const { error: mErr } = await supabaseAdmin.from("school_memberships").upsert(
      { user_id: uid, school_id: data.school_id, status: "approved", requested_role: "administrator", reviewed_by: context.userId },
      { onConflict: "user_id,school_id" },
    );
    if (mErr) throw new Error(mErr.message);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "administrator", school_id: data.school_id });
    if (rErr) throw new Error(rErr.message);
    return { id: uid };
  });
