import { PatchOp } from "../llm_output";
import { FndStateV1 } from "./fnd.extracted.types";

export interface FndLlmOutput {
  patch: PatchOp<FndStateV1>[];
  next_question: string | null;
  next_question_field: string | null;
  staff_note: string | null;
  confirmed_fields?: string[];
  ui_message: string | null;
}

export const food_drink_llm_outputJsonChema = {
    name: "food_drink_llm_output",
    strict : true,
    schema: {
        type: "object",
        additionalProperties:false,
        required:[
            "patch",
            "next_question",
            "next_question_field",
            "staff_note",
            "confirmed_fields",
            "ui_message",
        ],
        properties: {
          patch: {
            type: "array",
            items: {
              anyOf: [
                // 1) set
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["op", "path", "value"],
                  properties: {
                    op: { type: "string", const: "set" },
                    path: { type: "string", 
                      enum: [
                        "/service_type",
                        "/cuisine",
                        "/party_size",
                        "/location",
                        "/datetime",
                        "/budget",
                        "/dietary_rules",
                        "/notes",
                      ], 
                    },
                    value: { type: ["string", "number", "boolean", "null"] },
                  },
                },
            
                // 2) overwrite
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["op", "path", "value"],
                  properties: {
                    op: { type: "string", const: "overwrite" },
                    path: { 
                      type: "string", 
                      enum: [
                       "/service_type",
                        "/cuisine",
                        "/party_size",
                        "/location",
                        "/datetime",
                        "/budget",
                        "/dietary_rules",
                        "/notes",
                      ], 
                    },
                    value: { type: ["string", "number", "boolean", "null"] },
                  },
                },
            
                // 3) remove
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["op", "path", "reason"],
                  properties: {
                    op: { type: "string", const: "remove" },
                    path: { 
                      type: "string", 
                      enum: [
                        "/service_type",
                        "/cuisine",
                        "/party_size",
                        "/location",
                        "/datetime",
                        "/budget",
                        "/dietary_rules",
                        "/notes",
                      ],
                    },
                    reason: { type: "string", enum: ["user_denial", "retracted"] },
                  },
                },
              ],
            },
          },
	    next_question: {type: [ "string","null"] },
	    next_question_field: {
		type: ["string", "null"],
		enum: [
            "/service_type",
            "/cuisine",
            "/party_size",
            "/location",
            "/datetime",
            "/budget",
            "/dietary_rules",
            "/notes",
            "null"
		    ],
	    },
        staff_note: {type: "string"},
        confirmed_fields: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "/service_type",
                "/cuisine",
                "/party_size",
                "/location",
                "/datetime",
                "/budget",
                "/dietary_rules",
                "/notes",
              ],
            },
        },
        ui_message: {type: [ "string","null"] },
    },
 }
}      