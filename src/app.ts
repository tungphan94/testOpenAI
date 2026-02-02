import express from "express";
import chatRouter from "./api/routes/chat.route";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ type: ["application/json", "application/*+json"] }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", chatRouter);
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
