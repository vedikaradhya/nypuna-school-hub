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
  const { profile, roles, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
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
      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3 text-xs">
        <p className="truncate font-medium">{profile?.full_name ?? user?.email}</p>
        <p className="truncate text-sidebar-foreground/60">{roles.map((r) => r.replace("_", " ")).join(", ") || "no role"}</p>
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
