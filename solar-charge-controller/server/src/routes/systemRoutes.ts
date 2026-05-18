import { Router } from "express";
import { store, isDeviceConnected } from "../data/mockSystem";
import { listEvents } from "../services/eventService";
import { recommendCluster } from "../services/validationService";

export const systemRouter = Router();

systemRouter.get("/api/system/status", (_req, res) => {
  const recommendedClusterId = recommendCluster(store.state);
  res.json({
    ...store.state,
    deviceConnected: isDeviceConnected(),
    recommendedClusterId,
  });
});

systemRouter.get("/api/panels", (_req, res) => {
  res.json({ panels: store.state.panels });
});

systemRouter.get("/api/batteries", (_req, res) => {
  res.json({
    batteries: store.state.batteries,
    activeChargingClusterId: store.state.activeChargingClusterId,
    recommendedClusterId: recommendCluster(store.state),
  });
});

systemRouter.get("/api/events", (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 200);
  res.json({ events: listEvents(limit) });
});
