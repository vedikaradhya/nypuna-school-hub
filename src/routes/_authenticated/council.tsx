import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { VotingBooth } from "@/components/VotingBooth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/council")({
  head: () => ({
    meta: [
      { title: "Council & Elections — Nypuna Connect" },
      { name: "description", content: "School council members, election ballots and live vote tallies." },
      { property: "og:title", content: "Council & Elections — Nypuna Connect" },
      { property: "og:description", content: "School council members, election ballots and live vote tallies." },
    ],
  }),
  component: Council,
});

function Council() {
  const [electionId, setElectionId] = useState("");

  const elections = useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("elections").select("id, title, status, starts_at, ends_at, council_positions(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; title: string; status: string; starts_at: string | null; ends_at: string | null; council_positions: { name: string } | null }[];
    },
  });

  const members = useQuery({
    queryKey: ["council-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("council_members").select("id, appointed_on, is_active, council_positions(name), students(first_name, last_name, admission_no)");
      if (error) throw error;
      return data as unknown as { id: string; appointed_on: string; is_active: boolean; council_positions: { name: string } | null; students: { first_name: string; last_name: string; admission_no: string } | null }[];
    },
  });

  const active = electionId || elections.data?.[0]?.id || "";

  const tally = useQuery({
    queryKey: ["tally", active],
    enabled: !!active,
    queryFn: async () => {
      const [{ data: candidates }, { data: votes }] = await Promise.all([
        supabase.from("election_candidates").select("id, symbol, manifesto, is_approved, students(first_name, last_name)").eq("election_id", active),
        supabase.from("election_votes").select("candidate_id").eq("election_id", active),
      ]);
      const counts = new Map<string, number>();
      for (const v of (votes ?? []) as { candidate_id: string }[]) counts.set(v.candidate_id, (counts.get(v.candidate_id) ?? 0) + 1);
      const list = ((candidates ?? []) as unknown as { id: string; symbol: string | null; is_approved: boolean; students: { first_name: string; last_name: string } | null }[])
        .map((c) => ({ ...c, votes: counts.get(c.id) ?? 0 }))
        .sort((a, b) => b.votes - a.votes);
      return { list, total: votes?.length ?? 0 };
    },
  });

  return (
    <Page path="/council" title="School Council & Elections" subtitle="Ballots, tallies and council roster">
      <Tabs defaultValue="elections">
        <TabsList>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="members">Council members</TabsTrigger>
        </TabsList>

        <TabsContent value="elections">
          <Card className="mb-4"><CardContent className="pt-6">
            <Select value={active} onValueChange={setElectionId}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Select an election" /></SelectTrigger>
              <SelectContent>{elections.data?.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
            </Select>
            {elections.data?.filter((e) => e.id === active).map((e) => (
              <div key={e.id} className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {e.council_positions?.name ?? "General"} · <Badge variant="secondary">{e.status}</Badge>
                </p>
                <VotingBooth electionId={e.id} open={e.status === "open"} />
              </div>
            ))}
          </CardContent></Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Live tally — {tally.data?.total ?? 0} votes cast</CardTitle></CardHeader>
            <CardContent>
              <DataState loading={tally.isFetching} empty={!tally.data?.list.length} emptyText="No candidates registered for this election.">
                <ul className="space-y-4">
                  {tally.data?.list.map((c) => {
                    const pct = tally.data.total ? (c.votes / tally.data.total) * 100 : 0;
                    return (
                      <li key={c.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{c.students?.first_name} {c.students?.last_name} {c.symbol ? <span className="text-muted-foreground">· {c.symbol}</span> : null}</span>
                          <span className="text-muted-foreground">{c.votes} votes ({pct.toFixed(0)}%)</span>
                        </div>
                        <Progress value={pct} />
                      </li>
                    );
                  })}
                </ul>
              </DataState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members"><Card><CardContent className="pt-6">
          <DataState loading={members.isLoading} error={members.error} empty={!members.data?.length} emptyText="No council members appointed yet.">
            <ul className="divide-y">
              {members.data?.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{m.students?.first_name} {m.students?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{m.council_positions?.name} · since {m.appointed_on}</p>
                  </div>
                  <Badge variant={m.is_active ? "secondary" : "outline"}>{m.is_active ? "serving" : "past"}</Badge>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent></Card></TabsContent>
      </Tabs>
    </Page>
  );
}
