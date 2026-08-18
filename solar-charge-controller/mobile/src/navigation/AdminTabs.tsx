import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminBatteriesScreen } from "../screens/admin/AdminBatteriesScreen";
import { AdminLogsScreen } from "../screens/admin/AdminLogsScreen";
import { AdminSettingsScreen } from "../screens/admin/AdminSettingsScreen";
import { AdminProjectFinanceScreen } from "../screens/admin/AdminProjectFinanceScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

// Simple text "icons" — keeps the dependency footprint tight for the MVP.
function tabIcon(label: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{label}</Text>
  );
}

/**
 * Admin tab navigator — full operator access: dashboard, battery
 * control, logs, settings/simulation controls, and project finance.
 */
export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.charging,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ tabBarIcon: tabIcon("◐") }}
      />
      <Tab.Screen
        name="Batteries"
        component={AdminBatteriesScreen}
        options={{ tabBarIcon: tabIcon("⚡") }}
      />
      <Tab.Screen
        name="Logs"
        component={AdminLogsScreen}
        options={{ tabBarIcon: tabIcon("≡") }}
      />
      <Tab.Screen
        name="Finance"
        component={AdminProjectFinanceScreen}
        options={{ tabBarIcon: tabIcon("$") }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{ tabBarIcon: tabIcon("⚙") }}
      />
    </Tab.Navigator>
  );
}
