import { ConversationState, createEmptyConversationState, JsonObject } from '../db/repositories/ConversationStateRepository';
import { conversationService } from '../db/services/ConversationService';
import { medicalLlmIntakeOutputJsonSchema } from '../domain/medical/medicalLlmOutput';
import { call_message_analysis_llm } from '../llm/services/DomainClassifierService';
import { addTurn, SessionManager, SessionState, createDefaultSearchState } from '../llm/services/sessionManager';
import { buildMedicalInfoPayload, buildPayloadCommon } from '../domain/payload';
import { createDefauleMedicalStateV1, MedicalStateV1 } from '../domain/medical/medical.extracted.types';
import { INTAKE_ORDER } from '../domain/medical/medical_intake_order';
import { buildMedicalSystemPrompt } from '../llm/services/intake.service';
import { llmJson } from '../llm/llmClient';
import { CommonContext, llmInfoOutputJsonSchema, llmInfoSearchJsonSchema, LlmOutput } from '../domain/llm_output';
import { createDefaultFndStateV1, FndStateV1 } from '../domain/food_drink/fnd.extracted.types';
import { food_drink_llm_outputJsonChema } from '../domain/food_drink/fnd_llm_output';
import { buildStateKnow, isStringOrNull} from '../domain/buildStateKnow';
import { applyMedicalIntakePatch, medical_buildStateKnowFromDb, medical_pickConfirmedState } from '../domain/medical/medical_buildStateKnow';
import { CommonIntent } from '../domain/domain_analysis';
import { SYSTEM_MEDICAL_INFO_PROMT, SYSTEM_MEDICAL_SEARCH_PROMT } from '../llm/prompts/medical/system_medical';
import { applySearchPatch } from '../domain/applyPatch';
import console from 'node:console';


export type ChatFrontendResponse = {
  message: string | null;
};

export abstract class OutputItem {
  constructor(protected message:string, protected intent:CommonIntent,protected session:SessionState){}  
  abstract buildPayload():any;
  abstract buildSchema() :any;
  abstract buildPrompt(): string;
  abstract callLlm(): Promise<[LlmOutput | null,ChatFrontendResponse |null]>;
}

export class MedicalOutputItem extends OutputItem {
    constructor(message :string,intent:CommonIntent,session:SessionState ) {
        super(message,intent,session);
    } 
    override buildSchema() {
        if(this.intent === "intake" ){
            return medicalLlmIntakeOutputJsonSchema;
        }
        else if(this.intent === "search"){
            return llmInfoSearchJsonSchema;
        }
        return llmInfoOutputJsonSchema;
    } 
    override buildPayload() {
        if(this.intent === "intake" ){
            return buildPayloadCommon(this.message, this.session.domain_state.medical.intake, INTAKE_ORDER);
        }
        return buildMedicalInfoPayload(this.message, this.session);
    }
    override buildPrompt(): string {
        if(this.intent === "intake" ){
            return buildMedicalSystemPrompt(this.session.domain_state.medical.intake);
        }else if(this.intent === "search"){
            return SYSTEM_MEDICAL_SEARCH_PROMT;
        }
        else if(this.intent === "information"){
            return SYSTEM_MEDICAL_INFO_PROMT;
        }
        else if(this.intent === "booking"){
            return SYSTEM_MEDICAL_INFO_PROMT;
        }
        else{ //contact
            return SYSTEM_MEDICAL_INFO_PROMT;    
        }
    }   
    override async callLlm(): Promise<[LlmOutput | null,ChatFrontendResponse |null]>{
        try{
            const res = await llmJson<LlmOutput>(
                this.buildPrompt(),
                this.buildPayload(),
                this.buildSchema()
            );
            const ft_response:ChatFrontendResponse =  {
              message: (res.message??"") + (res.next_question??""),
            };
            return [res,ft_response];
        }catch{
            return [null,null];
        }
    }
}

