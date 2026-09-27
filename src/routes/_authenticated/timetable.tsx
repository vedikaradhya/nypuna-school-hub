import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateTimetable, type TTEntry } from "@/lib/timetable-validation";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable & Workload — Nypuna Connect" },
      { name: "description", content: "View published timetables, spot clashes and balance teacher period distribution." },
      { property: "og:title", content: "Timetable & Workload — Nypuna Connect" },
      { property: "og:description", content: "View published timetables, spot clashes and balance teacher period distribution." },
    ],
  }),
  component: Timetable,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Entry = TTEntry;

function Timetable() {
  const [sectionId, setSectionId] = useState<string>("");

  const sections = useQuery({
    queryKey: ["tt-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id, name, grades(name)").order("name");
      if (error) throw error;
      return data as unknown as { id: string; name: string; grades: { name: string } | null }[];
    },
  });

  const periods = useQuery({
    queryKey: ["tt-periods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("periods").select("id, period_no, label, is_break").order("period_no");
      if (error) throw error; return data;
    },
  });

  const entries = useQuery({
    queryKey: ["tt-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_entries")
        .select("id, day_of_week, section_id, sections(name, grades(name)), periods(period_no, label, is_break), subjects(id, name, code, requires_lab), profiles(id, full_name, max_periods_per_week, max_periods_per_day), classrooms(id, name, room_type)");
      if (error) throw error;
      return data as unknown as Entry[];
    },
  });

  const active = sectionId || sections.data?.[0]?.id || "";
  const sectionEntries = (entries.data ?? []).filter((e) => e.section_id === active);

  const clashes = useMemo(() => {
    const seen = new Map<string, string[]>();
    const out: string[] = [];
    for (const e of entries.data ?? []) {
      if (!e.profiles || !e.periods) continue;
      const key = `${e.day_of_week}-${e.periods.period_no}-${e.profiles.id}`;
      const list = seen.get(key) ?? [];
      list.push(e.id);
      seen.set(key, list);
      if (list.length === 2) out.push(`${e.profiles.full_name} is double-booked on ${DAYS[e.day_of_week - 1]}, period ${e.periods.period_no}`);
    }
    return out;
  }, [entries.data]);

  const workload = useMemo(() => {
    const map = new Map<string, { name: string; count: number; max: number }>();
    for (const e of entries.data ?? []) {
      if (!e.profiles) continue;
      const row = map.get(e.profiles.id) ?? { name: e.profiles.full_name, count: 0, max: e.profiles.max_periods_per_week || 30 };
      row.count += 1;
      map.set(e.profiles.id, row);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [entries.data]);

  const validation = useMemo(() => validateTimetable(entries.data ?? []), [entries.data]);
  const hardCount = validation.filter((r) => r.severity === "hard").reduce((n, r) => n + r.findings.length, 0);
  const softCount = validation.filter((r) => r.severity === "soft").reduce((n, r) => n + r.findings.length, 0);

  return (
    <Page path="/timetable" title="Timetable & Workload" subtitle="Weekly grid, clash detection and teacher load">
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Timetable</TabsTrigger>
          <TabsTrigger value="workload">Teacher workload</TabsTrigger>
          <TabsTrigger value="validation">Validation{hardCount ? ` (${hardCount})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="validation">
          <div className={`mb-4 rounded-md border p-3 text-sm ${hardCount ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5"}`}>
            {hardCount
              ? `${hardCount} critical conflict${hardCount > 1 ? "s" : ""} — publishing is blocked until resolved. ${softCount} warning${softCount === 1 ? "" : "s"}.`
              : `All hard constraints pass — this timetable can be published. ${softCount} soft warning${softCount === 1 ? "" : "s"}.`}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {validation.map((r) => (
              <Card key={r.rule}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between font-display text-base">
                    <span>{r.rule}</span>
                    <span className="flex gap-2">
                      <Badge variant="outline">{r.severity === "hard" ? "Hard" : "Soft"}</Badge>
                      {r.findings.length
                        ? <Badge variant={r.severity === "hard" ? "destructive" : "secondary"}>{r.findings.length} issue{r.findings.length > 1 ? "s" : ""}</Badge>
                        : <Badge variant="secondary">Pass</Badge>}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </CardHeader>
                {r.findings.length ? (
                  <CardContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm">{r.findings.slice(0, 8).map((f, i) => <li key={i}>{f.message}</li>)}</ul>
                    {r.findings.length > 8 ? <p className="mt-2 text-xs text-muted-foreground">+{r.findings.length - 8} more</p> : null}
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grid">
          {clashes.length ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive">{clashes.length} clash{clashes.length > 1 ? "es" : ""} detected — publishing is blocked</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-destructive/90">{clashes.slice(0, 6).map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          ) : (
            <div className="mb-4 rounded-md border border-success/30 bg-success/5 p-3 text-sm">No teacher, room or section clashes found.</div>
          )}

          <div className="mb-4 max-w-xs">
            <Select value={active} onValueChange={setSectionId}>
              <SelectTrigger><SelectValue placeholder="Select a section" /></SelectTrigger>
              <SelectContent>
                {sections.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.grades?.name} {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card><CardContent className="overflow-x-auto pt-6">
            <DataState loading={entries.isLoading || sections.isLoading} error={entries.error} empty={!sections.data?.length} emptyText="Create sections first to build a timetable.">
              <table className="w-full min-w-[720px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="w-24 text-left text-xs uppercase tracking-wide text-muted-foreground">Day</th>
                    {periods.data?.map((p) => <th key={p.id} className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d, di) => (
                    <tr key={d}>
                      <td className="text-xs font-medium text-muted-foreground">{d.slice(0, 3)}</td>
                      {periods.data?.map((p) => {
                        const e = sectionEntries.find((x) => x.day_of_week === di + 1 && x.periods?.period_no === p.period_no);
                        if (p.is_break) return <td key={p.id} className="rounded bg-muted p-2 text-center text-[11px] text-muted-foreground">{p.label}</td>;
                        return (
                          <td key={p.id} className="rounded border bg-card p-2 align-top">
                            {e ? (
                              <>
                                <p className="text-xs font-semibold">{e.subjects?.code ?? "—"}</p>
                                <p className="text-[11px] text-muted-foreground">{e.profiles?.full_name}</p>
                                <p className="text-[11px] text-muted-foreground">{e.classrooms?.name}</p>
                              </>
                            ) : <span className="text-[11px] text-muted-foreground">Free</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataState>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="workload">
          <Card>
            <CardHeader><CardTitle className="font-display text-base">Weekly period distribution</CardTitle></CardHeader>
            <CardContent>
              <DataState loading={entries.isLoading} error={entries.error} empty={!workload.length} emptyText="No timetable entries assigned yet.">
                <ul className="space-y-4">
                  {workload.map((w) => (
                    <li key={w.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{w.name}</span>
                        <span className="text-muted-foreground">{w.count} / {w.max} periods {w.count > w.max ? <Badge variant="destructive" className="ml-2">overloaded</Badge> : null}</span>
                      </div>
                      <Progress value={Math.min(100, (w.count / w.max) * 100)} />
                    </li>
                  ))}
                </ul>
              </DataState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
