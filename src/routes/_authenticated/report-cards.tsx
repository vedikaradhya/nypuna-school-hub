import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cbseGrade } from "@/lib/cbse";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/report-cards")({
  head: () => ({
    meta: [
      { title: "CBSE Report Cards — Nypuna Connect" },
      { name: "description", content: "Print-ready CBSE report cards with A1–E scholastic grades, co-scholastic grades and remarks." },
      { property: "og:title", content: "CBSE Report Cards — Nypuna Connect" },
      { property: "og:description", content: "Print-ready CBSE report cards with A1–E scholastic grades, co-scholastic grades and remarks." },
    ],
  }),
  component: ReportCards,
});

const CO = ["Work Education", "Art Education", "Health & Physical Education", "Discipline"];

function ReportCards() {
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [co, setCo] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState("");

  const lookups = useQuery({
    queryKey: ["rc-lookups"],
    queryFn: async () => {
      const [e, s] = await Promise.all([
        supabase.from("exams").select("id, name").order("created_at", { ascending: false }),
        supabase.from("sections").select("id, name, grades(name, level)"),
      ]);
      const sections = ((s.data ?? []) as unknown as { id: string; name: string; grades: { name: string; level: number } | null }[])
        .sort((a, b) => (a.grades?.level ?? 0) - (b.grades?.level ?? 0) || a.name.localeCompare(b.name));
      return { exams: e.data ?? [], sections };
    },
  });

  const students = useQuery({
    queryKey: ["rc-students", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, first_name, last_name, admission_no, roll_no, father_name, mother_name, date_of_birth").eq("section_id", sectionId).eq("status", "active").order("roll_no");
      if (error) throw error; return data;
    },
  });

  const marks = useQuery({
    queryKey: ["rc-marks", examId, studentId],
    enabled: !!examId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_marks").select("marks_obtained, is_absent, exam_schedules!inner(exam_id, max_marks, subjects(name, is_scholastic))").eq("student_id", studentId).eq("exam_schedules.exam_id", examId);
      if (error) throw error;
      return data as unknown as { marks_obtained: number | null; is_absent: boolean; exam_schedules: { max_marks: number; subjects: { name: string; is_scholastic: boolean } | null } }[];
    },
  });

  const student = students.data?.find((s) => s.id === studentId);
  const section = lookups.data?.sections.find((s) => s.id === sectionId);
  const exam = lookups.data?.exams.find((e) => e.id === examId);
  const rows = (marks.data ?? []).map((m) => {
    const pct = m.marks_obtained != null ? (m.marks_obtained / m.exam_schedules.max_marks) * 100 : 0;
    return { subject: m.exam_schedules.subjects?.name ?? "Subject", max: m.exam_schedules.max_marks, got: m.is_absent ? "AB" : m.marks_obtained ?? "—", grade: m.is_absent ? "—" : cbseGrade(pct), pct };
  });
  const total = rows.reduce((n, r) => n + (typeof r.got === "number" ? r.got : 0), 0);
  const max = rows.reduce((n, r) => n + r.max, 0);

  return (
    <Page path="/report-cards" title="CBSE Report Cards" subtitle="Scholastic & co-scholastic, print-ready">
      <Card className="mb-4"><CardContent className="grid gap-3 pt-6 md:grid-cols-3">
        <Select value={examId} onValueChange={setExamId}><SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
          <SelectContent>{lookups.data?.exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
        <Select value={sectionId} onValueChange={(v) => { setSectionId(v); setStudentId(""); }}><SelectTrigger><SelectValue placeholder="Class & section" /></SelectTrigger>
          <SelectContent>{lookups.data?.sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.grades?.name} {s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={studentId} onValueChange={setStudentId} disabled={!sectionId}><SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
          <SelectContent>{students.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.roll_no ?? "-"}. {s.first_name} {s.last_name}</SelectItem>)}</SelectContent></Select>
      </CardContent></Card>

      {student && exam ? (
        <Card><CardContent className="pt-6">
          <div className="mb-4 flex justify-end"><Button onClick={() => window.print()}>Print / Save PDF</Button></div>
          <div className="print-area space-y-5 rounded-lg border p-6">
            <div className="text-center">
              <p className="font-display text-xl font-semibold">Nypuna School</p>
              <p className="text-sm text-muted-foreground">Report Card — {exam.name}</p>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="inline text-muted-foreground">Name: </dt><dd className="inline font-medium">{student.first_name} {student.last_name}</dd></div>
              <div><dt className="inline text-muted-foreground">Class: </dt><dd className="inline font-medium">{section?.grades?.name} {section?.name}</dd></div>
              <div><dt className="inline text-muted-foreground">Admission no: </dt><dd className="inline">{student.admission_no}</dd></div>
              <div><dt className="inline text-muted-foreground">Roll no: </dt><dd className="inline">{student.roll_no ?? "—"}</dd></div>
              <div><dt className="inline text-muted-foreground">Father: </dt><dd className="inline">{student.father_name ?? "—"}</dd></div>
              <div><dt className="inline text-muted-foreground">Mother: </dt><dd className="inline">{student.mother_name ?? "—"}</dd></div>
            </dl>
            <div>
              <p className="mb-2 font-display font-semibold">Part A — Scholastic areas</p>
              <DataState loading={marks.isLoading} error={marks.error} empty={!rows.length} emptyText="No marks entered for this student in this exam.">
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Max</TableHead><TableHead className="text-right">Obtained</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r) => <TableRow key={r.subject}><TableCell>{r.subject}</TableCell><TableCell className="text-right">{r.max}</TableCell><TableCell className="text-right">{r.got}</TableCell><TableCell className="text-right font-semibold">{r.grade}</TableCell></TableRow>)}
                    <TableRow><TableCell className="font-semibold">Total</TableCell><TableCell className="text-right">{max}</TableCell><TableCell className="text-right">{total}</TableCell><TableCell className="text-right font-semibold">{max ? cbseGrade((total / max) * 100) : "—"}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </DataState>
            </div>
            <div>
              <p className="mb-2 font-display font-semibold">Part B — Co-scholastic areas (A–C)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CO.map((c) => (
                  <div key={c} className="flex items-center justify-between gap-2 rounded border px-3 py-1.5 text-sm">
                    <span>{c}</span>
                    <Select value={co[c] ?? ""} onValueChange={(v) => setCo({ ...co, [c]: v })}>
                      <SelectTrigger className="h-8 w-20"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{["A", "B", "C"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-display font-semibold">Class teacher's remarks</p>
              <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks…" />
            </div>
            <p className="text-xs text-muted-foreground">Grading: A1 91–100 · A2 81–90 · B1 71–80 · B2 61–70 · C1 51–60 · C2 41–50 · D 33–40 · E below 33</p>
          </div>
        </CardContent></Card>
      ) : <p className="text-sm text-muted-foreground">Choose an exam, class and student to build the report card.</p>}
    </Page>
  );
}
