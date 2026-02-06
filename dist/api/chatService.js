"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.FndOutputItem = exports.MedicalOutputItem = exports.OutputItem = void 0;
const ConversationService_1 = require("../db/services/ConversationService");
const medicalLlmOutput_1 = require("../domain/medical/medicalLlmOutput");
const DomainClassifierService_1 = require("../llm/services/DomainClassifierService");
const sessionManager_1 = require("../llm/services/sessionManager");
const payload_1 = require("../domain/payload");
const medical_intake_order_1 = require("../domain/medical/medical_intake_order");
const intake_service_1 = require("../llm/services/intake.service");
const llmClient_1 = require("../llm/llmClient");
const fnd_llm_output_1 = require("../domain/food_drink/fnd_llm_output");
const food_drink_order_1 = require("../domain/food_drink/food_drink_order");
const buildStateKnow_1 = require("../domain/buildStateKnow");
const medical_buildStateKnow_1 = require("../domain/medical/medical_buildStateKnow");
class OutputItem {
    constructor(message) {
        this.message = message;
    }
}
exports.OutputItem = OutputItem;
class MedicalOutputItem extends OutputItem {
    constructor(state, message) {
        super(message);
        this.state = state;
        this.know_state = (0, buildStateKnow_1.buildStateKnow)(this.state, medical_buildStateKnow_1.medical_buildStateKnowFromDb, medical_buildStateKnow_1.medical_pickConfirmedState);
    }
    buildSchema() {
        return medicalLlmOutput_1.medicalLlmOutputJsonSchema;
    }
    buildPayload() {
        return (0, payload_1.buildIntakePayload)(this.message, this.know_state, medical_intake_order_1.INTAKE_ORDER);
    }
    buildPrompt() {
        return (0, intake_service_1.buildMedicalSystemPrompt)(this.know_state);
    }
    async callLlm() {
        try {
            const res = await (0, llmClient_1.llmJson)(this.buildPrompt(), this.buildPayload(), this.buildSchema());
            const ft_response = {
                message: (res.ui_message ?? "") + (res.next_question ?? ""),
            };
            return [res, ft_response];
        }
        catch {
            return [null, null];
        }
    }
}
exports.MedicalOutputItem = MedicalOutputItem;
class FndOutputItem extends OutputItem {
    constructor(state, message) {
        super(message);
        this.state = state;
        this.know_state = null;
    }
    buildSchema() {
        return fnd_llm_output_1.food_drink_llm_outputJsonChema;
    }
    buildPayload() {
        return (0, payload_1.buildIntakePayload)(this.message, this.know_state, food_drink_order_1.FND_INTAKE_ORDER);
    }
    buildPrompt() {
        return (0, intake_service_1.buildFndSystemPrompt)(this.know_state);
    }
    async callLlm() {
        try {
            const res = await (0, llmClient_1.llmJson)(this.buildPrompt(), this.buildPayload(), this.buildSchema());
            const ft_response = {
                message: (res.ui_message ?? "") + (res.next_question ?? ""),
            };
            return [res, ft_response];
        }
        catch {
            return [null, null];
        }
    }
}
exports.FndOutputItem = FndOutputItem;
async function createOutputItem(message, session) {
    let state = await ConversationService_1.conversationService.getConversationState(session.conversation_id);
    if (session.domain === "medical") {
        return new MedicalOutputItem(state, message);
    }
    if (session.domain === "food_drink") {
        return new FndOutputItem(state, message);
    }
    if (session.domain === "real_estate") {
    }
    return null;
}
class ChatService {
    constructor(sessionMgr) {
        this.sessionMgr = sessionMgr;
    }
    updateSesstionState(session, llm_output) {
        if (llm_output === null) {
            return;
        }
        if (!(0, buildStateKnow_1.isStringOrNull)(llm_output.next_question_field)) {
            session.next_question_field = llm_output.next_question_field;
            session.off_topic_streak = 0;
        }
        else {
            session.off_topic_streak++;
        }
    }
    async handleMessage(input) {
        const analysis_domain = await (0, DomainClassifierService_1.call_message_analysis_llm)(input.domain, input.message);
        if ((analysis_domain?.domain ?? "unknown") === "unknown") {
            return {
                status: 422,
                body: { message: analysis_domain?.message }
            };
        }
        const session = this.sessionMgr.getOrDefault(input.tenant_id, input.conversation_id);
        session.domain = analysis_domain?.domain ?? "unknown";
        session.intent = analysis_domain?.intent ?? "information";
        (0, sessionManager_1.addTurn)(session, "user", input.message);
        const item = await createOutputItem(input.message, session);
        const res = await item?.callLlm();
        if (!res) {
            return {
                status: 422,
                body: { message: "LLM error" }
            };
        }
        const [llm_output, chat_response] = res;
        (0, sessionManager_1.addTurn)(session, "assistant", chat_response?.message ?? "");
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
exports.ChatService = ChatService;
