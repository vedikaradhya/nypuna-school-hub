import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({
    meta: [
      { title: "Document Repository — Nypuna Connect" },
      { name: "description", content: "Upload, filter and download school documents, circulars and exam papers." },
      { property: "og:title", content: "Document Repository — Nypuna Connect" },
      { property: "og:description", content: "Upload, filter and download school documents, circulars and exam papers." },
    ],
  }),
  component: Files,
});

type Cat = "circular" | "policy" | "syllabus" | "question_paper" | "lesson_plan" | "report" | "certificate" | "admission_doc" | "student_doc" | "resource" | "other";
const GROUPS: Record<string, Cat[]> = {
  Academic: ["syllabus", "lesson_plan", "resource"],
  Administrative: ["policy", "report", "certificate", "admission_doc", "student_doc", "other"],
  Circulars: ["circular"],
  "Exam Papers": ["question_paper"],
};
const UPLOAD_CAT: Record<string, Cat> = { Academic: "resource", Administrative: "policy", Circulars: "circular", "Exam Papers": "question_paper" };

function Files() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [group, setGroup] = useState("all");
  const [uploadGroup, setUploadGroup] = useState("Academic");
  const [search, setSearch] = useState("");

  const files = useQuery({
    queryKey: ["files", group],
    queryFn: async () => {
      let q = supabase.from("school_files").select("id, name, category, size_bytes, storage_path, created_at").order("created_at", { ascending: false }).limit(300);
      if (group !== "all") q = q.in("category", GROUPS[group]!);
      const { data, error } = await q;
      if (error) throw error; return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const path = `${UPLOAD_CAT[uploadGroup]}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: se } = await supabase.storage.from("school-files").upload(path, file);
      if (se) throw se;
      const { error } = await supabase.from("school_files").insert({
        name: file.name, category: UPLOAD_CAT[uploadGroup]!, storage_path: path, size_bytes: file.size, mime_type: file.type || null, uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Uploaded"); void qc.invalidateQueries({ queryKey: ["files"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = async (path: string) => {
    const { data, error } = await supabase.storage.from("school-files").createSignedUrl(path, 300);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const rows = (files.data ?? []).filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page path="/files" title="Document Repository" subtitle="Academic, administrative, circulars and exam papers">
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{Object.keys(GROUPS).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-xs" />
          <div className="flex gap-2 md:ml-auto">
            <Select value={uploadGroup} onValueChange={setUploadGroup}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(GROUPS).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
            <Button asChild disabled={upload.isPending}><label className="cursor-pointer">
              {upload.isPending ? "Uploading…" : "Upload"}
              <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
            </label></Button>
          </div>
        </div>
        <DataState loading={files.isLoading} error={files.error} empty={!rows.length} emptyText="No documents in this category yet.">
          <ul className="divide-y">
            {rows.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{(f.size_bytes / 1024).toFixed(0)} KB · {new Date(f.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{f.category.replace("_", " ")}</Badge>
                  <Button size="sm" variant="outline" onClick={() => void open(f.storage_path)}>Open</Button>
                </div>
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent></Card>
    </Page>
  );
}
