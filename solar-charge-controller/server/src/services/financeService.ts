import { ProjectFinance } from "../types/finance";
import { financeStore } from "../data/mockFinance";

// ---------------------------------------------------------------------------
// FINANCE SERVICE
// ---------------------------------------------------------------------------
// All simulated monetary math lives here. Derived values are computed
// from the stored finance parameters every time they are requested, so
// the project finance snapshot and every user portfolio always agree.
//
// Core formulas (see README "Project Credits system"):
//   grossRevenueUSD   = totalEnergySoldKWh * pricePerKWhUSD
//   userRewardPoolUSD = grossRevenueUSD * (rewardPercentToUsers / 100)
//   1 Project Credit  = creditConversionRateUSD ($0.01) USD
// ---------------------------------------------------------------------------

// Round a USD amount to 2 decimal places (cents).
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Convert a USD amount to whole Project Credits.
export function usdToCredits(usd: number, conversionRateUSD: number): number {
  return Math.round(usd / conversionRateUSD);
}

/**
 * Compute the full project finance snapshot from the stored parameters.
 * grossRevenueUSD and userRewardPoolUSD are always derived here — they
 * are never stored.
 */
export function computeProjectFinance(): ProjectFinance {
  const p = financeStore.params;
  const grossRevenueUSD = p.totalEnergySoldKWh * p.pricePerKWhUSD;
  const userRewardPoolUSD = grossRevenueUSD * (p.rewardPercentToUsers / 100);
  return {
    totalProjectShares: p.totalProjectShares,
    totalEnergySoldKWh: p.totalEnergySoldKWh,
    pricePerKWhUSD: p.pricePerKWhUSD,
    grossRevenueUSD: round2(grossRevenueUSD),
    rewardPercentToUsers: p.rewardPercentToUsers,
    userRewardPoolUSD: round2(userRewardPoolUSD),
    creditConversionRateUSD: p.creditConversionRateUSD,
    creditName: p.creditName,
    sharePriceUSD: p.sharePriceUSD,
  };
}
