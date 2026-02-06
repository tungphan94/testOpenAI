import { Request, Response } from "express";
import { SessionManager } from "../../llm/services/sessionManager";
import { ChatService } from "../chatService";

export type ChatFrontendResponse = {
  message: string | null;
};

export function createChatController(sessionMgr: SessionManager) {
  let chatService = new ChatService(sessionMgr);
  return {
    chat: async (req: Request, res: Response) => {
      try {
        const {domain, tenant_id, conversation_id, message } = req.body;
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
      } catch (err) {
        console.error(err);
        return res.status(500).json({error: "internal_error"});
      }
    },
  };
}