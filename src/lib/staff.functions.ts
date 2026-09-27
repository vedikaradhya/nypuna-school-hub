import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["administrator", "principal", "teacher", "front_office", "librarian"] as const;

export const createStaffMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(255),
      password: z.string().min(8).max(72),
      designation: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(20).optional(),
      roles: z.array(z.enum(ROLES)).min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "administrator" });
    if (roleErr || !isAdmin) throw new Error("Only administrators can add staff.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");
    const uid = created.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: uid, full_name: data.full_name, email: data.email,
      designation: data.designation ?? null, phone: data.phone ?? null,
    });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert(data.roles.map((role) => ({ user_id: uid, role })));
    if (rErr) throw new Error(rErr.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId, action: "staff.create", entity_type: "profiles", entity_id: uid,
      details: { email: data.email, roles: data.roles },
    });
    return { id: uid };
  });
