import { Router } from "express";
import bus from "../events/bus.js";

const router = Router();

router.post("/runs/:runId/events", (req, res) => {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!process.env.INTERNAL_SECRET || token !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const runId = String(req.params.runId);
  const evt = { ...req.body, runId };

  try {
    bus.emit("event", evt);
    res.status(204).end();
  } catch (error) {
    console.error("Failed to handle internal event", error);
    res.status(500).json({ error: "failed to process event" });
  }
});

export default router;
