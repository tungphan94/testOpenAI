import { llmJson } from "../llmClient";
import { buildPayload} from '../../domain/payload'
import { medicalLlmOutputJsonSchema, MedicalLlmOutput } from "../../domain/medical/medicalLlmOutput"
import {IntakeContext} from '../../domain/medical/medical.extracted.types'
import { SYSTEM_MEDICAL_INTAKE_PROMPT } from "../prompts/medical/system_medical";
import { DEVELOPER_RULES_INTAKE_PROMPT, CURRENT_CONVERSATION_STATE, INTAKE_COMPLETION_RULE } from "../prompts/medical/developer_rules_intake";
import { INTAKE_ORDER } from '../prompts/medical/intake_order';

import fs from "fs";
import path from "path";

export function loadMedicalSchema(): any {
   const p = path.resolve(
    __dirname,
    "../schemas/medical/medical_intake.extracted.schema.json"
  );
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function buildSystemPrompt(state: IntakeContext | null): string 
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

export async function call_intake_llm(
    state: IntakeContext | null, 
    message: string,
    last_question:string | null) 
    : Promise<MedicalLlmOutput | null>
{
  try{
    const payload = buildPayload(message, state,last_question, INTAKE_ORDER);
    const systemPrompt = buildSystemPrompt(state);
    return await llmJson<MedicalLlmOutput>(
      systemPrompt,
      payload,
      medicalLlmOutputJsonSchema
      );
  }catch{
    return null;
  }
}