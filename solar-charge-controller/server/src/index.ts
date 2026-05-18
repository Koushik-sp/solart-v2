import express from "express";
import cors from "cors";
import { systemRouter } from "./routes/systemRoutes";
import { controlRouter } from "./routes/controlRoutes";
import { simRouter } from "./routes/simRoutes";
import { deviceRouter } from "./routes/deviceRoutes";
import { startSimulation } from "./services/simulationService";
import { recordEvent } from "./services/eventService";

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(systemRouter);
app.use(controlRouter);
app.use(simRouter);
app.use(deviceRouter);

// 404 fallback (after all routers).
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  startSimulation();
  recordEvent(
    "SIMULATION_RESET",
    `SolarCharge gateway started on port ${PORT}.`,
    "info"
  );
  // Console banner so the user knows the gateway is up.
  // eslint-disable-next-line no-console
  console.log(
    `\nSolarCharge mock gateway listening on http://localhost:${PORT}` +
      `\n  GET  /api/system/status` +
      `\n  GET  /api/panels` +
      `\n  GET  /api/batteries` +
      `\n  GET  /api/events` +
      `\n  POST /api/control/charge-target` +
      `\n  POST /api/control/mode` +
      `\n  POST /api/sim/{reset,fault,clear-fault}` +
      `\n  POST /api/device/telemetry` +
      `\n  GET  /api/device/command?deviceId=...` +
      `\n  POST /api/device/command-result\n`
  );
});
