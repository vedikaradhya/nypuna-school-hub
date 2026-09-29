import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentProfile } from "@/components/StudentProfile";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Student Records — Nypuna Connect" },
      { name: "description", content: "Search the student registry, filter by class and house, and open full student profiles." },
      { property: "og:title", content: "Student Records — Nypuna Connect" },
      { property: "og:description", content: "Search the student registry, filter by class and house, and open full student profiles." },
    ],
  }),
  component: Students,
});

type Row = {
  id: string; admission_no: string; first_name: string; last_name: string; roll_no: number | null;
  status: string; gender: string | null; date_of_birth: string | null; guardian_name: string | null;
  guardian_phone: string | null; guardian_email: string | null; address: string | null; blood_group: string | null;
  allergies: string | null; medical_notes: string | null; admitted_on: string;
  sections: { name: string; grades: { name: string } | null } | null;
  houses: { name: string; color: string } | null;
};

function Students() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [selected, setSelected] = useState<Row | null>(null);

  const students = useQuery({
    queryKey: ["students", search, status],
    queryFn: async () => {
      let q = supabase
        .from("students")
        .select("id, admission_no, first_name, last_name, roll_no, status, gender, date_of_birth, guardian_name, guardian_phone, guardian_email, address, blood_group, allergies, medical_notes, admitted_on, sections(name, grades(name)), houses(name, color)")
        .order("admission_no")
        .limit(200);
      if (status !== "all") q = q.eq("status", status as never);
      if (search.trim()) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_no.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  return (
    <Page path="/students" title="Student Information System" subtitle="Registry, profiles and records">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search name or admission number" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["active", "graduated", "transferred", "withdrawn", "alumni", "all"].map((s) => (
                  <SelectItem key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataState loading={students.isLoading} error={students.error} empty={!students.data?.length} emptyText="No students match this filter.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adm. no</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead>
                    <TableHead>Roll</TableHead><TableHead>House</TableHead><TableHead>Guardian</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.data?.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                      <TableCell className="font-mono text-xs">{s.admission_no}</TableCell>
                      <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                      <TableCell>{s.sections ? `${s.sections.grades?.name ?? ""} ${s.sections.name}` : "—"}</TableCell>
                      <TableCell>{s.roll_no ?? "—"}</TableCell>
                      <TableCell>{s.houses?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.guardian_name ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataState>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{selected?.first_name} {selected?.last_name}</DialogTitle></DialogHeader>
          {selected ? <StudentProfile s={selected} /> : null}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
