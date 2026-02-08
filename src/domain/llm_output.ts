export type PatchOp =
  | {op: "set";path: string; value: unknown;}
  | {op: "upsert"; path: "/symptoms"; key: "canonical"; value: unknown;}
  | {op: "remove";path: string; reason?: "user_denial" | "retracted";}
  | {op: "overwrite";path: string;value: unknown;}

export interface LlmOutput {
  action?:string,
  patch: PatchOp[];
  next_question: string | null;
  next_question_field?: string | null;
  staff_note?: string | null;
  confirmed_fields?: string[];
  missing_fields?:string[]
  message: string | null;
  // specialty?:string | null;
}

export type CommonContext<T> = {
  state_digest: Partial<T> | null;
  confirmed_fields: string[];
  last_question_field?: string | null;
};

export const llmInfoOutputJsonSchema = {
  name: "llm_info_output",
  schema: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        message: { type: "string" }
      },
  }
}

export const llmInfoSearchJsonSchema = {
  name: "search_action",
  schema: {
    type:"object",
    additionalProperties:false,
    required: ["action", "patch", "missing_fields", "next_question", "message"],
    properties:{
      action:{type:"string", enum:["ask", "search_now"]},
      patch:{
        type:"array",
        items:{
          type: "object",  
          required: ["path", "op", "value"],
          additionalProperties:false,
          properties:{
            op: {type: "string",enum: ["set", "remove"]},
            path: {
              type: "string",
              enum: [
                "/criteria/city",
                "/criteria/place",
                "/criteria/facility_type",
                "/criteria/specialty",
                "/criteria/radius_meters",
                "/criteria/include",
                "/pending_question_field",
              ],
            },
            value: {type: ["string", "null"]},
          },
        }
      },
      missing_fields: {
        type: "array",
        items: { type: "string" },
      },
      next_question: { type: ["string", "null"] },
      message: { type: "string" },
    }
  }
}
