import {CommonIntent, DomainApp, MedicalIntent, FoodDrinkIntent,RealEstateIntent, DomainAnalysisResponse} from "../../domain/domain_analysis"
import { createDefaultFndContext, FndStateV1 } from "../../domain/food_drink/fnd.extracted.types";
import { CommonContext } from "../../domain/llm_output";
import { createDefaultMedicalContext, MedicalStateV1 } from "../../domain/medical/medical.extracted.types";

type SessionTurn = {
  role: "user" | "assistant";
  text: string;
  ts: number;
  domain: DomainApp
  intent: CommonIntent
};

export type FlowStatus =
  | "idle"          // chưa dùng
  | "collecting"    // đang hỏi để đủ điều kiện
  | "ready"         // đủ điều kiện để chạy search
  | "in_progress"   // đang gọi service
  | "done"          // có kết quả
  | "error";        // lỗi

export type SearchSlotKey =
  | "keyword"        // từ khóa: "da liễu", "nhà hàng Nhật", "2LDK"...
  | "region"         // vùng: Osaka, Tokyo...
  | "location_detail"// chi tiết: Umeda, tên ga, quận, địa chỉ gần đúng
  | "radius_m"       // bán kính nếu cần
  | "datetime"       // thời gian (booking/search theo giờ)
  | "party_size"     // số người
  | "budget"
  | "other";

// export type SearchSlot = {
//   key: SearchSlotKey | string;   // cho phép domain thêm key riêng
//   prompt: string;                // câu hỏi gợi ý để hỏi user (UI/LLM dùng)
//   value: any;                    // giá trị đã có
//   required?: boolean;            // slot bắt buộc
//   confidence?: number;           // optional: độ tin cậy 0..1
//   source?: "user" | "llm" | "system";
// };  

// export type SearchResultItem = {
//   id: string;              // stable id (hash/uuid)
//   title: string;           // tên bệnh viện/quán/nhà...
//   address?: string;
//   phone?: string;
//   url?: string;
//   distance_m?: number;
//   meta?: Record<string, any>;
// };

// export type SearchSnapshot = {
//   query_key: string;     // hash/serialize từ slots (hoặc criteria)
//   items: SearchResultItem[];
//   cursor?: string | null;
//   total_estimated?: number;
//   fetched_at: number;    // epoch ms
// };

// export type SearchState = {
//   status: FlowStatus;
//   // slots là “tổng quát nhất”: bạn không cần generic <TCriteria> nữa
//   // vì mọi domain đều quy về slot (keyword, region, location_detail, ...)
//   slots: Record<string, SearchSlot>;
//   // system quyết định slot nào cần hỏi tiếp
//   next_slot_key: string | null;
//   // snapshot kết quả gần nhất
//   results: SearchSnapshot | null;
//   // user chọn item nào trong results
//   selected_id: string | null;
//   // debug
//   last_error?: string | null;
// };

  


export type SearchState =
{
  domain?: string,
  intent?: string,
  action?: string,
  city?: string | null;
  place?:string | null,
  facility_type?:string | null,
  specialty?:string|null,
  radius_meters?:string | null,
  missing_fields?:[],
  next_question?:string | null;
  include?:string[] |null;
}

export function createDefaultSearchState(): SearchState {
  return {
  };
}

export type MedicalDomainState = {
  intake: CommonContext<MedicalStateV1>;
  search: SearchState;
  // booking: {
  //   status: FlowStatus;
  //   selected_facility_id: string | null;      // lấy từ search.selected_id
  //   datetime?: string | null;
  //   patient_name?: string | null;
  //   phone?: string | null;
  //   next_question_field: string | null;
  // };
}

export type FoodDrinkDomainState = {
  intake: CommonContext<FndStateV1>
  search: SearchState;
  // booking: {
  //   status: FlowStatus;
  //   selected_restaurant_id: string | null;
  //   datetime?: string | null;
  //   party_size?: number | null;
  //   name?: string | null;
  //   phone?: string | null;
  //   next_question_field: string | null;
  // };
};

export type RealEstateDomainState = {
  search: SearchState;
  // contact: {
  //   status: FlowStatus;
  //   selected_property_id: string | null;
  //   name?: string | null;
  //   phone?: string | null;
  //   next_question_field: string | null;
  // };
};

function createDefaultMedicalDomainState() : MedicalDomainState
{
  return {
    intake: createDefaultMedicalContext(),
    search: createDefaultSearchState(),
  }
}

function createDefaultFoodDrinkDomainState() : FoodDrinkDomainState
{
  return {
    intake: createDefaultFndContext(),
    search: createDefaultSearchState(),
  }
}

export type SessionState = {
  tenant_id: string;
  domain: DomainApp; //linh vuc
  intent: CommonIntent; //HÀNH VI 
  last_intent:CommonIntent;
  conversation_id: string;
  next_question_field: string | null;
  off_topic_streak: number; //Số lần liên tiếp user đi ngoài mục tiêu chính của flow hiện tại
  last_request_at: number;
  turns: SessionTurn[];
  max_turns: number;
  updated_at: number;
  domain_state: {
    medical: MedicalDomainState;
    food_drink: FoodDrinkDomainState;
    real_estate: RealEstateDomainState | null;
  };
};

export const DEFAULT_SESSION_STATE: SessionState = {
  tenant_id: "",
  domain: "unknown",
  intent: "information",
  last_intent:"information",
  conversation_id: "",
  next_question_field: null,
  off_topic_streak: 0,
  last_request_at: Date.now(),
  updated_at: Date.now(),
  turns: [],
  max_turns: 50,
  domain_state: {
      medical: createDefaultMedicalDomainState(),
      food_drink: createDefaultFoodDrinkDomainState(),
      real_estate: null,
  },
};

export function addTurn(session: SessionState, role: "user" | "assistant", text: string) {
  const domain = session.domain;
  const intent = session.intent;
  session.turns.push({ role, text, ts: Date.now(),domain,  intent});
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

  getOrDefault(tenant_id:string, conversation_id:string): SessionState{
    const k = this.key(tenant_id, conversation_id); 
    let s = this.sessions.get(k);
    if(s === undefined){
      s = DEFAULT_SESSION_STATE;
      s.tenant_id = tenant_id;
      s.conversation_id = conversation_id;
    }else{
        s.updated_at = Date.now();
    }
    return s;
  }
  update(session: SessionState)
  {
    this.sessions.set(this.key(session.tenant_id, session.conversation_id), session);
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