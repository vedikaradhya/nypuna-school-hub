import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NAV } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function Icon({ name, className }: { name: string; className: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ className: string }>>)[name];
  return C ? <C className={className} /> : null;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { hasAnyRole } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV.map((group) => {
        const items = group.items.filter((i) => hasAnyRole(i.roles));
        if (!items.length) return null;
        return (
          <div key={group.group}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {group.group}
            </p>
            <div className="space-y-1">
              {items.map((i) => (
                <Link
                  key={i.to}
                  to={i.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === i.to && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  )}
                >
                  <Icon name={i.icon} className="size-4 shrink-0" />
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { profile, roles, user, isOwner, memberships, activeSchoolId, refresh } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const approved = memberships.filter((m) => m.status === "approved");

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const switchSchool = async (id: string) => {
    const { error } = await supabase.rpc("set_active_school", { _school: id });
    if (error) return;
    await qc.cancelQueries();
    qc.clear();
    await refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <div className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">N</div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Nypuna Connect</p>
          <p className="text-[11px] text-sidebar-foreground/60">CBSE School Suite</p>
        </div>
      </div>
      {approved.length ? (
        <div className="border-b border-sidebar-border px-3 py-3">
          <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">School</p>
          <select
            aria-label="Switch school"
            className="w-full rounded-md border border-sidebar-border bg-sidebar px-2 py-1.5 text-sm text-sidebar-foreground"
            value={activeSchoolId ?? ""}
            onChange={(e) => void switchSchool(e.target.value)}
          >
            {!activeSchoolId ? <option value="">Select school</option> : null}
            {approved.map((m) => <option key={m.id} value={m.school_id}>{m.schools?.name}</option>)}
          </select>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        {isOwner ? (
          <div className="px-3 pt-4">
            <Link to="/owner" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent">
              <Icons.Building2 className="size-4" /> Owner: Schools
            </Link>
          </div>
        ) : null}
        <NavLinks onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3 text-xs">
        <p className="truncate font-medium">{profile?.full_name ?? user?.email}</p>
        <p className="truncate text-sidebar-foreground/60">{[isOwner ? "owner" : null, ...roles.map((r) => r.replace("_", " "))].filter(Boolean).join(", ") || "awaiting approval"}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
          <Icons.LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => {
              if (window.history.length > 1) router.history.back();
              else router.navigate({ to: "/dashboard" });
            }}
          >
            <Icons.ArrowLeft className="size-5" />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Icons.Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">{sidebar}</SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
