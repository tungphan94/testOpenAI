import { CommonContext } from '../llm_output';
export type Conversation_flow = "domain_detection" | "intake" | "off_topic";

export type CompletionStatus =
  | "in_progress"      // đang hỏi tiếp
  | "completed"        // hoàn tất bình thường
  | "emergency_stop"   // dừng do cấp cứu
  | "handoff_required" // cần nhân viên tiếp nhận
  | "error";           // lỗi hệ thống / fallback

export type EmergencyLevel =
  | "immediate"   // gọi cấp cứu NGAY
  | "urgent"      // cần khám gấp (hôm nay)
  | "moderate";   // có nguy cơ, theo dõi sớm

export interface RedFlags {
  red_flags_has: boolean | null;
  red_flags_detail: string | null;
}
export interface MedicalSymptom {
  surface: string;
  canonical: string;
  duration?: string | null;
}
export type MedicalStateV1 = {
  chief_complaint: string | null;
  symptoms: MedicalSymptom[];
  onset_time: string | null;
  past_history: string | null;
  medications: string | null;
  allergies: string | null;
  red_flags: RedFlags  | null;
};

export function createDefauleMedicalStateV1() : MedicalStateV1
{
  return {
    chief_complaint: null,
    symptoms: [],
    onset_time:null,
    past_history:null,
    medications:null,
    allergies:null,
    red_flags:null,
  }
}

export function createDefaultMedicalContext(): CommonContext<MedicalStateV1>
{
  return {
    state_digest: createDefauleMedicalStateV1(),
    confirmed_fields:[],
    last_question_field:null
  }
}

