import { ConversationStateRepository, ConversationState } from '../repositories/ConversationStateRepository';

export class ConversationService
{
    constructor(
        private stateRepo = new ConversationStateRepository(),
    ){}
    async start()
    {
        return this.stateRepo.create({tenantId: null});
    }

    async SaveConversationState(state: ConversationState | null)
    {
      this.stateRepo?.save(state)
    }

     async getConversationState(conversationId: string): Promise<ConversationState | null>
     {
        return this.stateRepo?.get(conversationId);
     }
     
     //test
     async getDefault(conversationId: string) : Promise<ConversationState | null>
     {
        return {
            conversation_id: conversationId,
            tenant_id:"",
            extracted: {
              chief_complaint: "đau đầu",
              symptoms: [
                {
                  canonical: "Headache",
                  surface: "đau đầu",
                  duration: "2 ngày"
                },
                {
                  canonical: "fever",
                  surface: "sốt",
                  duration: null
                },
                {
                  canonical: "Cough",
                  surface: "ho",
                  duration: null
                }
              ],
              onset_time: "2 ngày",
              past_history: "khong",
              medications: "parecetamol",
              allergies: null,
              red_flags: {
                red_flags_has: false,
                red_flags_detail: null
              }
            },
            confirmed_fields: ["red_flags", "chief_complaint","symptoms","onset_time","past_history", "medications"],
            next_question_field: "allergies",
            staff_note: "患者提供情報: 主訴=đau đầu; 発症時間=2 ngày; 既往歴=khong; 症状=đau đầu (2ngày), sốt, ho; レッドフラグあり=false; 投薬=parecetamol",
            is_completed:false,
            created_at:"",
            updated_at:""
        }
     }
}

export const conversationService = new ConversationService();
