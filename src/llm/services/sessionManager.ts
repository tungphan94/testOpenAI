import { CompletionStatus,Conversation_flow } from "../../domain/medical/medicalLlmOutput";

type SessionTurn = {
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export type SessionState = {
  conversation_flow : Conversation_flow;
  tenant_id: string;
  conversation_id: string;
  confirmed_fields: string[];
  next_question_field: string | null;
  off_topic_streak: number;
  last_mode: CompletionStatus | null;
  // optional: chống spam / out-of-order
  last_request_at: number;
  turns: SessionTurn[];
  max_turns: number;
  updated_at: number; // idle TTL based on this
};

function addTurn(session: SessionState, role: "user" | "assistant", text: string) {
  session.turns.push({ role, text, ts: Date.now() });
  const max = session.max_turns ?? 20;
  if (session.turns.length > max) {
    session.turns.splice(0, session.turns.length - max);
  }
}

type SessionManagerOptions = {
  ttlMs?: number;              // default 30m
  cleanupIntervalMs?: number;  // default 5m
  maxSessions?: number;        // hard cap (optional but recommended)
};

export class SessionManager {
  private sessions = new Map<string, SessionState>();
  private locks = new Map<string, Promise<void>>();

  private ttlMs: number;
  private cleanupIntervalMs: number;
  private maxSessions: number;

  constructor(opts: SessionManagerOptions = {}) {
    this.ttlMs = opts.ttlMs ?? 30 * 60 * 1000; // 30 minutes
    this.cleanupIntervalMs = opts.cleanupIntervalMs ?? 5 * 60 * 1000; // 5 minutes
    this.maxSessions = opts.maxSessions ?? 20000;
    setInterval(() => this.cleanup(), this.cleanupIntervalMs).unref?.();
  }

  /** Key for multi-tenant separation */
  private key(tenant_id: string, conversation_id: string) {
    return `${tenant_id}:${conversation_id}`;
  }

  /** Create or load session (touch updated_at) */
  getOrCreate(tenant_id: string, conversation_id: string): SessionState {
    const k = this.key(tenant_id, conversation_id);
    const now = Date.now();
    let s = this.sessions.get(k);
    if (s === undefined) {
      this.ensureCapacity();
      s = {
        conversation_flow:"intake",
        tenant_id,
        conversation_id,
        confirmed_fields: [],
        next_question_field: "red_flags",
        off_topic_streak: 0,
        last_mode: null,
        max_turns:10,
        turns:[],
        last_request_at: 0,
        updated_at: now,
      };
      this.sessions.set(k, s);
    } else {
      s.updated_at = now;
    }
    return s;
  }

  /** Update "last active" time */
  touch(tenant_id: string, conversation_id: string) {
    const k = this.key(tenant_id, conversation_id);
    const s = this.sessions.get(k);
    if (s) s.updated_at = Date.now();
  }

  /** Delete session manually (e.g., completed/emergency_stop if you want) */
  delete(tenant_id: string, conversation_id: string) {
    this.sessions.delete(this.key(tenant_id, conversation_id));
    this.locks.delete(this.key(tenant_id, conversation_id));
  }

  /** Prevent memory blow-up: evict oldest sessions when over cap */
  private ensureCapacity() {
    if (this.sessions.size < this.maxSessions) return;

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
  async withLock<T>(tenant_id: string, conversation_id: string, fn: () => Promise<T>): Promise<T> {
    const k = this.key(tenant_id, conversation_id);
    const prev = this.locks.get(k) ?? Promise.resolve();

    let release!: () => void;
    const next = new Promise<void>((res) => (release = res));
    this.locks.set(k, prev.then(() => next));

    await prev;
    try {
      return await fn();
    } finally {
      release();
      // (optional) don't bother cleaning lock chain here; TTL cleanup will remove stale keys
    }
  }

  /** Helper for monitoring */
  size() {
    return this.sessions.size;
  }
}