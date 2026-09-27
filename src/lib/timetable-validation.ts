// Deterministic Timetable Validation Engine — final authority over publishing (SRS Module 07).
export type TTEntry = {
  id: string;
  day_of_week: number;
  section_id: string;
  sections?: { name: string; grades: { name: string } | null } | null;
  periods: { period_no: number; label: string; is_break: boolean } | null;
  subjects: { id?: string; name: string; code: string; requires_lab?: boolean } | null;
  profiles: { id: string; full_name: string; max_periods_per_week: number; max_periods_per_day?: number } | null;
  classrooms: { id?: string; name: string; room_type?: string } | null;
};

export type Finding = { rule: string; severity: "hard" | "soft"; message: string };
export type RuleResult = { rule: string; severity: "hard" | "soft"; description: string; findings: Finding[] };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const day = (d: number) => DAYS[d - 1] ?? `Day ${d}`;
const sec = (e: TTEntry) => (e.sections ? `${e.sections.grades?.name ?? ""} ${e.sections.name}`.trim() : "Section");

function dupes(entries: TTEntry[], keyOf: (e: TTEntry) => string | null) {
  const map = new Map<string, TTEntry[]>();
  for (const e of entries) {
    const k = keyOf(e);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return [...map.values()].filter((l) => l.length > 1);
}

export function validateTimetable(entries: TTEntry[]): RuleResult[] {
  const slot = (e: TTEntry) => (e.periods ? `${e.day_of_week}-${e.periods.period_no}` : null);

  const teacherClash: Finding[] = dupes(entries, (e) => (e.profiles && slot(e) ? `${slot(e)}-${e.profiles.id}` : null)).map((l) => ({
    rule: "teacher_clash", severity: "hard",
    message: `${l[0]!.profiles!.full_name} is booked ${l.length}× on ${day(l[0]!.day_of_week)} P${l[0]!.periods!.period_no} (${l.map(sec).join(", ")})`,
  }));

  const roomClash: Finding[] = dupes(entries, (e) => (e.classrooms && slot(e) ? `${slot(e)}-${e.classrooms.id ?? e.classrooms.name}` : null)).map((l) => ({
    rule: "room_clash", severity: "hard",
    message: `Room ${l[0]!.classrooms!.name} is used ${l.length}× on ${day(l[0]!.day_of_week)} P${l[0]!.periods!.period_no}`,
  }));

  const sectionClash: Finding[] = dupes(entries, (e) => (slot(e) ? `${slot(e)}-${e.section_id}` : null)).map((l) => ({
    rule: "section_clash", severity: "hard",
    message: `${sec(l[0]!)} has ${l.length} lessons on ${day(l[0]!.day_of_week)} P${l[0]!.periods!.period_no}`,
  }));

  const breakRule: Finding[] = entries.filter((e) => e.periods?.is_break).map((e) => ({
    rule: "break_period", severity: "hard",
    message: `${sec(e)} has ${e.subjects?.name ?? "a lesson"} scheduled during ${e.periods!.label} on ${day(e.day_of_week)}`,
  }));

  const perDay = new Map<string, { e: TTEntry; n: number }>();
  const perWeek = new Map<string, { e: TTEntry; n: number }>();
  for (const e of entries) {
    if (!e.profiles) continue;
    const d = `${e.profiles.id}-${e.day_of_week}`;
    perDay.set(d, { e, n: (perDay.get(d)?.n ?? 0) + 1 });
    perWeek.set(e.profiles.id, { e, n: (perWeek.get(e.profiles.id)?.n ?? 0) + 1 });
  }
  const maxDay: Finding[] = [...perDay.values()]
    .filter(({ e, n }) => n > (e.profiles!.max_periods_per_day || 7))
    .map(({ e, n }) => ({ rule: "max_per_day", severity: "soft", message: `${e.profiles!.full_name}: ${n} periods on ${day(e.day_of_week)} (limit ${e.profiles!.max_periods_per_day || 7})` }));
  const maxWeek: Finding[] = [...perWeek.values()]
    .filter(({ e, n }) => n > (e.profiles!.max_periods_per_week || 30))
    .map(({ e, n }) => ({ rule: "max_per_week", severity: "soft", message: `${e.profiles!.full_name}: ${n} periods this week (limit ${e.profiles!.max_periods_per_week || 30})` }));

  const distribution: Finding[] = [];
  const subjDay = new Map<string, { e: TTEntry; n: number }>();
  for (const e of entries) {
    if (!e.subjects) continue;
    const k = `${e.section_id}-${e.day_of_week}-${e.subjects.code}`;
    subjDay.set(k, { e, n: (subjDay.get(k)?.n ?? 0) + 1 });
  }
  for (const { e, n } of subjDay.values()) {
    if (n > 2) distribution.push({ rule: "subject_distribution", severity: "soft", message: `${sec(e)}: ${e.subjects!.name} appears ${n}× on ${day(e.day_of_week)} (max 2)` });
  }

  const lab: Finding[] = entries
    .filter((e) => e.subjects?.requires_lab && e.classrooms && e.classrooms.room_type && !/lab/i.test(e.classrooms.room_type))
    .map((e) => ({ rule: "lab_room", severity: "soft", message: `${sec(e)}: ${e.subjects!.name} needs a lab but is in ${e.classrooms!.name} on ${day(e.day_of_week)}` }));

  return [
    { rule: "Teacher clash", severity: "hard", description: "A teacher cannot take two classes in the same period.", findings: teacherClash },
    { rule: "Room clash", severity: "hard", description: "A classroom cannot host two classes at once.", findings: roomClash },
    { rule: "Section clash", severity: "hard", description: "A section cannot have two lessons in one period.", findings: sectionClash },
    { rule: "Break periods", severity: "hard", description: "No lessons during lunch or break periods.", findings: breakRule },
    { rule: "Max periods per day", severity: "soft", description: "Teacher daily load within their limit.", findings: maxDay },
    { rule: "Max periods per week", severity: "soft", description: "Teacher weekly load within their limit.", findings: maxWeek },
    { rule: "Subject distribution", severity: "soft", description: "No subject more than twice a day per section.", findings: distribution },
    { rule: "Lab allocation", severity: "soft", description: "Lab subjects should be in a lab room.", findings: lab },
  ];
}
