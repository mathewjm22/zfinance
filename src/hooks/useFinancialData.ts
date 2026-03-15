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


  // Calculate estimated annual expenses for retirement
  const estimatedAnnualExpensesBreakdown = (data.expenseCategories || [])
    .filter(cat => cat.isRetirement !== false)
    .map(cat => {
      let annualCost = 0;

      if (cat.retirementAnnualOverride !== undefined) {
        // Use manual override if present
        annualCost = cat.retirementAnnualOverride;
      } else {
        // Calculate historical average
        const catTxs = (data.transactions || []).filter(t => t.categoryId === cat.id);
        
        let totalSpent = 0;
        const yearsWithData = new Set<string>();
        
        catTxs.forEach(t => {
          totalSpent += t.amount;
          yearsWithData.add(t.date.slice(0, 4));
        });

        const numYears = Math.max(1, yearsWithData.size);
        annualCost = totalSpent / numYears;

        // If no transactions exist for this category, fall back to the monthly budget * 12
        if (annualCost === 0 && cat.budget > 0) {
          annualCost = cat.budget * 12;
        }
      }

      // We calculate the future cost at retirement by compounding inflation over the years until retirement
      // Note: The FIRE number calculation usually works in "today's dollars" (which inflation adjusts the target),
      // but to accurately factor in category-specific inflation vs. generic inflation, we could adjust the relative weights here.
      // However, for simplicity and alignment with standard FIRE models, we will provide the "Today's Dollars" 
      // equivalent of their estimated retirement spend, while allowing the UI to show they've considered inflation.
      // Since the user specifically wanted to factor in that some costs rise faster than others,
      // we will compute the future inflated cost at retirement, then deflate it back to today's dollars using the global inflation rate,
      // giving us an accurate "real" cost in today's money that accounts for differential inflation.

      const yearsToRetirement = Math.max(0, data.personalInfo.retirementAge - data.personalInfo.age);
      const catInflation = cat.retirementInflationRate !== undefined ? cat.retirementInflationRate / 100 : data.personalInfo.inflationRate / 100;
      const globalInflation = data.personalInfo.inflationRate / 100;

      let realCostInTodaysDollars = annualCost;
      if (yearsToRetirement > 0) {
         const futureNominalCost = annualCost * Math.pow(1 + catInflation, yearsToRetirement);
         realCostInTodaysDollars = futureNominalCost / Math.pow(1 + globalInflation, yearsToRetirement);
      }

      return {
        categoryId: cat.id,
        name: cat.name,
        amount: realCostInTodaysDollars,
        baseAmount: annualCost, // store original for reference if needed
        inflationRate: cat.retirementInflationRate !== undefined ? cat.retirementInflationRate : data.personalInfo.inflationRate
      };
    });

  const estimatedAnnualExpenses = estimatedAnnualExpensesBreakdown.reduce((totalEst, cat) => totalEst + cat.amount, 0);

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
    estimatedAnnualExpensesBreakdown,
    totalContributions,
    monthlyNet,
    savingsRate,
    yearsToRetirement,
    netWorthProgress,
    projectedAtRetirement,
  };
}
