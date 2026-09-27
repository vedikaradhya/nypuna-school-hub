import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/teacher-tools")({
  head: () => ({
    meta: [
      { title: "Lesson Plans & Question Bank — Nypuna Connect" },
      { name: "description", content: "Lesson plans, syllabus tracker and a question bank with paper generator for teachers." },
      { property: "og:title", content: "Lesson Plans & Question Bank — Nypuna Connect" },
      { property: "og:description", content: "Lesson plans, syllabus tracker and a question bank with paper generator for teachers." },
    ],
  }),
  component: TeacherTools,
});

type Opt = { id: string; name: string };

function useLookups() {
  return useQuery({
    queryKey: ["tt-lookups"],
    queryFn: async () => {
      const [s, g, sec] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
        supabase.from("grades").select("id, name").order("level"),
        supabase.from("sections").select("id, name, grades(name, level)"),
      ]);
      const sections = ((sec.data ?? []) as unknown as { id: string; name: string; grades: { name: string; level: number } | null }[])
        .sort((a, b) => (a.grades?.level ?? 0) - (b.grades?.level ?? 0) || a.name.localeCompare(b.name))
        .map((x) => ({ id: x.id, name: `${x.grades?.name ?? ""} ${x.name}` }));
      return { subjects: (s.data ?? []) as Opt[], grades: (g.data ?? []) as Opt[], sections };
    },
  });
}

