import { ConversationState } from '../db/repositories/ConversationStateRepository';
import { IntakeContext, LlmOutput, PatchOp } from "./llm_output";

export type JsonObject = Record<string, unknown>;

export function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

type ApplyPatchFunc<T> = (state: T, patch: PatchOp<T>[]) => T;
export function mergeConversationStateMedical<T>(
  prev: ConversationState,
  llm: LlmOutput<T>,
  applyPatchFunc: ApplyPatchFunc<T>,
  nowISO = new Date().toISOString()
): ConversationState | null {
  if(llm === null){
    return prev;
  }
  let medicalState = applyPatchFunc(prev.extracted as T, llm.patch??[]);
  return {
    ...prev,
    extracted: medicalState as JsonObject,
    confirmed_fields: Array.from(new Set([...(prev.confirmed_fields ?? []), ...(llm.confirmed_fields ?? [])])),
    next_question_field: llm.next_question_field,
    staff_note: llm.staff_note,
    updated_at: nowISO,
  };
}

type BuildStateKnowFromDbFunc<T> = (row: ConversationState) => T;
type PickConfirmedStateFunc<T> = (state: T, confirmed: string[]) => Partial<T>;

export function buildStateKnow<T>(
  row: ConversationState | null,
  buildStateDb: BuildStateKnowFromDbFunc<T>,
  pickConfirmFunc: PickConfirmedStateFunc<T>
): IntakeContext<T> | null;

export function buildStateKnow(
  row: ConversationState | null,
  buildStateDb: (row: ConversationState) => any,
  pickConfirmFunc: (state: any, confirmed: string[]) => any
): IntakeContext<any> | null {
  if (!row) return null;

  const confirmed_fields = row.confirmed_fields ?? [];
  const last_question_field = row.next_question_field ?? null;
  const state = buildStateDb(row);
  return {
    state_digest: pickConfirmFunc(state, confirmed_fields),
    confirmed_fields,
    last_question_field,
  };
}

