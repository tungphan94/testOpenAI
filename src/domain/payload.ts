import {IntakeContext} from '../domain/medical/medical.extracted.types'

export interface LlmPayload {
  user_message: string;
  state_digest: any;
  rules: any;
}

export function buildPayload(
  message: string,
  state: IntakeContext | null,
  order:readonly string[]
): LlmPayload {
  return {
    user_message: message,
    state_digest: {
      confirmed: state?.state_digest ?? {},
      confirmed_fields: state?.confirmed_fields ?? [],
      last_question_field: state?.last_question_field ?? null,
    },
    rules: {
      order,
      only_ask_from_intake: true,
      return_confirmed_fields: true,
    },
  };
}