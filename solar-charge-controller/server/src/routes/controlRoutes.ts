import { Router } from "express";
import {
  ChargeTargetFailureResponse,
  ChargeTargetRequest,
  ChargeTargetSuccessResponse,
  OperatingMode,
} from "../types/system";
import { store, isDeviceConnected } from "../data/mockSystem";
import { validateChargeTargetSwitch } from "../services/validationService";
import { applyChargeTargetSwitch } from "../services/simulationService";
import { recordEvent } from "../services/eventService";
import { enqueueChargeTargetCommand } from "../services/commandService";

export const controlRouter = Router();

const FALLBACK_DEVICE_ID = "esp32-solar-controller-001";

/**
 * POST /api/control/charge-target
 *
 * The mobile app calls this when the user confirms a switch. The flow is:
 *   1. Validate the request against the current system snapshot.
 *   2. If a real device is connected, enqueue a command for the firmware
 *      and return success — the firmware will validate again locally
 *      (defense-in-depth) and report back via /api/device/command-result.
 *   3. If no device is connected, apply the switch in-memory and return
 *      success immediately. This is the simulation-only fallback.
 */
controlRouter.post("/api/control/charge-target", (req, res) => {
  const body = req.body as Partial<ChargeTargetRequest>;
  const clusterId = body?.clusterId;
  const requestedBy = body?.requestedBy ?? "unknown";

  if (!clusterId || typeof clusterId !== "string") {
    const fail: ChargeTargetFailureResponse = {
      success: false,
      message: "Missing or invalid clusterId.",
      reasonCode: "CLUSTER_NOT_FOUND",
    };
    return res.status(400).json(fail);
  }

  const decision = validateChargeTargetSwitch(store.state, clusterId);
  if (!decision.ok) {
    recordEvent(
      "CHARGE_TARGET_REJECTED",
      decision.message ?? "Charge target switch rejected.",
      "warning",
      { clusterId, requestedBy, reasonCode: decision.reasonCode }
    );
    const fail: ChargeTargetFailureResponse = {
      success: false,
      message: decision.message ?? "Charge target switch rejected.",
      reasonCode: decision.reasonCode!,
    };
    return res.status(409).json(fail);
  }

  // If switching out of auto mode, log it.
  if (store.state.operatingMode === "auto") {
    store.state.operatingMode = "manual";
    recordEvent(
      "MODE_CHANGED",
      "Operating mode changed to manual after user-initiated switch.",
      "info",
      { previous: "auto", next: "manual" }
    );
  }

  const previousClusterId = store.state.activeChargingClusterId;
  const target = store.state.batteries.find((b) => b.clusterId === clusterId)!;

  if (isDeviceConnected()) {
    // Defer the actual state mutation to the firmware. The mobile app
    // will see the change reflected once the device reports new
    // telemetry.
    const command = enqueueChargeTargetCommand(FALLBACK_DEVICE_ID, clusterId);
    const event = recordEvent(
      "DEVICE_COMMAND_PENDING",
      `Sent SET_CHARGE_TARGET ${clusterId} to device ${FALLBACK_DEVICE_ID}`,
      "info",
      {
        commandId: command.commandId,
        clusterId,
        requestedBy,
        previousClusterId,
      }
    );
    const ok: ChargeTargetSuccessResponse = {
      success: true,
      message: `Command queued for device. Switching to ${target.name}.`,
      activeChargingClusterId: clusterId,
      event,
    };
    return res.json(ok);
  }

  // Simulation-only fallback: apply the switch immediately.
  applyChargeTargetSwitch(clusterId);
  const event = recordEvent(
    "CHARGE_TARGET_CHANGED",
    `Charging target switched to ${target.name}`,
    "info",
    { clusterId, previousClusterId, requestedBy }
  );
  const ok: ChargeTargetSuccessResponse = {
    success: true,
    message: `Charging target switched to ${target.name}`,
    activeChargingClusterId: clusterId,
    event,
  };
  return res.json(ok);
});

/**
 * POST /api/control/mode
 * Body: { "mode": "auto" | "manual" }
 */
controlRouter.post("/api/control/mode", (req, res) => {
  const mode = (req.body?.mode ?? "") as OperatingMode;
  if (mode !== "auto" && mode !== "manual") {
    return res
      .status(400)
      .json({ success: false, message: "Mode must be 'auto' or 'manual'." });
  }
  const previous = store.state.operatingMode;
  store.state.operatingMode = mode;
  const event = recordEvent(
    "MODE_CHANGED",
    `Operating mode changed to ${mode}.`,
    "info",
    { previous, next: mode }
  );
  return res.json({ success: true, mode, event });
});
