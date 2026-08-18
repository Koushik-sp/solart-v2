import { Router } from "express";
import { LoginRequest } from "../types/auth";
import { authenticate } from "../services/authService";

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 *
 * Demo-only login. Returns the user record + a fixed demo token on
 * success, or a 401 with a generic message on failure.
 */
authRouter.post("/api/auth/login", (req, res) => {
  const body = req.body as Partial<LoginRequest>;
  const username = body?.username;
  const password = body?.password;

  if (typeof username !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid username or password" });
  }

  const result = authenticate(username, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  return res.json(result);
});
