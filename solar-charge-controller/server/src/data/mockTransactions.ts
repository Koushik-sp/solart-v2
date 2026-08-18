import { CreditTransaction } from "../types/finance";

// ---------------------------------------------------------------------------
// SIMULATED TRANSACTION HISTORY — SEED DATA
// ---------------------------------------------------------------------------
// An illustrative earnings/transaction history for the demo user. These
// rows are independent demo data — they do not have to sum to the user's
// computed totalCreditsEarned (which is derived from the project finance
// formula). New rows are appended when an admin simulates an energy sale.
// ---------------------------------------------------------------------------

const HOUR_MS = 3_600_000;

export function createInitialTransactions(): CreditTransaction[] {
  const now = Date.now();
  return [
    {
      id: "txn-001",
      userId: "user-001",
      timestamp: now - HOUR_MS * 3,
      type: "ENERGY_SALE_REWARD",
      description: "Energy Sale Reward",
      credits: 450,
      usdValue: 4.5,
    },
    {
      id: "txn-002",
      userId: "user-001",
      timestamp: now - HOUR_MS * 27,
      type: "ENERGY_SALE_REWARD",
      description: "Energy Sale Reward",
      credits: 380,
      usdValue: 3.8,
    },
    {
      id: "txn-003",
      userId: "user-001",
      timestamp: now - HOUR_MS * 51,
      type: "ENERGY_SALE_REWARD",
      description: "Energy Sale Reward",
      credits: 520,
      usdValue: 5.2,
    },
    {
      id: "txn-004",
      userId: "user-001",
      timestamp: now - HOUR_MS * 75,
      type: "SHARE_PURCHASE",
      description: "Share Purchase Simulation",
      credits: 0,
      usdValue: 0,
      sharesChanged: 100,
    },
  ];
}

// In-memory mutable store. /api/sim/reset restores the seed list.
export const transactionStore: { transactions: CreditTransaction[] } = {
  transactions: createInitialTransactions(),
};

let txnCounter = 100;

export function nextTransactionId(): string {
  txnCounter += 1;
  return `txn-${txnCounter}`;
}
