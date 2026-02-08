"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDomainAnalysisPayload = buildDomainAnalysisPayload;
exports.buildMedicalInfoPayload = buildMedicalInfoPayload;
exports.buildPayloadCommon = buildPayloadCommon;
function buildDomainAnalysisPayload(message, session) {
    const lastAssistantTurn = session.turns
        .filter(t => t.role === "assistant")
        .slice(-1)[0];
    return {
        user_message: message,
        state_digest: {
            domain: lastAssistantTurn?.domain,
            intent: lastAssistantTurn?.intent
        },
        last_assistant_question: lastAssistantTurn?.text,
    };
}
function buildMedicalInfoPayload(message, session) {
    const lastAssistantTurn = session.turns
        .filter(t => t.role === "assistant")
        .slice(-1)[0] ?? null;
    return {
        user_message: message,
        state_digest: session.domain_state.medical.search,
        last_assistant_question: lastAssistantTurn?.text,
    };
}
function buildPayloadCommon(message, state, order) {
    return {
        user_message: message,
        state_digest: {
            confirmed: state?.state_digest ?? {},
            confirmed_fields: state?.confirmed_fields ?? [],
            last_question_field: state?.last_question_field ?? null,
        },
        last_assistant_question: null,
        rules: {
            order,
            must_return_to_intake: true,
            max_off_topic_turns: 2,
            return_confirmed_fields: true,
        },
    };
}
