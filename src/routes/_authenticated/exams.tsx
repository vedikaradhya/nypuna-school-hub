import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "CBSE Examinations — Nypuna Connect" },
      { name: "description", content: "Schedule CBSE exams, enter subject marks and generate A1–E grade report cards." },
      { property: "og:title", content: "CBSE Examinations — Nypuna Connect" },
      { property: "og:description", content: "Schedule CBSE exams, enter subject marks and generate A1–E grade report cards." },
    ],
  }),
  component: Exams,
});

function cbseGrade(pct: number) {
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}

function Exams() {
  const qc = useQueryClient();
  const [scheduleId, setScheduleId] = useState("");
  const [reportSection, setReportSection] = useState("");
  const [reportExam, setReportExam] = useState("");

  const exams = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("id, name, exam_type, term, start_date, end_date, weightage, is_published").order("start_date", { ascending: false });
      if (error) throw error; return data;
    },
  });

  const schedules = useQuery({
    queryKey: ["exam-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_schedules")
        .select("id, exam_date, start_time, duration_minutes, max_marks, pass_marks, exams(name, id), grades(name, id), subjects(name)")
        .order("exam_date");
      if (error) throw error;
      return data as unknown as { id: string; exam_date: string | null; start_time: string | null; duration_minutes: number; max_marks: number; pass_marks: number; exams: { name: string; id: string } | null; grades: { name: string; id: string } | null; subjects: { name: string } | null }[];
    },
  });

  const sections = useQuery({
    queryKey: ["exam-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id, name, grades(name)").order("name");
      if (error) throw error;
      return data as unknown as { id: string; name: string; grades: { name: string } | null }[];
    },
  });

  const marks = useQuery({
    queryKey: ["exam-marks", scheduleId],
    enabled: !!scheduleId,
    queryFn: async () => {
      const sch = schedules.data?.find((s) => s.id === scheduleId);
      const [{ data: students }, { data: existing }] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name, roll_no, sections!inner(grade_id)").eq("status", "active").eq("sections.grade_id", sch?.grades?.id ?? ""),
        supabase.from("exam_marks").select("id, student_id, marks_obtained, is_absent").eq("exam_schedule_id", scheduleId),
      ]);
      return {
        students: (students ?? []) as unknown as { id: string; first_name: string; last_name: string; roll_no: number | null }[],
        existing: (existing ?? []) as { id: string; student_id: string; marks_obtained: number | null; is_absent: boolean }[],
      };
    },
  });

  const saveMark = useMutation({
    mutationFn: async ({ student_id, value }: { student_id: string; value: number | null }) => {
      const { error } = await supabase.from("exam_marks").upsert(
        { exam_schedule_id: scheduleId, student_id, marks_obtained: value, is_absent: value === null },
        { onConflict: "exam_schedule_id,student_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Mark saved"); void qc.invalidateQueries({ queryKey: ["exam-marks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const report = useQuery({
    queryKey: ["report-card", reportSection, reportExam],
    enabled: !!reportSection && !!reportExam,
    queryFn: async () => {
      const { data: students } = await supabase.from("students").select("id, first_name, last_name, roll_no").eq("section_id", reportSection).eq("status", "active").order("roll_no");
      const { data: rows } = await supabase
        .from("exam_marks")
        .select("student_id, marks_obtained, is_absent, exam_schedules!inner(exam_id, max_marks, subjects(name))")
        .eq("exam_schedules.exam_id", reportExam);
      const byStudent = new Map<string, { obtained: number; max: number; subjects: { name: string; pct: number }[] }>();
      for (const r of (rows ?? []) as unknown as { student_id: string; marks_obtained: number | null; is_absent: boolean; exam_schedules: { max_marks: number; subjects: { name: string } | null } }[]) {
        const agg = byStudent.get(r.student_id) ?? { obtained: 0, max: 0, subjects: [] };
        const got = r.is_absent ? 0 : (r.marks_obtained ?? 0);
        agg.obtained += got;
        agg.max += r.exam_schedules.max_marks;
        agg.subjects.push({ name: r.exam_schedules.subjects?.name ?? "—", pct: (got / r.exam_schedules.max_marks) * 100 });
        byStudent.set(r.student_id, agg);
      }
      return (students ?? []).map((s) => {
        const agg = byStudent.get(s.id);
        const pct = agg && agg.max > 0 ? (agg.obtained / agg.max) * 100 : null;
        return { ...s, obtained: agg?.obtained ?? null, max: agg?.max ?? null, pct, grade: pct === null ? "—" : cbseGrade(pct), subjects: agg?.subjects ?? [] };
      });
    },
  });

  return (
    <Page path="/exams" title="CBSE Examinations" subtitle="Scheduling, mark entry and report cards">
      <Tabs defaultValue="schedule">
        <TabsList className="flex-wrap">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="marks">Mark entry</TabsTrigger>
          <TabsTrigger value="report">Report cards</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {exams.data?.map((e) => (
              <Card key={e.id}><CardContent className="p-4">
                <p className="font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.exam_type.replace(/_/g, " ")} · Term {e.term} · {e.weightage}%</p>
                <Badge variant={e.is_published ? "secondary" : "outline"} className="mt-2">{e.is_published ? "published" : "draft"}</Badge>
              </CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="pt-6">
            <DataState loading={schedules.isLoading} error={schedules.error} empty={!schedules.data?.length} emptyText="No exam papers scheduled yet.">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Exam</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Max / Pass</TableHead>
                </TableRow></TableHeader>
                <TableBody>{schedules.data?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.exams?.name}</TableCell><TableCell>{s.grades?.name}</TableCell>
                    <TableCell>{s.subjects?.name}</TableCell><TableCell>{s.exam_date ?? "TBD"}</TableCell>
                    <TableCell>{s.duration_minutes} min</TableCell><TableCell>{s.max_marks} / {s.pass_marks}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </DataState>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="marks">
          <Card className="mb-4"><CardContent className="pt-6">
            <Select value={scheduleId} onValueChange={setScheduleId}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Select an exam paper" /></SelectTrigger>
              <SelectContent>{schedules.data?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.exams?.name} · {s.grades?.name} · {s.subjects?.name}</SelectItem>
              ))}</SelectContent>
            </Select>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <DataState loading={marks.isFetching} empty={!scheduleId || !marks.data?.students.length} emptyText="Choose an exam paper with enrolled students.">
              <ul className="divide-y">
                {marks.data?.students.map((s) => {
                  const ex = marks.data.existing.find((m) => m.student_id === s.id);
                  const sch = schedules.data?.find((x) => x.id === scheduleId);
                  const pct = ex?.marks_obtained != null && sch ? (ex.marks_obtained / sch.max_marks) * 100 : null;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <p className="font-medium">{s.roll_no ? `${s.roll_no}. ` : ""}{s.first_name} {s.last_name}</p>
                      <div className="flex items-center gap-2">
                        {pct !== null ? <Badge variant="secondary">{cbseGrade(pct)}</Badge> : null}
                        <Input
                          type="number" step="0.5" className="w-28" placeholder={`/ ${sch?.max_marks ?? ""}`}
                          defaultValue={ex?.marks_obtained ?? ""}
                          onBlur={(e) => {
                            const v = e.target.value === "" ? null : Number(e.target.value);
                            if (v !== (ex?.marks_obtained ?? null)) saveMark.mutate({ student_id: s.id, value: v });
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </DataState>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="report">
          <Card className="mb-4"><CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
            <Select value={reportExam} onValueChange={setReportExam}>
              <SelectTrigger className="sm:w-64"><SelectValue placeholder="Exam" /></SelectTrigger>
              <SelectContent>{exams.data?.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={reportSection} onValueChange={setReportSection}>
              <SelectTrigger className="sm:w-64"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>{sections.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.grades?.name} {s.name}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <DataState loading={report.isFetching} empty={!report.data?.length} emptyText="Pick an exam and section to build report cards.">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Total</TableHead>
                  <TableHead>Percentage</TableHead><TableHead>CBSE grade</TableHead>
                </TableRow></TableHeader>
                <TableBody>{report.data?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.roll_no ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                    <TableCell>{r.obtained != null ? `${r.obtained} / ${r.max}` : "—"}</TableCell>
                    <TableCell>{r.pct != null ? `${r.pct.toFixed(1)}%` : "—"}</TableCell>
                    <TableCell><Badge>{r.grade}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </DataState>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
