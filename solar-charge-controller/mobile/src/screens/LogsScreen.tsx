import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import { POLL_INTERVAL_MS } from "../api/config";
import { SystemEvent } from "../types/system";
import { colors, radii, spacing } from "../theme/colors";
import { fmtTime, severityColor } from "../utils/formatting";

export function LogsScreen() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchEvents() {
    try {
      const res = await api.getEvents(150);
      setEvents(res.events);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, POLL_INTERVAL_MS * 2);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.charging} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Activity Log</Text>
      <Text style={styles.subtitle}>
        Charge target switches, fault events, and device commands.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchEvents();
            }}
            tintColor={colors.textSecondary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No events yet.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { borderLeftColor: severityColor(item.severity) },
            ]}
          >
            <View style={styles.itemHeader}>
              <Text
                style={[styles.type, { color: severityColor(item.severity) }]}
              >
                {item.type}
              </Text>
              <Text style={styles.time}>{fmtTime(item.timestamp)}</Text>
            </View>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        )}
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
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  item: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  type: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  error: {
    color: colors.fault,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
