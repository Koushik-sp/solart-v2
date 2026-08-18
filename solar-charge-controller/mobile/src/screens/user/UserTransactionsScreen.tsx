import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../../api/client";
import { CreditTransaction } from "../../types/finance";
import { colors, spacing } from "../../theme/colors";
import { TransactionCard } from "../../components/TransactionCard";
import { RoleHeader } from "../../components/RoleHeader";
import { useAuth } from "../../auth/AuthContext";

export function UserTransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getUserTransactions(user.id);
      setTransactions(res.transactions);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load transactions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refetch on focus so a share purchase made on the Invest tab shows
  // up here immediately.
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.headerWrap}>
        <RoleHeader role="user" />
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          Your simulated earnings and share activity, newest first.
        </Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
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
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet.</Text>
        }
        renderItem={({ item }) => <TransactionCard transaction={item} />}
        ListFooterComponent={
          <Text style={styles.footer}>
            Project Credits are simulated MVP credits. They are not real
            money, cryptocurrency, or withdrawable funds.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.md,
  },
  error: {
    color: colors.fault,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
