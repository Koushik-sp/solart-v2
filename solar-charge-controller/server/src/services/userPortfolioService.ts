import { UserPortfolio } from "../types/finance";
import { financeStore } from "../data/mockFinance";
import { findAccountById } from "../data/mockUsers";
import { computeProjectFinance, round2, usdToCredits } from "./financeService";

// ---------------------------------------------------------------------------
// USER PORTFOLIO SERVICE
// ---------------------------------------------------------------------------
// Computes a single user's simulated stake in the project. A user earns
// a share of the user reward pool proportional to the fraction of total
// project shares they own — they do NOT get the whole 15% pool unless
// they own 100% of shares.
//
//   userOwnershipPercent = ownedShares / totalProjectShares
//   userEarningsUSD      = userRewardPoolUSD * userOwnershipPercent
//   userEarnedCredits    = userEarningsUSD / creditConversionRateUSD
// ---------------------------------------------------------------------------

export function computeUserPortfolio(userId: string): UserPortfolio | null {
  const account = findAccountById(userId);
  if (!account) return null;

  const params = financeStore.params;
  const finance = computeProjectFinance();

  const ownershipFraction =
    params.totalProjectShares > 0
      ? account.ownedShares / params.totalProjectShares
      : 0;

  const userEarningsUSD = finance.userRewardPoolUSD * ownershipFraction;
  const totalCreditsEarned = usdToCredits(
    userEarningsUSD,
    params.creditConversionRateUSD
  );

  // Shares the user could still buy — never more than the total.
  const availableShares = Math.max(
    0,
    params.totalProjectShares - account.ownedShares
  );

  return {
    userId: account.id,
    displayName: account.displayName,
    ownedShares: account.ownedShares,
    totalProjectShares: params.totalProjectShares,
    availableShares,
    sharePriceUSD: params.sharePriceUSD,
    ownershipPercent: round2(ownershipFraction * 100),
    totalCreditsEarned,
    estimatedUSDValue: round2(userEarningsUSD),
    userTotalSimulatedInvestedUSD: round2(account.totalSimulatedInvestedUSD),
    creditConversionRateUSD: params.creditConversionRateUSD,
    creditName: params.creditName,
  };
}
