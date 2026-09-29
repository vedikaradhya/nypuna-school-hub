import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cbseGrade } from "@/lib/cbse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type StudentRow = {
  id: string; admission_no: string; first_name: string; last_name: string; roll_no: number | null;
  status: string; gender: string | null; date_of_birth: string | null; father_name?: string | null; mother_name?: string | null;
  guardian_name: string | null; guardian_phone: string | null; guardian_email: string | null; address: string | null;
  blood_group: string | null; allergies: string | null; medical_notes: string | null; admitted_on: string;
  sections: { name: string; grades: { name: string } | null } | null;
  houses: { name: string; color: string } | null;
};

const SCHOOL = "Nypuna School";

export function StudentProfile({ s }: { s: StudentRow }) {
  const qc = useQueryClient();
  const { user, hasAnyRole } = useAuth();
  const [cert, setCert] = useState<"Bonafide" | "Transfer">("Bonafide");
  const cls = s.sections ? `${s.sections.grades?.name ?? ""} ${s.sections.name}` : "—";

  const att = useQuery({
    queryKey: ["stu-att", s.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("attendance_date, status").eq("student_id", s.id).order("attendance_date", { ascending: false }).limit(365);
      if (error) throw error; return data;
    },
  });
  const marks = useQuery({
    queryKey: ["stu-marks", s.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_marks")
        .select("marks_obtained, is_absent, exam_schedules(max_marks, exams(name), subjects(name))").eq("student_id", s.id);
      if (error) throw error;
      return data as unknown as { marks_obtained: number | null; is_absent: boolean; exam_schedules: { max_marks: number; exams: { name: string } | null; subjects: { name: string } | null } | null }[];
    },
  });
  const certs = useQuery({
    queryKey: ["stu-certs", s.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates").select("id, certificate_type, serial_no, issued_on").eq("student_id", s.id).order("issued_on", { ascending: false });
      if (error) throw error; return data;
    },
  });
  const history = useQuery({
    queryKey: ["stu-hist", s.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_history").select("id, event_type, description, occurred_on").eq("student_id", s.id).order("occurred_on", { ascending: false });
      if (error) throw error; return data;
    },
  });

  const issue = useMutation({
    mutationFn: async () => {
      const serial = `${cert === "Bonafide" ? "BC" : "TC"}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("certificates").insert({ student_id: s.id, certificate_type: cert, serial_no: serial, issued_by: user?.id ?? null });
      if (error) throw error;
      return serial;
    },
    onSuccess: (serial) => { toast.success(`Certificate ${serial} issued`); void qc.invalidateQueries({ queryKey: ["stu-certs", s.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = att.data?.length ?? 0;
  const present = att.data?.filter((a) => a.status === "present" || a.status === "late").length ?? 0;
  const half = att.data?.filter((a) => a.status === "half_day").length ?? 0;
  const pct = total ? Math.round(((present + half * 0.5) / total) * 100) : null;
  const latest = certs.data?.find((c) => c.certificate_type === cert);
  const today = new Date().toLocaleDateString("en-IN");

  return (
    <Tabs defaultValue="profile">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="exams">Exams</TabsTrigger>
        <TabsTrigger value="certs">Certificates</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {([
            ["Admission no", s.admission_no], ["Class", cls], ["Roll no", s.roll_no ?? "—"], ["House", s.houses?.name ?? "—"],
            ["Date of birth", s.date_of_birth ?? "—"], ["Gender", s.gender ?? "—"], ["Guardian", s.guardian_name ?? "—"],
            ["Guardian phone", s.guardian_phone ?? "—"], ["Guardian email", s.guardian_email ?? "—"], ["Blood group", s.blood_group ?? "—"],
            ["Allergies", s.allergies ?? "None recorded"], ["Admitted on", s.admitted_on],
          ] as const).map(([k, v]) => (
            <div key={k}><dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd></div>
          ))}
          <div className="col-span-2"><dt className="text-xs uppercase tracking-wide text-muted-foreground">Address</dt><dd>{s.address ?? "—"}</dd></div>
          <div className="col-span-2"><dt className="text-xs uppercase tracking-wide text-muted-foreground">Admission fee</dt><dd>Verified at admission (optional step)</dd></div>
        </dl>
      </TabsContent>

      <TabsContent value="attendance" className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Days marked", total], ["Present", present], ["Attendance", pct === null ? "—" : `${pct}%`]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-display text-xl font-semibold">{v}</p></div>
          ))}
        </div>
        {pct !== null && pct < 75 ? <p className="text-sm text-destructive">Below the CBSE 75% attendance requirement.</p> : null}
        <div className="flex flex-wrap gap-1">
          {att.data?.slice(0, 60).map((a) => (
            <span key={a.attendance_date} title={`${a.attendance_date}: ${a.status}`}
              className={`size-4 rounded-sm ${a.status === "present" ? "bg-primary" : a.status === "absent" ? "bg-destructive" : "bg-accent"}`} />
          ))}
          {!total && !att.isLoading ? <p className="text-sm text-muted-foreground">No attendance recorded yet.</p> : null}
        </div>
      </TabsContent>

      <TabsContent value="exams">
        {marks.data?.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
            <TableBody>{marks.data.map((m, i) => {
              const max = Number(m.exam_schedules?.max_marks ?? 100);
              return (
                <TableRow key={i}>
                  <TableCell>{m.exam_schedules?.exams?.name}</TableCell>
                  <TableCell>{m.exam_schedules?.subjects?.name}</TableCell>
                  <TableCell>{m.is_absent ? "Absent" : `${m.marks_obtained ?? "—"} / ${max}`}</TableCell>
                  <TableCell>{m.is_absent || m.marks_obtained == null ? "—" : <Badge variant="secondary">{cbseGrade((Number(m.marks_obtained) / max) * 100)}</Badge>}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        ) : <p className="text-sm text-muted-foreground">{marks.isLoading ? "Loading…" : "No exam marks yet."}</p>}
      </TabsContent>

      <TabsContent value="certs" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["Bonafide", "Transfer"] as const).map((c) => (
            <Button key={c} size="sm" variant={cert === c ? "default" : "outline"} onClick={() => setCert(c)}>{c} certificate</Button>
          ))}
        </div>
        <div className="print-area rounded-lg border bg-card p-6 text-sm leading-relaxed">
          <p className="text-center font-display text-lg font-semibold">{SCHOOL}</p>
          <p className="text-center text-xs text-muted-foreground">Affiliated to CBSE</p>
          <p className="mt-3 text-center font-semibold uppercase tracking-wide">{cert === "Bonafide" ? "Bonafide Certificate" : "Transfer Certificate"}</p>
          <p className="mt-1 text-right text-xs">Serial: {latest?.serial_no ?? "(issued on save)"} · Date: {latest?.issued_on ?? today}</p>
          {cert === "Bonafide" ? (
            <p className="mt-4">This is to certify that <b>{s.first_name} {s.last_name}</b> (Admission No. {s.admission_no}), date of birth {s.date_of_birth ?? "—"}, ward of {s.guardian_name ?? s.father_name ?? "—"}, is a bonafide student of this school studying in class <b>{cls}</b> during the current academic year.</p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {[["Name", `${s.first_name} ${s.last_name}`], ["Admission no", s.admission_no], ["Date of birth", s.date_of_birth ?? "—"],
                ["Parent / guardian", s.guardian_name ?? "—"], ["Date of admission", s.admitted_on], ["Class last studied", cls],
                ["Attendance", pct === null ? "—" : `${pct}%`], ["Conduct", "Good"], ["Reason for leaving", "Parent's request"]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          )}
          <div className="mt-8 flex justify-between text-xs"><span>Class Teacher</span><span>Principal</span></div>
        </div>
        <div className="flex gap-2">
          {hasAnyRole(["administrator", "principal", "front_office"]) ? (
            <Button size="sm" onClick={() => issue.mutate()} disabled={issue.isPending}>Issue & record</Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
        {certs.data?.length ? (
          <ul className="text-xs text-muted-foreground">{certs.data.map((c) => <li key={c.id}>{c.certificate_type} · {c.serial_no} · {c.issued_on}</li>)}</ul>
        ) : null}
      </TabsContent>

      <TabsContent value="history">
        {history.data?.length ? (
          <ul className="space-y-2 text-sm">{history.data.map((h) => (
            <li key={h.id} className="border-l-2 border-primary pl-3"><p className="font-medium">{h.event_type}</p><p className="text-muted-foreground">{h.description} · {h.occurred_on}</p></li>
          ))}</ul>
        ) : <p className="text-sm text-muted-foreground">No history events recorded.</p>}
      </TabsContent>
    </Tabs>
  );
}
