import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "../theme/colors";
import { useAuth } from "../auth/AuthContext";

/**
 * Demo login screen. Sign in with the hardcoded demo accounts:
 *   admin / admin  -> Admin side
 *   user  / user   -> Investor (user) side
 *
 * On success the AuthContext stores the role and AppNavigator routes to
 * the matching tab navigator.
 */
export function LoginScreen() {
  const { login, busy, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    await login(username, password);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>◐</Text>
          </View>
          <Text style={styles.title}>SolarCharge Controller</Text>
          <Text style={styles.subtitle}>
            Solar Energy Investment + Battery Control Platform
          </Text>

          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="admin or user"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="password"
              placeholderTextColor={colors.textMuted}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.85}
              style={[styles.button, busy && { opacity: 0.6 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helperBox}>
            <Text style={styles.helperTitle}>Demo accounts</Text>
            <Text style={styles.helperText}>Demo admin: admin / admin</Text>
            <Text style={styles.helperText}>Demo user: user / user</Text>
          </View>

          <Text style={styles.disclaimer}>
            This is an MVP simulation. Project Credits shown after login are
            simulated demo credits — not real money, cryptocurrency, or
            securities.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  logoMark: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.charging,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoGlyph: {
    color: colors.charging,
    fontSize: 30,
    fontWeight: "800",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  error: {
    color: colors.fault,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  button: {
    backgroundColor: colors.charging,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  helperBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  helperTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
