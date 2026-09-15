import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "administrator" | "principal" | "teacher" | "front_office" | "librarian";

type Profile = { id: string; full_name: string; email: string | null; designation: string | null };

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (r: AppRole) => boolean;
  hasAnyRole: (r: AppRole[]) => boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      setProfile(null);
      return;
    }
    const [{ data: roleRows }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("id, full_name, email, designation").eq("id", uid).maybeSingle(),
    ]);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
    setProfile((prof as Profile) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => void load(s?.user?.id), 0);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    loading,
    hasRole: (r) => roles.includes(r),
    hasAnyRole: (rs) => rs.some((r) => roles.includes(r)),
    refresh: async () => load(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
