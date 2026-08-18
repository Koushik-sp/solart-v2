import { DemoUser, UserRole } from "../types/auth";

// ---------------------------------------------------------------------------
// DEMO ACCOUNTS
// ---------------------------------------------------------------------------
// Hardcoded demo accounts for the MVP. Passwords are stored in plaintext
// ON PURPOSE — this is a throwaway demo login, not a real auth system.
// A real product would use hashed credentials and a proper identity
// provider. The token is a fixed demo string, not a signed JWT.
//
// `ownedShares` and `totalSimulatedInvestedUSD` are mutable: the
// simulated "buy shares" flow mutates them in place, and /api/sim/reset
// restores them via resetDemoAccounts().
// ---------------------------------------------------------------------------

export interface DemoAccount {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  token: string;
  // How many project shares this account owns in the simulation. The
  // admin is an operator, not an investor, so it owns 0 shares.
  ownedShares: number;
  // Running total of simulated USD this account has "invested" in
  // shares. Seeded as ownedShares * sharePriceUSD.
  totalSimulatedInvestedUSD: number;
}

function seedAccounts(): DemoAccount[] {
  return [
    {
      id: "admin-001",
      username: "admin",
      password: "admin",
      role: "admin",
      displayName: "Admin",
      token: "demo-admin-token",
      ownedShares: 0,
      totalSimulatedInvestedUSD: 0,
    },
    {
      id: "user-001",
      username: "user",
      password: "user",
      role: "user",
      displayName: "Demo User",
      token: "demo-user-token",
      // 100 shares seeded at $10.00/share -> $1,000.00 invested.
      ownedShares: 100,
      totalSimulatedInvestedUSD: 1000,
    },
  ];
}

export const demoAccounts: DemoAccount[] = seedAccounts();

// Restore the mutable account fields to their seed values. Called by
// resetSimulation() so a demo reset also rolls back share purchases.
export function resetDemoAccounts(): void {
  const fresh = seedAccounts();
  demoAccounts.length = 0;
  demoAccounts.push(...fresh);
}

// Strip the password before sending an account to the client.
export function toDemoUser(account: DemoAccount): DemoUser {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    displayName: account.displayName,
  };
}

export function findAccountById(userId: string): DemoAccount | null {
  return demoAccounts.find((a) => a.id === userId) ?? null;
}

export function findAccountByCredentials(
  username: string,
  password: string
): DemoAccount | null {
  return (
    demoAccounts.find(
      (a) => a.username === username && a.password === password
    ) ?? null
  );
}
