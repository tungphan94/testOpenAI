"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMedicalSchema = loadMedicalSchema;
exports.buildSystemPrompt = buildSystemPrompt;
exports.call_intake_llm = call_intake_llm;
const llmClient_1 = require("../llmClient");
const payload_1 = require("../../domain/payload");
const medicalLlmOutput_1 = require("../../domain/medical/medicalLlmOutput");
const system_medical_1 = require("../prompts/medical/system_medical");
const developer_rules_intake_1 = require("../prompts/medical/developer_rules_intake");
const intake_order_1 = require("../prompts/medical/intake_order");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadMedicalSchema() {
    const p = path_1.default.resolve(__dirname, "../schemas/medical/medical_intake.extracted.schema.json");
    return JSON.parse(fs_1.default.readFileSync(p, "utf-8"));
}
function buildSystemPrompt(state) {
    let parts = [system_medical_1.SYSTEM_MEDICAL_INTAKE_PROMPT];
    if (state == null) {
        parts.push(developer_rules_intake_1.DEVELOPER_RULES_INTAKE_PROMPT);
    }
    else {
        let count = state.confirmed_fields.length;
        let all_count = intake_order_1.INTAKE_ORDER.length;
        parts.push(developer_rules_intake_1.CURRENT_CONVERSATION_STATE);
        if (all_count - count === 1) {
            parts.push(developer_rules_intake_1.INTAKE_COMPLETION_RULE);
        }
    }
    return parts.join("\n\n");
}
async function call_intake_llm(state, message, last_question) {
    try {
        const payload = (0, payload_1.buildPayload)(message, state, last_question, intake_order_1.INTAKE_ORDER);
        const systemPrompt = buildSystemPrompt(state);
        return await (0, llmClient_1.llmJson)(systemPrompt, payload, medicalLlmOutput_1.medicalLlmOutputJsonSchema);
    }
    catch {
        return null;
    }
}
