import { Request, Response } from "express";
import {medicalService} from '../../db/services/MedicalIntakeService';
import {createEmptyConversationState} from '../../db/repositories/ConversationStateRepository';
import { createEmptyMedicalStateV1 } from "../../domain/medical/buildStateKnow"
import {buildStateKnow,mergeConversationStateMedical} from '../../domain/medical/buildStateKnow'
import { call_intake_llm } from "../../llm/services/intake.service";

// import { llmJsonTest } from "../../llm/llmClient";
import { MedicalLlmOutput } from '../../domain/medical/medicalLlmOutput';
import { SessionManager } from "../../llm/services/sessionManager";

export type ChatFrontendResponse = {
  message: string | null;
};

export function getChatFrontendResponse(result : MedicalLlmOutput) 
  :ChatFrontendResponse
{
  let res_mes = result.completion_status == "completed"
   ? result.ui_message 
   : result.next_question??result.ui_message;
  return {
    message: res_mes,
  }
}

export function createChatController(sessionMgr: SessionManager) {
  return {
    chat: async (req: Request, res: Response) => {
      try {
        const {tenant_id, conversation_id, message, last_question } = req.body;
        if (!tenant_id || !conversation_id || !message) {
          return res.status(400).json({ error: "missing field" });
        }
        const session = sessionMgr.getOrCreate(tenant_id, conversation_id);

        let state = await  medicalService.getConversationState(conversation_id);
        let know_state = buildStateKnow(state);
        let last_ques = know_state?.last_question_field === "red_flags" ? last_question : null;
        let result = await call_intake_llm(know_state, message,last_ques);
        if(result == null){
           return res.status(422).json({error: "LLM output does not match medical_llm_output schema"});
        }
        // const t0 = Date.now();
        // let test = await llmJsonTest(message);
        // const t1 = Date.now();
        // console.log("Total time (ms):", t1 - t0); 
        // return res.status(200).json({status: test} );
        state = mergeConversationStateMedical(
          state??createEmptyConversationState(
            conversation_id,
            () => createEmptyMedicalStateV1(), 
            tenant_id), 
          result);
        medicalService.SaveConversationState(state)
        const json = JSON.stringify(result);
        console.log(json);
        //merge to database
        return res.status(200).json(getChatFrontendResponse(result));
      } catch (err) {
        console.error(err);
        return res.status(500).json({error: "internal_error"});
      }
    },
  };
}