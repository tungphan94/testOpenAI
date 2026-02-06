"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatRouter = createChatRouter;
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
function createChatRouter(sessionMgr) {
    const router = (0, express_1.Router)();
    const chatController = (0, chat_controller_1.createChatController)(sessionMgr);
    router.post("/chat", chatController.chat);
    return router;
}
exports.default = router;
