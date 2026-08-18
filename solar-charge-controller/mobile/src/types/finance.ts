// Mirror of server/src/types/finance.ts. Keep in sync with the gateway.
//
// IMPORTANT: Project Credits are simulated MVP credits. They are NOT
// real money, NOT cryptocurrency, NOT a security, and cannot be
// withdrawn. 1 Project Credit = $0.01 USD is a fixed display constant.

export interface ProjectFinance {
  totalProjectShares: number;
  totalEnergySoldKWh: number;
  pricePerKWhUSD: number;
  grossRevenueUSD: number;
  rewardPercentToUsers: number;
  userRewardPoolUSD: number;
  creditConversionRateUSD: number;
  creditName: string;
  sharePriceUSD: number;
}

export interface UserPortfolio {
  userId: string;
  displayName: string;
  ownedShares: number;
  totalProjectShares: number;
  availableShares: number;
  sharePriceUSD: number;
  ownershipPercent: number;
  totalCreditsEarned: number;
  estimatedUSDValue: number;
  userTotalSimulatedInvestedUSD: number;
  creditConversionRateUSD: number;
  creditName: string;
}

export type CreditTransactionType = "ENERGY_SALE_REWARD" | "SHARE_PURCHASE";

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
  sharesChanged?: number;
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
