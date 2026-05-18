import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BatteryCluster, OperatingMode } from "../types/system";
import { colors, radii, spacing } from "../theme/colors";
import {
  batteryStatusColor,
  fmtPct,
  fmtTemp,
} from "../utils/formatting";
import { StatusBadge } from "./StatusBadge";

interface Props {
  visible: boolean;
  current: BatteryCluster | null;
  next: BatteryCluster | null;
  operatingMode: OperatingMode;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmSwitchModal({
  visible,
  current,
  next,
  operatingMode,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Switch Charging Target</Text>
          <Text style={styles.subtitle}>
            Switch charging from{" "}
            <Text style={styles.bold}>{current?.name ?? "—"}</Text> to{" "}
            <Text style={styles.bold}>{next?.name ?? "—"}</Text>?
          </Text>

          {operatingMode === "auto" ? (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                System is in AUTO mode. Confirming will switch the system to
                MANUAL mode.
              </Text>
            </View>
          ) : null}

          <View style={styles.safetyBox}>
            <Text style={styles.safetyHeader}>Safety check</Text>
            <SafetyRow label="State of charge" value={fmtPct(next?.stateOfChargePercent ?? 0)} />
            <SafetyRow label="Temperature" value={fmtTemp(next?.temperatureC ?? 0)} />
            <SafetyRow label="Health" value={fmtPct(next?.healthPercent ?? 0)} />
            <View style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>Status</Text>
              {next ? (
                <StatusBadge
                  label={next.status}
                  color={batteryStatusColor(next.status)}
                />
              ) : (
                <Text style={styles.safetyValue}>—</Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onCancel}
              disabled={busy}
              style={[styles.button, styles.cancel]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={busy}
              style={[styles.button, styles.confirm, busy && { opacity: 0.6 }]}
            >
              <Text style={styles.confirmText}>
                {busy ? "Switching..." : "Confirm Switch"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SafetyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.safetyRow}>
      <Text style={styles.safetyLabel}>{label}</Text>
      <Text style={styles.safetyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bold: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  warning: {
    backgroundColor: "#3B2A0E",
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "600",
  },
  safetyBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  safetyHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  safetyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  safetyLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  safetyValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: colors.surfaceAlt,
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  confirm: {
    backgroundColor: colors.charging,
  },
  confirmText: {
    color: colors.background,
    fontWeight: "800",
  },
});
