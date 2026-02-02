"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalLlmOutputJsonSchema = void 0;
exports.medicalLlmOutputJsonSchema = {
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
                                    required: ["canonical", "surface", "duration",],
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
            next_question: { type: ["string", "null"] },
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
                    null
                ],
            },
            staff_note: { type: "string" },
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
        },
    },
};