function Pick({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: Opt[]; placeholder: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function TeacherTools() {
  return (
    <Page path="/teacher-tools" title="Teacher Tools" subtitle="Lesson plans, syllabus tracker and question bank">
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Lesson plans</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus tracker</TabsTrigger>
          <TabsTrigger value="qbank">Question bank</TabsTrigger>
        </TabsList>
        <TabsContent value="plans"><LessonPlans /></TabsContent>
        <TabsContent value="syllabus"><Syllabus /></TabsContent>
        <TabsContent value="qbank"><QuestionBank /></TabsContent>
      </Tabs>
    </Page>
  );
}

function LessonPlans() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const lk = useLookups();
  const [open, setOpen] = useState(false);
  const empty = { title: "", subject_id: "", grade_id: "", chapter: "", unit: "", content: "", status: "draft" };
  const [form, setForm] = useState(empty);

  const plans = useQuery({
    queryKey: ["lesson-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_plans").select("id, title, chapter, unit, status, content, updated_at, subjects(name), grades(name)").order("updated_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as unknown as { id: string; title: string; chapter: string | null; unit: string | null; status: string; content: string | null; updated_at: string; subjects: { name: string } | null; grades: { name: string } | null }[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.subject_id) throw new Error("Choose a subject");
      const { error } = await supabase.from("lesson_plans").insert({
        title: form.title, subject_id: form.subject_id, grade_id: form.grade_id || null, chapter: form.chapter || null,
        unit: form.unit || null, content: form.content || null, status: form.status, teacher_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lesson plan saved"); setOpen(false); setForm(empty); void qc.invalidateQueries({ queryKey: ["lesson-plans"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("lesson_plans").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["lesson-plans"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base">Lesson plans</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">New plan</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">New lesson plan</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="lt">Title</Label><Input id="lt" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Pick value={form.subject_id} onChange={(v) => setForm({ ...form, subject_id: v })} options={lk.data?.subjects ?? []} placeholder="Subject" />
                <Pick value={form.grade_id} onChange={(v) => setForm({ ...form, grade_id: v })} options={lk.data?.grades ?? []} placeholder="Grade" />
                <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <Input placeholder="Chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} />
              </div>
              <Textarea rows={6} placeholder="Objectives, activities, resources, assessment…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              <Button type="submit" className="w-full" disabled={create.isPending}>Save plan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <DataState loading={plans.isLoading} error={plans.error} empty={!plans.data?.length} emptyText="No lesson plans yet.">
          <ul className="divide-y">
            {plans.data?.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.subjects?.name} · {p.grades?.name ?? "All grades"}{p.unit ? ` · ${p.unit}` : ""}{p.chapter ? ` · ${p.chapter}` : ""}</p>
                  {p.content ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p> : null}
                </div>
                <Select value={p.status} onValueChange={(v) => setStatus.mutate({ id: p.id, status: v })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft", "submitted", "approved", "delivered"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent>
    </Card>
  );
}

function Syllabus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const lk = useLookups();
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [ch, setCh] = useState({ chapter_name: "", start_date: "" });

  const rows = useQuery({
    queryKey: ["syllabus", sectionId, subjectId],
    enabled: !!sectionId && !!subjectId,
    queryFn: async () => {
      const { data, error } = await supabase.from("syllabus_progress").select("id, chapter_no, chapter_name, start_date, completion_date, completion_pct")
        .eq("section_id", sectionId).eq("subject_id", subjectId).order("chapter_no");
      if (error) throw error; return data;
    },
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["syllabus", sectionId, subjectId] });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("syllabus_progress").insert({
        section_id: sectionId, subject_id: subjectId, chapter_name: ch.chapter_name,
        chapter_no: (rows.data?.length ?? 0) + 1, start_date: ch.start_date || null, updated_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { setCh({ chapter_name: "", start_date: "" }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, pct }: { id: string; pct: number }) => {
      const { error } = await supabase.from("syllabus_progress").update({
        completion_pct: pct, completion_date: pct >= 100 ? new Date().toISOString().slice(0, 10) : null, updated_by: user!.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const list = rows.data ?? [];
  const overall = list.length ? list.reduce((n, r) => n + r.completion_pct, 0) / list.length : 0;
  const done = list.filter((r) => r.completion_pct >= 100).length;

  return (
    <Card><CardContent className="space-y-4 pt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Pick value={sectionId} onChange={setSectionId} options={lk.data?.sections ?? []} placeholder="Choose class & section" />
        <Pick value={subjectId} onChange={setSubjectId} options={lk.data?.subjects ?? []} placeholder="Choose subject" />
      </div>
      {sectionId && subjectId ? (
        <>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{done} of {list.length} chapters completed</span><span className="text-muted-foreground">{overall.toFixed(0)}% overall</span></div>
            <Progress value={overall} />
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <Input required placeholder="Chapter name" value={ch.chapter_name} onChange={(e) => setCh({ ...ch, chapter_name: e.target.value })} />
            <Input type="date" aria-label="Planned start date" className="sm:w-44" value={ch.start_date} onChange={(e) => setCh({ ...ch, start_date: e.target.value })} />
            <Button type="submit" disabled={add.isPending}>Add chapter</Button>
          </form>
          <DataState loading={rows.isLoading} error={rows.error} empty={!list.length} emptyText="No chapters planned yet for this class and subject.">
            <ul className="divide-y">
              {list.map((r) => (
                <li key={r.id} className="grid items-center gap-2 py-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium">Ch {r.chapter_no}. {r.chapter_name}</p>
                    <p className="text-xs text-muted-foreground">Planned {r.start_date ?? "—"}{r.completion_date ? ` · completed ${r.completion_date}` : ""}</p>
                    <Progress value={r.completion_pct} className="mt-2 h-1.5" />
                  </div>
                  <div className="flex gap-1">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <Button key={p} size="sm" variant={r.completion_pct === p ? "default" : "outline"} onClick={() => update.mutate({ id: r.id, pct: p })}>{p}%</Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </DataState>
        </>
      ) : <p className="text-sm text-muted-foreground">Choose a class and subject to track chapter progress.</p>}
    </CardContent></Card>
  );
}

type Q = { id: string; question: string; answer: string | null; marks: number; difficulty: string; question_type: string; chapter: string | null; subjects: { name: string } | null; grades: { name: string } | null };

function QuestionBank() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const lk = useLookups();
  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [open, setOpen] = useState(false);
  const empty = { question: "", answer: "", marks: "1", difficulty: "medium", question_type: "short_answer", chapter: "" };
  const [form, setForm] = useState(empty);
  const [gen, setGen] = useState({ count: "10", target: "40" });
  const [paper, setPaper] = useState<Q[] | null>(null);

  const questions = useQuery({
    queryKey: ["qbank", subjectId, gradeId],
    queryFn: async () => {
      let q = supabase.from("question_bank").select("id, question, answer, marks, difficulty, question_type, chapter, subjects(name), grades(name)").eq("is_archived", false).order("created_at", { ascending: false }).limit(300);
      if (subjectId) q = q.eq("subject_id", subjectId);
      if (gradeId) q = q.eq("grade_id", gradeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Q[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!subjectId) throw new Error("Pick a subject filter first");
      const { error } = await supabase.from("question_bank").insert({
        question: form.question, answer: form.answer || null, marks: Number(form.marks) || 1, difficulty: form.difficulty,
        question_type: form.question_type, chapter: form.chapter || null, subject_id: subjectId, grade_id: gradeId || null, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Question added"); setOpen(false); setForm(empty); void qc.invalidateQueries({ queryKey: ["qbank"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = () => {
    const pool = [...(questions.data ?? [])].sort(() => Math.random() - 0.5);
    const want = Number(gen.count) || 10;
    const target = Number(gen.target) || 0;
    const picked: Q[] = [];
    let total = 0;
    for (const q of pool) {
      if (picked.length >= want) break;
      if (target && total + q.marks > target) continue;
      picked.push(q); total += q.marks;
    }
    if (!picked.length) { toast.error("No questions match these filters"); return; }
    setPaper(picked.sort((a, b) => a.marks - b.marks));
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_1fr_auto]">
        <Pick value={subjectId} onChange={setSubjectId} options={lk.data?.subjects ?? []} placeholder="All subjects" />
        <Pick value={gradeId} onChange={setGradeId} options={lk.data?.grades ?? []} placeholder="All grades" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!subjectId}>Add question</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">New question</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <Textarea required rows={3} placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              <Textarea rows={2} placeholder="Answer / marking scheme" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min={1} max={20} aria-label="Marks" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
                <Input placeholder="Chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} />
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["easy", "medium", "hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["mcq", "very_short", "short_answer", "long_answer", "case_based"].map((d) => <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Save question</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Paper generator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5"><Label htmlFor="gc">Questions</Label><Input id="gc" type="number" className="w-28" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="gt">Max total marks</Label><Input id="gt" type="number" className="w-28" value={gen.target} onChange={(e) => setGen({ ...gen, target: e.target.value })} /></div>
            <Button onClick={generate} variant="secondary">Generate paper</Button>
            {paper ? <Button variant="outline" onClick={() => window.print()}>Print</Button> : null}
          </div>
          {paper ? (
            <div className="print-area rounded-lg border p-6">
              <p className="text-center font-display text-lg font-semibold">Question Paper</p>
              <p className="mb-4 text-center text-xs text-muted-foreground">Total marks: {paper.reduce((n, q) => n + q.marks, 0)}</p>
              <ol className="list-decimal space-y-3 pl-5 text-sm">
                {paper.map((q) => <li key={q.id}><span>{q.question}</span> <span className="text-muted-foreground">[{q.marks}]</span></li>)}
              </ol>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card><CardContent className="pt-6">
        <DataState loading={questions.isLoading} error={questions.error} empty={!questions.data?.length} emptyText="No questions in the bank for these filters.">
          <ul className="divide-y">
            {questions.data?.map((q) => (
              <li key={q.id} className="py-3">
                <p className="text-sm font-medium">{q.question}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
                  <Badge variant="outline">{q.difficulty}</Badge>
                  <Badge variant="outline">{q.question_type.replace("_", " ")}</Badge>
                  <span className="text-muted-foreground">{q.subjects?.name} · {q.grades?.name ?? "any grade"}{q.chapter ? ` · ${q.chapter}` : ""}</span>
                </div>
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent></Card>
    </div>
  );
}
