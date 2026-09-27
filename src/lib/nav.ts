import type { AppRole } from "@/hooks/useAuth";

export type NavItem = { to: string; label: string; icon: string; roles: AppRole[] };

export const ALL_ROLES: AppRole[] = ["administrator", "principal", "teacher", "front_office", "librarian"];
const ALL = ALL_ROLES;
const LEAD: AppRole[] = ["administrator", "principal"];

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ALL },
      { to: "/analytics", label: "Analytics", icon: "BarChart3", roles: LEAD },
    ],
  },
  {
    group: "People",
    items: [
      { to: "/students", label: "Students", icon: "Users", roles: ["administrator", "principal", "teacher", "front_office"] },
      { to: "/admissions", label: "Admissions", icon: "ClipboardList", roles: ["administrator", "principal", "front_office"] },
      { to: "/staff", label: "Staff", icon: "IdCard", roles: LEAD },
      { to: "/visitors", label: "Visitor Log", icon: "DoorOpen", roles: ["administrator", "principal", "front_office"] },
    ],
  },
  {
    group: "Academics",
    items: [
      { to: "/academics", label: "Academic Setup", icon: "School", roles: LEAD },
      { to: "/timetable", label: "Timetable & Workload", icon: "CalendarClock", roles: ["administrator", "principal", "teacher"] },
      { to: "/attendance", label: "Attendance", icon: "CheckSquare", roles: ["administrator", "principal", "teacher"] },
      { to: "/assignments", label: "Assignments", icon: "NotebookPen", roles: ["administrator", "principal", "teacher"] },
      { to: "/teacher-tools", label: "Lesson Plans & Q-Bank", icon: "Lightbulb", roles: ["administrator", "principal", "teacher"] },
      { to: "/exams", label: "Examinations", icon: "GraduationCap", roles: ["administrator", "principal", "teacher"] },
      { to: "/report-cards", label: "Report Cards", icon: "FileBadge", roles: ["administrator", "principal", "teacher"] },
    ],
  },
  {
    group: "Campus",
    items: [
      { to: "/library", label: "Library", icon: "BookOpen", roles: ["administrator", "principal", "librarian", "teacher"] },
      { to: "/council", label: "Council & Elections", icon: "Vote", roles: ["administrator", "principal", "teacher"] },
      { to: "/houses", label: "House Points", icon: "Trophy", roles: ALL },
      { to: "/notices", label: "Notice Board", icon: "Megaphone", roles: ALL },
      { to: "/calendar", label: "Calendar", icon: "CalendarDays", roles: ALL },
      { to: "/files", label: "Documents", icon: "FolderOpen", roles: ALL },
    ],
  },
  {
    group: "System",
    items: [{ to: "/audit", label: "Audit & Security", icon: "ShieldCheck", roles: ["administrator"] }],
  },
];

export const ROUTE_ROLES: Record<string, AppRole[]> = Object.fromEntries(
  NAV.flatMap((g) => g.items).map((i) => [i.to, i.roles]),
);
