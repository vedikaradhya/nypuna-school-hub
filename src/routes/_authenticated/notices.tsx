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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Nypuna Connect" },
      { name: "description", content: "Publish and read school circulars and staff announcements." },
      { property: "og:title", content: "Notice Board — Nypuna Connect" },
      { property: "og:description", content: "Publish and read school circulars and staff announcements." },
    ],
  }),
  component: Notices,
});

function Notices() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  const notices = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("id, title, body, audience, is_pinned, is_approved, created_at")
        .order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
      if (error) throw error; return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({ title: form.title, body: form.body, audience: ["staff"] });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Notice posted"); setOpen(false); setForm({ title: "", body: "" }); void qc.invalidateQueries({ queryKey: ["notices"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Page
      path="/notices" title="Notice Board" subtitle="Circulars and announcements"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Post notice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New notice</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="nt">Title</Label>
                <Input id="nt" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="nb">Message</Label>
                <Textarea id="nb" required rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Publish</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataState loading={notices.isLoading} error={notices.error} empty={!notices.data?.length} emptyText="No notices published yet.">
        <div className="grid gap-4 md:grid-cols-2">
          {notices.data?.map((n) => (
            <Card key={n.id}><CardContent className="p-5">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold">{n.title}</h2>
                {n.is_pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                {n.is_approved ? null : <Badge variant="outline">Awaiting approval</Badge>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()} · {(n.audience as string[]).join(", ")}</p>
            </CardContent></Card>
          ))}
        </div>
      </DataState>
    </Page>
  );
}
