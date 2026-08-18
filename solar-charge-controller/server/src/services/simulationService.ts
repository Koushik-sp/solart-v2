import {
  BatteryCluster,
  SolarPanel,
  SystemState,
} from "../types/system";
import { isDeviceConnected, store, createInitialState } from "../data/mockSystem";
import { financeStore, createInitialFinanceParams } from "../data/mockFinance";
import {
  transactionStore,
  createInitialTransactions,
} from "../data/mockTransactions";
import { resetDemoAccounts } from "../data/mockUsers";

// ---------------------------------------------------------------------------
// SIMULATION
// ---------------------------------------------------------------------------
// This module runs only when there is no live device telemetry. When a
// real ESP32 is reporting telemetry to /api/device/telemetry, the
// simulation tick becomes a no-op so the device remains the source of
// truth.
// ---------------------------------------------------------------------------

const TICK_MS = 2000;

function jitter(value: number, magnitude: number): number {
  return value + (Math.random() * 2 - 1) * magnitude;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tickPanel(panel: SolarPanel): SolarPanel {
  if (panel.status === "offline" || panel.status === "fault") {
    return { ...panel, current: 0, powerWatts: 0 };
  }
  const voltage = clamp(jitter(panel.voltage, 0.4), 30, 42);
  const baseCurrent = panel.status === "low_light" ? 2 : 7.5;
  const current = clamp(jitter(baseCurrent, 0.6), 0, 12);
  const powerWatts = clamp(voltage * current, 0, 600);
  const temperatureC = clamp(jitter(panel.temperatureC, 0.3), 15, 65);
  return { ...panel, voltage, current, powerWatts, temperatureC };
}

function tickBattery(
  battery: BatteryCluster,
  isActiveTarget: boolean,
  systemFault: boolean
): BatteryCluster {
  const now = Date.now();
  let { stateOfChargePercent, temperatureC, current, status, isCurrentlyCharging } =
    battery;

  if (status === "fault" || status === "offline") {
    return { ...battery, current: 0, isCurrentlyCharging: false, lastUpdated: now };
  }

  if (systemFault) {
    return {
      ...battery,
      status: "idle",
      current: 0,
      isCurrentlyCharging: false,
      lastUpdated: now,
    };
  }

  if (isActiveTarget) {
    // Charging: SOC slowly rises, current is positive, temp creeps up.
    const charged = stateOfChargePercent >= 100;
    if (charged) {
      stateOfChargePercent = 100;
      status = "full";
      current = 0;
      isCurrentlyCharging = false;
    } else {
      // ~0.05–0.15 % SOC per tick.
      stateOfChargePercent = clamp(
        stateOfChargePercent + 0.05 + Math.random() * 0.1,
        0,
        100
      );
      current = clamp(jitter(12, 1), 8, 16);
      temperatureC = clamp(temperatureC + 0.05 + Math.random() * 0.05, 15, 60);
      status = "charging";
      isCurrentlyCharging = true;
    }
  } else {
    // Idle: current near zero (slight self-discharge), temp drifts toward
    // ambient.
    current = clamp(jitter(0, 0.2), -0.5, 0.5);
    if (status !== "full") status = "idle";
    isCurrentlyCharging = false;
    // Tiny drift toward 25 C ambient.
    if (temperatureC > 25) temperatureC -= 0.05;
    else if (temperatureC < 25) temperatureC += 0.02;
    // Very slow self-discharge unless full.
    if (status !== "full") {
      stateOfChargePercent = clamp(stateOfChargePercent - 0.005, 0, 100);
    }
  }

  return {
    ...battery,
    stateOfChargePercent,
    temperatureC,
    current,
    status,
    isCurrentlyCharging,
    lastUpdated: now,
  };
}

export function runSimulationTick(): void {
  // If a real device is reporting telemetry, defer entirely to it.
  if (isDeviceConnected()) {
    store.state.timestamp = Date.now();
    return;
  }

  const state = store.state;
  const systemFault = state.systemStatus === "fault";

  const panels = state.panels.map(tickPanel);
  const batteries = state.batteries.map((b) =>
    tickBattery(b, b.clusterId === state.activeChargingClusterId, systemFault)
  );

  const totalSolarPowerWatts = panels.reduce((sum, p) => sum + p.powerWatts, 0);
  const totalBatteryCapacityKWh = batteries.reduce(
    (sum, b) => sum + b.capacityKWh,
    0
  );

  store.state = {
    ...state,
    panels,
    batteries,
    totalSolarPowerWatts,
    totalBatteryCapacityKWh,
    timestamp: Date.now(),
  };
}

let timer: NodeJS.Timeout | null = null;

export function startSimulation(): void {
  if (timer) return;
  timer = setInterval(runSimulationTick, TICK_MS);
}

export function stopSimulation(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export function resetSimulation(): SystemState {
  store.state = createInitialState();
  store.lastDeviceTelemetryAt.clear();
  store.pendingCommands.clear();
  // Also restore the simulated project finance, transaction history,
  // and demo account share holdings so a demo reset returns the
  // credits/earnings/ownership numbers to their seed values too.
  financeStore.params = createInitialFinanceParams();
  transactionStore.transactions = createInitialTransactions();
  resetDemoAccounts();
  return store.state;
}

/**
 * Apply an accepted charge-target switch to in-memory state. Mutates the
 * store: sets `activeChargingClusterId`, marks the new cluster as
 * charging, marks all others as idle (preserving fault/offline/full).
 */
export function applyChargeTargetSwitch(targetClusterId: string): void {
  const state = store.state;
  const batteries = state.batteries.map<BatteryCluster>((b) => {
    if (b.clusterId === targetClusterId) {
      return {
        ...b,
        status: "charging",
        isCurrentlyCharging: true,
        lastUpdated: Date.now(),
      };
    }
    // Don't override terminal/exception states.
    if (b.status === "fault" || b.status === "offline" || b.status === "full") {
      return { ...b, isCurrentlyCharging: false };
    }
    return {
      ...b,
      status: "idle",
      isCurrentlyCharging: false,
      current: 0,
      lastUpdated: Date.now(),
    };
  });
  store.state = {
    ...state,
    batteries,
    activeChargingClusterId: targetClusterId,
    timestamp: Date.now(),
  };
}
