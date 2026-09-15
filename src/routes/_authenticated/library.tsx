import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Page";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — Nypuna Connect" },
      { name: "description", content: "Book inventory, issue and return circulation, overdue tracking and fines." },
      { property: "og:title", content: "Library — Nypuna Connect" },
      { property: "og:description", content: "Book inventory, issue and return circulation, overdue tracking and fines." },
    ],
  }),
  component: Library,
});

function Library() {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const books = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("id, title, author, category, language, accession_no, total_copies, available_copies, shelf_location").order("title").limit(200);
      if (error) throw error; return data;
    },
  });

  const issues = useQuery({
    queryKey: ["book-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_issues")
        .select("id, issued_on, due_on, returned_on, fine_amount, books(title), students(first_name, last_name, admission_no), profiles(full_name)")
        .order("issued_on", { ascending: false }).limit(150);
      if (error) throw error;
      return data as unknown as { id: string; issued_on: string; due_on: string; returned_on: string | null; fine_amount: number; books: { title: string } | null; students: { first_name: string; last_name: string; admission_no: string } | null; profiles: { full_name: string } | null }[];
    },
  });

  const returnBook = useMutation({
    mutationFn: async ({ id, due }: { id: string; due: string }) => {
      const overdueDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(due)) / 86400000));
      const { error } = await supabase.from("book_issues").update({ returned_on: today, fine_amount: overdueDays * 2 }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Return recorded"); void qc.invalidateQueries({ queryKey: ["book-issues"] }); void qc.invalidateQueries({ queryKey: ["books"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const outstanding = (issues.data ?? []).filter((i) => !i.returned_on);
  const fines = (issues.data ?? []).reduce((s, i) => s + Number(i.fine_amount ?? 0), 0);

  return (
    <Page path="/library" title="Library Operations" subtitle={`${outstanding.length} books on loan · ₹${fines.toFixed(0)} fines recorded`}>
      <Tabs defaultValue="circulation">
        <TabsList>
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="circulation"><Card><CardContent className="pt-6">
          <DataState loading={issues.isLoading} error={issues.error} empty={!issues.data?.length} emptyText="No issues recorded yet.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Book</TableHead><TableHead>Borrower</TableHead><TableHead>Issued</TableHead>
                <TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Fine</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>{issues.data?.map((i) => {
                const overdue = !i.returned_on && i.due_on < today;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.books?.title}</TableCell>
                    <TableCell>{i.students ? `${i.students.first_name} ${i.students.last_name}` : i.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell>{i.issued_on}</TableCell><TableCell>{i.due_on}</TableCell>
                    <TableCell>{i.returned_on ? <Badge variant="secondary">returned</Badge> : overdue ? <Badge variant="destructive">overdue</Badge> : <Badge>on loan</Badge>}</TableCell>
                    <TableCell>₹{Number(i.fine_amount ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-right">
                      {i.returned_on ? null : <Button size="sm" variant="outline" onClick={() => returnBook.mutate({ id: i.id, due: i.due_on })}>Return</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>

        <TabsContent value="catalogue"><Card><CardContent className="pt-6">
          <DataState loading={books.isLoading} error={books.error} empty={!books.data?.length} emptyText="No books in the catalogue yet.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead>
                <TableHead>Shelf</TableHead><TableHead>Available</TableHead>
              </TableRow></TableHeader>
              <TableBody>{books.data?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell><TableCell>{b.author ?? "—"}</TableCell>
                  <TableCell>{b.category}</TableCell><TableCell>{b.shelf_location ?? "—"}</TableCell>
                  <TableCell>{b.available_copies} / {b.total_copies}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </DataState>
        </CardContent></Card></TabsContent>
      </Tabs>
    </Page>
  );
}
