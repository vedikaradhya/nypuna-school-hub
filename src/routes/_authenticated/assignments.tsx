import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — Nypuna Connect" },
      { name: "description", content: "Set homework, track submissions and record marks and feedback for each student." },
      { property: "og:title", content: "Assignments — Nypuna Connect" },
      { property: "og:description", content: "Set homework, track submissions and record marks and feedback for each student." },
    ],
  }),
  component: Assignments,
});

function Assignments() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", section_id: "", subject_id: "", due_date: "", max_marks: "20" });

  const options = useQuery({
    queryKey: ["assignment-options"],
    queryFn: async () => {
      const [{ data: sections }, { data: subjects }] = await Promise.all([
        supabase.from("sections").select("id, name, grades(name)").order("name"),
        supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
      ]);
      return {
        sections: (sections ?? []) as unknown as { id: string; name: string; grades: { name: string } | null }[],
        subjects: (subjects ?? []) as { id: string; name: string }[],
      };
    },
  });

  const list = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, assigned_on, due_date, max_marks, sections(name, grades(name)), subjects(name), profiles(full_name)")
        .order("due_date", { ascending: false }).limit(100);
      if (error) throw error;
      return data as unknown as { id: string; title: string; assigned_on: string; due_date: string; max_marks: number; sections: { name: string; grades: { name: string } | null } | null; subjects: { name: string } | null; profiles: { full_name: string } | null }[];
    },
  });

  const subs = useQuery({
    queryKey: ["submissions", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("id, status, submitted_on, marks, feedback, students(first_name, last_name, roll_no)")
        .eq("assignment_id", selected!);
      if (error) throw error;
      return data as unknown as { id: string; status: string; submitted_on: string | null; marks: number | null; feedback: string | null; students: { first_name: string; last_name: string; roll_no: number | null } | null }[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assignments").insert({
        title: form.title, description: form.description || null, section_id: form.section_id,
        subject_id: form.subject_id, teacher_id: user!.id, due_date: form.due_date, max_marks: Number(form.max_marks),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assignment created"); setOpen(false); void qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const grade = useMutation({
    mutationFn: async ({ id, marks, feedback }: { id: string; marks: number | null; feedback: string }) => {
      const { error } = await supabase.from("assignment_submissions").update({ marks, feedback, status: "graded" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Feedback saved"); void qc.invalidateQueries({ queryKey: ["submissions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Page
      path="/assignments"
      title="Assignments & Homework"
      subtitle="Tasks, submissions and feedback"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">New assignment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Create assignment</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="t">Title</Label>
                <Input id="t" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="d">Description</Label>
                <Textarea id="d" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent>{options.data?.sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.grades?.name} {s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>{options.data?.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="due">Due date</Label>
                  <Input id="due" type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="mm">Max marks</Label>
                  <Input id="mm" type="number" min={1} value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending || !form.section_id || !form.subject_id}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card><CardContent className="pt-6">
        <DataState loading={list.isLoading} error={list.error} empty={!list.data?.length} emptyText="No assignments yet.">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead>
              <TableHead>Due</TableHead><TableHead>Marks</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{list.data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>{a.sections?.grades?.name} {a.sections?.name}</TableCell>
                <TableCell>{a.subjects?.name}</TableCell>
                <TableCell>{a.due_date}</TableCell>
                <TableCell>{a.max_marks}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(a.id)}>Submissions</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </DataState>
      </CardContent></Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Submission log</DialogTitle></DialogHeader>
          <DataState loading={subs.isLoading} error={subs.error} empty={!subs.data?.length} emptyText="No submissions recorded for this assignment.">
            <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
              {subs.data?.map((s) => (
                <li key={s.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{s.students?.roll_no ? `${s.students.roll_no}. ` : ""}{s.students?.first_name} {s.students?.last_name}</p>
                    <Badge variant="secondary">{s.status}</Badge>
                  </div>
                  <form
                    className="mt-2 flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      grade.mutate({ id: s.id, marks: f.get("marks") ? Number(f.get("marks")) : null, feedback: String(f.get("feedback") ?? "") });
                    }}
                  >
                    <Input name="marks" type="number" step="0.5" placeholder="Marks" defaultValue={s.marks ?? ""} className="w-24" />
                    <Input name="feedback" placeholder="Feedback" defaultValue={s.feedback ?? ""} className="min-w-40 flex-1" />
                    <Button size="sm" type="submit">Save</Button>
                  </form>
                </li>
              ))}
            </ul>
          </DataState>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
