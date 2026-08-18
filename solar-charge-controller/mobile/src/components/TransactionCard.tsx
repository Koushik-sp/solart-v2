import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CreditTransaction } from "../types/finance";
import { colors, radii, spacing } from "../theme/colors";
import {
  fmtTime,
  formatCredits,
  formatSignedUSD,
  formatUSD,
} from "../utils/formatting";

interface Props {
  transaction: CreditTransaction;
}

/**
 * Renders one row of the user's simulated transaction history.
 *
 * - Energy sale rewards show positive credits + USD earned.
 * - Share purchases show the shares added, a negative simulated USD
 *   cost, and 0 credits.
 */
export function TransactionCard({ transaction }: Props) {
  const isShares = transaction.type === "SHARE_PURCHASE";
  const date = new Date(transaction.timestamp);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.meta}>
          {date.toLocaleDateString()} · {fmtTime(transaction.timestamp)}
        </Text>
      </View>
      <View style={styles.right}>
        {isShares ? (
          <>
            <Text style={styles.shares}>
              +{transaction.sharesChanged ?? 0} shares
            </Text>
            <Text style={styles.cost}>
              {formatSignedUSD(transaction.usdValue)} · 0 credits
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.credits}>
              +{formatCredits(transaction.credits)}
            </Text>
            <Text style={styles.usd}>{formatUSD(transaction.usdValue)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  left: {
    flex: 1,
  },
  description: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  credits: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: "800",
  },
  usd: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  shares: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "800",
  },
  cost: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
