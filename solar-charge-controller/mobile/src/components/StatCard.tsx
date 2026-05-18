import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radii, spacing } from "../theme/colors";

interface Props {
  label: string;
  value: string;
  accent?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, accent, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
});
