import React from "react";
import { Text } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { BatteriesScreen } from "../screens/BatteriesScreen";
import { LogsScreen } from "../screens/LogsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.charging,
  },
};

// Simple text "icons". Avoiding an icon font keeps the dependency
// footprint tight for the MVP — adding @expo/vector-icons is a one-line
// upgrade later.
function tabIcon(label: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{label}</Text>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
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
          tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarIcon: tabIcon("◐") }}
        />
        <Tab.Screen
          name="Batteries"
          component={BatteriesScreen}
          options={{ tabBarIcon: tabIcon("⚡") }}
        />
        <Tab.Screen
          name="Logs"
          component={LogsScreen}
          options={{ tabBarIcon: tabIcon("≡") }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: tabIcon("⚙") }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
