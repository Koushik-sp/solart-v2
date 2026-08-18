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
import { StatCard } from "../../components/StatCard";
import { BatteryCard } from "../../components/BatteryCard";
import { PanelCard } from "../../components/PanelCard";
import { formatWatts } from "../../utils/formatting";
import { StatusBadge } from "../../components/StatusBadge";
import { RoleHeader } from "../../components/RoleHeader";

export function AdminDashboardScreen() {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.charging} />
        <Text style={styles.muted}>Loading system status…</Text>
      </SafeAreaView>
    );
  }

  if (error || !state) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Gateway unavailable</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <Text style={styles.errorHint}>
          Verify the backend is running and check API_BASE_URL in
          mobile/src/api/config.ts.
        </Text>
      </SafeAreaView>
    );
  }

  const activeCluster = state.batteries.find(
    (b) => b.clusterId === state.activeChargingClusterId
  );
  const sysColor =
    state.systemStatus === "fault"
      ? colors.fault
      : state.systemStatus === "warning"
      ? colors.warning
      : colors.charging;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <RoleHeader role="admin" />
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          {state.deviceConnected ? "Live device telemetry" : "Simulation mode"} •
          updated {new Date(state.timestamp).toLocaleTimeString()}
        </Text>

        <View style={styles.row}>
          <StatCard
            label="Solar Production"
            value={formatWatts(state.totalSolarPowerWatts)}
            accent={colors.charging}
          />
          <View style={{ width: spacing.md }} />
          <StatCard
            label="Active Cluster"
            value={activeCluster?.name ?? "—"}
            accent={colors.blue}
          />
        </View>

        <View style={styles.row}>
          <StatCard
            label="System Status"
            value={state.systemStatus.toUpperCase()}
            accent={sysColor}
          />
          <View style={{ width: spacing.md }} />
          <StatCard
            label="Mode"
            value={state.operatingMode.toUpperCase()}
            accent={colors.textPrimary}
          />
        </View>

        <View style={styles.row}>
          <StatCard
            label="Grid"
            value={state.gridConnected ? "CONNECTED" : "OFFLINE"}
            accent={state.gridConnected ? colors.charging : colors.warning}
          />
          <View style={{ width: spacing.md }} />
          <StatCard
            label="Battery Capacity"
            value={`${state.totalBatteryCapacityKWh} kWh`}
          />
        </View>

        <View style={styles.deviceBadgeWrap}>
          <StatusBadge
            label={state.deviceConnected ? "ESP32 ONLINE" : "SIM ONLY"}
            color={state.deviceConnected ? colors.charging : colors.textMuted}
          />
        </View>

        <View style={styles.simNote}>
          <Text style={styles.simNoteText}>
            Control actions are simulated and must not be connected to real
            high-voltage hardware without proper safety systems.
          </Text>
        </View>

        <Text style={styles.section}>Battery Clusters</Text>
        {state.batteries.map((b) => (
          <BatteryCard
            key={b.clusterId}
            battery={b}
            recommended={state.recommendedClusterId === b.clusterId}
          />
        ))}

        <Text style={styles.section}>Solar Panels</Text>
        {state.panels.map((p) => (
          <PanelCard key={p.panelId} panel={p} />
        ))}

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
  row: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  section: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  deviceBadgeWrap: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  simNote: {
    backgroundColor: "#3B2A0E",
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  simNoteText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.md,
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
    marginBottom: spacing.md,
  },
  errorHint: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: spacing.lg,
  },
});
