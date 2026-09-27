import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cbseGrade, CBSE_GRADES } from "@/lib/cbse";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "School Analytics — Nypuna Connect" },
      { name: "description", content: "Attendance trends, exam pass rates, CBSE grade distribution and teacher workload." },
      { property: "og:title", content: "School Analytics — Nypuna Connect" },
      { property: "og:description", content: "Attendance trends, exam pass rates, CBSE grade distribution and teacher workload." },
    ],
  }),
  component: Analytics,
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function ChartCard({ title, loading, empty, emptyText, children }: { title: string; loading: boolean; empty: boolean; emptyText: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <DataState loading={loading} empty={empty} emptyText={emptyText}>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
        </DataState>
      </CardContent>
    </Card>
  );
}

function Analytics() {
  const data = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [att, marks, tt, students] = await Promise.all([
        supabase.from("attendance").select("attendance_date, status").gte("attendance_date", since).limit(20000),
        supabase.from("exam_marks").select("marks_obtained, is_absent, exam_schedules(max_marks, pass_marks, exams(name))").limit(20000),
        supabase.from("timetable_entries").select("profiles(full_name, max_periods_per_week)").limit(5000),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const byDay = new Map<string, { p: number; t: number }>();
      for (const r of att.data ?? []) {
        const d = byDay.get(r.attendance_date) ?? { p: 0, t: 0 };
        d.t += 1; if (r.status === "present" || r.status === "late" || r.status === "half_day") d.p += 1;
        byDay.set(r.attendance_date, d);
      }
      const attendance = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.slice(5), pct: Math.round((v.p / v.t) * 100) }));

      type M = { marks_obtained: number | null; is_absent: boolean; exam_schedules: { max_marks: number; pass_marks: number; exams: { name: string } | null } | null };
      const byExam = new Map<string, { pass: number; total: number }>();
      const dist = new Map<string, number>(CBSE_GRADES.map((g) => [g, 0]));
      for (const m of (marks.data ?? []) as unknown as M[]) {
        if (!m.exam_schedules || m.is_absent || m.marks_obtained == null) continue;
        const name = m.exam_schedules.exams?.name ?? "Exam";
        const e = byExam.get(name) ?? { pass: 0, total: 0 };
        e.total += 1; if (m.marks_obtained >= m.exam_schedules.pass_marks) e.pass += 1;
        byExam.set(name, e);
        const g = cbseGrade((m.marks_obtained / m.exam_schedules.max_marks) * 100);
        dist.set(g, (dist.get(g) ?? 0) + 1);
      }
      const passRates = [...byExam.entries()].map(([exam, v]) => ({ exam, pct: Math.round((v.pass / v.total) * 100) }));
      const grades = [...dist.entries()].map(([grade, count]) => ({ grade, count }));

      const load = new Map<string, { name: string; periods: number; limit: number }>();
      for (const r of (tt.data ?? []) as unknown as { profiles: { full_name: string; max_periods_per_week: number } | null }[]) {
        if (!r.profiles) continue;
        const x = load.get(r.profiles.full_name) ?? { name: r.profiles.full_name.split(" ")[0]!, periods: 0, limit: r.profiles.max_periods_per_week };
        x.periods += 1; load.set(r.profiles.full_name, x);
      }
      const workload = [...load.values()].sort((a, b) => b.periods - a.periods).slice(0, 15);

      const avgAtt = attendance.length ? Math.round(attendance.reduce((n, a) => n + a.pct, 0) / attendance.length) : null;
      const totalMarks = [...byExam.values()].reduce((n, v) => n + v.total, 0);
      const overallPass = totalMarks ? Math.round(([...byExam.values()].reduce((n, v) => n + v.pass, 0) / totalMarks) * 100) : null;
      return { attendance, passRates, grades, workload, gradeTotal: totalMarks, kpis: { students: students.count ?? 0, avgAtt, overallPass, teachers: load.size } };
    },
  });

  const d = data.data;
  return (
    <Page path="/analytics" title="Analytics & Reporting" subtitle="School-wide trends at a glance">
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active students", d?.kpis.students ?? "—"],
          ["Attendance (30 days)", d?.kpis.avgAtt != null ? `${d.kpis.avgAtt}%` : "—"],
          ["Exam pass rate", d?.kpis.overallPass != null ? `${d.kpis.overallPass}%` : "—"],
          ["Teachers timetabled", d?.kpis.teachers ?? "—"],
        ].map(([k, v]) => (
          <Card key={String(k)}><CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{v}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Attendance trend (last 30 days)" loading={data.isLoading} empty={!d?.attendance.length} emptyText="No attendance marked in the last 30 days.">
          <LineChart data={d?.attendance ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={axis} /><YAxis domain={[0, 100]} tick={axis} unit="%" />
            <Tooltip /><Line type="monotone" dataKey="pct" name="Present %" stroke="var(--primary)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Pass percentage by exam" loading={data.isLoading} empty={!d?.passRates.length} emptyText="No exam marks entered yet.">
          <BarChart data={d?.passRates ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="exam" tick={axis} /><YAxis domain={[0, 100]} tick={axis} unit="%" />
            <Tooltip /><Bar dataKey="pct" name="Pass %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="CBSE grade distribution" loading={data.isLoading} empty={!d?.gradeTotal} emptyText="No graded marks yet.">
          <BarChart data={d?.grades ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="grade" tick={axis} /><YAxis allowDecimals={false} tick={axis} />
            <Tooltip /><Bar dataKey="count" name="Papers" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Teacher workload (periods / week)" loading={data.isLoading} empty={!d?.workload.length} emptyText="No timetable entries yet.">
          <BarChart data={d?.workload ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={axis} /><YAxis allowDecimals={false} tick={axis} />
            <Tooltip /><Bar dataKey="periods" name="Periods" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </Page>
  );
}
