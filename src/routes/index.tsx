import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nypuna Connect — CBSE School Management Platform" },
      { name: "description", content: "One staff workspace for students, admissions, timetables, attendance, CBSE exams, library and campus life." },
      { property: "og:title", content: "Nypuna Connect — CBSE School Management Platform" },
      { property: "og:description", content: "One staff workspace for students, admissions, timetables, attendance, CBSE exams, library and campus life." },
    ],
  }),
  component: Index,
});

const FEATURES = [
  ["Student Information System", "Registry, profiles, guardians and medical records."],
  ["Admissions", "Enquiries through to admitted, stage by stage."],
  ["Timetable & Workload", "Weekly grids, clash alerts and teacher load balance."],
  ["Attendance", "Section roll call with instant daily totals."],
  ["CBSE Examinations", "Scheduling, mark entry and A1–E report cards."],
  ["Campus Life", "Library, council elections, house points and visitors."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary font-bold text-primary-foreground">N</div>
          <span className="font-display font-semibold">Nypuna Connect</span>
        </div>
        <Link to="/auth" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Staff sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">CBSE school management</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Run the whole campus from one workspace
        </h1>
        <p className="mt-4 text-muted-foreground">
          Nypuna Connect brings students, admissions, academics, examinations, library and campus life together for
          administrators, principals, teachers, front office and librarians.
        </p>
        <Link to="/auth" className="mt-8 inline-flex rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Sign in to your workspace
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-lg border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
