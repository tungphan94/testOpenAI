"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTAKE_COMPLETION_RULE = exports.CURRENT_CONVERSATION_STATE = exports.DEVELOPER_RULES_INTAKE_PROMPT = void 0;
exports.DEVELOPER_RULES_INTAKE_PROMPT = `
PATCH RULES
- upsert only for /symptoms with key=canonical (lowercase).
- set only when confirmed state value is empty/missing.
- overwrite only on explicit user correction.
- remove only on explicit user denial.
`;
exports.CURRENT_CONVERSATION_STATE = `
- Continue intake strictly from the provided state.
- The current next_question_field defines the PRIMARY field to collect in this turn.
- Any additional patient-provided medical information in the same message MUST also be extracted into the appropriate paths.
- Do NOT assume, skip, or reorder fields unless explicitly instructed by the user.
`;
exports.INTAKE_COMPLETION_RULE = `
- If all required intake fields are collected AND no red-flag or emergency condition is present:
- completion_status = "completed", emergency_level = null
- The assistant MUST provide a completion ui_message:
  - Short and clear (1–2 sentences)
  - Calm and reassuring tone
  - Inform the user that the information has been successfully collected
  - Explain the next step (e.g. review by staff, appointment, or waiting)
  - No questions
`;
