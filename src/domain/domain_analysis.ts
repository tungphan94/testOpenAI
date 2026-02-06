

export type MedicalIntent = "medical_intake" | "medical_facility";
export type FoodDrinkIntent = "restaurant_booking" | "restaurant_info";
export type RealEstateIntent = "realestate_search" | "realestate_contact";
export type Intent = MedicalIntent | FoodDrinkIntent | RealEstateIntent | string;

export const DOMAINS = [
  "food_drink",
  "medical",
  "real_estate",
  "unknown",
] as const;

export type DomainApp = typeof DOMAINS[number];
export function isDomain(v: unknown): v is DomainApp {
  return typeof v === "string" && DOMAINS.includes(v as DomainApp);
}

export type CommonIntent =
  | "intake"        // thu thập thông tin (y tế)
  | "search"        // tìm kiếm (BĐS, nhà hàng)
  | "booking"       // đặt lịch / đặt chỗ
  | "contact"       // liên hệ / tư vấn trực tiếp
  | "information";  // hỏi thông tin chung

export interface DomainAnalysisResponse{
    domain: DomainApp;
    intent: CommonIntent;
    message: string | null
}

export const domain_analysis_ouput_schema = {
  name: "domain_router_v1",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["domain", "intent", "message"],
    properties: {
      domain: {
        type: "string",
        enum: ["food_drink", "medical", "real_estate", "unknown"]
      },
      intent: {
        type: "string",
        enum: ["intake", "search", "booking", "contact", "information"]
      },
      message: {type: ["string", "null"]}
    }
  }
}

export function mapIntent(domain: DomainApp,intent: CommonIntent) {
  if (domain === "medical") {
    if (intent === "intake") return "medical_intake";
    return "medical_facility";
  }

  if (domain === "food_drink") {
    if (intent === "booking") return "restaurant_booking";
    return "restaurant_info";
  }

  if (domain === "real_estate") {
    if (intent === "search") return "realestate_search";
    return "realestate_contact";
  }

  return null;
}