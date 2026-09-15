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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/houses")({
  head: () => ({
    meta: [
      { title: "House Points — Nypuna Connect" },
      { name: "description", content: "House points leaderboard and the ledger of awards across the school year." },
      { property: "og:title", content: "House Points — Nypuna Connect" },
      { property: "og:description", content: "House points leaderboard and the ledger of awards across the school year." },
    ],
  }),
  component: Houses,
});

function Houses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ house_id: "", points: "10", reason: "", category: "academics" });

  const houses = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name, color, motto").order("name");
      if (error) throw error; return data;
    },
  });

  const points = useQuery({
    queryKey: ["house-points"],
    queryFn: async () => {
      const { data, error } = await supabase.from("house_points").select("id, points, reason, category, awarded_on, house_id, houses(name)").order("awarded_on", { ascending: false }).limit(100);
      if (error) throw error;
      return data as unknown as { id: string; points: number; reason: string; category: string; awarded_on: string; house_id: string; houses: { name: string } | null }[];
    },
  });

  const award = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("house_points").insert({
        house_id: form.house_id, points: Number(form.points), reason: form.reason, category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Points awarded"); setOpen(false); void qc.invalidateQueries({ queryKey: ["house-points"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = (houses.data ?? []).map((h) => ({
    ...h,
    total: (points.data ?? []).filter((p) => p.house_id === h.id).reduce((s, p) => s + p.points, 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <Page
      path="/houses" title="House Points" subtitle="Leaderboard and points ledger"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">Award points</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Award house points</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); award.mutate(); }}>
              <Select value={form.house_id} onValueChange={(v) => setForm({ ...form, house_id: v })}>
                <SelectTrigger><SelectValue placeholder="House" /></SelectTrigger>
                <SelectContent>{houses.data?.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["academics", "sports", "culturals", "discipline", "service"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="space-y-1.5"><Label htmlFor="pts">Points</Label>
                <Input id="pts" type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="reason">Reason</Label>
                <Input id="reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={award.isPending || !form.house_id}>Award</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totals.map((h, i) => (
          <Card key={h.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: h.color }} />
                <p className="font-medium">{h.name}</p>
                {i === 0 && h.total > 0 ? <span className="ml-auto text-xs text-muted-foreground">Leading</span> : null}
              </div>
              <p className="mt-2 font-display text-3xl font-semibold">{h.total}</p>
              <p className="text-xs text-muted-foreground">{h.motto ?? ""}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display text-base">Points ledger</CardTitle></CardHeader>
        <CardContent>
          <DataState loading={points.isLoading} error={points.error} empty={!points.data?.length} emptyText="No points awarded yet.">
            <ul className="divide-y">
              {points.data?.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{p.houses?.name} · {p.points > 0 ? "+" : ""}{p.points}</p>
                    <p className="text-muted-foreground">{p.reason} · {p.category}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.awarded_on}</span>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent>
      </Card>
    </Page>
  );
}
