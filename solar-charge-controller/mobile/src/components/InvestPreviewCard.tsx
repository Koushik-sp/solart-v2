import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/colors";
import {
  formatCredits,
  formatPercent,
  formatUSD,
} from "../utils/formatting";

interface Props {
  // Number of shares the user intends to buy (0 when input is empty or
  // invalid — the card then renders the "before" values only).
  sharesToBuy: number;
  sharePriceUSD: number;
  currentShares: number;
  totalProjectShares: number;
  // Used to preview the user's future reward share.
  userRewardPoolUSD: number;
  creditConversionRateUSD: number;
}

/**
 * Live preview of a simulated share purchase: how the cost, ownership,
 * and estimated reward change. All numbers are simulated MVP values.
 */
export function InvestPreviewCard({
  sharesToBuy,
  sharePriceUSD,
  currentShares,
  totalProjectShares,
  userRewardPoolUSD,
  creditConversionRateUSD,
}: Props) {
  const safeShares = Number.isFinite(sharesToBuy) && sharesToBuy > 0
    ? Math.floor(sharesToBuy)
    : 0;

  const investmentAmountUSD = safeShares * sharePriceUSD;
  const newShares = currentShares + safeShares;

  const currentFraction =
    totalProjectShares > 0 ? currentShares / totalProjectShares : 0;
  const newFraction =
    totalProjectShares > 0 ? newShares / totalProjectShares : 0;

  const currentEarningsUSD = userRewardPoolUSD * currentFraction;
  const newEarningsUSD = userRewardPoolUSD * newFraction;
  const currentCredits = currentEarningsUSD / creditConversionRateUSD;
  const newCredits = newEarningsUSD / creditConversionRateUSD;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Investment Preview</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Shares to buy</Text>
        <Text style={styles.value}>{safeShares}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Simulated cost</Text>
        <Text style={[styles.value, { color: colors.green }]}>
          {formatUSD(investmentAmountUSD)}
        </Text>
      </View>

      <BeforeAfterRow
        label="Owned shares"
        before={String(currentShares)}
        after={String(newShares)}
      />
      <BeforeAfterRow
        label="Ownership"
        before={formatPercent(currentFraction * 100)}
        after={formatPercent(newFraction * 100)}
        afterColor={colors.blue}
      />
      <BeforeAfterRow
        label="Est. future reward"
        before={formatCredits(currentCredits)}
        after={formatCredits(newCredits)}
        afterColor={colors.yellow}
      />
      <BeforeAfterRow
        label="Est. USD value"
        before={formatUSD(currentEarningsUSD)}
        after={formatUSD(newEarningsUSD)}
        afterColor={colors.green}
      />
    </View>
  );
}

function BeforeAfterRow({
  label,
  before,
  after,
  afterColor,
}: {
  label: string;
  before: string;
  after: string;
  afterColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.beforeAfter}>
        <Text style={styles.before}>{before}</Text>
        <Text style={styles.arrow}> → </Text>
        <Text style={[styles.after, afterColor ? { color: afterColor } : null]}>
          {after}
        </Text>
      </View>
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
  title: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  } as const,
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    flexShrink: 1,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  beforeAfter: {
    flexDirection: "row",
    alignItems: "center",
  },
  before: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  after: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
});
