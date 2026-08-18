import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { UserDashboardScreen } from "../screens/user/UserDashboardScreen";
import { UserBatteryStatusScreen } from "../screens/user/UserBatteryStatusScreen";
import { UserEarningsScreen } from "../screens/user/UserEarningsScreen";
import { UserTransactionsScreen } from "../screens/user/UserTransactionsScreen";
import { UserInvestScreen } from "../screens/user/UserInvestScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

function tabIcon(label: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{label}</Text>
  );
}

/**
 * User (investor) tab navigator — read-only system views plus the
 * investor's shares, Project Credit earnings, and transaction history.
 * There are no control screens here.
 */
export function UserTabs() {
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
        component={UserDashboardScreen}
        options={{ tabBarIcon: tabIcon("◐") }}
      />
      <Tab.Screen
        name="Batteries"
        component={UserBatteryStatusScreen}
        options={{ tabBarIcon: tabIcon("⚡") }}
      />
      <Tab.Screen
        name="Earnings"
        component={UserEarningsScreen}
        options={{ tabBarIcon: tabIcon("$") }}
      />
      <Tab.Screen
        name="Transactions"
        component={UserTransactionsScreen}
        options={{ tabBarIcon: tabIcon("≡") }}
      />
      <Tab.Screen
        name="Invest"
        component={UserInvestScreen}
        options={{ tabBarIcon: tabIcon("+") }}
      />
    </Tab.Navigator>
  );
}
