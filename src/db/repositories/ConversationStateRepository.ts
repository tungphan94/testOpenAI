import { pool } from "../db";
export type JsonObject = Record<string, any>;

export interface ConversationState {
  conversation_id: string;
  tenant_id: string | null;
  extracted: JsonObject;
  confirmed_fields: string[];
  next_question_field: string | null;
  staff_note: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(r: any): ConversationState {
  return {
    conversation_id: r.conversation_id,
    tenant_id: r.tenant_id,
    extracted: r.extracted ?? {},
    confirmed_fields: Array.isArray(r.confirmed_fields) ? r.confirmed_fields : (r.confirmed_fields ?? []),
    next_question_field: r.next_question_field,
    staff_note: r.staff_note,
    is_completed: r.is_completed,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function createEmptyConversationState(
  conversationId: string,
  createExtracted: () => JsonObject,
  tenantId: string | null = null,
  nowISO: string = new Date().toISOString(),
): ConversationState {
  return {
    conversation_id: conversationId,
    tenant_id: tenantId,
    extracted: createExtracted(),
    confirmed_fields: [],
    next_question_field: null,
    staff_note: null,
    is_completed: false,
    created_at: nowISO,
    updated_at: nowISO,
  };
}

export class ConversationStateRepository 
{
    async create(args: {
        tenantId?: string | null;
        extracted?: JsonObject;
    }): Promise<ConversationState>
    {
         const sql = `
            INSERT INTO conversation_state
              (tenant_id, extracted, confirmed_fields)
            VALUES
              ($1, $2::jsonb, '[]'::jsonb)
            RETURNING *;
        `;
        const res = await pool.query(sql, [
          args.tenantId ?? null,
          JSON.stringify(args.extracted ?? {}),
        ]);
        return mapRow(res.rows[0]);
    }

    async get(conversationId: string): Promise<ConversationState | null> {
      const sql = `
        SELECT *
        FROM conversation_state
        WHERE conversation_id = $1
        LIMIT 1;
      `;
      try{
        const res = await pool.query(sql, [conversationId]);
        if (!res.rowCount) return null;
        return mapRow(res.rows[0])
      }catch{
        return null;
      }
    }
    
    async updateFromLlmOutput(conversationId: string, llm: {
        extracted: JsonObject;
        confirmed_fields: string[];
        missing_fields: string[];
        next_question_field: string | null;
        staff_note: string | null;
    }): Promise<ConversationState | null> {
        const sql = `
          UPDATE conversation_state
          SET
            extracted = $1::jsonb,
            confirmed_fields = $2::jsonb,
            next_question_field = $4,
            staff_note = $5,
            is_completed = (jsonb_array_length($3::jsonb) = 0),
            updated_at = NOW()
          WHERE conversation_id = $6
          RETURNING *;
        `;
        try{
          const res = await pool.query(sql, [
            JSON.stringify(llm.extracted ?? {}),
            JSON.stringify(llm.confirmed_fields ?? []),
            JSON.stringify(llm.missing_fields ?? []),
            llm.next_question_field ?? null,
            llm.staff_note ?? null,
            conversationId,
          ]);
          if (!res.rowCount) throw new Error("conversation not found");
          return mapRow(res.rows[0]);
        }catch{
          return null;
        }
    }
}