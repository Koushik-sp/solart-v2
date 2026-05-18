import {
  BatteryCluster,
  SafetyDecision,
  SystemState,
} from "../types/system";

// ---------------------------------------------------------------------------
// SAFETY THRESHOLDS
// ---------------------------------------------------------------------------
// These mirror the firmware SafetyManager. Any change here MUST be applied
// in firmware/src/SafetyManager.cpp as well — the system relies on
// defense-in-depth between gateway and device.
// ---------------------------------------------------------------------------
export const SAFETY = {
  MAX_BATTERY_TEMP_C: 45,
  MAX_BATTERY_SOC_PCT: 95,
  MIN_BATTERY_HEALTH_PCT: 60,
  MIN_SOLAR_POWER_W: 100,
} as const;

/**
 * validateChargeTargetSwitch
 *
 * Pure function: given a system snapshot and the requested target cluster,
 * decide whether switching the active charging cluster is safe.
 *
 * The order of checks matters for UX — we surface the most actionable
 * reason first (existence, then explicit fault states, then operational
 * thresholds, then "already charging" which is essentially a no-op).
 */
export function validateChargeTargetSwitch(
  state: SystemState,
  targetClusterId: string
): SafetyDecision {
  const target: BatteryCluster | undefined = state.batteries.find(
    (b) => b.clusterId === targetClusterId
  );

  if (!target) {
    return {
      ok: false,
      reasonCode: "CLUSTER_NOT_FOUND",
      message: `Cannot switch charging target: cluster '${targetClusterId}' not found.`,
    };
  }

  if (state.systemStatus === "fault") {
    return {
      ok: false,
      reasonCode: "SYSTEM_FAULT",
      message:
        "Cannot switch charging target: system is in a fault state. Clear the fault first.",
    };
  }

  if (target.status === "fault" || target.status === "offline") {
    return {
      ok: false,
      reasonCode: "CLUSTER_FAULT_OR_OFFLINE",
      message: `Cannot switch charging target: ${target.name} is ${target.status}.`,
    };
  }

  if (target.temperatureC > SAFETY.MAX_BATTERY_TEMP_C) {
    return {
      ok: false,
      reasonCode: "BATTERY_TEMP_HIGH",
      message: `Cannot switch charging target: ${target.name} temperature is too high (${target.temperatureC.toFixed(
        1
      )}°C > ${SAFETY.MAX_BATTERY_TEMP_C}°C).`,
    };
  }

  if (target.stateOfChargePercent >= SAFETY.MAX_BATTERY_SOC_PCT) {
    return {
      ok: false,
      reasonCode: "BATTERY_SOC_HIGH",
      message: `Cannot switch charging target: ${target.name} is already near full (${target.stateOfChargePercent.toFixed(
        0
      )}% ≥ ${SAFETY.MAX_BATTERY_SOC_PCT}%).`,
    };
  }

  if (target.healthPercent < SAFETY.MIN_BATTERY_HEALTH_PCT) {
    return {
      ok: false,
      reasonCode: "BATTERY_HEALTH_LOW",
      message: `Cannot switch charging target: ${target.name} health is too low (${target.healthPercent.toFixed(
        0
      )}% < ${SAFETY.MIN_BATTERY_HEALTH_PCT}%).`,
    };
  }

  if (state.totalSolarPowerWatts < SAFETY.MIN_SOLAR_POWER_W) {
    return {
      ok: false,
      reasonCode: "SOLAR_POWER_LOW",
      message: `Cannot switch charging target: solar production is too low (${state.totalSolarPowerWatts.toFixed(
        0
      )} W < ${SAFETY.MIN_SOLAR_POWER_W} W).`,
    };
  }

  if (target.isCurrentlyCharging || state.activeChargingClusterId === targetClusterId) {
    return {
      ok: false,
      reasonCode: "ALREADY_CHARGING",
      message: `${target.name} is already the active charging cluster.`,
    };
  }

  return { ok: true };
}

/**
 * recommendCluster
 *
 * Picks the "best" cluster to charge next based on:
 *   - lowest SOC
 *   - healthy status (not fault/offline)
 *   - temperature under 40 C
 *   - not full
 *   - good health (>= MIN_BATTERY_HEALTH_PCT)
 *
 * Returns the cluster ID or null if nothing qualifies. The mobile UI uses
 * this to render a "Recommended" badge — the user is still free to pick
 * any cluster that passes the safety validation above.
 */
export function recommendCluster(state: SystemState): string | null {
  const candidates = state.batteries.filter(
    (b) =>
      b.status !== "fault" &&
      b.status !== "offline" &&
      b.status !== "full" &&
      b.temperatureC < 40 &&
      b.stateOfChargePercent < SAFETY.MAX_BATTERY_SOC_PCT &&
      b.healthPercent >= SAFETY.MIN_BATTERY_HEALTH_PCT
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.stateOfChargePercent - b.stateOfChargePercent);
  return candidates[0].clusterId;
}
