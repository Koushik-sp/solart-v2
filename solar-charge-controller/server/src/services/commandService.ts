import { DeviceCommand } from "../types/system";
import { store } from "../data/mockSystem";

function nextCommandId(): string {
  return `cmd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Enqueue a charge-target command for a device. The firmware polls
 * /api/device/command and pulls these off one at a time. We keep the
 * queue per-device because a future product could have multiple
 * controllers.
 */
export function enqueueChargeTargetCommand(
  deviceId: string,
  clusterId: string
): DeviceCommand {
  const command: DeviceCommand = {
    commandId: nextCommandId(),
    type: "SET_CHARGE_TARGET",
    clusterId,
    createdAt: Date.now(),
    status: "pending",
  };
  const queue = store.pendingCommands.get(deviceId) ?? [];
  queue.push(command);
  store.pendingCommands.set(deviceId, queue);
  return command;
}

/**
 * Return the oldest pending command for a device. Marks it as
 * "delivered" so a poll loop doesn't re-deliver the same command.
 */
export function takeNextCommand(deviceId: string): DeviceCommand | null {
  const queue = store.pendingCommands.get(deviceId);
  if (!queue || queue.length === 0) return null;
  const cmd = queue[0];
  // Move from "pending" -> "delivered". The command stays at the head of
  // the queue until the firmware reports a result, so a flaky network
  // can't lose it. The firmware is idempotent on result reporting.
  cmd.status = "delivered";
  return cmd;
}

/**
 * Mark a command as completed (accepted or rejected) and remove it from
 * the queue. Called when the firmware POSTs to
 * /api/device/command-result.
 */
export function completeCommand(
  deviceId: string,
  commandId: string,
  accepted: boolean
): DeviceCommand | null {
  const queue = store.pendingCommands.get(deviceId);
  if (!queue) return null;
  const idx = queue.findIndex((c) => c.commandId === commandId);
  if (idx < 0) return null;
  const cmd = queue[idx];
  cmd.status = accepted ? "accepted" : "rejected";
  queue.splice(idx, 1);
  return cmd;
}

export function findPendingCommand(
  deviceId: string,
  commandId: string
): DeviceCommand | null {
  const queue = store.pendingCommands.get(deviceId);
  if (!queue) return null;
  return queue.find((c) => c.commandId === commandId) ?? null;
}
