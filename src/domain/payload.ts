import { Domain } from 'node:domain';
import {IntakeContext} from '../domain/medical/medical.extracted.types'

export interface LlmPayload {
  user_message: string;
  state_digest: any | null;
  rules: any |null;
}

export function builDomainAnalysisPayload(
  message: string): LlmPayload {
  return {
    user_message:message,
    state_digest: null,
    rules: null,
  }
}

export function buildIntakePayload(
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
      must_return_to_intake: true,
      max_off_topic_turns: 2,
      return_confirmed_fields: true,
    },
  };
}