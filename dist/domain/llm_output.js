"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmInfoSearchJsonSchema = exports.llmInfoOutputJsonSchema = void 0;
exports.llmInfoOutputJsonSchema = {
    name: "llm_info_output",
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["message"],
        properties: {
            message: { type: "string" }
        },
    }
};
exports.llmInfoSearchJsonSchema = {
    name: "search_action",
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["action", "patch", "missing_fields", "next_question", "message"],
        properties: {
            action: { type: "string", enum: ["ask", "search_now"] },
            patch: {
                type: "array",
                items: {
                    type: "object",
                    required: ["path", "op", "value"],
                    additionalProperties: false,
                    properties: {
                        op: { type: "string", enum: ["set", "remove"] },
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
                        value: { type: ["string", "null"] },
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
};
