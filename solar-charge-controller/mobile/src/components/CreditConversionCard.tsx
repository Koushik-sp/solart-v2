import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/colors";
import { formatCredits, formatUSD } from "../utils/formatting";

interface Props {
  // USD value of one Project Credit (e.g. 0.01).
  conversionRateUSD: number;
}

/**
 * Small reference card that spells out the Project Credit -> USD
 * conversion. Project Credits are a simulated MVP unit only.
 */
export function CreditConversionCard({ conversionRateUSD }: Props) {
  // Show 1, 100, and 1,000-credit reference rows.
  const tiers = [1, 100, 1000];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Credit Conversion</Text>
      {tiers.map((credits) => (
        <View key={credits} style={styles.row}>
          <Text style={styles.credits}>{formatCredits(credits)}</Text>
          <Text style={styles.equals}>=</Text>
          <Text style={styles.usd}>
            {formatUSD(credits * conversionRateUSD)}
          </Text>
        </View>
      ))}
      <Text style={styles.note}>
        Project Credits are a simulated MVP unit. They are not real money,
        not cryptocurrency, and cannot be withdrawn.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  credits: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  equals: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
  },
  usd: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    width: 90,
  },
  note: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
