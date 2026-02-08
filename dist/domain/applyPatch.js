"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySearchPatch = applySearchPatch;
const buildStateKnow_1 = require("./buildStateKnow");
function applySearchPatch(state, patch) {
    const next = structuredClone(state);
    for (const p of patch) {
        if (p.op === "set") {
            switch (p.path) {
                case "/criteria/city":
                    if ((0, buildStateKnow_1.isStringOrNull)(p.value))
                        next.city = p.value;
                    break;
                case "/criteria/place":
                    if ((0, buildStateKnow_1.isStringOrNull)(p.value))
                        next.place = p.value;
                    break;
                case "/criteria/facility_type":
                    if ((0, buildStateKnow_1.isStringOrNull)(p.value))
                        next.facility_type = p.value;
                    break;
                case "/criteria/specialty":
                    if ((0, buildStateKnow_1.isStringOrNull)(p.value))
                        next.specialty = p.value;
                    break;
                case "/criteria/radius_meters":
                    if ((0, buildStateKnow_1.isStringOrNull)(p.value))
                        next.radius_meters = p.value;
                    break;
                case "/criteria/include":
                    if ((0, buildStateKnow_1.isStringArray)(p.value))
                        next.include = p.value;
                    break;
            }
        }
    }
    return next;
}
// action: 'ask',
// patch: [
//   { op: 'set', path: '/criteria/city', value: 'Osaka' },
//   { op: 'set', path: '/criteria/place', value: null },
//   { op: 'set', path: '/criteria/facility_type', value: 'hospital' },
//   { op: 'set', path: '/criteria/specialty', value: null },
//   { op: 'set', path: '/criteria/radius_meters', value: '3000' },
//   {
//     op: 'set',
//     path: '/criteria/include',
//     value: '["address","phone"]'
//   },
//   { op: 'set', path: '/pending_question_field', value: 'specialty' }
// ],
// missing_fields: [ 'place', 'specialty' ],
// next_question: 'Bạn cần chuyên khoa nào?',
// message: 'Bạn tìm bệnh viện quanh Osaka. Mình cần biết chuyên khoa bạn cần để tiếp tục.'
