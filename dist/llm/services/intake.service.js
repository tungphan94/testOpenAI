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
function buildSystemPrompt(is_init) {
    if (is_init) {
        const parts = [
            system_medical_1.SYSTEM_MEDICAL_INTAKE_PROMPT,
            developer_rules_intake_1.DEVELOPER_RULES_INTAKE_PROMPT
        ];
        return parts.join("\n\n");
    }
    else {
        const parts = [
            system_medical_1.SYSTEM_MEDICAL_INTAKE_PROMPT,
            developer_rules_intake_1.CURRENT_CONVERSATION_STATE
        ];
        return parts.join("\n\n");
    }
}
async function call_intake_llm(state, message) {
    try {
        const is_init = state == null;
        const payload = (0, payload_1.buildPayload)(message, state, intake_order_1.INTAKE_ORDER);
        const systemPrompt = buildSystemPrompt(is_init);
        return await (0, llmClient_1.llmJson)(systemPrompt, payload, medicalLlmOutput_1.medicalLlmOutputJsonSchema);
    }
    catch {
        return null;
    }
}
