import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SolarPanel } from "../types/system";
import { colors, radii, spacing } from "../theme/colors";
import {
  fmtCurrent,
  fmtTemp,
  fmtVoltage,
  fmtWatts,
  panelStatusColor,
} from "../utils/formatting";
import { StatusBadge } from "./StatusBadge";

interface Props {
  panel: SolarPanel;
}

export function PanelCard({ panel }: Props) {
  const color = panelStatusColor(panel.status);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{panel.name}</Text>
        <StatusBadge label={panel.status} color={color} />
      </View>
      <Text style={[styles.power, { color }]}>{fmtWatts(panel.powerWatts)}</Text>
      <View style={styles.row}>
        <Stat label="V" value={fmtVoltage(panel.voltage)} />
        <Stat label="A" value={fmtCurrent(panel.current)} />
        <Stat label="Temp" value={fmtTemp(panel.temperatureC)} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  power: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
});
