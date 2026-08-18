import { Router } from "express";
import { SimulateEnergySaleRequest } from "../types/finance";
import { financeStore } from "../data/mockFinance";
import {
  nextTransactionId,
  transactionStore,
} from "../data/mockTransactions";
import { findAccountById } from "../data/mockUsers";
import {
  computeProjectFinance,
  round2,
  usdToCredits,
} from "../services/financeService";
import { computeUserPortfolio } from "../services/userPortfolioService";
import { recordEvent } from "../services/eventService";

export const projectRouter = Router();

// The demo user that receives simulated energy-sale rewards.
const DEMO_INVESTOR_ID = "user-001";

/**
 * GET /api/project/finance
 * Returns the simulated project finance snapshot. Gross revenue and the
 * user reward pool are computed from the stored parameters.
 */
projectRouter.get("/api/project/finance", (_req, res) => {
  res.json(computeProjectFinance());
});

/**
 * POST /api/project/simulate-energy-sale
 * Body: { energySoldKWh, pricePerKWhUSD? }
 *
 * Simulates the project selling more energy:
 *   1. Adds energySoldKWh to totalEnergySoldKWh.
 *   2. Optionally updates pricePerKWhUSD.
 *   3. Appends an ENERGY_SALE_REWARD transaction for the demo investor,
 *      with the credits earned from THIS sale.
 *
 * Auth is demo-level, so this is not access-controlled at the HTTP layer
 * — in the product only an admin would be able to reach it.
 */
projectRouter.post("/api/project/simulate-energy-sale", (req, res) => {
  const body = req.body as Partial<SimulateEnergySaleRequest>;
  const energySoldKWh = Number(body?.energySoldKWh);

  if (!Number.isFinite(energySoldKWh) || energySoldKWh <= 0) {
    return res.status(400).json({
      success: false,
      message: "energySoldKWh must be a positive number.",
    });
  }

  const params = financeStore.params;

  // Optionally update the price per kWh for the project going forward.
  if (body?.pricePerKWhUSD !== undefined) {
    const price = Number(body.pricePerKWhUSD);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "pricePerKWhUSD must be a positive number.",
      });
    }
    params.pricePerKWhUSD = price;
  }

  // Apply the sale.
  params.totalEnergySoldKWh += energySoldKWh;

  // Compute the demo investor's reward from THIS incremental sale.
  const investor = findAccountById(DEMO_INVESTOR_ID);
  const ownershipFraction =
    investor && params.totalProjectShares > 0
      ? investor.ownedShares / params.totalProjectShares
      : 0;
  const incrementalGrossUSD = energySoldKWh * params.pricePerKWhUSD;
  const incrementalPoolUSD =
    incrementalGrossUSD * (params.rewardPercentToUsers / 100);
  const incrementalEarningsUSD = incrementalPoolUSD * ownershipFraction;
  const incrementalCredits = usdToCredits(
    incrementalEarningsUSD,
    params.creditConversionRateUSD
  );

  const transaction = {
    id: nextTransactionId(),
    userId: DEMO_INVESTOR_ID,
    timestamp: Date.now(),
    type: "ENERGY_SALE_REWARD" as const,
    description: "Energy Sale Reward",
    credits: incrementalCredits,
    usdValue: round2(incrementalEarningsUSD),
  };
  transactionStore.transactions.unshift(transaction);

  recordEvent(
    "ENERGY_SALE_SIMULATED",
    `Simulated energy sale: ${energySoldKWh} kWh at $${params.pricePerKWhUSD}/kWh. ` +
      `Demo investor earned ${incrementalCredits} Project Credits.`,
    "info",
    { energySoldKWh, pricePerKWhUSD: params.pricePerKWhUSD }
  );

  return res.json({
    success: true,
    finance: computeProjectFinance(),
    transaction,
    portfolio: computeUserPortfolio(DEMO_INVESTOR_ID),
  });
});
