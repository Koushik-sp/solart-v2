import {
  BatteryCluster,
  SolarPanel,
  SystemEvent,
  SystemState,
  DeviceCommand,
} from "../types/system";

// Initial seed values. The simulation service mutates copies of these
// values in place, so we expose factory functions to reset cleanly.

export function createInitialPanels(): SolarPanel[] {
  return [
    {
      panelId: "panel-1",
      name: "Panel 1",
      voltage: 38.4,
      current: 7.3,
      powerWatts: 280,
      status: "online",
      temperatureC: 32,
    },
    {
      panelId: "panel-2",
      name: "Panel 2",
      voltage: 38.6,
      current: 8.0,
      powerWatts: 310,
      status: "online",
      temperatureC: 33,
    },
    {
      panelId: "panel-3",
      name: "Panel 3",
      voltage: 38.1,
      current: 6.6,
      powerWatts: 250,
      status: "online",
      temperatureC: 31,
    },
    {
      panelId: "panel-4",
      name: "Panel 4",
      voltage: 38.5,
      current: 7.5,
      powerWatts: 290,
      status: "online",
      temperatureC: 32,
    },
  ];
}

export function createInitialBatteries(): BatteryCluster[] {
  const now = Date.now();
  return [
    {
      clusterId: "battery-1",
      name: "Battery Cluster 1",
      stateOfChargePercent: 72,
      voltage: 48.2,
      current: 12.0,
      capacityKWh: 10,
      temperatureC: 28,
      status: "charging",
      isCurrentlyCharging: true,
      healthPercent: 96,
      lastUpdated: now,
    },
    {
      clusterId: "battery-2",
      name: "Battery Cluster 2",
      stateOfChargePercent: 41,
      voltage: 47.8,
      current: 0,
      capacityKWh: 10,
      temperatureC: 27,
      status: "idle",
      isCurrentlyCharging: false,
      healthPercent: 94,
      lastUpdated: now,
    },
    {
      clusterId: "battery-3",
      name: "Battery Cluster 3",
      stateOfChargePercent: 88,
      voltage: 49.1,
      current: 0,
      capacityKWh: 8,
      temperatureC: 29,
      status: "idle",
      isCurrentlyCharging: false,
      healthPercent: 92,
      lastUpdated: now,
    },
    {
      clusterId: "battery-4",
      name: "Battery Cluster 4",
      stateOfChargePercent: 25,
      voltage: 47.1,
      current: 0,
      capacityKWh: 12,
      temperatureC: 26,
      status: "idle",
      isCurrentlyCharging: false,
      healthPercent: 95,
      lastUpdated: now,
    },
  ];
}

export function createInitialState(): SystemState {
  const panels = createInitialPanels();
  const batteries = createInitialBatteries();
  return {
    panels,
    batteries,
    totalSolarPowerWatts: panels.reduce((sum, p) => sum + p.powerWatts, 0),
    totalBatteryCapacityKWh: batteries.reduce((sum, b) => sum + b.capacityKWh, 0),
    activeChargingClusterId: "battery-1",
    operatingMode: "auto",
    gridConnected: true,
    systemStatus: "normal",
    timestamp: Date.now(),
  };
}

// In-memory store. This is intentionally a simple module-level mutable
// container — production would back this by a persistent store and a
// real device session registry.
export const store = {
  state: createInitialState(),
  events: [] as SystemEvent[],
  // Pending commands keyed by device ID. The firmware polls these and
  // reports back via /api/device/command-result.
  pendingCommands: new Map<string, DeviceCommand[]>(),
  // Tracks the most recent telemetry timestamp per device so we can
  // decide whether the backend is in "device-connected" or "simulation"
  // mode at any moment.
  lastDeviceTelemetryAt: new Map<string, number>(),
};

// Window during which a device is considered "connected" — if the
// firmware misses telemetry for longer than this, the backend falls
// back to running its own simulation loop.
export const DEVICE_TELEMETRY_FRESHNESS_MS = 6000;

export function isDeviceConnected(now: number = Date.now()): boolean {
  for (const ts of store.lastDeviceTelemetryAt.values()) {
    if (now - ts < DEVICE_TELEMETRY_FRESHNESS_MS) return true;
  }
  return false;
}
