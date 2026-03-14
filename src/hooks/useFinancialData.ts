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
  const totalMonthlyExpenses = data.expenseCategories.reduce((s, e) => s + e.amount, 0);
  const totalContributions   = data.retirementContributions.reduce((s, c) => s + c.monthlyAmount, 0);
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
    totalContributions,
    monthlyNet,
    savingsRate,
    yearsToRetirement,
    netWorthProgress,
    projectedAtRetirement,
  };
}
