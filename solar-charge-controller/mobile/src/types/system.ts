// Mirror of server/src/types/system.ts. Keep in sync when the API
// contract changes — these are the wire types between mobile and
// gateway.

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
  deviceConnected?: boolean;
  recommendedClusterId?: string | null;
}

export type EventSeverity = "info" | "warning" | "error";

export interface SystemEvent {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  severity: EventSeverity;
  metadata?: Record<string, unknown>;
}

export type SafetyReasonCode =
  | "CLUSTER_NOT_FOUND"
  | "CLUSTER_FAULT_OR_OFFLINE"
  | "BATTERY_TEMP_HIGH"
  | "BATTERY_SOC_HIGH"
  | "BATTERY_HEALTH_LOW"
  | "SYSTEM_FAULT"
  | "SOLAR_POWER_LOW"
  | "ALREADY_CHARGING";

export interface ChargeTargetSuccess {
  success: true;
  message: string;
  activeChargingClusterId: string;
  event: SystemEvent;
}

export interface ChargeTargetFailure {
  success: false;
  message: string;
  reasonCode: SafetyReasonCode;
}

export type ChargeTargetResponse = ChargeTargetSuccess | ChargeTargetFailure;
