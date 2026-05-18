import { API_BASE_URL } from "./config";
import {
  BatteryCluster,
  ChargeTargetResponse,
  OperatingMode,
  SolarPanel,
  SystemEvent,
  SystemState,
} from "../types/system";

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
};

export { ApiError };