export class FndOutputItem extends OutputItem
{
   constructor(message :string,intent:CommonIntent,session:SessionState) {
        super(message, intent,session);
    } 
    override buildSchema() {
        if(this.intent == "intake"){
            return food_drink_llm_outputJsonChema;
        }
        else if(this.intent === "search"){
            return llmInfoSearchJsonSchema;
        }
        return llmInfoOutputJsonSchema;
    } 
    override buildPayload() {
        if(this.intent == "intake"){
        }
      return buildMedicalInfoPayload(this.message, this.session);
    }
    override buildPrompt(): string {
        if(this.intent == "intake"){
        }
        return SYSTEM_MEDICAL_INFO_PROMT;
    }   
    override async callLlm(): Promise<[LlmOutput | null,ChatFrontendResponse |null]>{
        try{
            const res = await llmJson<LlmOutput>(
                this.buildPrompt(),
                this.buildPayload(),
                this.buildSchema()
            );
            const ft_response:ChatFrontendResponse =  {
              message: (res.message??"") + (res.next_question??""),
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
) : Promise<OutputItem | null> {
     if(session.domain === "medical"){
        return new MedicalOutputItem(message, session.intent, session);
     }
     if(session.domain === "food_drink"){
        return new FndOutputItem(message,session.intent,session);
     }
     if(session.domain === "real_estate"){

     }
    return null;
}

function updateSessionMedicalState(session : SessionState,  llm_output : LlmOutput)
{
    if(session.intent === "intake"){
        let intake_state = session.domain_state.medical.intake;
        const state = (intake_state.state_digest??createDefauleMedicalStateV1()) as MedicalStateV1;
        intake_state.state_digest = applyMedicalIntakePatch(state, llm_output.patch);
        intake_state.last_question_field = llm_output.next_question_field;
        intake_state.confirmed_fields = llm_output.confirmed_fields??[];
        session.domain_state.medical.intake = intake_state;
    }else if(session.intent === "search"){
        let search_state = session.domain_state.medical.search;
        search_state = applySearchPatch(search_state, llm_output.patch);
        search_state.action = llm_output.action;
        session.domain_state.medical.search = search_state;
    }
}

function updateSessionFoodDrinkState(session : SessionState,  llm_output : LlmOutput)
{
    if(session.intent === "intake"){
        let domain_state = session.domain_state.food_drink.intake;
        const state = (domain_state.state_digest??createDefaultFndStateV1()) as FndStateV1;
        domain_state.last_question_field = llm_output.next_question_field;
        domain_state.confirmed_fields = llm_output.confirmed_fields??[];
        session.domain_state.food_drink.intake = domain_state;
    }
}

function updateSesstionState(session : SessionState,  llm_output : LlmOutput | null)
{
  if(llm_output === null){
      return;
  }
  if(session.domain === "medical"){
    updateSessionMedicalState(session, llm_output);
  }else if(session.domain === "food_drink"){
    updateSessionFoodDrinkState(session, llm_output);
  }
  if(session.intent != "search"){
    session.domain_state.medical.search = createDefaultSearchState();
    session.domain_state.food_drink.search = createDefaultSearchState();
    // session.domain_state.real_estate.search = createDefaultSearchState();
  }

}

export class ChatService {
  constructor(private sessionMgr: SessionManager) {}

  async handleMessage(input: {
    tenant_id: string;
    conversation_id: string;
    message: string;
    domain: string | null;
  }) {
    const session = this.sessionMgr.getOrDefault(input.tenant_id, input.conversation_id);
    const analysis_domain = await call_message_analysis_llm(input.domain, input.message,session);
    if(analysis_domain === null){
         return {
            status: 422,
            body: { message: "err" }
        };
    }
    if(analysis_domain.domain === "unknown"){
       return {
        status: 200,
        body: { message: analysis_domain?.message??"" }
      };
    }
    const prevIntent = session.intent;
    session.domain = analysis_domain.domain;
    session.last_intent = prevIntent;
    session.intent = analysis_domain.intent;
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
    updateSesstionState(session, llm_output);
    this.sessionMgr.update(session);
    return {
            status: 200,
            body: chat_response,
        }; 
  }
}