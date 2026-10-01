import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "administrator" | "principal" | "teacher" | "front_office" | "librarian";

type Profile = { id: string; full_name: string; email: string | null; designation: string | null; active_school_id: string | null };
export type Membership = { id: string; school_id: string; status: string; requested_role: AppRole; schools: { name: string } | null };

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isOwner: boolean;
  memberships: Membership[];
  activeSchoolId: string | null;
  activeSchoolName: string | null;
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
  const [isOwner, setIsOwner] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]); setProfile(null); setIsOwner(false); setMemberships([]);
      return;
    }
    const [{ data: prof }, { data: owner }, { data: mems }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, designation, active_school_id").eq("id", uid).maybeSingle(),
      supabase.rpc("is_owner"),
      supabase.from("school_memberships").select("id, school_id, status, requested_role, schools(name)").eq("user_id", uid),
    ]);
    const p = (prof as Profile) ?? null;
    const ms = (mems ?? []) as unknown as Membership[];
    const active = p?.active_school_id && ms.some((m) => m.school_id === p.active_school_id && m.status === "approved") ? p.active_school_id : null;
    let rs: AppRole[] = [];
    if (active) {
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("school_id", active);
      rs = ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role);
    }
    setProfile(p ? { ...p, active_school_id: active } : null);
    setIsOwner(!!owner);
    setMemberships(ms);
    setRoles(rs);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setSession(s);
      setTimeout(() => {
        void load(s?.user?.id);
        if (e === "SIGNED_IN" && s?.user) {
          const key = `nc-login-${s.user.id}-${s.access_token.slice(-12)}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            const ua = navigator.userAgent;
            void supabase.from("login_history").insert({
              user_id: s.user.id, user_agent: ua.slice(0, 500),
              device: /Mobi|Android/i.test(ua) ? "mobile" : "desktop",
            });
          }
        }
      }, 0);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const activeSchoolId = profile?.active_school_id ?? null;
  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    isOwner,
    memberships,
    activeSchoolId,
    activeSchoolName: memberships.find((m) => m.school_id === activeSchoolId)?.schools?.name ?? null,
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
