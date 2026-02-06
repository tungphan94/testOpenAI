"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStringOrNull = isStringOrNull;
exports.isBoolean = isBoolean;
exports.isPlainObject = isPlainObject;
exports.mergeConversationStateMedical = mergeConversationStateMedical;
exports.buildStateKnow = buildStateKnow;
function isStringOrNull(v) {
    return v === null || typeof v === "string";
}
function isBoolean(v) {
    return typeof v === "boolean";
}
function isPlainObject(x) {
    return x !== null && typeof x === "object" && !Array.isArray(x);
}
function mergeConversationStateMedical(prev, llm, applyPatchFunc, nowISO = new Date().toISOString()) {
    if (llm === null) {
        return prev;
    }
    let medicalState = applyPatchFunc(prev.extracted, llm.patch ?? []);
    return {
        ...prev,
        extracted: medicalState,
        confirmed_fields: Array.from(new Set([...(prev.confirmed_fields ?? []), ...(llm.confirmed_fields ?? [])])),
        next_question_field: llm.next_question_field,
        staff_note: llm.staff_note,
        updated_at: nowISO,
    };
}
function buildStateKnow(row, buildStateDb, pickConfirmFunc) {
    if (!row)
        return null;
    const confirmed_fields = row.confirmed_fields ?? [];
    const last_question_field = row.next_question_field ?? null;
    const state = buildStateDb(row);
    return {
        state_digest: pickConfirmFunc(state, confirmed_fields),
        confirmed_fields,
        last_question_field,
    };
}
