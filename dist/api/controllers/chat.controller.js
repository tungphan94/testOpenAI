"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
const MedicalIntakeService_1 = require("../../db/services/MedicalIntakeService");
const ConversationStateRepository_1 = require("../../db/repositories/ConversationStateRepository");
const buildStateKnow_1 = require("../../domain/medical/buildStateKnow");
const buildStateKnow_2 = require("../../domain/medical/buildStateKnow");
const intake_service_1 = require("../../llm/services/intake.service");
// import { llmJsonTest } from "../../llm/llmClient";
async function chat(req, res) {
    try {
        const { tenant_id, conversation_id, message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }
        let state = await MedicalIntakeService_1.medicalService.getConversationState(conversation_id);
        // const json = JSON.stringify(state);
        // console.log(json);
        let know_state = (0, buildStateKnow_2.buildStateKnow)(state);
        let result = await (0, intake_service_1.call_intake_llm)(know_state, message);
        if (result == null) {
            return res.status(422).json({ error: "LLM output does not match medical_llm_output schema" });
        }
        // const t0 = Date.now();
        // let test = await llmJsonTest(message);
        // const t1 = Date.now();
        // console.log("Total time (ms):", t1 - t0); 
        // return res.status(200).json({status: test} );
        state = (0, buildStateKnow_2.mergeConversationStateMedical)(state ?? (0, ConversationStateRepository_1.createEmptyConversationState)(conversation_id, () => (0, buildStateKnow_1.createEmptyMedicalStateV1)(), tenant_id), result);
        // const json = JSON.stringify(state);
        // console.log(json);
        MedicalIntakeService_1.medicalService.SaveConversationState(state);
        //merge to database
        return res.status(200).json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "internal_error" });
    }
}
