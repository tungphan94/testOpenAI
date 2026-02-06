// 1) Thu thập nhu cầu (khách muốn gì)
export const FND_INTAKE_ORDER = [
  "service_type",   // dine_in / takeaway / delivery
  "cuisine",        // món / phong cách
  "party_size",     // số người
  "location",       // khu vực hoặc địa chỉ
  "datetime",       // thời gian ăn
  "budget",         // ngân sách
  "dietary_rules",  // ăn chay / halal / dị ứng
  "notes"           // yêu cầu thêm (free text)
] as const;

export type FndIntakeField = typeof FND_INTAKE_ORDER[number];

// 2) Chốt đặt (đặt bàn / đặt giao / đặt mang về / đặt tiệc)
export const FOOD_BOOKING_ORDER = [
  "provider_choice",   // nhà hàng/chi nhánh đã chọn (hoặc “đề xuất 1-2 lựa chọn”)
  "final_datetime",    // giờ chốt cuối (nếu intake là khoảng)
  "final_party_size",  // số người chốt cuối
  "contact_name",      // tên liên hệ
  "contact_phone",     // sđt (ưu tiên)
  "contact_email",     // email (nếu cần)
  "delivery_address",  // chỉ dùng cho delivery (nullable/skip nếu dine_in)
  "payment_method",    // tại quán/online/cash/card... (tuỳ hệ thống)
  "confirmation"       // xác nhận đặt (yes/no) hoặc consent
] as const;

export type FoodBookingField = typeof FOOD_BOOKING_ORDER[number];
