"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const sessionManager_1 = require("./llm/services/sessionManager");
const chat_route_1 = require("./api/routes/chat.route");
const sessionMgr = new sessionManager_1.SessionManager({
    ttlMs: 30 * 60 * 1000,
    cleanupIntervalMs: 5 * 60 * 1000,
    maxSessions: 20000,
});
const app = (0, express_1.default)();
app.use(express_1.default.json({ type: ["application/json", "application/*+json"] }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", (0, chat_route_1.createChatRouter)(sessionMgr));
const publicDir = path_1.default.join(process.cwd(), "public");
app.use(express_1.default.static(publicDir));
app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, "index.html"));
});
exports.default = app;
