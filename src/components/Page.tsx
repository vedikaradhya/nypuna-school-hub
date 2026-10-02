import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { SchoolGate } from "@/components/SchoolGate";
import { useAuth } from "@/hooks/useAuth";
import { ROUTE_ROLES } from "@/lib/nav";

export function Page({ path, title, subtitle, actions, children }: {
  path: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { hasAnyRole, loading, roles, activeSchoolId } = useAuth();
  const allowed = ROUTE_ROLES[path] ?? [];
  const ok = hasAnyRole(allowed);

  return (
    <AppShell title={title} {...(subtitle ? { subtitle } : {})} {...(actions ? { actions } : {})}>
      {loading ? null : !activeSchoolId || !roles.length ? <SchoolGate /> : ok ? children : (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-display text-lg font-semibold">Not available for your role</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is limited to: {allowed.map((r) => r.replace("_", " ")).join(", ")}.
          </p>
        </div>
      )}
    </AppShell>
  );
}
