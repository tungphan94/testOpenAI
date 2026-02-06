import { domain_analysis_ouput_schema, DomainAnalysisResponse, DomainApp, isDomain } from "../../domain/domain_analysis";
import { builDomainAnalysisPayload } from "../../domain/payload";
import { llmJson } from "../llmClient";
import { domain_analysis_promt,intake_analysis_promt, real_estate_intent_prompt, food_drink_intent_prompt } from "../prompts/domain_analysis_promt";


export function build_promt(domain : string | null): string
{
    const isDefaultDomain = isDomain(domain);
    if(isDefaultDomain){
      if(domain === "medical"){
        return intake_analysis_promt;
      }else if(domain === "food_drink"){
        return food_drink_intent_prompt
      }else if(domain === "real_estate"){
        return real_estate_intent_prompt
      }
    }
    return domain_analysis_promt;
}

export async function call_message_analysis_llm(
    domain: string | null,
    message: string) 
    : Promise<DomainAnalysisResponse | null>
{
  try{
    const promt =build_promt(domain);
    console.log(promt);
    const payload = builDomainAnalysisPayload(message);
    return await llmJson<DomainAnalysisResponse>(
      promt,
      payload,
      domain_analysis_ouput_schema,
      {model:"gpt-5-nano"});
  }catch{
    return null;
  }
}