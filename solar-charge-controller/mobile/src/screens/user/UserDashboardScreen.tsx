import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { api, ApiError } from "../../api/client";
import { POLL_INTERVAL_MS } from "../../api/config";
import { SystemState } from "../../types/system";
import { ProjectFinance, UserPortfolio } from "../../types/finance";
import { colors, radii, spacing } from "../../theme/colors";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { EarningsCard } from "../../components/EarningsCard";
import { RoleHeader } from "../../components/RoleHeader";
import { useAuth } from "../../auth/AuthContext";
import {
  formatCredits,
  formatKWh,
  formatPercent,
  formatUSD,
  formatWatts,
} from "../../utils/formatting";

export function UserDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [state, setState] = useState<SystemState | null>(null);
  const [finance, setFinance] = useState<ProjectFinance | null>(null);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [s, f, p] = await Promise.all([
        api.getSystemStatus(),
        api.getProjectFinance(),
        api.getUserPortfolio(user.id),
      ]);
      setState(s);
      setFinance(f);
      setPortfolio(p);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to reach gateway."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS * 2);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.charging} />
        <Text style={styles.muted}>Loading your dashboard…</Text>
      </SafeAreaView>
    );
  }

  if (error || !state || !finance || !portfolio) {
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
  const sysColor =
    state.systemStatus === "fault"
      ? colors.fault
      : state.systemStatus === "warning"
      ? colors.warning
      : colors.charging;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.textSecondary}
          />
        }
      >
        <RoleHeader role="user" />
        <Text style={styles.title}>
          Welcome, {portfolio.displayName}
        </Text>
        <Text style={styles.subtitle}>
          Read-only investor view • updated{" "}
          {new Date(state.timestamp).toLocaleTimeString()}
        </Text>

        <Text style={styles.section}>Solar System</Text>
        <View style={styles.row}>
          <StatCard
            label="Active Charging"
            value={activeCluster?.name ?? "—"}
            accent={colors.blue}
          />
          <View style={{ width: spacing.md }} />
          <StatCard
            label="Total Solar Power"
            value={formatWatts(state.totalSolarPowerWatts)}
            accent={colors.charging}
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
            label="Total Energy Sold"
            value={formatKWh(finance.totalEnergySoldKWh)}
          />
        </View>
        <View style={styles.deviceBadgeWrap}>
          <StatusBadge
            label={state.deviceConnected ? "ESP32 ONLINE" : "SIM ONLY"}
            color={state.deviceConnected ? colors.charging : colors.textMuted}
          />
        </View>

        <Text style={styles.section}>Your Investment</Text>
        <EarningsCard
          title="Your Stake & Earnings"
          rows={[
            {
              label: "Owned shares",
              value: portfolio.ownedShares.toLocaleString(),
            },
            {
              label: "Ownership",
              value: formatPercent(portfolio.ownershipPercent),
            },
            {
              label: "Credits earned",
              value: formatCredits(portfolio.totalCreditsEarned),
              accent: colors.yellow,
              emphasis: true,
            },
            {
              label: "Estimated USD value",
              value: formatUSD(portfolio.estimatedUSDValue),
              accent: colors.green,
            },
          ]}
          footnote={`${portfolio.creditName} are simulated MVP credits. They are not real money, cryptocurrency, or withdrawable funds.`}
        />

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Invest" as never)}
          style={styles.investCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.investTitle}>Invest More</Text>
            <Text style={styles.investBody}>
              Buy more simulated shares to grow your ownership and earnings.
            </Text>
          </View>
          <Text style={styles.investArrow}>→</Text>
        </TouchableOpacity>

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
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  section: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  deviceBadgeWrap: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  investCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2A1C",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.charging,
    padding: spacing.lg,
    gap: spacing.md,
  },
  investTitle: {
    color: colors.charging,
    fontSize: 16,
    fontWeight: "800",
  },
  investBody: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  investArrow: {
    color: colors.charging,
    fontSize: 22,
    fontWeight: "800",
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
  },
});
