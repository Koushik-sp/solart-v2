// Types for the simulated "Project Credits" monetary system.
//
// IMPORTANT: Project Credits and project shares are simulated, in-app
// accounting units for this MVP only. They are NOT real money, NOT
// cryptocurrency, NOT securities/equity, and cannot be withdrawn or
// exchanged. Buying shares only updates mock in-memory data — no real
// money is charged and no real ownership is created.

// Snapshot of the whole project's simulated finances. Derived values
// (grossRevenueUSD, userRewardPoolUSD) are always computed in code from
// the stored parameters — see services/financeService.ts.
export interface ProjectFinance {
  totalProjectShares: number;
  totalEnergySoldKWh: number;
  pricePerKWhUSD: number;
  grossRevenueUSD: number;
  rewardPercentToUsers: number;
  userRewardPoolUSD: number;
  creditConversionRateUSD: number;
  creditName: string;
  // Simulated price to buy one project share.
  sharePriceUSD: number;
}

// A single user's simulated stake in the project. All monetary fields
// are computed from ProjectFinance + the user's owned shares.
export interface UserPortfolio {
  userId: string;
  displayName: string;
  ownedShares: number;
  totalProjectShares: number;
  // Shares still available for this user to buy (cannot exceed the
  // total project shares).
  availableShares: number;
  sharePriceUSD: number;
  ownershipPercent: number;
  totalCreditsEarned: number;
  estimatedUSDValue: number;
  // Running total of simulated USD the user has "invested" in shares.
  userTotalSimulatedInvestedUSD: number;
  creditConversionRateUSD: number;
  creditName: string;
}

export type CreditTransactionType = "ENERGY_SALE_REWARD" | "SHARE_PURCHASE";

// One row of the user's simulated earnings/transaction history.
export interface CreditTransaction {
  id: string;
  userId: string;
  timestamp: number;
  type: CreditTransactionType;
  description: string;
  credits: number;
  // Negative for share purchases (a simulated cost), positive for
  // energy-sale rewards.
  usdValue: number;
  // Present only for SHARE_PURCHASE rows.
  sharesChanged?: number;
}

export interface SimulateEnergySaleRequest {
  energySoldKWh: number;
  pricePerKWhUSD?: number;
}

export interface BuySharesRequest {
  sharesToBuy: number;
}

export interface BuySharesResponse {
  success: boolean;
  message: string;
  portfolio?: UserPortfolio;
  transaction?: CreditTransaction;
  reasonCode?: string;
}
