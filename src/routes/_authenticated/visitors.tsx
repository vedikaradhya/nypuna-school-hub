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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/visitors")({
  head: () => ({
    meta: [
      { title: "Visitor Log — Nypuna Connect" },
      { name: "description", content: "Front office visitor register with check-in, badge numbers and check-out." },
      { property: "og:title", content: "Visitor Log — Nypuna Connect" },
      { property: "og:description", content: "Front office visitor register with check-in, badge numbers and check-out." },
    ],
  }),
  component: Visitors,
});

function Visitors() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", phone: "", purpose: "", host_name: "", badge_no: "" });

  const logs = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("visitor_logs").select("id, visitor_name, phone, purpose, host_name, badge_no, check_in, check_out").order("check_in", { ascending: false }).limit(150);
      if (error) throw error; return data;
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("visitor_logs").insert({
        visitor_name: form.visitor_name, phone: form.phone || null, purpose: form.purpose,
        host_name: form.host_name || null, badge_no: form.badge_no || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Visitor checked in"); setOpen(false); setForm({ visitor_name: "", phone: "", purpose: "", host_name: "", badge_no: "" }); void qc.invalidateQueries({ queryKey: ["visitors"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visitor_logs").update({ check_out: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checked out"); void qc.invalidateQueries({ queryKey: ["visitors"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Page
      path="/visitors" title="Front Office — Visitor Log" subtitle="Campus check-in register"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Check in visitor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New visitor</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); checkIn.mutate(); }}>
              {([["visitor_name", "Visitor name", true], ["phone", "Phone", false], ["purpose", "Purpose", true], ["host_name", "Person to meet", false], ["badge_no", "Badge no", false]] as const).map(([k, label, req]) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k}>{label}</Label>
                  <Input id={k} required={req} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={checkIn.isPending}>Check in</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card><CardContent className="pt-6">
        <DataState loading={logs.isLoading} error={logs.error} empty={!logs.data?.length} emptyText="No visitors logged yet.">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Visitor</TableHead><TableHead>Purpose</TableHead><TableHead>Meeting</TableHead>
              <TableHead>Badge</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{logs.data?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.visitor_name}<div className="text-xs text-muted-foreground">{v.phone ?? ""}</div></TableCell>
                <TableCell>{v.purpose}</TableCell><TableCell>{v.host_name ?? "—"}</TableCell>
                <TableCell>{v.badge_no ?? "—"}</TableCell>
                <TableCell className="text-xs">{new Date(v.check_in).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{v.check_out ? new Date(v.check_out).toLocaleString() : <Badge>on campus</Badge>}</TableCell>
                <TableCell className="text-right">{v.check_out ? null : <Button size="sm" variant="outline" onClick={() => checkOut.mutate(v.id)}>Check out</Button>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </DataState>
      </CardContent></Card>
    </Page>
  );
}
