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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "School Calendar — Nypuna Connect" },
      { name: "description", content: "Holidays, exams, meetings and campus events for the academic year." },
      { property: "og:title", content: "School Calendar — Nypuna Connect" },
      { property: "og:description", content: "Holidays, exams, meetings and campus events for the academic year." },
    ],
  }),
  component: CalendarPage,
});

const TYPES = ["holiday", "exam", "event", "meeting", "activity", "ptm", "other"] as const;

function CalendarPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", event_type: "event", starts_on: "", location: "" });

  const events = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calendar_events").select("id, title, description, event_type, starts_on, ends_on, start_time, location").order("starts_on").limit(200);
      if (error) throw error; return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("calendar_events").insert({
        title: form.title, event_type: form.event_type as never, starts_on: form.starts_on,
        location: form.location || null, audience: ["administrator", "principal", "teacher", "front_office", "librarian"],
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Event added"); setOpen(false); void qc.invalidateQueries({ queryKey: ["calendar-events"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcoming = (events.data ?? []).filter((e) => e.starts_on >= new Date().toISOString().slice(0, 10));
  const past = (events.data ?? []).filter((e) => e.starts_on < new Date().toISOString().slice(0, 10));

  const list = (rows: typeof upcoming, empty: string) => (
    <DataState loading={events.isLoading} error={events.error} empty={!rows.length} emptyText={empty}>
      <ul className="divide-y">
        {rows.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {e.starts_on}{e.ends_on && e.ends_on !== e.starts_on ? ` – ${e.ends_on}` : ""}{e.start_time ? ` · ${e.start_time}` : ""}{e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
            <Badge variant="secondary">{e.event_type}</Badge>
          </li>
        ))}
      </ul>
    </DataState>
  );

  return (
    <Page
      path="/calendar" title="School Calendar" subtitle="Holidays, exams, meetings and events"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Add event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New calendar event</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="et">Title</Label>
                <Input id="et" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <div className="space-y-1.5"><Label htmlFor="ed">Date</Label>
                <Input id="ed" type="date" required value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="el">Location</Label>
                <Input id="el" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Add to calendar</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="pt-6">
          <h2 className="mb-2 font-display text-base font-semibold">Upcoming</h2>
          {list(upcoming, "Nothing scheduled ahead.")}
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <h2 className="mb-2 font-display text-base font-semibold">Earlier this year</h2>
          {list(past, "No past events recorded.")}
        </CardContent></Card>
      </div>
    </Page>
  );
}
