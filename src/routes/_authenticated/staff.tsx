import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { ALL_ROLES } from "@/lib/nav";
import { createStaffMember } from "@/lib/staff.functions";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff Directory — Nypuna Connect" },
      { name: "description", content: "Staff directory, role management and teacher subject/class allocations." },
      { property: "og:title", content: "Staff Directory — Nypuna Connect" },
      { property: "og:description", content: "Staff directory, role management and teacher subject/class allocations." },
    ],
  }),
  component: Staff,
});

const label = (r: string) => r.replace("_", " ");

function Staff() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("administrator");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const empty = { full_name: "", email: "", password: "", designation: "", phone: "", roles: ["teacher"] as AppRole[] };
  const [form, setForm] = useState(empty);
  const createFn = useServerFn(createStaffMember);

  const staff = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, designation, phone, employee_id, is_active, max_periods_per_week").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const map = new Map<string, AppRole[]>();
      for (const r of (roles ?? []) as { user_id: string; role: AppRole }[]) map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.role]);
      return (profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  const allocations = useQuery({
    queryKey: ["staff-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_assignments").select("id, teacher_id, subjects(name), sections(name, grades(name))");
      if (error) throw error;
      return data as unknown as { id: string; teacher_id: string; subjects: { name: string } | null; sections: { name: string; grades: { name: string } | null } | null }[];
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      const { error } = has
        ? await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role)
        : await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); void qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: () => createFn({ data: { ...form, designation: form.designation || undefined, phone: form.phone || undefined } }),
    onSuccess: () => { toast.success("Staff member added — they can sign in now"); setOpen(false); setForm(empty); void qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (staff.data ?? []).filter((s) => !search || `${s.full_name} ${s.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page
      path="/staff" title="Staff Management" subtitle="Directory, roles and teaching allocations"
      actions={isAdmin ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Add staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New staff member</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              {([["full_name", "Full name", "text", true], ["email", "Email", "email", true], ["password", "Temporary password (min 8)", "password", true], ["designation", "Designation", "text", false], ["phone", "Phone", "tel", false]] as const).map(([k, l, t, r]) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k}>{l}</Label>
                  <Input id={k} type={t} required={r} minLength={k === "password" ? 8 : undefined} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm capitalize">
                      <Checkbox checked={form.roles.includes(r)} onCheckedChange={(c) => setForm({ ...form, roles: c ? [...form.roles, r] : form.roles.filter((x) => x !== r) })} />
                      {label(r)}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending || !form.roles.length}>Create account</Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    >
      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory & roles</TabsTrigger>
          <TabsTrigger value="allocations">Teaching allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="directory"><Card><CardContent className="pt-6">
          <Input placeholder="Search staff" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-xs" />
          <DataState loading={staff.isLoading} error={staff.error} empty={!rows.length} emptyText="No staff found.">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Contact</TableHead>
                {ALL_ROLES.map((r) => <TableHead key={r} className="text-center capitalize">{label(r)}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>{rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}{s.is_active ? null : <Badge variant="outline" className="ml-2">inactive</Badge>}</TableCell>
                  <TableCell>{s.designation ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.email}<div>{s.phone ?? ""}</div></TableCell>
                  {ALL_ROLES.map((r) => {
                    const has = s.roles.includes(r);
                    return (
                      <TableCell key={r} className="text-center">
                        <Checkbox checked={has} disabled={!isAdmin || toggleRole.isPending} aria-label={`${label(r)} role for ${s.full_name}`}
                          onCheckedChange={() => toggleRole.mutate({ userId: s.id, role: r, has })} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}</TableBody>
            </Table></div>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="allocations"><Card><CardContent className="pt-6">
          <DataState loading={allocations.isLoading || staff.isLoading} error={allocations.error} empty={!allocations.data?.length} emptyText="No subjects have been allocated to teachers yet. Allocate them in Academic Setup.">
            <div className="grid gap-4 md:grid-cols-2">
              {(staff.data ?? []).filter((s) => allocations.data?.some((a) => a.teacher_id === s.id)).map((s) => {
                const mine = allocations.data!.filter((a) => a.teacher_id === s.id);
                return (
                  <div key={s.id} className="rounded-lg border p-4">
                    <p className="font-display font-semibold">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{mine.length} allocation{mine.length > 1 ? "s" : ""} · weekly limit {s.max_periods_per_week}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mine.map((a) => <Badge key={a.id} variant="secondary">{a.subjects?.name} · {a.sections?.grades?.name} {a.sections?.name}</Badge>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataState>
        </CardContent></Card></TabsContent>
      </Tabs>
    </Page>
  );
}
