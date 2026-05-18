import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/colors";

interface Props {
  label: string;
  color: string;
  filled?: boolean;
}

export function StatusBadge({ label, color, filled = false }: Props) {
  return (
    <View
      style={[
        styles.badge,
        filled
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: color, backgroundColor: "transparent" },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: filled ? colors.background : color },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
