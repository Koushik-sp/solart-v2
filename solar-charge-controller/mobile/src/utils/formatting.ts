import { BatteryStatus, PanelStatus } from "../types/system";
import { colors } from "../theme/colors";

export function fmtNumber(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

// ---------------------------------------------------------------------------
// Display formatters
// ---------------------------------------------------------------------------
// Group a number's integer part with thousands separators. Written by
// hand instead of toLocaleString so the output is identical across the
// JS engines Expo can run on.
function withThousands(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  const fixed = value.toFixed(fractionDigits);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${grouped}.${decPart}` : grouped;
}

// "$22.41" — USD, always 2 decimals.
export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `$${withThousands(value, 2)}`;
}

// Signed USD with the sign outside the $: "-$50.00", "$0.00", "$4.50".
// Used for transaction amounts where a share purchase is a negative cost.
export function formatSignedUSD(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 0) return `-${formatUSD(Math.abs(value))}`;
  return formatUSD(value);
}

// "2,241 Project Credits" — whole credits, with the credit name.
export function formatCredits(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${withThousands(Math.round(value))} Project Credits`;
}

// "10%" — drops trailing zeros (10, not 10.00; 12.5 stays 12.5).
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Number(value.toFixed(2))}%`;
}

// "12,450 kWh"
export function formatKWh(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${withThousands(Math.round(value))} kWh`;
}

// "1,130 W" — always watts, with thousands grouping.
export function formatWatts(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${withThousands(Math.round(value))} W`;
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
