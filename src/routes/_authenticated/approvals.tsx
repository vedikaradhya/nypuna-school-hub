import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { ALL_ROLES } from "@/lib/nav";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Staff Approvals — Nypuna Connect" },
      { name: "description", content: "Approve or reject staff who asked to join your school and assign their roles." },
      { property: "og:title", content: "Staff Approvals — Nypuna Connect" },
      { property: "og:description", content: "Approve or reject staff who asked to join your school and assign their roles." },
    ],
  }),
  component: Approvals,
});

type Req = { id: string; user_id: string; status: string; requested_role: AppRole; created_at: string; name: string; email: string | null };

function Approvals() {
  const { activeSchoolId } = useAuth();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<Record<string, AppRole[]>>({});

  const reqs = useQuery({
    queryKey: ["approvals", activeSchoolId],
    enabled: !!activeSchoolId,
    queryFn: async () => {
      const { data, error } = await supabase.from("school_memberships")
        .select("id, user_id, status, requested_role, created_at").eq("school_id", activeSchoolId!).order("created_at", { ascending: false });
      if (error) throw error;
      const ids = data.map((d) => d.user_id);
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
      const pm = new Map((profs ?? []).map((p) => [p.id, p]));
      return data.map((d) => ({ ...d, name: pm.get(d.user_id)?.full_name ?? "Unknown", email: pm.get(d.user_id)?.email ?? null })) as Req[];
    },
  });

  const rolesFor = (r: Req) => picked[r.id] ?? [r.requested_role];
  const toggle = (r: Req, role: AppRole) => {
    const cur = rolesFor(r);
    setPicked({ ...picked, [r.id]: cur.includes(role) ? cur.filter((x) => x !== role) : [...cur, role] });
  };

  const review = async (r: Req, approve: boolean) => {
    const { error } = await supabase.rpc("review_membership", { _membership: r.id, _approve: approve, _roles: approve ? rolesFor(r) : [] });
    if (error) return toast.error(error.message);
    toast.success(approve ? `${r.name} approved` : `${r.name} rejected`);
    void qc.invalidateQueries({ queryKey: ["approvals"] });
  };

  const list = (status: string) => reqs.data?.filter((r) => r.status === status) ?? [];

  const render = (items: Req[], actions: boolean) => (
    <DataState loading={reqs.isLoading} error={reqs.error} empty={!items.length} emptyText="Nobody here.">
      <ul className="divide-y">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.email} · asked to be {r.requested_role.replace("_", " ")} · {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-xs capitalize">
                    <Checkbox checked={rolesFor(r).includes(role)} onCheckedChange={() => toggle(r, role)} />
                    {role.replace("_", " ")}
                  </label>
                ))}
                <Button size="sm" onClick={() => review(r, true)} disabled={!rolesFor(r).length}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => review(r, false)}>Reject</Button>
              </div>
            ) : <Badge variant="secondary">{r.status}</Badge>}
          </li>
        ))}
      </ul>
    </DataState>
  );

  return (
    <Page path="/approvals" title="Staff Approvals" subtitle="People who asked to join this school">
      <Card><CardContent className="pt-6">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Waiting ({list("pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">{render(list("pending"), true)}</TabsContent>
          <TabsContent value="approved">{render(list("approved"), false)}</TabsContent>
          <TabsContent value="rejected">{render(list("rejected"), true)}</TabsContent>
        </Tabs>
      </CardContent></Card>
    </Page>
  );
}
