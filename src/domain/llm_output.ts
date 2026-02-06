export type PatchOp<T> =
  | {op: "set";path: string; value: unknown;}
  | {op: "upsert"; path: "/symptoms"; key: "canonical"; value: unknown; }
  | {op: "remove";path: string; reason?: "user_denial" | "retracted"}
  | {op: "overwrite";path: string;value: unknown;}

export interface LlmOutput<T> {
  patch: PatchOp<T>[];
  next_question: string | null;
  next_question_field: string | null;
  staff_note: string | null;
  confirmed_fields?: string[];
  ui_message: string | null;
}

export type IntakeContext<T> = {
  state_digest: Partial<T>;
  confirmed_fields: string[];
  last_question_field: string | null;
};
