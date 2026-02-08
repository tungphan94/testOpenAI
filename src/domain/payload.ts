import { SessionState } from '../llm/services/sessionManager';
import { CommonIntent, DomainApp } from './domain_analysis';
import { CommonContext } from './llm_output';


export interface llmPayload {
  user_message: string;
  state_digest: any | null;
  last_assistant_question:string |null,
  rules?: any |null;
}

export function buildDomainAnalysisPayload(
  message: string,
  session : SessionState): llmPayload { 
  const lastAssistantTurn =  session.turns
    .filter(t => t.role === "assistant")
    .slice(-1)[0];
  return {
    user_message:message,
    state_digest: {
      domain: lastAssistantTurn?.domain,
      intent: lastAssistantTurn?.intent
    },
    last_assistant_question : lastAssistantTurn?.text,
  }
}

export function buildMedicalInfoPayload(
  message: string, session : SessionState): llmPayload {
  const lastAssistantTurn = session.turns
    .filter(t => t.role === "assistant")
    .slice(-1)[0] ?? null;   

  return {
    user_message:message,
    state_digest: session.domain_state.medical.search,
    last_assistant_question: lastAssistantTurn?.text,
  }
}

export function buildPayloadCommon<T>(
  message: string,
  state: CommonContext<T> | null,
  order?:readonly string[]
): llmPayload {
  return {
    user_message: message,
    state_digest: {
      confirmed: state?.state_digest ?? {},
      confirmed_fields: state?.confirmed_fields ?? [],
      last_question_field: state?.last_question_field ?? null,
    },
    last_assistant_question:null,
    rules: {
      order,
      must_return_to_intake: true,
      max_off_topic_turns: 2,
      return_confirmed_fields: true,
    },
  };
}