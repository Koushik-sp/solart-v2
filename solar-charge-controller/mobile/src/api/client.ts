import { API_BASE_URL } from "./config";
import {
  BatteryCluster,
  ChargeTargetResponse,
  OperatingMode,
  SolarPanel,
  SystemEvent,
  SystemState,
} from "../types/system";
import { LoginResponse } from "../types/auth";
import {
  BuySharesResponse,
  CreditTransaction,
  ProjectFinance,
  UserPortfolio,
} from "../types/finance";

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { allowStatuses?: number[] }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new ApiError(`Network error: ${msg}`, 0, null);
  }
  const allowed = init?.allowStatuses ?? [];
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok && !allowed.includes(res.status)) {
    const detail =
      typeof body === "object" && body && "message" in body
        ? String((body as Record<string, unknown>).message)
        : `HTTP ${res.status}`;
    throw new ApiError(detail, res.status, body);
  }
  return body as T;
}

export const api = {
  // --- Auth -----------------------------------------------------------
  async login(username: string, password: string): Promise<LoginResponse> {
    // 401 (bad credentials) carries a structured failure body we surface
    // to the user — treat it as an expected response, not a thrown error.
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      allowStatuses: [400, 401],
    });
  },

  // --- System ---------------------------------------------------------
  async getSystemStatus(): Promise<SystemState> {
    return request<SystemState>("/api/system/status");
  },

  async getPanels(): Promise<{ panels: SolarPanel[] }> {
    return request<{ panels: SolarPanel[] }>("/api/panels");
  },

  async getBatteries(): Promise<{
    batteries: BatteryCluster[];
    activeChargingClusterId: string | null;
    recommendedClusterId: string | null;
  }> {
    return request("/api/batteries");
  },

  async getEvents(limit = 100): Promise<{ events: SystemEvent[] }> {
    return request<{ events: SystemEvent[] }>(`/api/events?limit=${limit}`);
  },

  // --- Control (admin only) ------------------------------------------
  async switchChargeTarget(
    clusterId: string,
    requestedBy = "mobile-app"
  ): Promise<ChargeTargetResponse> {
    // 409 (safety rejection) is an expected response — the server returns
    // a structured failure body that we want to surface to the user.
    return request<ChargeTargetResponse>("/api/control/charge-target", {
      method: "POST",
      body: JSON.stringify({ clusterId, requestedBy }),
      allowStatuses: [400, 409],
    });
  },

  async setMode(mode: OperatingMode) {
    return request("/api/control/mode", {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  },

  async resetSimulation() {
    return request("/api/sim/reset", { method: "POST" });
  },

  async simulateFault() {
    return request("/api/sim/fault", { method: "POST" });
  },

  async clearFault() {
    return request("/api/sim/clear-fault", { method: "POST" });
  },

  // --- Project finance + user portfolio (Project Credits) ------------
  async getProjectFinance(): Promise<ProjectFinance> {
    return request<ProjectFinance>("/api/project/finance");
  },

  async getUserPortfolio(userId: string): Promise<UserPortfolio> {
    return request<UserPortfolio>(`/api/users/${userId}/portfolio`);
  },

  async getUserTransactions(
    userId: string
  ): Promise<{ userId: string; transactions: CreditTransaction[] }> {
    return request(`/api/users/${userId}/transactions`);
  },

  async buyShares(
    userId: string,
    sharesToBuy: number
  ): Promise<BuySharesResponse> {
    // 400/404/409 carry a structured failure body (validation errors,
    // insufficient available shares) we want to surface to the user.
    return request<BuySharesResponse>(`/api/users/${userId}/buy-shares`, {
      method: "POST",
      body: JSON.stringify({ sharesToBuy }),
      allowStatuses: [400, 404, 409],
    });
  },

  async simulateEnergySale(
    energySoldKWh: number,
    pricePerKWhUSD?: number
  ): Promise<{
    success: boolean;
    finance: ProjectFinance;
    transaction: CreditTransaction;
    portfolio: UserPortfolio;
  }> {
    return request("/api/project/simulate-energy-sale", {
      method: "POST",
      body: JSON.stringify({ energySoldKWh, pricePerKWhUSD }),
    });
  },
};

export { ApiError };
