import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Nypuna Connect" },
      { name: "description", content: "Mark daily roll call for each section and review attendance already recorded." },
      { property: "og:title", content: "Attendance — Nypuna Connect" },
      { property: "og:description", content: "Mark daily roll call for each section and review attendance already recorded." },
    ],
  }),
  component: Attendance,
});

const STATUSES = ["present", "absent", "late", "leave", "half_day"] as const;
type Status = (typeof STATUSES)[number];

function Attendance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const sections = useQuery({
    queryKey: ["att-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id, name, grades(name)").order("name");
      if (error) throw error;
      return data as unknown as { id: string; name: string; grades: { name: string } | null }[];
    },
  });

  const active = sectionId || sections.data?.[0]?.id || "";

  const roll = useQuery({
    queryKey: ["att-roll", active, date],
    enabled: !!active,
    queryFn: async () => {
      const [{ data: students, error: e1 }, { data: existing, error: e2 }] = await Promise.all([
        supabase.from("students").select("id, roll_no, first_name, last_name, admission_no").eq("section_id", active).eq("status", "active").order("roll_no"),
        supabase.from("attendance").select("student_id, status").eq("section_id", active).eq("attendance_date", date),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { students: students ?? [], existing: existing ?? [] };
    },
  });

  useEffect(() => {
    if (!roll.data) return;
    const next: Record<string, Status> = {};
    for (const s of roll.data.students) next[s.id] = "present";
    for (const e of roll.data.existing) next[e.student_id] = e.status as Status;
    setMarks(next);
  }, [roll.data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(marks).map(([student_id, status]) => ({
        student_id, section_id: active, attendance_date: date, status, marked_by: user?.id ?? null,
      }));
      if (!rows.length) return;
      await supabase.from("attendance").delete().eq("section_id", active).eq("attendance_date", date);
      const { error } = await supabase.from("attendance").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Attendance saved"); void qc.invalidateQueries({ queryKey: ["att-roll"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = STATUSES.map((s) => [s, Object.values(marks).filter((m) => m === s).length] as const);

  return (
    <Page
      path="/attendance"
      title="Attendance Management"
      subtitle="Daily roll call"
      actions={<Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !active}>Save attendance</Button>}
    >
      <Card className="mb-4"><CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
        <Select value={active} onValueChange={setSectionId}>
          <SelectTrigger className="sm:w-64"><SelectValue placeholder="Select section" /></SelectTrigger>
          <SelectContent>{sections.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.grades?.name} {s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-48" />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {counts.map(([s, n]) => <span key={s}>{s.replace("_", " ")}: <strong className="text-foreground">{n}</strong></span>)}
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-6">
        <DataState loading={roll.isLoading} error={roll.error} empty={!roll.data?.students.length} emptyText="No active students in this section.">
          <ul className="divide-y">
            {roll.data?.students.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{s.roll_no ? `${s.roll_no}. ` : ""}{s.first_name} {s.last_name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{s.admission_no}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMarks({ ...marks, [s.id]: st })}
                      className={cn(
                        "rounded-md border px-3 py-1 text-xs capitalize transition-colors",
                        marks[s.id] === st ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent/10",
                      )}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent></Card>
    </Page>
  );
}
