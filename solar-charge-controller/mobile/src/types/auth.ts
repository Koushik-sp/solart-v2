// Mirror of server/src/types/auth.ts. Keep in sync with the gateway.
//
// IMPORTANT: this is a demo-only auth layer — no real authentication,
// no JWT, no secure session. See the server types file for details.

export type UserRole = "admin" | "user";

export interface DemoUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
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
