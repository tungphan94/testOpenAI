"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domain_analysis_ouput_schema = exports.DOMAINS = void 0;
exports.isDomain = isDomain;
exports.mapIntent = mapIntent;
exports.DOMAINS = [
    "food_drink",
    "medical",
    "real_estate",
    "unknown",
];
function isDomain(v) {
    return typeof v === "string" && exports.DOMAINS.includes(v);
}
exports.domain_analysis_ouput_schema = {
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
            message: { type: ["string", "null"] }
        }
    }
};
function mapIntent(domain, intent) {
    if (domain === "medical") {
        if (intent === "intake")
            return "medical_intake";
        return "medical_facility";
    }
    if (domain === "food_drink") {
        if (intent === "booking")
            return "restaurant_booking";
        return "restaurant_info";
    }
    if (domain === "real_estate") {
        if (intent === "search")
            return "realestate_search";
        return "realestate_contact";
    }
    return null;
}
