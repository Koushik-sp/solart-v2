import { LoginResponse } from "../types/auth";
import { findAccountByCredentials, toDemoUser } from "../data/mockUsers";

// ---------------------------------------------------------------------------
// AUTH SERVICE
// ---------------------------------------------------------------------------
// Demo-only credential check. Matches the request against the hardcoded
// demo accounts and returns a fixed demo token. No hashing, no JWT, no
// session — this is intentionally minimal for the MVP.
// ---------------------------------------------------------------------------

export function authenticate(
  username: string,
  password: string
): LoginResponse {
  const account = findAccountByCredentials(username, password);
  if (!account) {
    return { success: false, message: "Invalid username or password" };
  }
  return {
    success: true,
    user: toDemoUser(account),
    token: account.token,
  };
}
