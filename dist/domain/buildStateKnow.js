"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStringOrNull = isStringOrNull;
exports.isBoolean = isBoolean;
exports.isPlainObject = isPlainObject;
exports.isStringArray = isStringArray;
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
function isStringArray(v) {
    return Array.isArray(v) && v.every(x => typeof x === "string");
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
