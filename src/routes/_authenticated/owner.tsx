import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { DataState } from "@/components/DataState";
import { createSchoolAdmin } from "@/lib/owner.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Owner Console — Nypuna Connect" },
      { name: "description", content: "Add and remove schools and create each school's administrator account." },
      { property: "og:title", content: "Owner Console — Nypuna Connect" },
      { property: "og:description", content: "Add and remove schools and create each school's administrator account." },
    ],
  }),
  component: Owner,
});

type School = { id: string; name: string; code: string; address: string | null; is_active: boolean };

function Owner() {
  const { isOwner, loading } = useAuth();
  const qc = useQueryClient();
  const createAdmin = useServerFn(createSchoolAdmin);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [adminFor, setAdminFor] = useState<School | null>(null);
  const [admin, setAdmin] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const schools = useQuery({
    queryKey: ["owner-schools"],
    enabled: isOwner,
    queryFn: async () => {
      const [{ data, error }, { data: admins }] = await Promise.all([
        supabase.from("schools").select("id, name, code, address, is_active").order("created_at"),
        supabase.from("user_roles").select("school_id, user_id").eq("role", "administrator"),
      ]);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const a of admins ?? []) if (a.school_id) counts.set(a.school_id, (counts.get(a.school_id) ?? 0) + 1);
      return (data as School[]).map((s) => ({ ...s, admins: counts.get(s.id) ?? 0 }));
    },
  });

  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("schools").insert({ name: name.trim(), code: code.trim().toUpperCase(), address: address.trim() || null });
    if (error) return toast.error(error.message.includes("duplicate") ? "That school code is already used." : error.message);
    toast.success("School added with default classes, periods, houses and subjects.");
    setName(""); setCode(""); setAddress("");
    void qc.invalidateQueries({ queryKey: ["owner-schools"] });
  };

  const setActive = async (s: School, active: boolean) => {
    if (!active && !confirm(`Remove ${s.name}? Staff will no longer be able to choose it. Its records are kept and it can be restored.`)) return;
    const { error } = await supabase.from("schools").update({ is_active: active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["owner-schools"] });
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFor) return;
    setBusy(true);
    try {
      await createAdmin({ data: { school_id: adminFor.id, ...admin } });
      toast.success(`Administrator created for ${adminFor.name}. Share the email and password with them.`);
      setAdminFor(null);
      setAdmin({ full_name: "", email: "", password: "" });
      void qc.invalidateQueries({ queryKey: ["owner-schools"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create administrator");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Owner Console" subtitle="Schools and their administrators">
      {loading ? null : !isOwner ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Only the platform owner can open this page.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="font-display text-base">Add a school</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={addSchool}>
                <div className="space-y-1.5"><Label htmlFor="sn">School name</Label><Input id="sn" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kautilya School" /></div>
                <div className="space-y-1.5"><Label htmlFor="sc">Short code</Label><Input id="sc" required maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} placeholder="KAUTILYA" /></div>
                <div className="space-y-1.5"><Label htmlFor="sa">Address</Label><Input id="sa" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <Button type="submit" className="w-full">Add school</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display text-base">Schools</CardTitle></CardHeader>
            <CardContent>
              <DataState loading={schools.isLoading} error={schools.error} empty={!schools.data?.length} emptyText="No schools yet.">
                <ul className="divide-y">
                  {schools.data?.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">{s.name} <span className="font-mono text-xs text-muted-foreground">{s.code}</span></p>
                        <p className="text-xs text-muted-foreground">{s.admins} administrator{s.admins === 1 ? "" : "s"}{s.address ? ` · ${s.address}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!s.is_active ? <Badge variant="outline">removed</Badge> : null}
                        {s.is_active ? (
                          <>
                            <Button size="sm" onClick={() => setAdminFor(s)}>Create administrator</Button>
                            <Button size="sm" variant="ghost" onClick={() => setActive(s, false)}>Remove</Button>
                          </>
                        ) : <Button size="sm" variant="outline" onClick={() => setActive(s, true)}>Restore</Button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </DataState>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!adminFor} onOpenChange={(o) => !o && setAdminFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Administrator for {adminFor?.name}</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={submitAdmin}>
            <div className="space-y-1.5"><Label htmlFor="an">Full name</Label><Input id="an" required value={admin.full_name} onChange={(e) => setAdmin({ ...admin, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ae">Email</Label><Input id="ae" type="email" required value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ap">Temporary password</Label><Input id="ap" type="text" required minLength={8} value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={busy}>Create administrator</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
