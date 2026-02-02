import { Request, Response } from "express";
import {medicalService} from '../../db/services/MedicalIntakeService';
import {createEmptyConversationState} from '../../db/repositories/ConversationStateRepository';
import { createEmptyMedicalStateV1 } from "../../domain/medical/buildStateKnow"
import {buildStateKnow,mergeConversationStateMedical} from '../../domain/medical/buildStateKnow'
import { call_intake_llm } from "../../llm/services/intake.service";
// import { llmJsonTest } from "../../llm/llmClient";

export async function chat(req: Request, res: Response) {
  try {
    const {tenant_id, conversation_id, message } = req.body;
    if (!message) {
      return res.status(400).json({error: "message is required"});
    }
    let state = await  medicalService.getConversationState(conversation_id);
    let know_state = buildStateKnow(state);
    let result = await call_intake_llm(know_state, message);
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

    const json = JSON.stringify(state);
    console.log(json);
    //merge to database
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: "internal_error"});
  }
}