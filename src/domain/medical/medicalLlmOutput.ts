import { MedicalStateV1 } from "./medical.extracted.types";

export type Conversation_flow = "intake" | "off_topic";

export type CompletionStatus =
  | "in_progress"      // đang hỏi tiếp
  | "completed"        // hoàn tất bình thường
  | "emergency_stop"   // dừng do cấp cứu
  | "handoff_required" // cần nhân viên tiếp nhận
  | "error";           // lỗi hệ thống / fallback

export type EmergencyLevel =
  | "immediate"   // gọi cấp cứu NGAY
  | "urgent"      // cần khám gấp (hôm nay)
  | "moderate";   // có nguy cơ, theo dõi sớm

export interface MedicalLlmOutput {
  conversation_flow : Conversation_flow,
  patch: PatchOp<MedicalStateV1>[];
  next_question: string | null;
  next_question_field: string | null;
  staff_note: string | null;
  confirmed_fields?: string[];
  ui_message: string | null;
  completion_status: CompletionStatus;
  emergency_level: EmergencyLevel
  
}

export type PatchOp<T> =
  | {op: "set";path: string; value: unknown;}
  | {op: "upsert"; path: "/symptoms"; key: "canonical"; value: unknown; }
  | {op: "remove";path: string; reason?: "user_denial" | "retracted"}
  | {op: "overwrite";path: string;value: unknown;}


export const medicalLlmOutputJsonSchema = {
  name: "medical_llm_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "patch",
      "next_question",
      "next_question_field",
      "staff_note",
      "confirmed_fields",
      "ui_message",
      "completion_status",
      "emergency_level",
      "conversation_flow"
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
                    "/chief_complaint",
                    "/onset_time",
                    "/past_history",
                    "/medications",
                    "/allergies",
                    "/red_flags/red_flags_has",
                    "/red_flags/red_flags_detail",
                    "/symptoms", // optional: allow clearing whole list when user says "không"
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
                    "/chief_complaint",
                    "/onset_time",
                    "/past_history",
                    "/medications",
                    "/allergies",
                    "/red_flags/red_flags_has",
                    "/red_flags/red_flags_detail",
                  ], 
                },
                value: { type: ["string", "number", "boolean", "null"] },
              },
            },

            // 3) upsert symptoms (keyed by canonical)
            {
              type: "object",
              additionalProperties: false,
              required: ["op", "path", "key", "value"],
              properties: {
                op: { type: "string", const: "upsert" },
                path: { type: "string", const: "/symptoms" },
                key: { type: "string", const: "canonical" },
                value: {
                  type: "object",
                  additionalProperties: false,
                  required: ["canonical","surface","duration",],
                  properties: {
                    canonical: { type: "string", minLength: 1 },
                    surface: { type: "string", minLength: 1 },
                    duration: { type: ["string", "null"] },
                  },
                },
              },
            },

            // 4) remove
            {
              type: "object",
              additionalProperties: false,
              required: ["op", "path", "reason"],
              properties: {
                op: { type: "string", const: "remove" },
                path: { 
                  type: "string", 
                  enum: [
                    "/chief_complaint",
                    "/onset_time",
                    "/past_history",
                    "/medications",
                    "/allergies",
                    "/red_flags/red_flags_has",
                    "/red_flags/red_flags_detail",
                    "/symptoms", 
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
				"red_flags",
				"chief_complaint",
				"symptoms",
				"onset_time",
				"past_history",
				"medications",
				"allergies",
				"null"
			],
		  },
      staff_note: {type: "string"},
      confirmed_fields: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "red_flags",
              "chief_complaint",
              "symptoms",
              "onset_time",
              "past_history",
              "medications",
              "allergies",
            ],
          },
      },
      ui_message: {type: [ "string","null"] },
      completion_status: {
        type: "string",
        enum: [
          "in_progress",
          "completed",
          "emergency_stop",
          "handoff_required",
          "error",
        ]
      },
      emergency_level: {
        type: ["string", "null"],
        enum: ["immediate", "urgent", "moderate", "null"]
      },
      conversation_flow: {
        type: "string",
        enum: ["intake","off_topic",]
      },
    },
  },
} as const;




  