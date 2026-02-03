"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationStateRepository = exports.prisma = void 0;
exports.createEmptyConversationState = createEmptyConversationState;
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({
    url: "file:./data/dev.db",
});
exports.prisma = new client_1.PrismaClient({ adapter });
function mapRow(r) {
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
function toIsoString(d) {
    return d.toISOString();
}
function mapConversationState(row) {
    const extractedRaw = row.extracted;
    const confirmedRaw = row.confirmed_fields;
    const extracted = typeof extractedRaw === "string"
        ? safeJsonParse(extractedRaw, {})
        : (extractedRaw ?? {});
    const confirmed_fields = typeof confirmedRaw === "string"
        ? safeJsonParse(confirmedRaw, [])
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
function safeJsonParse(s, fallback) {
    try {
        return JSON.parse(s);
    }
    catch {
        return fallback;
    }
}
function createEmptyConversationState(conversationId, createExtracted, tenantId = null, nowISO = new Date().toISOString()) {
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
class ConversationStateRepository {
    async create(args) {
        const sql = `
            INSERT INTO conversation_state
              (tenant_id, extracted, confirmed_fields)
            VALUES
              ($1, $2::jsonb, '[]'::jsonb)
            RETURNING *;
        `;
        const res = await db_1.pool.query(sql, [
            args.tenantId ?? null,
            JSON.stringify(args.extracted ?? {}),
        ]);
        return mapRow(res.rows[0]);
    }
    async getTest(conversationId) {
        const sql = `
        SELECT *
        FROM conversation_state
        WHERE conversation_id = $1
        LIMIT 1;
      `;
        try {
            const res = await db_1.pool.query(sql, [conversationId]);
            if (!res.rowCount)
                return null;
            return mapRow(res.rows[0]);
        }
        catch {
            return null;
        }
    }
    async get(conversationId) {
        try {
            const row = await exports.prisma.conversationState_Prisma.findUnique({
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
            if (!row)
                return null;
            return mapConversationState(row);
        }
        catch {
            return null;
        }
    }
    async updateFromLlmOutputtest(conversationId, llm) {
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
        try {
            const res = await db_1.pool.query(sql, [
                JSON.stringify(llm.extracted ?? {}),
                JSON.stringify(llm.confirmed_fields ?? []),
                JSON.stringify(llm.missing_fields ?? []),
                llm.next_question_field ?? null,
                llm.staff_note ?? null,
                conversationId,
            ]);
            if (!res.rowCount)
                throw new Error("conversation not found");
            return mapRow(res.rows[0]);
        }
        catch {
            return null;
        }
    }
    async save(state) {
        if (!state?.conversation_id) {
            throw new Error("conversation_id is required");
        }
        try {
            await exports.prisma.conversationState_Prisma.upsert({
                where: { conversation_id: state.conversation_id },
                create: {
                    conversation_id: state.conversation_id,
                    tenant_id: state.tenant_id,
                    extracted: (state.extracted ?? {}),
                    confirmed_fields: (state.confirmed_fields ?? []),
                    next_question_field: state.next_question_field ?? null,
                    staff_note: state.staff_note ?? null,
                    is_completed: state.next_question_field === null
                },
                update: {
                    extracted: (state.extracted ?? {}),
                    confirmed_fields: (state.confirmed_fields ?? []),
                    next_question_field: state.next_question_field ?? null,
                    staff_note: state.staff_note ?? null,
                    is_completed: state.next_question_field === null,
                }
            });
        }
        catch (e) {
            console.log("err save", e);
        }
    }
    async updateFromLlmOutput(conversationId, llm) {
        try {
            const updated = await exports.prisma.conversationState_Prisma.update({
                where: { conversation_id: conversationId },
                data: {
                    // Nếu DB là Postgres JsonB: truyền JSON thẳng
                    // Nếu DB là SQLite TEXT: bạn cần stringify (xem note bên dưới)
                    extracted: (llm.extracted ?? {}),
                    confirmed_fields: (llm.confirmed_fields ?? []),
                    next_question_field: llm.next_question_field ?? null,
                    staff_note: llm.staff_note ?? null,
                    is_completed: (llm.missing_fields?.length ?? 0) === 0,
                },
            });
            return mapConversationState(updated);
        }
        catch (e) {
            // Không tìm thấy record
            if (e?.code === "P2025")
                return null;
            return null;
        }
    }
}
exports.ConversationStateRepository = ConversationStateRepository;
