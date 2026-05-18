import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BatteryCluster } from "../types/system";
import { colors, radii, spacing } from "../theme/colors";
import {
  batteryStatusColor,
  fmtCurrent,
  fmtPct,
  fmtTemp,
  fmtVoltage,
} from "../utils/formatting";
import { StatusBadge } from "./StatusBadge";

interface Props {
  battery: BatteryCluster;
  recommended?: boolean;
  onPressCharge?: (battery: BatteryCluster) => void;
  // When true, the action button is disabled (battery already charging,
  // or eligibility check failed). The reason is shown subtly.
  disableReason?: string | null;
}

export function BatteryCard({
  battery,
  recommended,
  onPressCharge,
  disableReason,
}: Props) {
  const statusColor = batteryStatusColor(battery.status);
  const isCharging = battery.isCurrentlyCharging;

  return (
    <View
      style={[
        styles.card,
        isCharging && {
          borderColor: colors.charging,
          shadowColor: colors.charging,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{battery.name}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={battery.status} color={statusColor} filled={isCharging} />
            {recommended ? (
              <StatusBadge label="recommended" color={colors.blue} />
            ) : null}
          </View>
        </View>
        <View style={styles.socWrap}>
          <Text style={[styles.socValue, { color: statusColor }]}>
            {fmtPct(battery.stateOfChargePercent)}
          </Text>
          <Text style={styles.socLabel}>SOC</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <Stat label="Voltage" value={fmtVoltage(battery.voltage)} />
        <Stat label="Current" value={fmtCurrent(battery.current)} />
        <Stat label="Temp" value={fmtTemp(battery.temperatureC)} />
      </View>

      <View style={styles.gridRow}>
        <Stat label="Capacity" value={`${battery.capacityKWh} kWh`} />
        <Stat label="Health" value={fmtPct(battery.healthPercent)} />
        <Stat
          label="Charging"
          value={isCharging ? "YES" : "NO"}
          accent={isCharging ? colors.charging : colors.textSecondary}
        />
      </View>

      {onPressCharge ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={!!disableReason}
          onPress={() => onPressCharge(battery)}
          style={[
            styles.button,
            isCharging && styles.buttonActive,
            disableReason && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              disableReason && { color: colors.textMuted },
            ]}
          >
            {isCharging ? "CURRENTLY CHARGING" : "CHARGE THIS CLUSTER"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {disableReason && !isCharging ? (
        <Text style={styles.disableReason}>{disableReason}</Text>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  socWrap: {
    alignItems: "flex-end",
    marginLeft: spacing.md,
  },
  socValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  socLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.greenDim,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: colors.charging,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontSize: 13,
  },
  disableReason: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
