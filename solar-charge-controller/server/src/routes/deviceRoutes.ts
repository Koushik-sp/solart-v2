import { Router } from "express";
import { store } from "../data/mockSystem";
import { recordEvent } from "../services/eventService";
import {
  completeCommand,
  takeNextCommand,
} from "../services/commandService";
import { applyChargeTargetSwitch } from "../services/simulationService";
import {
  DeviceCommandResult,
  DeviceTelemetryPayload,
} from "../types/system";

export const deviceRouter = Router();

/**
 * POST /api/device/telemetry
 * Firmware reports the latest sensor snapshot. The backend uses this
 * payload as the new system state and stops running its internal
 * simulation tick (see `isDeviceConnected`).
 */
deviceRouter.post("/api/device/telemetry", (req, res) => {
  const payload = req.body as Partial<DeviceTelemetryPayload>;
  if (!payload?.deviceId || typeof payload.deviceId !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Missing deviceId." });
  }
  if (!Array.isArray(payload.panels) || !Array.isArray(payload.batteries)) {
    return res.status(400).json({
      success: false,
      message: "Missing panels or batteries in telemetry.",
    });
  }

  store.lastDeviceTelemetryAt.set(payload.deviceId, Date.now());

  const totalSolarPowerWatts = payload.panels.reduce(
    (sum, p) => sum + (p.powerWatts ?? 0),
    0
  );
  const totalBatteryCapacityKWh = payload.batteries.reduce(
    (sum, b) => sum + (b.capacityKWh ?? 0),
    0
  );

  store.state = {
    ...store.state,
    panels: payload.panels,
    batteries: payload.batteries,
    activeChargingClusterId: payload.activeChargingClusterId ?? null,
    systemStatus: payload.systemStatus ?? store.state.systemStatus,
    totalSolarPowerWatts,
    totalBatteryCapacityKWh,
    timestamp: Date.now(),
  };

  // Lightweight log so the user can see telemetry arriving. We only log
  // every 30s of telemetry to keep the events feed readable.
  const lastTelemetryEvent = store.events.find((e) => e.type === "DEVICE_TELEMETRY");
  if (!lastTelemetryEvent || Date.now() - lastTelemetryEvent.timestamp > 30_000) {
    recordEvent(
      "DEVICE_TELEMETRY",
      `Telemetry received from ${payload.deviceId} (fw ${payload.firmwareVersion ?? "?"})`,
      "info",
      { deviceId: payload.deviceId }
    );
  }

  res.json({ success: true });
});

/**
 * GET /api/device/command?deviceId=...
 * Firmware polls this on a short interval. Returns at most one pending
 * command. The command stays at the head of the queue (status:
 * "delivered") until the firmware reports a result, so a network blip
 * won't lose it.
 */
deviceRouter.get("/api/device/command", (req, res) => {
  const deviceId = String(req.query.deviceId ?? "");
  if (!deviceId) {
    return res
      .status(400)
      .json({ hasCommand: false, message: "Missing deviceId." });
  }
  const cmd = takeNextCommand(deviceId);
  if (!cmd) {
    return res.json({ hasCommand: false });
  }
  return res.json({
    hasCommand: true,
    commandId: cmd.commandId,
    type: cmd.type,
    clusterId: cmd.clusterId,
  });
});

/**
 * POST /api/device/command-result
 * Firmware reports the outcome of a command. We update state and event
 * log accordingly.
 */
deviceRouter.post("/api/device/command-result", (req, res) => {
  const result = req.body as Partial<DeviceCommandResult>;
  if (!result?.deviceId || !result?.commandId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing deviceId or commandId." });
  }
  const cmd = completeCommand(result.deviceId, result.commandId, !!result.accepted);
  if (!cmd) {
    return res.status(404).json({
      success: false,
      message: "Command not found or already resolved.",
    });
  }

  if (result.accepted) {
    // Reflect device-applied state in our snapshot. If the device is
    // actively reporting telemetry, the next telemetry tick will
    // overwrite this — that's fine.
    if (result.activeChargingClusterId) {
      applyChargeTargetSwitch(result.activeChargingClusterId);
    } else {
      applyChargeTargetSwitch(cmd.clusterId);
    }
    recordEvent(
      "DEVICE_COMMAND_RESULT",
      result.message ?? `Device accepted SET_CHARGE_TARGET ${cmd.clusterId}.`,
      "info",
      {
        deviceId: result.deviceId,
        commandId: result.commandId,
        clusterId: cmd.clusterId,
      }
    );
  } else {
    recordEvent(
      "DEVICE_COMMAND_RESULT",
      result.message ?? `Device rejected command.`,
      "warning",
      {
        deviceId: result.deviceId,
        commandId: result.commandId,
        clusterId: cmd.clusterId,
        reasonCode: result.reasonCode,
      }
    );
  }

  res.json({ success: true });
});
