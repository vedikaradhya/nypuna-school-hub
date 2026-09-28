import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Candidate = { id: string; symbol: string | null; students: { first_name: string; last_name: string } | null };

export function VotingBooth({ electionId, open: isOpen }: { electionId: string; open: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [admNo, setAdmNo] = useState("");
  const [voter, setVoter] = useState<{ id: string; name: string } | null>(null);
  const [choice, setChoice] = useState("");

  const candidates = useQuery({
    queryKey: ["booth-candidates", electionId],
    enabled: open && !!electionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("election_candidates")
        .select("id, symbol, students(first_name, last_name)").eq("election_id", electionId).eq("is_approved", true);
      if (error) throw error;
      return data as unknown as Candidate[];
    },
  });

  const reset = () => { setAdmNo(""); setVoter(null); setChoice(""); };

  const verify = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("students").select("id, first_name, last_name").eq("admission_no", admNo.trim()).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("No student with that admission number.");
      const { count } = await supabase.from("election_votes").select("id", { count: "exact", head: true })
        .eq("election_id", electionId).eq("voter_student_id", data.id);
      if (count) throw new Error("This student has already voted.");
      return { id: data.id, name: `${data.first_name} ${data.last_name}` };
    },
    onSuccess: setVoter,
    onError: (e: Error) => toast.error(e.message),
  });

  const cast = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("election_votes").insert({
        election_id: electionId, candidate_id: choice, voter_student_id: voter!.id, recorded_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Vote recorded. Next voter, please."); reset(); void qc.invalidateQueries({ queryKey: ["tally", electionId] }); },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "This student has already voted." : e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button size="sm" disabled={!isOpen}>{isOpen ? "Open voting booth" : "Voting closed"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Voting booth</DialogTitle></DialogHeader>
        {!voter ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); verify.mutate(); }}>
            <Label htmlFor="adm">Voter admission number</Label>
            <Input id="adm" autoFocus required value={admNo} onChange={(e) => setAdmNo(e.target.value)} />
            <Button type="submit" className="w-full" disabled={verify.isPending}>Verify voter</Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Voting as <span className="font-medium text-foreground">{voter.name}</span>. Your choice is secret.</p>
            <div className="grid gap-2">
              {candidates.data?.map((c) => (
                <button key={c.id} type="button" onClick={() => setChoice(c.id)}
                  className={`rounded-lg border p-4 text-left transition ${choice === c.id ? "border-primary bg-accent" : "hover:bg-muted"}`}>
                  <span className="font-medium">{c.students?.first_name} {c.students?.last_name}</span>
                  {c.symbol ? <span className="ml-2 text-muted-foreground">· {c.symbol}</span> : null}
                </button>
              ))}
              {!candidates.isLoading && !candidates.data?.length ? <p className="text-sm text-muted-foreground">No approved candidates.</p> : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button className="flex-1" disabled={!choice || cast.isPending} onClick={() => cast.mutate()}>Cast vote</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
