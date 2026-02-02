"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPayload = buildPayload;
function buildPayload(message, state, order) {
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
