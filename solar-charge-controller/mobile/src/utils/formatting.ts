import { BatteryStatus, PanelStatus } from "../types/system";
import { colors } from "../theme/colors";

export function fmtNumber(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtWatts(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(2)} kW`;
  return `${Math.round(n)} W`;
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

export function fmtVoltage(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(1)} V`;
}

export function fmtCurrent(a: number): string {
  if (!Number.isFinite(a)) return "—";
  return `${a.toFixed(1)} A`;
}

export function fmtTemp(t: number): string {
  if (!Number.isFinite(t)) return "—";
  return `${t.toFixed(1)}°C`;
}

export function fmtTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export function batteryStatusColor(status: BatteryStatus): string {
  switch (status) {
    case "charging":
      return colors.charging;
    case "full":
      return colors.full;
    case "fault":
      return colors.fault;
    case "offline":
      return colors.textMuted;
    case "discharging":
      return colors.warning;
    case "idle":
    default:
      return colors.idle;
  }
}

export function panelStatusColor(status: PanelStatus): string {
  switch (status) {
    case "online":
      return colors.charging;
    case "low_light":
      return colors.warning;
    case "fault":
      return colors.fault;
    case "offline":
    default:
      return colors.textMuted;
  }
}

export function severityColor(s: "info" | "warning" | "error"): string {
  switch (s) {
    case "warning":
      return colors.warning;
    case "error":
      return colors.fault;
    case "info":
    default:
      return colors.blue;
  }
}
