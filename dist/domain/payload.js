"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builDomainAnalysisPayload = builDomainAnalysisPayload;
exports.buildIntakePayload = buildIntakePayload;
function builDomainAnalysisPayload(message) {
    return {
        user_message: message,
        state_digest: null,
        rules: null,
    };
}
function buildIntakePayload(message, state, order) {
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
