import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../../api/client";
import { ProjectFinance, UserPortfolio } from "../../types/finance";
import { colors, radii, spacing } from "../../theme/colors";
import { EarningsCard } from "../../components/EarningsCard";
import { CreditConversionCard } from "../../components/CreditConversionCard";
import { RoleHeader } from "../../components/RoleHeader";
import { useAuth } from "../../auth/AuthContext";
import {
  formatCredits,
  formatKWh,
  formatPercent,
  formatUSD,
} from "../../utils/formatting";

export function UserEarningsScreen() {
  const { user } = useAuth();
  const [finance, setFinance] = useState<ProjectFinance | null>(null);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [f, p] = await Promise.all([
        api.getProjectFinance(),
        api.getUserPortfolio(user.id),
      ]);
      setFinance(f);
      setPortfolio(p);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load earnings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refetch on focus so earnings reflect any shares bought on the
  // Invest tab.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <Text style={styles.errorTitle}>Could not load earnings</Text>
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
        <RoleHeader role="user" />
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>
          How your {finance.creditName} are calculated from the project's
          simulated energy revenue.
        </Text>

        <EarningsCard
          title="Your Ownership"
          rows={[
            {
              label: "Owned shares",
              value: portfolio.ownedShares.toLocaleString(),
            },
            {
              label: "Total project shares",
              value: finance.totalProjectShares.toLocaleString(),
            },
            {
              label: "Ownership",
              value: formatPercent(portfolio.ownershipPercent),
              accent: colors.blue,
            },
          ]}
        />

        <EarningsCard
          title="Project Revenue (simulated)"
          rows={[
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
              label: `User reward pool (${formatPercent(
                finance.rewardPercentToUsers
              )})`,
              value: formatUSD(finance.userRewardPoolUSD),
              accent: colors.green,
            },
          ]}
        />

        <EarningsCard
          title="Your Earnings"
          rows={[
            {
              label: "Project Credits earned",
              value: formatCredits(portfolio.totalCreditsEarned),
              accent: colors.yellow,
              emphasis: true,
            },
            {
              label: "Estimated USD value",
              value: formatUSD(portfolio.estimatedUSDValue),
              accent: colors.green,
              emphasis: true,
            },
          ]}
        />

        <View style={styles.formulaBox}>
          <Text style={styles.formulaTitle}>How this is calculated</Text>
          <Text style={styles.formulaLine}>
            grossRevenue = energySold × pricePerKWh
          </Text>
          <Text style={styles.formulaLine}>
            userRewardPool = grossRevenue × {finance.rewardPercentToUsers}%
          </Text>
          <Text style={styles.formulaLine}>
            ownership = yourShares ÷ totalShares
          </Text>
          <Text style={styles.formulaLine}>
            yourEarnings = userRewardPool × ownership
          </Text>
          <Text style={styles.formulaLine}>
            yourCredits = yourEarnings ÷{" "}
            {formatUSD(finance.creditConversionRateUSD)}
          </Text>
          <Text style={styles.formulaNote}>
            You receive {formatPercent(finance.rewardPercentToUsers)} of the
            energy revenue pool, scaled by your ownership share — not the full
            pool unless you own 100% of shares.
          </Text>
        </View>

        <CreditConversionCard
          conversionRateUSD={finance.creditConversionRateUSD}
        />

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {finance.creditName} are simulated MVP credits for demo purposes
            only. 1 Project Credit ={" "}
            {formatUSD(finance.creditConversionRateUSD)} USD in this prototype.
            Credits are not real money, not cryptocurrency, and cannot be
            withdrawn.
          </Text>
        </View>

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
  formulaBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  formulaTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  formulaLine: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: "Courier",
    marginVertical: 2,
  },
  formulaNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  disclaimerBox: {
    backgroundColor: "#3B2A0E",
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  disclaimerText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "600",
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
