/**
 * Fallback demo data used when the backend API is unavailable (e.g. GitHub Pages).
 * Mirrors the shape returned by the real API so every service/hook works without changes.
 */
export const MOCK_CREDIT_TYPES = [
  {
    id: 'mock-1',
    name: 'Personal Credit',
    description: 'For personal expenses: travel, home improvements, emergencies and more.',
    minAmount: 5000,
    maxAmount: 200000,
    baseInterestRate: 18,
    minTermMonths: 12,
    maxTermMonths: 60,
    isActive: true,
  },
  {
    id: 'mock-2',
    name: 'Express Credit',
    description: 'Same-day approval for small amounts. No collateral required.',
    minAmount: 1000,
    maxAmount: 50000,
    baseInterestRate: 24,
    minTermMonths: 6,
    maxTermMonths: 24,
    isActive: true,
  },
  {
    id: 'mock-3',
    name: 'Consolidation Credit',
    description: 'Combine all your existing debts into one manageable monthly payment.',
    minAmount: 10000,
    maxAmount: 500000,
    baseInterestRate: 15,
    minTermMonths: 24,
    maxTermMonths: 120,
    isActive: true,
  },
  {
    id: 'mock-4',
    name: 'Business Credit',
    description: 'Flexible financing to grow your business or cover operating costs.',
    minAmount: 20000,
    maxAmount: 1000000,
    baseInterestRate: 16,
    minTermMonths: 12,
    maxTermMonths: 84,
    isActive: true,
  },
];
