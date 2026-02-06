"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatController = createChatController;
const chatService_1 = require("../chatService");
function createChatController(sessionMgr) {
    let chatService = new chatService_1.ChatService(sessionMgr);
    return {
        chat: async (req, res) => {
            try {
                const { domain, tenant_id, conversation_id, message } = req.body;
                if (!tenant_id || !conversation_id || !message) {
                    return res.status(400).json({ error: "missing field" });
                }
                const result = await chatService.handleMessage({
                    tenant_id,
                    conversation_id,
                    message,
                    domain,
                });
                console.log(result);
                return res.status(result.status).json(result.body);
            }
            catch (err) {
                console.error(err);
                return res.status(500).json({ error: "internal_error" });
            }
        },
    };
}
