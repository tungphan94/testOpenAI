"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_CONVERSATION_STATE = exports.DEVELOPER_RULES_INTAKE_PROMPT = void 0;
exports.DEVELOPER_RULES_INTAKE_PROMPT = `
- Ask AT MOST ONE question per turn.
- next_question MUST be a single short sentence.
- next_question MUST contain exactly ONE '?' character. 
- If /red_flags/red_flags_has is NOT yet confirmed, next_question_field MUST be "red_flags" regardless of any other missing fields.
- /red_flags/red_flags_has can be set ONLY from the user's explicit YES/NO answer to the red flags question.
- Symptom statements without an explicit YES/NO confirmation MUST NOT be treated as an answer.
- Do NOT infer /red_flags/red_flags_has from symptoms or any other information.
Emergency rule (highest priority):
- If red_flags_has = true:
  - next_question = null
  - next_question_field = null
  - Stop intake

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
- next_question MUST be a single short sentence.
- next_question MUST contain exactly ONE '?' character.
RED FLAGS
- If /red_flags/red_flags_has is NOT yet confirmed, next_question_field MUST be "red_flags".
- /red_flags/red_flags_has can be set ONLY from the user's explicit YES/NO answer to the red flags question.
- Symptom statements MUST NOT be treated as the YES/NO answer for /red_flags/red_flags_has.
Emergency rule (highest priority):
- If red_flags_has = true:
  - next_question = null
  - next_question_field = null
  - Stop intake
`;
// - If red_flags_has = true:
// - next_question MUST be a single short sentence.
// - next_question MUST contain exactly ONE '?' character, 
// EXCEPT in EMERGENCY MODE (red_flags_has=true), 
// where next_question is an emergency alert and MUST NOT be a question (no '?' required).
