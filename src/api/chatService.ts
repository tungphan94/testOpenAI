import { ConversationState } from '../db/repositories/ConversationStateRepository';
import { conversationService } from '../db/services/ConversationService';
import { MedicalLlmOutput, medicalLlmOutputJsonSchema } from "../domain/medical/medicalLlmOutput";
import { call_message_analysis_llm } from '../llm/services/DomainClassifierService';
import { SessionManager, SessionState } from '../llm/services/sessionManager';
import { buildStateKnow } from '../domain/medical/buildStateKnow';
import { buildIntakePayload, LlmPayload } from '../domain/payload';
import { IntakeContext } from '../domain/medical/medical.extracted.types';
import { INTAKE_ORDER } from '../llm/prompts/medical/intake_order';
import { buildSystemPrompt } from '../llm/services/intake.service';
import { llmJson } from '../llm/llmClient';


export type ChatFrontendResponse = {
  message: string | null;
};



export abstract class OutputItem<TOutput> {
  constructor(　protected message:string){}  
  abstract buildPayload():LlmPayload;
  abstract buildSchema() :any;
  abstract buildPrompt(): string;
  abstract callLlm(): Promise<[MedicalLlmOutput | null,ChatFrontendResponse |null]>;
  abstract getChatFrontendResponse(
    llmOutput: TOutput
  ): ChatFrontendResponse;
}

export class MedicalOutputItem extends OutputItem<MedicalLlmOutput> {
    private readonly know_state: IntakeContext | null;
    constructor(private readonly  state: ConversationState | null,  message :string ) {
        super(message);
        this.know_state = buildStateKnow(this.state);
    } 
    override buildSchema() {
        return medicalLlmOutputJsonSchema;
    } 
    override buildPayload(): LlmPayload {
        return buildIntakePayload(this.message, this.know_state, INTAKE_ORDER);
    }
    override buildPrompt(): string {
        return buildSystemPrompt(this.know_state);
    }   
    override async callLlm(): Promise<[MedicalLlmOutput | null,ChatFrontendResponse |null]>{
        try{
            const res = await llmJson<MedicalLlmOutput>(
                this.buildPrompt(),
                this.buildPayload(),
                this.buildSchema()
            );
            const output = this.getChatFrontendResponse(res);
            return [res,output];
        }catch{
            return [null,null];
        }
    }

    getChatFrontendResponse(result : MedicalLlmOutput) :ChatFrontendResponse{
      let res_mes = result.completion_status == "completed"
       ? result.ui_message 
       : result.next_question??result.ui_message;
      return {
        message: res_mes,
      }
    }
}


async function  createOutputItem(
    message: string,
    session :SessionState,
) : Promise<OutputItem<any> | null> {
    let state = await conversationService.getConversationState(session.conversation_id);
     if(session.domain === "medical"){
        return new MedicalOutputItem(state, message)
     }
    // if(session.domain === "medical"){       
    //     if(session.intent === "intake"){
    //         return new MedicalIntakeItem();
    //     }
    //     return new MedicalFacilityItem();
    // }
    // if(session.domain === "real_estate"){
    // }
    return null;
    
}



export class ChatService {
  constructor(private sessionMgr: SessionManager) {}


  async handlMedicalMessage(input :{
    tenant_id: string;
    intent :string;
    conversation_id: string;
    message: string}) 
  {

  }

  async handleMessage(input: {
    tenant_id: string;
    conversation_id: string;
    message: string;
    domain: string | null;
  }) {
    const analysis_domain = await call_message_analysis_llm(input.domain, input.message);
    if((analysis_domain?.domain??"unknown") === "unknown"){
       return {
        status: 422,
        body: { message: analysis_domain?.message }
      };
    }
    const session = this.sessionMgr.getOrDefault(input.tenant_id, input.conversation_id);
    session.domain = analysis_domain?.domain?? "unknown";
    session.intent = analysis_domain?.intent ?? null;
    const item = await createOutputItem(input.message,session);
    const res =  await item?.callLlm();
    if(!res){
        return {
            status: 422,
            body: { message: "LLM error" }
        };
    }
    const [llm_output, chat_response] = res;
    return {
            status: 200,
            body: chat_response,
        }; 

    // const res = await item?.call_llm();


// let state = await  medicalService.getConversationState(conversation_id);
        // let know_state = buildStateKnow(state);
        // let result = await call_intake_llm(know_state, message);
        // if(result == null){
        //    return res.status(422).json({error: "LLM output does not match medical_llm_output schema"});
        // }
        // const t0 = Date.now();
        // let test = await llmJsonTest(message);
        // const t1 = Date.now();
        // console.log("Total time (ms):", t1 - t0); 
        // return res.status(200).json({status: test} );
        // state = mergeConversationStateMedical(
        //   state??createEmptyConversationState(
        //     conversation_id,
        //     () => createEmptyMedicalStateV1(), 
        //     tenant_id), 
        //   result);
        // medicalService.SaveConversationState(state)
        // const json = JSON.stringify(result);
        // console.log(json);
        //merge to database
        // return res.status(200).json(getChatFrontendResponse(result));
    return {
      status: 200,
      body: { ok: true }
    };
  }
}