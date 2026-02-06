"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = exports.DEFAULT_SESSION_STATE = void 0;
exports.DEFAULT_SESSION_STATE = {
    tenant_id: "",
    domain: null,
    intent: null,
    conversation_id: "",
    next_question_field: null,
    off_topic_streak: 0,
    last_request_at: Date.now(),
    updated_at: Date.now(),
    turns: [],
    max_turns: 50,
    domain_state: {},
};
class SessionManager {
    constructor(opts = {}) {
        this.sessions = new Map();
        this.locks = new Map();
        this.ttlMs = opts.ttlMs ?? 30 * 60 * 1000; // 30 minutes
        this.cleanupIntervalMs = opts.cleanupIntervalMs ?? 5 * 60 * 1000; // 5 minutes
        this.maxSessions = opts.maxSessions ?? 20000;
        setInterval(() => this.cleanup(), this.cleanupIntervalMs).unref?.();
    }
    /** Key for multi-tenant separation */
    key(tenant_id, conversation_id) {
        return `${tenant_id}:${conversation_id}`;
    }
    getOrDefault(tenant_id, conversation_id) {
        const k = this.key(tenant_id, conversation_id);
        let s = this.sessions.get(k);
        if (s === undefined) {
            s = exports.DEFAULT_SESSION_STATE;
            s.tenant_id = tenant_id;
            s.conversation_id = conversation_id;
        }
        else {
            s.updated_at = Date.now();
        }
        return s;
    }
    /** Update "last active" time */
    touch(tenant_id, conversation_id) {
        const k = this.key(tenant_id, conversation_id);
        const s = this.sessions.get(k);
        if (s)
            s.updated_at = Date.now();
    }
    /** Delete session manually (e.g., completed/emergency_stop if you want) */
    delete(tenant_id, conversation_id) {
        this.sessions.delete(this.key(tenant_id, conversation_id));
        this.locks.delete(this.key(tenant_id, conversation_id));
    }
    /** Prevent memory blow-up: evict oldest sessions when over cap */
    ensureCapacity() {
        if (this.sessions.size < this.maxSessions)
            return;
        // Evict ~1% oldest sessions to reduce sorting cost
        const evictCount = Math.max(50, Math.floor(this.maxSessions * 0.01));
        const entries = Array.from(this.sessions.entries());
        entries.sort((a, b) => a[1].updated_at - b[1].updated_at);
        for (let i = 0; i < Math.min(evictCount, entries.length); i++) {
            this.sessions.delete(entries[i][0]);
        }
    }
    /** Cleanup by TTL (idle time) */
    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [k, s] of this.sessions) {
            if (now - s.updated_at >= this.ttlMs) {
                this.sessions.delete(k);
                this.locks.delete(k);
                removed++;
            }
        }
        if (removed > 0) {
            // optional log
            // console.log(`[session] cleaned=${removed} remain=${this.sessions.size}`);
        }
    }
    /** Per-session lock to avoid concurrent updates for same conversation */
    async withLock(tenant_id, conversation_id, fn) {
        const k = this.key(tenant_id, conversation_id);
        const prev = this.locks.get(k) ?? Promise.resolve();
        let release;
        const next = new Promise((res) => (release = res));
        this.locks.set(k, prev.then(() => next));
        await prev;
        try {
            return await fn();
        }
        finally {
            release();
            // (optional) don't bother cleaning lock chain here; TTL cleanup will remove stale keys
        }
    }
    /** Helper for monitoring */
    size() {
        return this.sessions.size;
    }
}
exports.SessionManager = SessionManager;
