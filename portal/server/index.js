import "dotenv/config";
import express from "express";
import { registerApi } from "./api.js";
import { registerStatic } from "./static.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

registerApi(app);
registerStatic(app);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Static server running → http://localhost:${port}`);
});
