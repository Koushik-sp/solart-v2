import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import { API_BASE_URL, POLL_INTERVAL_MS } from "../api/config";
import { OperatingMode, SystemState } from "../types/system";
import { colors, radii, spacing } from "../theme/colors";

export function SettingsScreen() {
  const [state, setState] = useState<SystemState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    try {
      const s = await api.getSystemStatus();
      setState(s);
    } catch {
      // Settings screen tolerates missing state — most controls still work
      // because they don't depend on local state.
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS * 2);
    return () => clearInterval(id);
  }, []);

  async function setMode(mode: OperatingMode) {
    setBusy("mode");
    try {
      await api.setMode(mode);
      await refresh();
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof ApiError ? e.message : "Could not change mode."
      );
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    Alert.alert(
      "Reset simulation?",
      "This restores all panels and battery clusters to their initial demo values.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setBusy("reset");
            try {
              await api.resetSimulation();
              await refresh();
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

  async function fault() {
    setBusy("fault");
    try {
      await api.simulateFault();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function clearFault() {
    setBusy("clear");
    try {
      await api.clearFault();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  const isAuto = state?.operatingMode === "auto";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Section title="Operating mode">
          <Row
            label={isAuto ? "Auto" : "Manual"}
            description={
              isAuto
                ? "System chooses charge target. Manual switching will move you to MANUAL."
                : "You select which cluster receives charge."
            }
            right={
              <Switch
                value={isAuto}
                disabled={busy === "mode" || !state}
                onValueChange={(v) => setMode(v ? "auto" : "manual")}
                trackColor={{ true: colors.greenDim, false: colors.surfaceAlt }}
                thumbColor={isAuto ? colors.charging : colors.textSecondary}
              />
            }
          />
        </Section>

        <Section title="Simulation controls">
          <Button label="Reset simulation data" onPress={reset} busy={busy === "reset"} />
          <Button
            label="Simulate fault"
            onPress={fault}
            busy={busy === "fault"}
            tone="warn"
          />
          <Button
            label="Clear fault"
            onPress={clearFault}
            busy={busy === "clear"}
          />
        </Section>

        <Section title="Connection">
          <Row label="API base URL" description={API_BASE_URL} />
          <Row
            label="Device link"
            description={
              state?.deviceConnected
                ? "ESP32 firmware is reporting telemetry."
                : "No device telemetry — backend is in simulation mode."
            }
          />
          <Text style={styles.hint}>
            On a physical iPhone, replace "localhost" with your computer's LAN
            IP in mobile/src/api/config.ts.
          </Text>
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  description,
  right,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? (
          <Text style={styles.rowDesc}>{description}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function Button({
  label,
  onPress,
  busy,
  tone = "default",
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  tone?: "default" | "warn";
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.85}
      style={[
        styles.button,
        tone === "warn" && {
          backgroundColor: "#3B2A0E",
          borderColor: colors.warning,
        },
        busy && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === "warn" && { color: colors.warning },
        ]}
      >
        {busy ? "Working..." : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  rowDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
