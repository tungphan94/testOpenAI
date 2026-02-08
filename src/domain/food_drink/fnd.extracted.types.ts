import { CommonContext } from "../llm_output"

export type FndStateV1 = {
    service_type: string | null,
    cuisine:string | null,
    party_size:string | null,
    location:string | null,
    datetime:string | null,
    budget: string | null,
    dietary_rules:string | null,
    notes:string | null,
}

export function createDefaultFndStateV1() : FndStateV1
{
  return {
    service_type: null,
    cuisine: null,
    party_size:null,
    location:null,
    datetime:null,
    budget:null,
    dietary_rules:null,
    notes:null,
  }
}

export function createDefaultFndContext(): CommonContext<FndStateV1>
{
  return {
    state_digest: createDefaultFndStateV1(),
    confirmed_fields:[],
    last_question_field:null
  }
}