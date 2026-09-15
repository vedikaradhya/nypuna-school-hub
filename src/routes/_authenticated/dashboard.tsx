import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/DataState";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nypuna Connect" },
      { name: "description", content: "School-wide snapshot of students, staff, admissions, attendance and library activity." },
      { property: "og:title", content: "Dashboard — Nypuna Connect" },
      { property: "og:description", content: "School-wide snapshot of students, staff, admissions, attendance and library activity." },
    ],
  }),
  component: Dashboard,
});

const count = async (table: string, apply?: (q: any) => any) => {
  let q = supabase.from(table as never).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: c } = await q;
  return c ?? 0;
};

function Dashboard() {
  const { profile, roles } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => ({
      students: await count("students", (q) => q.eq("status", "active")),
      staff: await count("profiles", (q) => q.eq("is_active", true)),
      applications: await count("admission_applications"),
      enquiries: await count("enquiries", (q) => q.eq("status", "open")),
      presentToday: await count("attendance", (q) => q.eq("attendance_date", today).eq("status", "present")),
      absentToday: await count("attendance", (q) => q.eq("attendance_date", today).eq("status", "absent")),
      booksOut: await count("book_issues", (q) => q.is("returned_on", null)),
      visitorsIn: await count("visitor_logs", (q) => q.is("check_out", null)),
    }),
  });

  const notices = useQuery({
    queryKey: ["dashboard-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, created_at, is_pinned")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Active students", value: stats.data?.students },
    { label: "Active staff", value: stats.data?.staff },
    { label: "Admission applications", value: stats.data?.applications },
    { label: "Open enquiries", value: stats.data?.enquiries },
    { label: "Present today", value: stats.data?.presentToday },
    { label: "Absent today", value: stats.data?.absentToday },
    { label: "Books on loan", value: stats.data?.booksOut },
    { label: "Visitors on campus", value: stats.data?.visitorsIn },
  ];

  return (
    <Page path="/dashboard" title={`Welcome, ${profile?.full_name ?? "there"}`} subtitle={roles.map((r) => r.replace("_", " ")).join(" · ") || "Awaiting role assignment"}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold">{stats.isLoading ? "—" : (c.value ?? 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display text-base">Latest notices</CardTitle></CardHeader>
        <CardContent>
          <DataState loading={notices.isLoading} error={notices.error} empty={!notices.data?.length} emptyText="No notices published yet.">
            <ul className="divide-y">
              {notices.data?.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {n.is_pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent>
      </Card>
    </Page>
  );
}
