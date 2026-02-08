"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.FndOutputItem = exports.MedicalOutputItem = exports.OutputItem = void 0;
const medicalLlmOutput_1 = require("../domain/medical/medicalLlmOutput");
const DomainClassifierService_1 = require("../llm/services/DomainClassifierService");
const sessionManager_1 = require("../llm/services/sessionManager");
const payload_1 = require("../domain/payload");
const medical_extracted_types_1 = require("../domain/medical/medical.extracted.types");
const medical_intake_order_1 = require("../domain/medical/medical_intake_order");
const intake_service_1 = require("../llm/services/intake.service");
const llmClient_1 = require("../llm/llmClient");
const llm_output_1 = require("../domain/llm_output");
const fnd_extracted_types_1 = require("../domain/food_drink/fnd.extracted.types");
const fnd_llm_output_1 = require("../domain/food_drink/fnd_llm_output");
const medical_buildStateKnow_1 = require("../domain/medical/medical_buildStateKnow");
const system_medical_1 = require("../llm/prompts/medical/system_medical");
const applyPatch_1 = require("../domain/applyPatch");
class OutputItem {
    constructor(message, intent, session) {
        this.message = message;
        this.intent = intent;
        this.session = session;
    }
}
exports.OutputItem = OutputItem;
class MedicalOutputItem extends OutputItem {
    constructor(message, intent, session) {
        super(message, intent, session);
    }
    buildSchema() {
        if (this.intent === "intake") {
            return medicalLlmOutput_1.medicalLlmIntakeOutputJsonSchema;
        }
        else if (this.intent === "search") {
            return llm_output_1.llmInfoSearchJsonSchema;
        }
        return llm_output_1.llmInfoOutputJsonSchema;
    }
    buildPayload() {
        if (this.intent === "intake") {
            return (0, payload_1.buildPayloadCommon)(this.message, this.session.domain_state.medical.intake, medical_intake_order_1.INTAKE_ORDER);
        }
        return (0, payload_1.buildMedicalInfoPayload)(this.message, this.session);
    }
    buildPrompt() {
        if (this.intent === "intake") {
            return (0, intake_service_1.buildMedicalSystemPrompt)(this.session.domain_state.medical.intake);
        }
        else if (this.intent === "search") {
            return system_medical_1.SYSTEM_MEDICAL_SEARCH_PROMT;
        }
        else if (this.intent === "information") {
            return system_medical_1.SYSTEM_MEDICAL_INFO_PROMT;
        }
        else if (this.intent === "booking") {
            return system_medical_1.SYSTEM_MEDICAL_INFO_PROMT;
        }
        else { //contact
            return system_medical_1.SYSTEM_MEDICAL_INFO_PROMT;
        }
    }
    async callLlm() {
        try {
            const res = await (0, llmClient_1.llmJson)(this.buildPrompt(), this.buildPayload(), this.buildSchema());
            const ft_response = {
                message: (res.message ?? "") + (res.next_question ?? ""),
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
    constructor(message, intent, session) {
        super(message, intent, session);
    }
    buildSchema() {
        if (this.intent == "intake") {
            return fnd_llm_output_1.food_drink_llm_outputJsonChema;
        }
        else if (this.intent === "search") {
            return llm_output_1.llmInfoSearchJsonSchema;
        }
        return llm_output_1.llmInfoOutputJsonSchema;
    }
    buildPayload() {
        if (this.intent == "intake") {
        }
        return (0, payload_1.buildMedicalInfoPayload)(this.message, this.session);
    }
    buildPrompt() {
        if (this.intent == "intake") {
        }
        return system_medical_1.SYSTEM_MEDICAL_INFO_PROMT;
    }
    async callLlm() {
        try {
            const res = await (0, llmClient_1.llmJson)(this.buildPrompt(), this.buildPayload(), this.buildSchema());
            const ft_response = {
                message: (res.message ?? "") + (res.next_question ?? ""),
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
    if (session.domain === "medical") {
        return new MedicalOutputItem(message, session.intent, session);
    }
    if (session.domain === "food_drink") {
        return new FndOutputItem(message, session.intent, session);
    }
    if (session.domain === "real_estate") {
    }
    return null;
}
function updateSessionMedicalState(session, llm_output) {
    if (session.intent === "intake") {
        let intake_state = session.domain_state.medical.intake;
        const state = (intake_state.state_digest ?? (0, medical_extracted_types_1.createDefauleMedicalStateV1)());
        intake_state.state_digest = (0, medical_buildStateKnow_1.applyMedicalIntakePatch)(state, llm_output.patch);
        intake_state.last_question_field = llm_output.next_question_field;
        intake_state.confirmed_fields = llm_output.confirmed_fields ?? [];
        session.domain_state.medical.intake = intake_state;
    }
    else if (session.intent === "search") {
        let search_state = session.domain_state.medical.search;
        search_state = (0, applyPatch_1.applySearchPatch)(search_state, llm_output.patch);
        search_state.action = llm_output.action;
        session.domain_state.medical.search = search_state;
    }
}
function updateSessionFoodDrinkState(session, llm_output) {
    if (session.intent === "intake") {
        let domain_state = session.domain_state.food_drink.intake;
        const state = (domain_state.state_digest ?? (0, fnd_extracted_types_1.createDefaultFndStateV1)());
        domain_state.last_question_field = llm_output.next_question_field;
        domain_state.confirmed_fields = llm_output.confirmed_fields ?? [];
        session.domain_state.food_drink.intake = domain_state;
    }
}
function updateSesstionState(session, llm_output) {
    if (llm_output === null) {
        return;
    }
    if (session.domain === "medical") {
        updateSessionMedicalState(session, llm_output);
    }
    else if (session.domain === "food_drink") {
        updateSessionFoodDrinkState(session, llm_output);
    }
    if (session.intent != "search") {
        session.domain_state.medical.search = (0, sessionManager_1.createDefaultSearchState)();
        session.domain_state.food_drink.search = (0, sessionManager_1.createDefaultSearchState)();
        // session.domain_state.real_estate.search = createDefaultSearchState();
    }
}
class ChatService {
    constructor(sessionMgr) {
        this.sessionMgr = sessionMgr;
    }
    async handleMessage(input) {
        const session = this.sessionMgr.getOrDefault(input.tenant_id, input.conversation_id);
        const analysis_domain = await (0, DomainClassifierService_1.call_message_analysis_llm)(input.domain, input.message, session);
        if (analysis_domain === null) {
            return {
                status: 422,
                body: { message: "err" }
            };
        }
        if (analysis_domain.domain === "unknown") {
            return {
                status: 200,
                body: { message: analysis_domain?.message ?? "" }
            };
        }
        const prevIntent = session.intent;
        session.domain = analysis_domain.domain;
        session.last_intent = prevIntent;
        session.intent = analysis_domain.intent;
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
        updateSesstionState(session, llm_output);
        this.sessionMgr.update(session);
        return {
            status: 200,
            body: chat_response,
        };
    }
}
exports.ChatService = ChatService;
