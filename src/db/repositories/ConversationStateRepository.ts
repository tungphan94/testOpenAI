import { pool } from "../db";

import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
const db = new Database("./data/dev.db");
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:.data/dev.db",
});
export const prisma = new PrismaClient({ adapter });

console.log("DATABASE_URL =", process.env.DATABASE_URL);

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

function toIsoString(d: Date): string {
  return d.toISOString();
}

function mapConversationState(row: any): ConversationState {
  const extractedRaw = row.extracted;
  const confirmedRaw = row.confirmed_fields;

  const extracted: JsonObject =
    typeof extractedRaw === "string"
      ? (safeJsonParse(extractedRaw, {}) as JsonObject)
      : (extractedRaw ?? {});

  const confirmed_fields: string[] =
    typeof confirmedRaw === "string"
      ? (safeJsonParse(confirmedRaw, []) as string[])
      : (Array.isArray(confirmedRaw) ? confirmedRaw : []);

  return {
    conversation_id: row.conversation_id,
    tenant_id: row.tenant_id ?? null,
    extracted,
    confirmed_fields,
    next_question_field: row.next_question_field ?? null,
    staff_note: row.staff_note ?? null,
    is_completed: !!row.is_completed,
    created_at: row.created_at instanceof Date ? toIsoString(row.created_at) : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? toIsoString(row.updated_at) : String(row.updated_at),
  };
}

function safeJsonParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
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

    async getTest(conversationId: string): Promise<ConversationState | null> {
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

    async get(conversationId: string): Promise<ConversationState | null> 
    {
      try {
        const row = await prisma.conversationState.findUnique({
          where: { conversation_id: conversationId },
          select: {
            conversation_id: true,
            tenant_id: true,
            extracted: true,
            confirmed_fields: true,
            next_question_field: true,
            staff_note: true,
            is_completed: true,
            created_at: true,
            updated_at: true,
          },
        });
        if (!row) return null;
          return mapConversationState(row);
      } catch {
        return null;
      }
    }
    
    async updateFromLlmOutputtest(conversationId: string, llm: {
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

    async save(state :ConversationState | null)
    {
        if (!state?.conversation_id) {
          throw new Error("conversation_id is required");
        }
        try {
         await prisma.conversationState.upsert({
           where: { conversation_id: state.conversation_id },
           create: {
             conversation_id: state.conversation_id,
             tenant_id: state.tenant_id,
             extracted: (state.extracted ?? {}) as Prisma.InputJsonValue,
             confirmed_fields: (state.confirmed_fields ?? []) as Prisma.InputJsonValue,
             next_question_field: state.next_question_field ?? null,
             staff_note: state.staff_note ?? null,
             is_completed: state.next_question_field === null
           },
           update: {
             extracted: (state.extracted ?? {}) as Prisma.InputJsonValue,
             confirmed_fields: (state.confirmed_fields ?? []) as Prisma.InputJsonValue,
             next_question_field: state.next_question_field ?? null,
             staff_note: state.staff_note ?? null,
             is_completed: state.next_question_field === null,
           }
          });
        } catch (e: any) { console.log("err save", e)}
    }

    async updateFromLlmOutput(conversationId: string, llm: {
        extracted: JsonObject;
        confirmed_fields: string[];
        missing_fields: string[];
        next_question_field: string | null;
        staff_note: string | null;
        }): Promise<ConversationState | null> {
        try {
          const updated = await prisma.conversationState.update({
          where: { conversation_id: conversationId },
          data: {
        // Nếu DB là Postgres JsonB: truyền JSON thẳng
        // Nếu DB là SQLite TEXT: bạn cần stringify (xem note bên dưới)
            extracted: (llm.extracted ?? {}) as Prisma.InputJsonValue,
            confirmed_fields: (llm.confirmed_fields ?? []) as Prisma.InputJsonValue,
            next_question_field: llm.next_question_field ?? null,
            staff_note: llm.staff_note ?? null,
            is_completed: (llm.missing_fields?.length ?? 0) === 0,
            },
          });
          return mapConversationState(updated);
        } catch (e: any) {
    // Không tìm thấy record
        if (e?.code === "P2025") return null;
        return null;
      }
    }

    
}