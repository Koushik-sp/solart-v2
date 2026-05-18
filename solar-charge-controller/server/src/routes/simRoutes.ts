import { Router } from "express";
import { store } from "../data/mockSystem";
import { resetSimulation } from "../services/simulationService";
import { recordEvent } from "../services/eventService";

export const simRouter = Router();

/**
 * POST /api/sim/reset
 * Resets all in-memory data to the seed state. Useful for demo loops.
 */
simRouter.post("/api/sim/reset", (_req, res) => {
  const next = resetSimulation();
  const event = recordEvent(
    "SIMULATION_RESET",
    "Simulation data reset to defaults.",
    "info"
  );
  res.json({ success: true, state: next, event });
});

/**
 * POST /api/sim/fault
 * Forces the system into a fault state and marks one battery faulty so
 * the safety validation has something to reject on. Body is ignored.
 */
simRouter.post("/api/sim/fault", (_req, res) => {
  store.state.systemStatus = "fault";
  // Mark battery-3 faulty for visual demo if not already so.
  const target =
    store.state.batteries.find((b) => b.clusterId === "battery-3") ??
    store.state.batteries[0];
  if (target) {
    target.status = "fault";
    target.isCurrentlyCharging = false;
    target.current = 0;
  }
  const event = recordEvent(
    "FAULT_SIMULATED",
    "Simulated fault injected. System status is FAULT.",
    "error",
    { faultedClusterId: target?.clusterId }
  );
  res.json({ success: true, state: store.state, event });
});

/**
 * POST /api/sim/clear-fault
 * Clears system fault and returns affected battery to idle.
 */
simRouter.post("/api/sim/clear-fault", (_req, res) => {
  store.state.systemStatus = "normal";
  store.state.batteries.forEach((b) => {
    if (b.status === "fault") b.status = "idle";
  });
  const event = recordEvent(
    "FAULT_CLEARED",
    "Simulated fault cleared. System status is NORMAL.",
    "info"
  );
  res.json({ success: true, state: store.state, event });
});
