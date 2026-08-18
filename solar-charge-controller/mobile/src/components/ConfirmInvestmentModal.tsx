import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radii, spacing } from "../theme/colors";
import { formatPercent, formatUSD } from "../utils/formatting";

interface Props {
  visible: boolean;
  sharesToBuy: number;
  investmentAmountUSD: number;
  currentShares: number;
  newShares: number;
  currentOwnershipPercent: number;
  newOwnershipPercent: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation modal for a simulated share purchase. Spells out exactly
 * what changes and makes clear that no real money is charged.
 */
export function ConfirmInvestmentModal({
  visible,
  sharesToBuy,
  investmentAmountUSD,
  currentShares,
  newShares,
  currentOwnershipPercent,
  newOwnershipPercent,
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
          <Text style={styles.title}>Confirm Simulated Investment</Text>
          <Text style={styles.body}>
            You are about to buy{" "}
            <Text style={styles.bold}>{sharesToBuy}</Text> project share
            {sharesToBuy === 1 ? "" : "s"} for a simulated amount of{" "}
            <Text style={styles.bold}>{formatUSD(investmentAmountUSD)}</Text>.
            This is not a real purchase and no money will be charged.
          </Text>

          <View style={styles.box}>
            <DetailRow label="Shares to buy" value={String(sharesToBuy)} />
            <DetailRow
              label="Simulated cost"
              value={formatUSD(investmentAmountUSD)}
            />
            <DetailRow
              label="Owned shares"
              value={`${currentShares} → ${newShares}`}
            />
            <DetailRow
              label="Ownership"
              value={`${formatPercent(
                currentOwnershipPercent
              )} → ${formatPercent(newOwnershipPercent)}`}
            />
          </View>

          <Text style={styles.disclaimer}>
            This is a simulated MVP investment flow. No real money is charged.
            Project shares and Project Credits are demo-only and do not
            represent real securities, equity, cryptocurrency, or withdrawable
            funds.
          </Text>

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
                {busy ? "Processing..." : "Confirm Simulated Purchase"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bold: {
    color: colors.textPrimary,
    fontWeight: "800",
  },
  box: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.lg,
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
    fontSize: 13,
  },
});
