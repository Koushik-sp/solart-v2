// Authentication types for the MVP demo login system.
//
// IMPORTANT: this is a demo-only auth layer. There is no password
// hashing, no JWT, no session store — just hardcoded demo accounts and
// fixed demo tokens. Do not use this shape for a real product.

export type UserRole = "admin" | "user";

// The public-facing user record returned to the client after login.
// Never includes the password.
export interface DemoUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginSuccessResponse {
  success: true;
  user: DemoUser;
  token: string;
}

export interface LoginFailureResponse {
  success: false;
  message: string;
}

export type LoginResponse = LoginSuccessResponse | LoginFailureResponse;
