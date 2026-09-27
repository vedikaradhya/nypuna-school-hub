import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NAV, ALL_ROLES } from "@/lib/nav";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit & Security — Nypuna Connect" },
      { name: "description", content: "System activity audit trail, staff login history and role permission matrix." },
      { property: "og:title", content: "Audit & Security — Nypuna Connect" },
      { property: "og:description", content: "System activity audit trail, staff login history and role permission matrix." },
    ],
  }),
  component: Audit,
});

function useNames() {
  return useQuery({
    queryKey: ["profile-names"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return new Map((data ?? []).map((p) => [p.id, p.full_name]));
    },
  });
}

function Audit() {
  const names = useNames();
  const logs = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("id, user_id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(300);
      if (error) throw error; return data;
    },
  });
  const logins = useQuery({
    queryKey: ["login-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("login_history").select("id, user_id, logged_in_at, device, user_agent").order("logged_in_at", { ascending: false }).limit(300);
      if (error) throw error; return data;
    },
  });
  const who = (id: string | null) => (id ? names.data?.get(id) ?? "Unknown user" : "System");

  return (
    <Page path="/audit" title="Audit & Security" subtitle="Activity trail, sign-ins and permissions">
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity log</TabsTrigger>
          <TabsTrigger value="logins">Login history</TabsTrigger>
          <TabsTrigger value="perms">Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="activity"><Card><CardContent className="pt-6">
          <DataState loading={logs.isLoading} error={logs.error} empty={!logs.data?.length} emptyText="No activity recorded yet.">
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Module</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>{logs.data?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>{who(l.user_id)}</TableCell>
                  <TableCell>{l.entity_type?.replace(/_/g, " ") ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{l.action}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>
        <TabsContent value="logins"><Card><CardContent className="pt-6">
          <DataState loading={logins.isLoading} error={logins.error} empty={!logins.data?.length} emptyText="No sign-ins recorded yet.">
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Staff member</TableHead><TableHead>Device</TableHead></TableRow></TableHeader>
              <TableBody>{logins.data?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.logged_in_at).toLocaleString()}</TableCell>
                  <TableCell>{who(l.user_id)}</TableCell>
                  <TableCell className="max-w-md truncate text-xs text-muted-foreground">{l.device ?? l.user_agent ?? "—"}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>
        <TabsContent value="perms"><Card><CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead>{ALL_ROLES.map((r) => <TableHead key={r} className="text-center capitalize">{r.replace("_", " ")}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{NAV.flatMap((g) => g.items).map((i) => (
              <TableRow key={i.to}>
                <TableCell className="font-medium">{i.label}</TableCell>
                {ALL_ROLES.map((r) => <TableCell key={r} className="text-center">{i.roles.includes(r) ? "✓" : "—"}</TableCell>)}
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card></TabsContent>
      </Tabs>
    </Page>
  );
}
