import { llmJson } from "../llmClient";
import { buildPayload} from '../../domain/payload'
import { medicalLlmOutputJsonSchema, MedicalLlmOutput } from "../../domain/medical/medicalLlmOutput"
import {IntakeContext} from '../../domain/medical/medical.extracted.types'
import { SYSTEM_MEDICAL_INTAKE_PROMPT } from "../prompts/medical/system_medical";
import { DEVELOPER_RULES_INTAKE_PROMPT, CURRENT_CONVERSATION_STATE } from "../prompts/medical/developer_rules_intake";

import { getNextIntakeField, INTAKE_ORDER,type IntakeField } from "../prompts/medical/intake_order";

import fs from "fs";
import path from "path";

export function loadMedicalSchema(): any {
   const p = path.resolve(
    __dirname,
    "../schemas/medical/medical_intake.extracted.schema.json"
  );
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}



export function buildSystemPrompt(is_init: boolean): string 
{
    if(is_init){
        const parts = [
          SYSTEM_MEDICAL_INTAKE_PROMPT,
          DEVELOPER_RULES_INTAKE_PROMPT
        ];
        return parts.join("\n\n");
    } else{
        const parts = [
          SYSTEM_MEDICAL_INTAKE_PROMPT,
          CURRENT_CONVERSATION_STATE
        ];
        return parts.join("\n\n");
    }
}

export async function call_intake_llm(
    state: IntakeContext | null, 
    message: string) 
    : Promise<MedicalLlmOutput | null>
{
  try{
    const is_init = state == null;
    const payload = buildPayload(message, state, INTAKE_ORDER);
    const systemPrompt = buildSystemPrompt(is_init);
    return await llmJson<MedicalLlmOutput>(
      systemPrompt,
      payload,
      medicalLlmOutputJsonSchema
      );
  }catch{
    return null;
  }
}