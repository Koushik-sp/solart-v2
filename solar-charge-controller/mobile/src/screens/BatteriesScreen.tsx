import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import { POLL_INTERVAL_MS } from "../api/config";
import { BatteryCluster, SystemState } from "../types/system";
import { colors, spacing } from "../theme/colors";
import { BatteryCard } from "../components/BatteryCard";
import { ConfirmSwitchModal } from "../components/ConfirmSwitchModal";

export function BatteriesScreen() {
  const [state, setState] = useState<SystemState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingSwitch, setPendingSwitch] = useState<BatteryCluster | null>(null);
  const [switching, setSwitching] = useState(false);

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
          e instanceof ApiError
            ? `${e.message} (${e.status})`
            : "Failed to reach gateway."
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

  function ineligibilityReason(b: BatteryCluster): string | null {
    // Mirrors the backend safety checks so the UI can disable the
    // button before the user even tries. The server is still the
    // authority and will reject independently.
    if (b.isCurrentlyCharging) return null; // The button shows "currently charging".
    if (b.status === "fault") return "Cluster is in a fault state.";
    if (b.status === "offline") return "Cluster is offline.";
    if (b.status === "full") return "Cluster is already full.";
    if (b.temperatureC > 45) return "Cluster temperature is too high.";
    if (b.stateOfChargePercent >= 95) return "Cluster is near full.";
    if (b.healthPercent < 60) return "Cluster health is too low.";
    if (state && state.systemStatus === "fault")
      return "System is in a fault state.";
    if (state && state.totalSolarPowerWatts < 100)
      return "Solar production is too low to switch.";
    return null;
  }

  async function handleConfirm() {
    if (!pendingSwitch) return;
    setSwitching(true);
    try {
      const res = await api.switchChargeTarget(pendingSwitch.clusterId);
      setSwitching(false);
      setPendingSwitch(null);
      if (res.success) {
        Alert.alert("Switched", res.message);
        // Force a fresh poll.
        const s = await api.getSystemStatus();
        setState(s);
      } else {
        Alert.alert(
          "Switch rejected",
          `${res.message}\n\nReason: ${res.reasonCode}`
        );
      }
    } catch (e) {
      setSwitching(false);
      setPendingSwitch(null);
      Alert.alert(
        "Error",
        e instanceof ApiError ? e.message : "Failed to switch charging target."
      );
    }
  }

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

  const activeCluster =
    state.batteries.find((b) => b.clusterId === state.activeChargingClusterId) ??
    null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Battery Control</Text>
        <Text style={styles.subtitle}>
          Pick a cluster to charge. Switches are validated by the gateway and
          (when connected) by the firmware.
        </Text>

        {state.recommendedClusterId ? (
          <View style={styles.recBanner}>
            <Text style={styles.recHeader}>RECOMMENDED</Text>
            <Text style={styles.recBody}>
              {state.batteries.find(
                (b) => b.clusterId === state.recommendedClusterId
              )?.name ?? "—"}{" "}
              has the lowest healthy SOC.
            </Text>
          </View>
        ) : null}

        {state.batteries.map((b) => (
          <BatteryCard
            key={b.clusterId}
            battery={b}
            recommended={state.recommendedClusterId === b.clusterId}
            onPressCharge={(battery) => setPendingSwitch(battery)}
            disableReason={ineligibilityReason(b)}
          />
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <ConfirmSwitchModal
        visible={!!pendingSwitch}
        current={activeCluster}
        next={pendingSwitch}
        operatingMode={state.operatingMode}
        busy={switching}
        onCancel={() => setPendingSwitch(null)}
        onConfirm={handleConfirm}
      />
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
  recBanner: {
    backgroundColor: "#0F2236",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  recHeader: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  recBody: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
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
