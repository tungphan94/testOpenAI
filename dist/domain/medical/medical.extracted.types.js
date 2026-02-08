"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefauleMedicalStateV1 = createDefauleMedicalStateV1;
exports.createDefaultMedicalContext = createDefaultMedicalContext;
function createDefauleMedicalStateV1() {
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
function createDefaultMedicalContext() {
    return {
        state_digest: createDefauleMedicalStateV1(),
        confirmed_fields: [],
        last_question_field: null
    };
}
