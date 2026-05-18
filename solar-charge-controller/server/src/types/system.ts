// Shared types used across the mock gateway. The mobile app and firmware
// produce/consume these same shapes — keep changes here in sync with
// mobile/src/types/system.ts and the firmware payloads.

export type PanelStatus = "online" | "offline" | "low_light" | "fault";

export interface SolarPanel {
  panelId: string;
  name: string;
  voltage: number;
  current: number;
  powerWatts: number;
  status: PanelStatus;
  temperatureC: number;
}

export type BatteryStatus =
  | "idle"
  | "charging"
  | "discharging"
  | "full"
  | "fault"
  | "offline";

export interface BatteryCluster {
  clusterId: string;
  name: string;
  stateOfChargePercent: number;
  voltage: number;
  current: number;
  capacityKWh: number;
  temperatureC: number;
  status: BatteryStatus;
  isCurrentlyCharging: boolean;
  healthPercent: number;
  lastUpdated: number;
}

export type OperatingMode = "auto" | "manual";
export type SystemStatus = "normal" | "warning" | "fault";

export interface SystemState {
  panels: SolarPanel[];
  batteries: BatteryCluster[];
  totalSolarPowerWatts: number;
  totalBatteryCapacityKWh: number;
  activeChargingClusterId: string | null;
  operatingMode: OperatingMode;
  gridConnected: boolean;
  systemStatus: SystemStatus;
  timestamp: number;
}

export type EventSeverity = "info" | "warning" | "error";

export type EventType =
  | "CHARGE_TARGET_CHANGED"
  | "CHARGE_TARGET_REJECTED"
  | "MODE_CHANGED"
  | "FAULT_SIMULATED"
  | "FAULT_CLEARED"
  | "SIMULATION_RESET"
  | "DEVICE_TELEMETRY"
  | "DEVICE_COMMAND_PENDING"
  | "DEVICE_COMMAND_RESULT";

export interface SystemEvent {
  id: string;
  timestamp: number;
  type: EventType;
  message: string;
  severity: EventSeverity;
  metadata?: Record<string, unknown>;
}

// Reason codes returned to the mobile app when a switch is rejected.
// Keep this list in sync with the firmware SafetyManager.
export type SafetyReasonCode =
  | "CLUSTER_NOT_FOUND"
  | "CLUSTER_FAULT_OR_OFFLINE"
  | "BATTERY_TEMP_HIGH"
  | "BATTERY_SOC_HIGH"
  | "BATTERY_HEALTH_LOW"
  | "SYSTEM_FAULT"
  | "SOLAR_POWER_LOW"
  | "ALREADY_CHARGING";

export interface SafetyDecision {
  ok: boolean;
  reasonCode?: SafetyReasonCode;
  message?: string;
}

// Device-layer types (firmware <-> backend).

export interface DeviceTelemetryPayload {
  deviceId: string;
  timestamp: number;
  panels: SolarPanel[];
  batteries: BatteryCluster[];
  activeChargingClusterId: string | null;
  systemStatus: SystemStatus;
  firmwareVersion: string;
}

export type DeviceCommandType = "SET_CHARGE_TARGET";

export interface DeviceCommand {
  commandId: string;
  type: DeviceCommandType;
  clusterId: string;
  createdAt: number;
  status: "pending" | "delivered" | "accepted" | "rejected";
}

export interface DeviceCommandResult {
  deviceId: string;
  commandId: string;
  accepted: boolean;
  message: string;
  reasonCode?: SafetyReasonCode;
  activeChargingClusterId?: string | null;
}

export interface ChargeTargetRequest {
  clusterId: string;
  requestedBy: string;
}

export interface ChargeTargetSuccessResponse {
  success: true;
  message: string;
  activeChargingClusterId: string;
  event: SystemEvent;
}

export interface ChargeTargetFailureResponse {
  success: false;
  message: string;
  reasonCode: SafetyReasonCode;
}

export type ChargeTargetResponse =
  | ChargeTargetSuccessResponse
  | ChargeTargetFailureResponse;
