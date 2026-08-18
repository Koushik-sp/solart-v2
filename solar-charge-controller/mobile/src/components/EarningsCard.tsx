import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/colors";

export interface EarningsRow {
  label: string;
  value: string;
  // When set, the value is rendered in this accent color (e.g. credits
  // in yellow, USD in green).
  accent?: string;
  // When true, the row is rendered larger as a headline metric.
  emphasis?: boolean;
}

interface Props {
  title: string;
  rows: EarningsRow[];
  footnote?: string;
}

/**
 * A titled card that renders a list of label/value rows. Used across the
 * user Earnings, Dashboard, and admin Project Finance screens so the
 * simulated monetary numbers are presented consistently.
 */
export function EarningsCard({ title, rows, footnote }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row, i) => (
        <View
          key={`${row.label}-${i}`}
          style={[styles.row, row.emphasis && styles.rowEmphasis]}
        >
          <Text style={[styles.label, row.emphasis && styles.labelEmphasis]}>
            {row.label}
          </Text>
          <Text
            style={[
              styles.value,
              row.emphasis && styles.valueEmphasis,
              row.accent ? { color: row.accent } : undefined,
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
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
  },
  rowEmphasis: {
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    flexShrink: 1,
  },
  labelEmphasis: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  valueEmphasis: {
    fontSize: 22,
    fontWeight: "800",
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
