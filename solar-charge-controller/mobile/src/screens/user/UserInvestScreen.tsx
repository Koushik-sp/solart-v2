import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../../api/client";
import { ProjectFinance, UserPortfolio } from "../../types/finance";
import { colors, radii, spacing } from "../../theme/colors";
import { EarningsCard } from "../../components/EarningsCard";
import { InvestPreviewCard } from "../../components/InvestPreviewCard";
import { ConfirmInvestmentModal } from "../../components/ConfirmInvestmentModal";
import { RoleHeader } from "../../components/RoleHeader";
import { useAuth } from "../../auth/AuthContext";
import {
  formatCredits,
  formatPercent,
  formatUSD,
} from "../../utils/formatting";

const SIM_DISCLAIMER =
  "This is a simulated MVP investment flow. No real money is charged. " +
  "Project shares and Project Credits are demo-only and do not represent " +
  "real securities, equity, cryptocurrency, or withdrawable funds.";

export function UserInvestScreen() {
  const { user } = useAuth();
  const [finance, setFinance] = useState<ProjectFinance | null>(null);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sharesInput, setSharesInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setError(e instanceof ApiError ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refetch whenever the Invest tab gains focus so the portfolio is
  // current (e.g. after a reset elsewhere).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleConfirm() {
    if (!user || !portfolio) return;
    setSubmitting(true);
    try {
      const res = await api.buyShares(user.id, sharesToBuy);
      if (res.success && res.portfolio) {
        setPortfolio(res.portfolio);
        setSharesInput("");
        setShowConfirm(false);
        Alert.alert(
          "Purchase Complete",
          "Simulated purchase complete. Your ownership has been updated."
        );
      } else {
        setShowConfirm(false);
        Alert.alert(
          "Purchase failed",
          res.message ?? "The simulated purchase could not be completed."
        );
      }
    } catch (e) {
      setShowConfirm(false);
      Alert.alert(
        "Error",
        e instanceof ApiError ? e.message : "Failed to buy shares."
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
        <Text style={styles.errorTitle}>Could not load</Text>
        <Text style={styles.errorMsg}>{error}</Text>
      </SafeAreaView>
    );
  }

  // --- Validation -----------------------------------------------------
  // sharesToBuy must be a positive whole number that does not exceed the
  // shares still available. The regex rejects decimals, negatives, and
  // non-numeric input.
  const trimmed = sharesInput.trim();
  const isWholeNumber = /^\d+$/.test(trimmed);
  const sharesToBuy = isWholeNumber ? parseInt(trimmed, 10) : 0;

  let validationError: string | null = null;
  if (trimmed.length > 0) {
    if (!isWholeNumber) {
      validationError = "Enter a whole number of shares (no decimals).";
    } else if (sharesToBuy <= 0) {
      validationError = "Enter at least 1 share.";
    } else if (sharesToBuy > portfolio.availableShares) {
      validationError = `Only ${portfolio.availableShares} shares are available to buy.`;
    }
  }
  const canBuy = validationError === null && sharesToBuy > 0;

  const investmentAmountUSD = sharesToBuy * portfolio.sharePriceUSD;
  const newShares = portfolio.ownedShares + sharesToBuy;
  const newOwnershipPercent =
    portfolio.totalProjectShares > 0
      ? (newShares / portfolio.totalProjectShares) * 100
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Invest</Text>
          <Text style={styles.subtitle}>
            Buy more simulated shares of the solar project.
          </Text>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>{SIM_DISCLAIMER}</Text>
          </View>

          <EarningsCard
            title="Your Current Position"
            rows={[
              {
                label: "Owned shares",
                value: portfolio.ownedShares.toLocaleString(),
              },
              {
                label: "Total project shares",
                value: portfolio.totalProjectShares.toLocaleString(),
              },
              {
                label: "Ownership",
                value: formatPercent(portfolio.ownershipPercent),
                accent: colors.blue,
              },
              {
                label: "Credits earned",
                value: formatCredits(portfolio.totalCreditsEarned),
                accent: colors.yellow,
              },
              {
                label: "Estimated USD value",
                value: formatUSD(portfolio.estimatedUSDValue),
                accent: colors.green,
              },
              {
                label: "Share price",
                value: `${formatUSD(portfolio.sharePriceUSD)} / share`,
              },
              {
                label: "Shares available to buy",
                value: portfolio.availableShares.toLocaleString(),
              },
            ]}
          />

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Number of shares to buy</Text>
            <TextInput
              style={styles.input}
              value={sharesInput}
              onChangeText={setSharesInput}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              placeholderTextColor={colors.textMuted}
            />
            {validationError ? (
              <Text style={styles.validationError}>{validationError}</Text>
            ) : (
              <Text style={styles.inputHint}>
                Whole numbers only. Max {portfolio.availableShares.toLocaleString()}{" "}
                shares at {formatUSD(portfolio.sharePriceUSD)} each.
              </Text>
            )}
          </View>

          <InvestPreviewCard
            sharesToBuy={sharesToBuy}
            sharePriceUSD={portfolio.sharePriceUSD}
            currentShares={portfolio.ownedShares}
            totalProjectShares={portfolio.totalProjectShares}
            userRewardPoolUSD={finance.userRewardPoolUSD}
            creditConversionRateUSD={finance.creditConversionRateUSD}
          />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowConfirm(true)}
            disabled={!canBuy}
            activeOpacity={0.85}
            style={[styles.buyButton, !canBuy && styles.buyButtonDisabled]}
          >
            <Text
              style={[
                styles.buyButtonText,
                !canBuy && { color: colors.textMuted },
              ]}
            >
              Buy Shares
            </Text>
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmInvestmentModal
        visible={showConfirm}
        sharesToBuy={sharesToBuy}
        investmentAmountUSD={investmentAmountUSD}
        currentShares={portfolio.ownedShares}
        newShares={newShares}
        currentOwnershipPercent={portfolio.ownershipPercent}
        newOwnershipPercent={newOwnershipPercent}
        busy={submitting}
        onCancel={() => setShowConfirm(false)}
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
  disclaimerBox: {
    backgroundColor: "#3B2A0E",
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  inputBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: "700",
  },
  inputHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  validationError: {
    color: colors.fault,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  buyButton: {
    backgroundColor: colors.charging,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buyButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  buyButtonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
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
