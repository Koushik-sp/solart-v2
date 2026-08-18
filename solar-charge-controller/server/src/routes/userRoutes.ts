import { Router } from "express";
import { BuySharesRequest, BuySharesResponse } from "../types/finance";
import { computeUserPortfolio } from "../services/userPortfolioService";
import { round2 } from "../services/financeService";
import { financeStore } from "../data/mockFinance";
import { findAccountById } from "../data/mockUsers";
import {
  nextTransactionId,
  transactionStore,
} from "../data/mockTransactions";
import { recordEvent } from "../services/eventService";

export const userRouter = Router();

/**
 * GET /api/users/:userId/portfolio
 * Returns the user's simulated stake: owned shares, ownership percent,
 * total Project Credits earned, estimated USD value, available shares,
 * share price, and total simulated amount invested.
 */
userRouter.get("/api/users/:userId/portfolio", (req, res) => {
  const portfolio = computeUserPortfolio(req.params.userId);
  if (!portfolio) {
    return res
      .status(404)
      .json({ success: false, message: "User not found." });
  }
  return res.json(portfolio);
});

/**
 * GET /api/users/:userId/transactions
 * Returns the user's simulated transaction history, newest first.
 */
userRouter.get("/api/users/:userId/transactions", (req, res) => {
  const { userId } = req.params;
  const transactions = transactionStore.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
  return res.json({ userId, transactions });
});

/**
 * POST /api/users/:userId/buy-shares
 * Body: { sharesToBuy }
 *
 * Simulated share purchase. This is SIMULATION ONLY — no real money is
 * charged, no real ownership/securities are created. It only mutates
 * mock in-memory data:
 *   1. Validates the user exists and sharesToBuy is a positive integer.
 *   2. Validates sharesToBuy does not exceed the available shares
 *      (totalProjectShares - ownedShares). Total project shares stay
 *      fixed for the MVP — only the user's owned shares increase.
 *   3. Increases ownedShares + totalSimulatedInvestedUSD.
 *   4. Appends a SHARE_PURCHASE transaction with a negative usdValue.
 */
userRouter.post("/api/users/:userId/buy-shares", (req, res) => {
  const account = findAccountById(req.params.userId);
  if (!account) {
    const fail: BuySharesResponse = {
      success: false,
      message: "User not found.",
      reasonCode: "USER_NOT_FOUND",
    };
    return res.status(404).json(fail);
  }

  const body = req.body as Partial<BuySharesRequest>;
  const sharesToBuy = Number(body?.sharesToBuy);

  // Must be a positive whole number — rejects 0, negatives, decimals,
  // and non-numeric input (Number("abc") -> NaN -> not an integer).
  if (!Number.isInteger(sharesToBuy) || sharesToBuy <= 0) {
    const fail: BuySharesResponse = {
      success: false,
      message: "sharesToBuy must be a positive whole number.",
      reasonCode: "INVALID_SHARES_AMOUNT",
    };
    return res.status(400).json(fail);
  }

  const params = financeStore.params;
  const availableShares = Math.max(
    0,
    params.totalProjectShares - account.ownedShares
  );

  if (sharesToBuy > availableShares) {
    const fail: BuySharesResponse = {
      success: false,
      message: "Cannot buy more shares than available.",
      reasonCode: "INSUFFICIENT_AVAILABLE_SHARES",
    };
    return res.status(409).json(fail);
  }

  // Apply the simulated purchase.
  const investmentAmountUSD = round2(sharesToBuy * params.sharePriceUSD);
  account.ownedShares += sharesToBuy;
  account.totalSimulatedInvestedUSD = round2(
    account.totalSimulatedInvestedUSD + investmentAmountUSD
  );

  const transaction = {
    id: nextTransactionId(),
    userId: account.id,
    timestamp: Date.now(),
    type: "SHARE_PURCHASE" as const,
    description: `Simulated purchase of ${sharesToBuy} project share${
      sharesToBuy === 1 ? "" : "s"
    }`,
    credits: 0,
    // Negative — a simulated investment cost, not earnings.
    usdValue: -investmentAmountUSD,
    sharesChanged: sharesToBuy,
  };
  transactionStore.transactions.unshift(transaction);

  recordEvent(
    "SHARES_PURCHASED",
    `${account.displayName} bought ${sharesToBuy} simulated project ` +
      `share${sharesToBuy === 1 ? "" : "s"} for $${investmentAmountUSD}.`,
    "info",
    { userId: account.id, sharesToBuy, investmentAmountUSD }
  );

  const ok: BuySharesResponse = {
    success: true,
    message: "Simulated purchase complete.",
    portfolio: computeUserPortfolio(account.id) ?? undefined,
    transaction,
  };
  return res.json(ok);
});
