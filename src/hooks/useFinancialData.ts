import { useState, useCallback } from 'react';
import { FinancialData } from '../types';
import { defaultData } from '../data/defaultData';

const STORAGE_KEY = 'zfinance_data';

function load(): FinancialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinancialData;
      // Migrate if needed
      return { ...defaultData, ...parsed, version: 1 };
    }
  } catch {/* ignore */}
  return { ...defaultData, lastUpdated: new Date().toISOString() };
}

function save(data: FinancialData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString(),
    }));
  } catch {/* ignore */}
}

export function useFinancialData() {
  const [data, setData] = useState<FinancialData>(load);

  const updateData = useCallback((updater: (prev: FinancialData) => FinancialData) => {
    setData(prev => {
      const next = { ...updater(prev), lastUpdated: new Date().toISOString() };
      save(next);
      return next;
    });
  }, []);

  const setDataFromDrive = useCallback((driveData: FinancialData) => {
    const merged = { ...defaultData, ...driveData, version: 1, lastUpdated: new Date().toISOString() };
    save(merged);
    setData(merged);
  }, []);

  const resetToDefaults = useCallback(() => {
    const fresh = { ...defaultData, lastUpdated: new Date().toISOString() };
    save(fresh);
    setData(fresh);
  }, []);

  // Derived totals
  const totalNetWorth     = data.accounts.reduce((s, a) => s + a.balance, 0);
  const totalMonthlyIncome   = data.incomeSources.reduce((s, i) => s + i.amount, 0);
  const totalGrossIncome     = data.incomeSources.reduce((s, i) => s + i.gross, 0);
  // Calculate current month strings (YYYY-MM)
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Expenses this month
  const totalMonthlyExpenses = (data.transactions || [])
    .filter(t => t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  // First calculate the global number of active months per year across all transactions
  const activeMonthsPerYear: Record<string, Set<string>> = {};
  (data.transactions || []).forEach(t => {
    const year = t.date.slice(0, 4);
    const month = t.date.slice(0, 7);
    if (!activeMonthsPerYear[year]) activeMonthsPerYear[year] = new Set();
    activeMonthsPerYear[year].add(month);
  });

  // Calculate estimated annual expenses by finding the highest extrapolated year per category
  const estimatedAnnualExpenses = (data.expenseCategories || []).reduce((totalEst, cat) => {
    // Group transactions by year and month
    const yearlyTotals: Record<string, number> = {};
    const catTxs = (data.transactions || []).filter(t => t.categoryId === cat.id);

    catTxs.forEach(t => {
      const year = t.date.slice(0, 4);
      yearlyTotals[year] = (yearlyTotals[year] || 0) + t.amount;
    });

    let maxAnnualForCat = 0;
    Object.entries(yearlyTotals).forEach(([year, total]) => {
      const numMonths = activeMonthsPerYear[year]?.size || 0;
      if (numMonths > 0) {
        // Extrapolate to full year based on the *global* active months for that year
        const extrapolated = (total / numMonths) * 12;
        if (extrapolated > maxAnnualForCat) {
          maxAnnualForCat = extrapolated;
        }
      }
    });

    // If no transactions exist for this category, we might want to fall back to the monthly budget * 12
    if (maxAnnualForCat === 0 && cat.budget > 0) {
      maxAnnualForCat = cat.budget * 12;
    }

    return totalEst + maxAnnualForCat;
  }, 0);

  const totalContributions = (data.retirementContributions || []).reduce(
    (s, c) => s + c.monthlyAmount + (c.monthlyAmount * (c.employerMatch || 0) / 100),
    0
  );

  const monthlyNet           = totalMonthlyIncome - totalMonthlyExpenses;
  const savingsRate          = totalGrossIncome > 0
    ? ((totalContributions + Math.max(0, monthlyNet)) / totalGrossIncome) * 100
    : 0;
  const yearsToRetirement    = Math.max(0, data.personalInfo.retirementAge - data.personalInfo.age);
  const netWorthProgress     = Math.min(100, (totalNetWorth / data.personalInfo.retirementGoal) * 100);

  // Future value of current portfolio at expected return
  const r = data.personalInfo.expectedReturn / 100;
  const n = yearsToRetirement;
  const projectedAtRetirement = totalNetWorth * Math.pow(1 + r, n)
    + totalContributions * 12 * ((Math.pow(1 + r, n) - 1) / r);

  return {
    data,
    updateData,
    setDataFromDrive,
    resetToDefaults,
    // Derived
    totalNetWorth,
    totalMonthlyIncome,
    totalGrossIncome,
    totalMonthlyExpenses,
    estimatedAnnualExpenses,
    totalContributions,
    monthlyNet,
    savingsRate,
    yearsToRetirement,
    netWorthProgress,
    projectedAtRetirement,
  };
}
