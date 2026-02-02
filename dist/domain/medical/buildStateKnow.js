"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStateKnowFromDb = buildStateKnowFromDb;
exports.buildStateKnow = buildStateKnow;
exports.applyPatch = applyPatch;
exports.createEmptyMedicalStateV1 = createEmptyMedicalStateV1;
exports.mergeConversationStateMedical = mergeConversationStateMedical;
const medical_extracted_types_1 = require("./medical.extracted.types");
const medical_extracted_types_2 = require("../../domain/medical/medical.extracted.types");
function normalizeState(raw) {
    const r = raw ?? {};
    const rf = r.red_flags;
    return {
        chief_complaint: r.chief_complaint ?? null,
        symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
        onset_time: r.onset_time ?? null,
        past_history: r.past_history ?? null,
        medications: r.medications ?? null,
        allergies: r.allergies ?? null,
        red_flags: {
            red_flags_has: typeof rf?.red_flags_has === "boolean" ? rf.red_flags_has : null,
            red_flags_detail: typeof rf?.red_flags_detail === "string" ? rf.red_flags_detail : null,
        },
    };
}
function isPlainObject(x) {
    return x !== null && typeof x === "object" && !Array.isArray(x);
}
function pickConfirmedState(state, confirmed) {
    const out = {};
    for (const f of confirmed) {
        switch (f) {
            case "chief_complaint":
                if (state.chief_complaint)
                    out.chief_complaint = state.chief_complaint;
                break;
            case "symptoms":
                if (state.symptoms?.length)
                    out.symptoms = state.symptoms;
                break;
            case "onset_time":
                if (state.onset_time)
                    out.onset_time = state.onset_time;
                break;
            case "past_history":
                if (state.past_history)
                    out.past_history = state.past_history;
                break;
            case "medications":
                if (state.medications)
                    out.medications = state.medications;
                break;
            case "allergies":
                if (state.allergies)
                    out.allergies = state.allergies;
                break;
            case "red_flags":
                if (state.red_flags)
                    out.red_flags = state.red_flags;
                break;
        }
    }
    return out;
}
function buildStateKnowFromDb(row) {
    const ex = row?.extracted;
    const raw = isPlainObject(ex) ? ex : undefined;
    return normalizeState(raw);
}
function buildStateKnow(row) {
    if (row == null) {
        return null;
    }
    const confirmed_fields = row?.confirmed_fields ?? [];
    const last_question_field = row?.next_question_field ?? null;
    const state = buildStateKnowFromDb(row);
    return {
        state_digest: pickConfirmedState(state, confirmed_fields),
        confirmed_fields,
        last_question_field,
    };
}
function applyPatch(state, patch) {
    const next = structuredClone(state);
    for (const p of patch) {
        if (p.op === "remove") {
            switch (p.path) {
                case "/chief_complaint":
                    next.chief_complaint = null;
                    break;
                case "/onset_time":
                    next.onset_time = null;
                    break;
                case "/past_history":
                    next.past_history = null;
                    break;
                case "/medications":
                    next.medications = null;
                    break;
                case "/allergies":
                    next.allergies = null;
                    break;
                case "/symptoms":
                    next.symptoms = [];
                    break;
            }
            continue;
        }
        if (p.op === "upsert" && p.path === "/symptoms") {
            if (!(0, medical_extracted_types_2.isMedicalSymptom)(p.value))
                continue; // ignore invalid
            const s = p.value;
            const idx = next.symptoms.findIndex(x => x.canonical === s.canonical);
            if (idx >= 0)
                next.symptoms[idx] = { ...next.symptoms[idx], ...s };
            else
                next.symptoms.push(s);
            continue;
        }
        // ---- set / overwrite (treat same) ----
        if (p.op === "set" || p.op === "overwrite") {
            switch (p.path) {
                case "/chief_complaint":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        next.chief_complaint = p.value;
                    break;
                case "/onset_time":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        next.onset_time = p.value;
                    break;
                case "/past_history":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        next.past_history = p.value;
                    break;
                case "/medications":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        next.medications = p.value;
                    break;
                case "/allergies":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        next.allergies = p.value;
                    break;
                case "/red_flags/red_flags_has":
                    if ((0, medical_extracted_types_2.isBoolean)(p.value))
                        (0, medical_extracted_types_1.ensureRedFlags)(next).red_flags_has = p.value;
                    break;
                case "/red_flags/red_flags_detail":
                    if ((0, medical_extracted_types_2.isStringOrNull)(p.value))
                        (0, medical_extracted_types_1.ensureRedFlags)(next).red_flags_detail = p.value;
                    break;
            }
        }
    }
    return next;
}
function createEmptyMedicalStateV1() {
    return {
        chief_complaint: null,
        symptoms: [],
        onset_time: null,
        past_history: null,
        medications: null,
        allergies: null,
        red_flags: null,
    };
}
function mergeConversationStateMedical(prev, llm, nowISO = new Date().toISOString()) {
    if (llm === null) {
        return prev;
    }
    let medicalState = applyPatch(prev.extracted, llm.patch ?? []);
    return {
        ...prev,
        extracted: medicalState,
        confirmed_fields: Array.from(new Set([...(prev.confirmed_fields ?? []), ...(llm.confirmed_fields ?? [])])),
        next_question_field: llm.next_question_field,
        staff_note: llm.staff_note,
        updated_at: nowISO,
        is_completed: llm.next_question_field == null,
    };
}
