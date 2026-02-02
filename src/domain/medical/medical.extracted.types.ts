export interface RedFlags {
  red_flags_has: boolean | null;
  red_flags_detail: string | null;
}
export interface MedicalSymptom {
  surface: string;
  canonical: string;
  duration?: string | null;
}
export type MedicalStateV1 = {
  chief_complaint: string | null;
  symptoms: MedicalSymptom[];
  onset_time: string | null;
  past_history: string | null;
  medications: string | null;
  allergies: string | null;
  red_flags: RedFlags  | null;
};

export type IntakeContext = {
  state_digest: Partial<MedicalStateV1>;
  confirmed_fields: string[];
  last_question_field: string | null;
};

export function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isMedicalSymptom(v: unknown): v is MedicalSymptom {
  if (!v || typeof v !== "object") return false;
  const o = v as any;
  return (
    typeof o.canonical === "string" &&
    typeof o.surface === "string" &&
    (o.duration === undefined || o.duration === null || typeof o.duration === "string")
  );
}

export function ensureRedFlags(state: MedicalStateV1): RedFlags {
  if (!state.red_flags) {
    state.red_flags = { red_flags_has: false, red_flags_detail: null };
  }
  return state.red_flags;
}

