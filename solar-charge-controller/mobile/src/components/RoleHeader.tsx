import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { UserRole } from "../types/auth";
import { useAuth } from "../auth/AuthContext";
import { colors, radii, spacing } from "../theme/colors";

interface Props {
  role: UserRole;
}

/**
 * Top-of-screen header shown on every admin and user screen. It labels
 * the current role ("Admin" vs "Investor View") and provides the logout
 * button required for both roles.
 */
export function RoleHeader({ role }: Props) {
  const { user, logout } = useAuth();
  const isAdmin = role === "admin";
  const label = isAdmin ? "Admin" : "Investor View";
  const accent = isAdmin ? colors.blue : colors.green;

  function confirmLogout() {
    Alert.alert("Log out?", "You will return to the login screen.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={[styles.badge, { borderColor: accent }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {label.toUpperCase()}
          </Text>
        </View>
        {user ? (
          <Text style={styles.who}>{user.displayName}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={confirmLogout}
        activeOpacity={0.8}
        style={styles.logout}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  who: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  logout: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
