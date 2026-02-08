"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultFndStateV1 = createDefaultFndStateV1;
exports.createDefaultFndContext = createDefaultFndContext;
function createDefaultFndStateV1() {
    return {
        service_type: null,
        cuisine: null,
        party_size: null,
        location: null,
        datetime: null,
        budget: null,
        dietary_rules: null,
        notes: null,
    };
}
function createDefaultFndContext() {
    return {
        state_digest: createDefaultFndStateV1(),
        confirmed_fields: [],
        last_question_field: null
    };
}
