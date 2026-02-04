"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatFrontendResponse = getChatFrontendResponse;
exports.chat = chat;
const MedicalIntakeService_1 = require("../../db/services/MedicalIntakeService");
const ConversationStateRepository_1 = require("../../db/repositories/ConversationStateRepository");
const buildStateKnow_1 = require("../../domain/medical/buildStateKnow");
const buildStateKnow_2 = require("../../domain/medical/buildStateKnow");
const intake_service_1 = require("../../llm/services/intake.service");
function getChatFrontendResponse(result) {
    let res_mes = result.completion_status == "completed"
        ? result.ui_message
        : result.next_question ?? result.ui_message;
    return {
        message: res_mes,
    };
}
async function chat(req, res) {
    try {
        const { tenant_id, conversation_id, message, last_question } = req.body;
        if (!tenant_id || !conversation_id || !message) {
            return res.status(400).json({ error: "missing field" });
        }
        let state = await MedicalIntakeService_1.medicalService.getConversationState(conversation_id);
        let know_state = (0, buildStateKnow_2.buildStateKnow)(state);
        let last_ques = know_state?.last_question_field === "red_flags" ? last_question : null;
        let result = await (0, intake_service_1.call_intake_llm)(know_state, message, last_ques);
        if (result == null) {
            return res.status(422).json({ error: "LLM output does not match medical_llm_output schema" });
        }
        // const t0 = Date.now();
        // let test = await llmJsonTest(message);
        // const t1 = Date.now();
        // console.log("Total time (ms):", t1 - t0); 
        // return res.status(200).json({status: test} );
        state = (0, buildStateKnow_2.mergeConversationStateMedical)(state ?? (0, ConversationStateRepository_1.createEmptyConversationState)(conversation_id, () => (0, buildStateKnow_1.createEmptyMedicalStateV1)(), tenant_id), result);
        MedicalIntakeService_1.medicalService.SaveConversationState(state);
        const json = JSON.stringify(result);
        console.log(json);
        //merge to database
        return res.status(200).json(getChatFrontendResponse(result));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "internal_error" });
    }
}
