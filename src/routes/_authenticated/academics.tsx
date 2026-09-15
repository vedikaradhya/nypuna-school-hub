import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/academics")({
  head: () => ({
    meta: [
      { title: "Academic Setup — Nypuna Connect" },
      { name: "description", content: "Configure classes, sections, subjects, periods and classrooms for the academic year." },
      { property: "og:title", content: "Academic Setup — Nypuna Connect" },
      { property: "og:description", content: "Configure classes, sections, subjects, periods and classrooms for the academic year." },
    ],
  }),
  component: Academics,
});

function useTable<T>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn });
}

function Academics() {
  const grades = useTable("grades", async () => {
    const { data, error } = await supabase.from("grades").select("id, name, level, stream, is_active").order("level");
    if (error) throw error; return data;
  });
  const sections = useTable("sections", async () => {
    const { data, error } = await supabase.from("sections").select("id, name, capacity, grades(name), profiles(full_name), classrooms(name)").order("name");
    if (error) throw error; return data as unknown as { id: string; name: string; capacity: number; grades: { name: string } | null; profiles: { full_name: string } | null; classrooms: { name: string } | null }[];
  });
  const subjects = useTable("subjects", async () => {
    const { data, error } = await supabase.from("subjects").select("id, name, code, is_scholastic, requires_lab, departments(name)").order("name");
    if (error) throw error; return data as unknown as { id: string; name: string; code: string; is_scholastic: boolean; requires_lab: boolean; departments: { name: string } | null }[];
  });
  const classrooms = useTable("classrooms", async () => {
    const { data, error } = await supabase.from("classrooms").select("id, name, building, floor, capacity, room_type, is_active").order("name");
    if (error) throw error; return data;
  });
  const periods = useTable("periods", async () => {
    const { data, error } = await supabase.from("periods").select("id, period_no, label, start_time, end_time, is_break").order("period_no");
    if (error) throw error; return data;
  });

  return (
    <Page path="/academics" title="Academic Management" subtitle="Classes, sections, subjects, periods and classrooms">
      <Tabs defaultValue="grades">
        <TabsList className="flex-wrap">
          <TabsTrigger value="grades">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="periods">Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="grades"><Card><CardContent className="pt-6">
          <DataState loading={grades.isLoading} error={grades.error} empty={!grades.data?.length}>
            <Table>
              <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Level</TableHead><TableHead>Stream</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{grades.data?.map((g) => (
                <TableRow key={g.id}><TableCell className="font-medium">{g.name}</TableCell><TableCell>{g.level}</TableCell>
                  <TableCell>{g.stream ?? "—"}</TableCell><TableCell><Badge variant={g.is_active ? "secondary" : "outline"}>{g.is_active ? "active" : "inactive"}</Badge></TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="sections"><Card><CardContent className="pt-6">
          <DataState loading={sections.isLoading} error={sections.error} empty={!sections.data?.length} emptyText="No sections configured yet.">
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Class teacher</TableHead><TableHead>Room</TableHead><TableHead>Capacity</TableHead></TableRow></TableHeader>
              <TableBody>{sections.data?.map((s) => (
                <TableRow key={s.id}><TableCell className="font-medium">{s.grades?.name} {s.name}</TableCell>
                  <TableCell>{s.profiles?.full_name ?? "Unassigned"}</TableCell><TableCell>{s.classrooms?.name ?? "—"}</TableCell><TableCell>{s.capacity}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="subjects"><Card><CardContent className="pt-6">
          <DataState loading={subjects.isLoading} error={subjects.error} empty={!subjects.data?.length}>
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Code</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
              <TableBody>{subjects.data?.map((s) => (
                <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell>{s.departments?.name ?? "—"}</TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant="secondary">{s.is_scholastic ? "scholastic" : "co-scholastic"}</Badge>
                    {s.requires_lab ? <Badge variant="outline">lab</Badge> : null}
                  </TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="classrooms"><Card><CardContent className="pt-6">
          <DataState loading={classrooms.isLoading} error={classrooms.error} empty={!classrooms.data?.length}>
            <Table>
              <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Building</TableHead><TableHead>Floor</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead></TableRow></TableHeader>
              <TableBody>{classrooms.data?.map((c) => (
                <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.building ?? "—"}</TableCell>
                  <TableCell>{c.floor ?? "—"}</TableCell><TableCell>{c.room_type}</TableCell><TableCell>{c.capacity}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="periods"><Card><CardContent className="pt-6">
          <DataState loading={periods.isLoading} error={periods.error} empty={!periods.data?.length}>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Label</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Break</TableHead></TableRow></TableHeader>
              <TableBody>{periods.data?.map((p) => (
                <TableRow key={p.id}><TableCell>{p.period_no}</TableCell><TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell>{p.start_time}</TableCell><TableCell>{p.end_time}</TableCell><TableCell>{p.is_break ? "Yes" : "No"}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>
      </Tabs>
    </Page>
  );
}
