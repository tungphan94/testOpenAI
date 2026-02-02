"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_route_1 = __importDefault(require("./api/routes/chat.route"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ type: ["application/json", "application/*+json"] }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", chat_route_1.default);
const publicDir = path_1.default.join(process.cwd(), "public");
app.use(express_1.default.static(publicDir));
app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, "index.html"));
});
exports.default = app;
