"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStringOrNull = isStringOrNull;
exports.isBoolean = isBoolean;
exports.isMedicalSymptom = isMedicalSymptom;
exports.ensureRedFlags = ensureRedFlags;
function isStringOrNull(v) {
    return v === null || typeof v === "string";
}
function isBoolean(v) {
    return typeof v === "boolean";
}
function isMedicalSymptom(v) {
    if (!v || typeof v !== "object")
        return false;
    const o = v;
    return (typeof o.canonical === "string" &&
        typeof o.surface === "string" &&
        (o.duration === undefined || o.duration === null || typeof o.duration === "string"));
}
function ensureRedFlags(state) {
    if (!state.red_flags) {
        state.red_flags = { red_flags_has: false, red_flags_detail: null };
    }
    return state.red_flags;
}
