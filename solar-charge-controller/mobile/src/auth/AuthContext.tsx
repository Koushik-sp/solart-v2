import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { api, ApiError } from "../api/client";
import { DemoUser } from "../types/auth";

// ---------------------------------------------------------------------------
// AUTH CONTEXT
// ---------------------------------------------------------------------------
// Holds the logged-in demo user + token in app state. This is a simple
// in-memory, session-only login for the MVP — nothing is persisted, so
// closing the app logs you out. No Firebase / Auth0 / real auth service.
//
// The logged-in role drives routing: admins see AdminTabs, users see
// UserTabs (see navigation/AppNavigator.tsx).
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: DemoUser | null;
  token: string | null;
  busy: boolean;
  error: string | null;
  // Returns true on success. On failure, `error` is populated.
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        const res = await api.login(username.trim(), password);
        if (res.success) {
          setUser(res.user);
          setToken(res.token);
          return true;
        }
        setError(res.message);
        return false;
      } catch (e) {
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not reach the gateway. Check that the server is running."
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, busy, error, login, logout }),
    [user, token, busy, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
