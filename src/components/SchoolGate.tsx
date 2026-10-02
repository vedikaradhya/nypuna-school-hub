import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const REQUESTABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "principal", label: "Principal" },
  { value: "front_office", label: "Front Office" },
  { value: "librarian", label: "Librarian" },
];

export function useSchools() {
  return useQuery({
    queryKey: ["schools-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** Shown when the signed-in person has no approved school selected. */
export function SchoolGate() {
  const { user, memberships, isOwner, refresh } = useAuth();
  const schools = useSchools();
  const [school, setSchool] = useState("");
  const [role, setRole] = useState<AppRole>("teacher");
  const approved = memberships.filter((m) => m.status === "approved");

  const request = async () => {
    if (!school || !user) return;
    const { error } = await supabase.from("school_memberships").insert({ user_id: user.id, school_id: school, requested_role: role, status: "pending" });
    if (error) return toast.error(error.message.includes("duplicate") ? "You already asked to join this school." : error.message);
    toast.success("Request sent. The school administrator will review it.");
    await refresh();
  };

  const open = async (id: string) => {
    const { error } = await supabase.rpc("set_active_school", { _school: id });
    if (error) return toast.error(error.message);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-lg border p-6">
      {isOwner ? (
        <p className="text-sm">You're the platform owner. <Link to="/owner" className="font-medium underline">Manage schools</Link></p>
      ) : null}
      {approved.length ? (
        <div>
          <h2 className="font-display text-lg font-semibold">Choose a school</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {approved.map((m) => <Button key={m.id} variant="outline" onClick={() => open(m.school_id)}>{m.schools?.name}</Button>)}
          </div>
        </div>
      ) : null}
      {memberships.length ? (
        <div>
          <h3 className="text-sm font-semibold">Your school requests</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {memberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span>{m.schools?.name} · {m.requested_role.replace("_", " ")}</span>
                <Badge variant={m.status === "approved" ? "secondary" : m.status === "rejected" ? "destructive" : "outline"}>
                  {m.status === "pending" ? "waiting for approval" : m.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : !isOwner ? (
        <p className="text-sm text-muted-foreground">Your account isn't linked to a school yet.</p>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold">Ask to join a school</h3>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Select value={school} onValueChange={setSchool}>
            <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
            <SelectContent>{schools.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{REQUESTABLE_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={request} disabled={!school}>Request</Button>
        </div>
      </div>
    </div>
  );
}
