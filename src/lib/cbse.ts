export function cbseGrade(pct: number): string {
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}
export const CBSE_GRADES = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"] as const;
