import { Router } from "express";
import {createChatController} from "../controllers/chat.controller";
import { SessionManager } from "../../llm/services/sessionManager";

const router = Router();
export function createChatRouter(sessionMgr: SessionManager) {
  const router = Router();
  const chatController = createChatController(sessionMgr);
  router.post("/chat", chatController.chat);
  return router;
}
export default router;
