"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build_promt = build_promt;
exports.call_message_analysis_llm = call_message_analysis_llm;
const domain_analysis_1 = require("../../domain/domain_analysis");
const payload_1 = require("../../domain/payload");
const llmClient_1 = require("../llmClient");
const domain_analysis_promt_1 = require("../prompts/domain_analysis_promt");
function build_promt(domain) {
    const isDefaultDomain = (0, domain_analysis_1.isDomain)(domain);
    if (isDefaultDomain) {
        // if(domain === "medical"){
        //   return intake_analysis_promt;
        // }else if(domain === "food_drink"){
        //   return food_drink_intent_prompt
        // }else if(domain === "real_estate"){
        //   return real_estate_intent_prompt
        // }
    }
    return domain_analysis_promt_1.domain_analysis_promt;
}
async function call_message_analysis_llm(domain, message, session) {
    try {
        const promt = build_promt(domain);
        const payload = (0, payload_1.buildDomainAnalysisPayload)(message, session);
        return await (0, llmClient_1.llmJson)(promt, payload, domain_analysis_1.domain_analysis_ouput_schema, { model: "gpt-5-nano" });
    }
    catch {
        return null;
    }
}
