import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../../api/client";
import { POLL_INTERVAL_MS } from "../../api/config";
import { SystemState } from "../../types/system";
import { colors, radii, spacing } from "../../theme/colors";
import { BatteryCard } from "../../components/BatteryCard";
import { RoleHeader } from "../../components/RoleHeader";

/**
 * Read-only battery cluster view for investors. BatteryCard renders
 * without an onPressCharge handler, so no control buttons appear — users
 * cannot switch the charging target.
 */
export function UserBatteryStatusScreen() {
  const [state, setState] = useState<SystemState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const s = await api.getSystemStatus();
        if (cancelled) return;
        setState(s);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError ? e.message : "Failed to reach gateway."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.charging} />
      </SafeAreaView>
    );
  }

  if (error || !state) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Gateway unavailable</Text>
        <Text style={styles.errorMsg}>{error}</Text>
      </SafeAreaView>
    );
  }

  const activeCluster = state.batteries.find(
    (b) => b.clusterId === state.activeChargingClusterId
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <RoleHeader role="user" />
        <Text style={styles.title}>Battery Status</Text>
        <Text style={styles.subtitle}>
          Read-only view of the project's battery clusters.
        </Text>

        <View style={styles.activeBanner}>
          <Text style={styles.activeHeader}>CURRENTLY CHARGING</Text>
          <Text style={styles.activeBody}>
            {activeCluster?.name ?? "No cluster is charging right now."}
          </Text>
        </View>

        {state.batteries.map((b) => (
          <BatteryCard key={b.clusterId} battery={b} />
        ))}

        <Text style={styles.readonlyNote}>
          This is an investor view. Battery charging is controlled by system
          operators — investors cannot switch charging targets.
        </Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  activeBanner: {
    backgroundColor: "#0F2236",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  activeHeader: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  activeBody: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  readonlyNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  errorTitle: {
    color: colors.fault,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  errorMsg: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
