"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMedicalSystemPrompt = buildMedicalSystemPrompt;
exports.buildFndSystemPrompt = buildFndSystemPrompt;
const system_medical_1 = require("../prompts/medical/system_medical");
const developer_rules_intake_1 = require("../prompts/medical/developer_rules_intake");
const medical_intake_order_1 = require("../../domain/medical/medical_intake_order");
function buildMedicalSystemPrompt(state) {
    let parts = [system_medical_1.SYSTEM_MEDICAL_INTAKE_PROMPT];
    if (state == null) {
        parts.push(developer_rules_intake_1.DEVELOPER_RULES_INTAKE_PROMPT);
    }
    else {
        let count = state.confirmed_fields.length;
        let all_count = medical_intake_order_1.INTAKE_ORDER.length;
        parts.push(developer_rules_intake_1.CURRENT_CONVERSATION_STATE);
        if (all_count - count === 1) {
            parts.push(developer_rules_intake_1.INTAKE_COMPLETION_RULE);
        }
    }
    return parts.join("\n\n");
}
function buildFndSystemPrompt(state) {
    let parts = [system_medical_1.SYSTEM_MEDICAL_INTAKE_PROMPT];
    if (state == null) {
        parts.push(developer_rules_intake_1.DEVELOPER_RULES_INTAKE_PROMPT);
    }
    else {
        let count = state.confirmed_fields.length;
        let all_count = medical_intake_order_1.INTAKE_ORDER.length;
        parts.push(developer_rules_intake_1.CURRENT_CONVERSATION_STATE);
        if (all_count - count === 1) {
            parts.push(developer_rules_intake_1.INTAKE_COMPLETION_RULE);
        }
    }
    return parts.join("\n\n");
}
