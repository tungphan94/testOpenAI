import express from "express";
import chatRouter from "./api/routes/chat.route";
import path from "path";
import { SessionManager } from "./llm/services/sessionManager";
import {createChatRouter } from "./api/routes/chat.route"
const sessionMgr = new SessionManager({
  ttlMs: 30 * 60 * 1000,
  cleanupIntervalMs: 5 * 60 * 1000,
  maxSessions: 20000,
});
const app = express();
app.use(express.json({ type: ["application/json", "application/*+json"] }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", createChatRouter(sessionMgr));
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
