import { llmJson } from "../llmClient";
import { buildIntakePayload } from '../../domain/payload'
import { medicalLlmOutputJsonSchema } from "../../domain/medical/medicalLlmOutput"
import {MedicalStateV1} from '../../domain/medical/medical.extracted.types'
import { SYSTEM_MEDICAL_INTAKE_PROMPT } from "../prompts/medical/system_medical";
import { DEVELOPER_RULES_INTAKE_PROMPT, CURRENT_CONVERSATION_STATE, INTAKE_COMPLETION_RULE } from "../prompts/medical/developer_rules_intake";
import { INTAKE_ORDER } from '../../domain/medical/medical_intake_order';
import { IntakeContext, LlmOutput } from "../../domain/llm_output";
import { FndStateV1 } from "../../domain/food_drink/fnd.extracted.types";

export function buildMedicalSystemPrompt(state: IntakeContext<MedicalStateV1> | null): string 
{
    let parts = [SYSTEM_MEDICAL_INTAKE_PROMPT]
    if(state == null) {
      parts.push(DEVELOPER_RULES_INTAKE_PROMPT);
    }else{
        let count = state.confirmed_fields.length;
        let all_count = INTAKE_ORDER.length;
        parts.push(CURRENT_CONVERSATION_STATE)
        if(all_count - count === 1){
            parts.push(INTAKE_COMPLETION_RULE)
        }
    }
    return parts.join("\n\n");
}

export function buildFndSystemPrompt(state: IntakeContext<FndStateV1> | null): string 
{
    let parts = [SYSTEM_MEDICAL_INTAKE_PROMPT]
    if(state == null) {
      parts.push(DEVELOPER_RULES_INTAKE_PROMPT);
    }else{
        let count = state.confirmed_fields.length;
        let all_count = INTAKE_ORDER.length;
        parts.push(CURRENT_CONVERSATION_STATE)
        if(all_count - count === 1){
            parts.push(INTAKE_COMPLETION_RULE)
        }
    }
    return parts.join("\n\n");
}