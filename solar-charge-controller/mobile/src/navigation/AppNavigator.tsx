import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { AdminTabs } from "./AdminTabs";
import { UserTabs } from "./UserTabs";
import { LoginScreen } from "../screens/LoginScreen";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/colors";

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

/**
 * Top-level navigator. Routing is driven entirely by the logged-in
 * role held in AuthContext:
 *   - not logged in  -> LoginScreen
 *   - role "admin"   -> AdminTabs (full control)
 *   - role "user"    -> UserTabs (read-only investor view)
 *
 * Because the tab navigators are swapped wholesale, a user can never
 * reach an admin screen and vice versa — the screens are not even
 * mounted for the other role.
 */
export function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <LoginScreen />
      ) : user.role === "admin" ? (
        <AdminTabs />
      ) : (
        <UserTabs />
      )}
    </NavigationContainer>
  );
}
