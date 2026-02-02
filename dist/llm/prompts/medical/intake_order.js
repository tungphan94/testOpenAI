"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTAKE_ORDER = void 0;
exports.getNextIntakeField = getNextIntakeField;
exports.INTAKE_ORDER = [
    "red_flags",
    "chief_complaint",
    "symptoms",
    "onset_time",
    "past_history",
    "medications",
    "allergies",
];
function getNextIntakeField(confirmedFields) {
    for (const field of exports.INTAKE_ORDER) {
        if (!confirmedFields.includes(field)) {
            return field;
        }
    }
    return null;
}
