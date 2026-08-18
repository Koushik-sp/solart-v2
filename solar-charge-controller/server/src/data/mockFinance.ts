// ---------------------------------------------------------------------------
// SIMULATED PROJECT FINANCE — SEED DATA
// ---------------------------------------------------------------------------
// These are the stored, mutable parameters of the simulated solar project.
// Derived monetary values (gross revenue, user reward pool, per-user
// earnings) are NEVER stored here — they are computed in
// services/financeService.ts so the numbers are always internally
// consistent.
//
// Reminder: this is a simulation. No real energy is sold, no real money
// changes hands.
// ---------------------------------------------------------------------------

export interface FinanceParams {
  totalProjectShares: number;
  totalEnergySoldKWh: number;
  pricePerKWhUSD: number;
  // Percentage of gross energy revenue that flows into the user reward
  // pool (e.g. 15 means 15%).
  rewardPercentToUsers: number;
  // 1 Project Credit = this many USD. Fixed display constant.
  creditConversionRateUSD: number;
  creditName: string;
  // Simulated price to buy one project share. Fixed for the MVP.
  sharePriceUSD: number;
}

export function createInitialFinanceParams(): FinanceParams {
  return {
    totalProjectShares: 1000,
    totalEnergySoldKWh: 12450,
    pricePerKWhUSD: 0.12,
    rewardPercentToUsers: 15,
    creditConversionRateUSD: 0.01,
    creditName: "Project Credits",
    sharePriceUSD: 10.0,
  };
}

// In-memory mutable store. POST /api/project/simulate-energy-sale mutates
// these params; /api/sim/reset restores them.
export const financeStore: { params: FinanceParams } = {
  params: createInitialFinanceParams(),
};
