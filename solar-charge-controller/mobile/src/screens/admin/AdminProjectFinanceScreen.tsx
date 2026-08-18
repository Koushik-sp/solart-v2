import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../../api/client";
import { ProjectFinance, UserPortfolio } from "../../types/finance";
import { colors, radii, spacing } from "../../theme/colors";
import { EarningsCard } from "../../components/EarningsCard";
import { RoleHeader } from "../../components/RoleHeader";
import {
  formatCredits,
  formatKWh,
  formatPercent,
  formatUSD,
} from "../../utils/formatting";

// The demo investor whose simulated portfolio the admin can review.
const DEMO_USER_ID = "user-001";

export function AdminProjectFinanceScreen() {
  const [finance, setFinance] = useState<ProjectFinance | null>(null);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulate-energy-sale form state.
  const [kwhInput, setKwhInput] = useState("100");
  const [priceInput, setPriceInput] = useState("0.12");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, p] = await Promise.all([
        api.getProjectFinance(),
        api.getUserPortfolio(DEMO_USER_ID),
      ]);
      setFinance(f);
      setPortfolio(p);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load project finance."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function simulateSale() {
    const kwh = Number(kwhInput);
    const price = Number(priceInput);
    if (!Number.isFinite(kwh) || kwh <= 0) {
      Alert.alert("Invalid input", "Energy sold must be a positive number.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert("Invalid input", "Price per kWh must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.simulateEnergySale(kwh, price);
      setFinance(res.finance);
      setPortfolio(res.portfolio);
      Alert.alert(
        "Energy sale simulated",
        `Added ${formatKWh(kwh)} of simulated energy sales. ` +
          `Demo investor earned ${formatCredits(res.transaction.credits)}.`
      );
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof ApiError ? e.message : "Failed to simulate energy sale."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.charging} />
      </SafeAreaView>
    );
  }

  if (error || !finance || !portfolio) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Could not load finance</Text>
        <Text style={styles.errorMsg}>{error}</Text>
      </SafeAreaView>
    );
  }

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
        <RoleHeader role="admin" />
        <Text style={styles.title}>Project Finance</Text>
        <Text style={styles.subtitle}>
          Simulated revenue and {finance.creditName} accounting for the solar
          project.
        </Text>

        <EarningsCard
          title="Project Revenue (simulated)"
          rows={[
            {
              label: "Total project shares",
              value: finance.totalProjectShares.toLocaleString(),
            },
            {
              label: "Total energy sold",
              value: formatKWh(finance.totalEnergySoldKWh),
            },
            {
              label: "Price per kWh",
              value: formatUSD(finance.pricePerKWhUSD),
            },
            {
              label: "Gross revenue",
              value: formatUSD(finance.grossRevenueUSD),
              accent: colors.green,
            },
            {
              label: "Reward pool %",
              value: formatPercent(finance.rewardPercentToUsers),
            },
            {
              label: "Total user reward pool",
              value: formatUSD(finance.userRewardPoolUSD),
              accent: colors.green,
              emphasis: true,
            },
            {
              label: "Credit conversion rate",
              value: `${formatUSD(finance.creditConversionRateUSD)} / credit`,
            },
            {
              label: "Share price",
              value: `${formatUSD(finance.sharePriceUSD)} / share`,
            },
          ]}
        />

        <EarningsCard
          title={`Demo Investor — ${portfolio.displayName}`}
          rows={[
            {
              label: "Owned shares",
              value: portfolio.ownedShares.toLocaleString(),
            },
            {
              label: "Available shares remaining",
              value: portfolio.availableShares.toLocaleString(),
            },
            {
              label: "Ownership",
              value: formatPercent(portfolio.ownershipPercent),
            },
            {
              label: "Simulated amount invested",
              value: formatUSD(portfolio.userTotalSimulatedInvestedUSD),
              accent: colors.green,
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
        />

        <View style={styles.simBox}>
          <Text style={styles.simTitle}>Simulate Energy Sale</Text>
          <Text style={styles.simHelp}>
            Adds simulated energy sales to the project, recalculates revenue,
            and credits the demo investor proportionally to their shares.
          </Text>
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Energy sold (kWh)</Text>
              <TextInput
                style={styles.input}
                value={kwhInput}
                onChangeText={setKwhInput}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Price per kWh (USD)</Text>
              <TextInput
                style={styles.input}
                value={priceInput}
                onChangeText={setPriceInput}
                keyboardType="numeric"
                placeholder="0.12"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={simulateSale}
            disabled={submitting}
            activeOpacity={0.85}
            style={[styles.simButton, submitting && { opacity: 0.6 }]}
          >
            <Text style={styles.simButtonText}>
              {submitting ? "Simulating..." : "Simulate Sale"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          {finance.creditName} are simulated MVP credits for demo purposes
          only. They are not real money, not cryptocurrency, not securities,
          and cannot be withdrawn. No real energy is sold and no real money
          changes hands.
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
  simBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  simTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  simHelp: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontWeight: "600",
  },
  simButton: {
    backgroundColor: colors.charging,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  simButtonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
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
