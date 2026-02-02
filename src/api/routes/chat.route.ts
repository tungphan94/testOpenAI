import { Router } from "express";
import * as chatController from "../controllers/chat.controller";

const router = Router();
router.post("/chat", chatController.chat);

export default router;
