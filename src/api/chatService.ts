import { ConversationState } from '../db/repositories/ConversationStateRepository';
import { conversationService } from '../db/services/ConversationService';
import { medicalLlmOutputJsonSchema } from "../domain/medical/medicalLlmOutput";
import { call_message_analysis_llm } from '../llm/services/DomainClassifierService';
import { addTurn, SessionManager, SessionState } from '../llm/services/sessionManager';
import { buildIntakePayload, LlmPayload } from '../domain/payload';
import { MedicalStateV1 } from '../domain/medical/medical.extracted.types';
import { INTAKE_ORDER } from '../domain/medical/medical_intake_order';
import { buildMedicalSystemPrompt, buildFndSystemPrompt } from '../llm/services/intake.service';
import { llmJson } from '../llm/llmClient';
import { IntakeContext, LlmOutput } from '../domain/llm_output';
import { FndStateV1 } from '../domain/food_drink/fnd.extracted.types';
import { food_drink_llm_outputJsonChema } from '../domain/food_drink/fnd_llm_output';
import { FND_INTAKE_ORDER, FOOD_BOOKING_ORDER } from '../domain/food_drink/food_drink_order';
import { buildStateKnow, isStringOrNull } from '../domain/buildStateKnow';
import { medical_buildStateKnowFromDb, medical_pickConfirmedState } from '../domain/medical/medical_buildStateKnow';


export type ChatFrontendResponse = {
  message: string | null;
};

export abstract class OutputItem<TOutput> {
  constructor(protected message:string){}  
  abstract buildPayload():LlmPayload;
  abstract buildSchema() :any;
  abstract buildPrompt(): string;
  abstract callLlm(): Promise<[LlmOutput<MedicalStateV1> | null,ChatFrontendResponse |null]>;
}

export class MedicalOutputItem extends OutputItem<LlmOutput<MedicalStateV1> > {
    private readonly know_state: IntakeContext<MedicalStateV1> | null;
    constructor(private readonly  state: ConversationState | null,  message :string ) {
        super(message);
        this.know_state = buildStateKnow(this.state, medical_buildStateKnowFromDb, medical_pickConfirmedState);
    } 
    override buildSchema() {
        return medicalLlmOutputJsonSchema;
    } 
    override buildPayload(): LlmPayload {
        return buildIntakePayload(this.message, this.know_state, INTAKE_ORDER);
    }
    override buildPrompt(): string {
        return buildMedicalSystemPrompt(this.know_state);
    }   
    override async callLlm(): Promise<[LlmOutput<MedicalStateV1> | null,ChatFrontendResponse |null]>{
        try{
            const res = await llmJson<LlmOutput<MedicalStateV1>>(
                this.buildPrompt(),
                this.buildPayload(),
                this.buildSchema()
            );
            const ft_response:ChatFrontendResponse =  {
              message: (res.ui_message??"") + (res.next_question??""),
            };
            return [res,ft_response];
        }catch{
            return [null,null];
        }
    }
}

export class FndOutputItem extends OutputItem<LlmOutput<FndStateV1>>
{
   private readonly know_state: IntakeContext<FndStateV1> | null;
   constructor(private readonly  state: ConversationState | null,  message :string ) {
        super(message);
        this.know_state = null;
    } 
    override buildSchema() {
        return food_drink_llm_outputJsonChema;
    } 
    override buildPayload(): LlmPayload {
      return buildIntakePayload(this.message, this.know_state, FND_INTAKE_ORDER);
    }
    override buildPrompt(): string {
        return buildFndSystemPrompt(this.know_state);
    }   
    override async callLlm(): Promise<[LlmOutput<FndStateV1> | null,ChatFrontendResponse |null]>{
        try{
            const res = await llmJson<LlmOutput<FndStateV1>>(
                this.buildPrompt(),
                this.buildPayload(),
                this.buildSchema()
            );
            const ft_response:ChatFrontendResponse =  {
              message: (res.ui_message??"") + (res.next_question??""),
            };
            return [res,ft_response];
        }catch{
            return [null,null];
        }
    }
}

async function  createOutputItem(
    message: string,
    session :SessionState,
) : Promise<OutputItem<any> | null> {
    let state = await conversationService.getConversationState(session.conversation_id);
     if(session.domain === "medical"){
        return new MedicalOutputItem(state, message);
     }
     if(session.domain === "food_drink"){
        return new FndOutputItem(state, message);
     }
     if(session.domain === "real_estate"){

     }
    return null;
}



export class ChatService {
  constructor(private sessionMgr: SessionManager) {}

  private updateSesstionState(session : SessionState,  llm_output : LlmOutput<any> | null)
  {
    if(llm_output === null){
        return;
    }
    if(!isStringOrNull(llm_output.next_question_field)) {
        session.next_question_field = llm_output.next_question_field;
        session.off_topic_streak = 0;
    }else{
        session.off_topic_streak++;
    }
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
    session.intent = analysis_domain?.intent ?? "information";
    addTurn(session, "user", input.message);    
    const item = await createOutputItem(input.message,session);
    const res =  await item?.callLlm();
    if(!res){
        return {
            status: 422,
            body: { message: "LLM error" }
        };
    }
    const [llm_output, chat_response] = res;
    addTurn(session, "assistant", chat_response?.message??"");
    this.updateSesstionState(session, llm_output);
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