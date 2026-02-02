export const INTAKE_ORDER = [
  "red_flags",
  "chief_complaint",
  "symptoms",
  "onset_time",
  "past_history",
  "medications",
  "allergies",
] as const;

export type IntakeField = typeof INTAKE_ORDER[number];

export function getNextIntakeField(
  confirmedFields: string[]
): IntakeField | null {
  for (const field of INTAKE_ORDER) {
    if (!confirmedFields.includes(field)) {
      return field;
    }
  }
  return null;
}