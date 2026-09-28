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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Nypuna Connect" },
      { name: "description", content: "Track admission enquiries and move applications through the school's admission pipeline." },
      { property: "og:title", content: "Admissions — Nypuna Connect" },
      { property: "og:description", content: "Track admission enquiries and move applications through the school's admission pipeline." },
    ],
  }),
  component: Admissions,
});

const STAGES = ["enquiry", "applied", "document_verification", "test_scheduled", "interviewed", "principal_approval", "offered", "admitted", "rejected", "withdrawn"] as const;

function Admissions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ parent_name: "", phone: "", child_name: "", email: "" });

  const enquiries = useQuery({
    queryKey: ["enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enquiries").select("id, parent_name, phone, email, child_name, status, follow_up_date, created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const apps = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admission_applications").select("id, application_no, applicant_name, guardian_name, guardian_phone, stage, documents_verified, fee_verified, test_score, created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const addEnquiry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("enquiries").insert({
        parent_name: form.parent_name, phone: form.phone,
        child_name: form.child_name || null, email: form.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enquiry recorded");
      setOpen(false);
      setForm({ parent_name: "", phone: "", child_name: "", email: "" });
      void qc.invalidateQueries({ queryKey: ["enquiries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("admission_applications").update({ stage: stage as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stage updated"); void qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setFlag = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { documents_verified?: boolean; fee_verified?: boolean } }) => {
      const { error } = await supabase.from("admission_applications").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Page
      path="/admissions"
      title="Admissions Management"
      subtitle="Enquiries and application pipeline"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">New enquiry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Record an enquiry</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); addEnquiry.mutate(); }}>
              {([["parent_name", "Parent name", true], ["phone", "Phone", true], ["child_name", "Child name", false], ["email", "Email", false]] as const).map(([k, label, req]) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k}>{label}</Label>
                  <Input id={k} required={req} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={addEnquiry.isPending}>Save enquiry</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Applications</TabsTrigger>
          <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {STAGES.slice(0, 10).map((s) => (
              <Card key={s}>
                <CardContent className="p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.replace(/_/g, " ")}</p>
                  <p className="font-display text-2xl font-semibold">{apps.data?.filter((a) => a.stage === s).length ?? 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card><CardContent className="pt-6">
            <DataState loading={apps.isLoading} error={apps.error} empty={!apps.data?.length} emptyText="No applications yet.">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Application</TableHead><TableHead>Applicant</TableHead><TableHead>Guardian</TableHead>
                    <TableHead>Docs</TableHead><TableHead>Test score</TableHead><TableHead>Stage</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {apps.data?.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.application_no}</TableCell>
                        <TableCell className="font-medium">{a.applicant_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.guardian_name} · {a.guardian_phone}</TableCell>
                        <TableCell className="space-y-1 text-xs">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={a.documents_verified} onChange={(e) => setFlag.mutate({ id: a.id, patch: { documents_verified: e.target.checked } })} /> Documents</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={a.fee_verified} onChange={(e) => setFlag.mutate({ id: a.id, patch: { fee_verified: e.target.checked } })} /> Fee (optional)</label>
                        </TableCell>
                        <TableCell>{a.test_score ?? "—"}</TableCell>
                        <TableCell>
                          <Select value={a.stage} onValueChange={(v) => setStage.mutate({ id: a.id, stage: v })}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataState>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="enquiries">
          <Card><CardContent className="pt-6">
            <DataState loading={enquiries.isLoading} error={enquiries.error} empty={!enquiries.data?.length} emptyText="No enquiries recorded yet.">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Parent</TableHead><TableHead>Child</TableHead><TableHead>Contact</TableHead>
                  <TableHead>Follow-up</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {enquiries.data?.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.parent_name}</TableCell>
                      <TableCell>{e.child_name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.phone}{e.email ? ` · ${e.email}` : ""}</TableCell>
                      <TableCell>{e.follow_up_date ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataState>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
