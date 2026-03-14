// All TypeScript interfaces for WealthDash financial data

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  type: 'brokerage' | 'retirement' | 'hsa' | 'bond' | 'checking' | 'savings' | 'other';
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  gross: number;
  type: 'salary' | 'bonus' | 'rental' | 'dividend' | 'other';
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  budget: number;
  color: string;
}

export interface RetirementContribution {
  id: string;
  accountName: string;
  monthlyAmount: number;
  annualMax: number;
  employerMatch: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
}

export interface TaxInfo {
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  federalTaxableIncome: number;
  stateTaxRate: number;
  itemizedDeductions: number;
  standardDeduction: number;
  preTaxContributions: number;
}

export interface PortfolioHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  price: number;
  allocation: number;
  assetClass: 'us_stock' | 'intl_stock' | 'bond' | 'reit' | 'commodity' | 'cash';
}

export interface CollegePlan {
  id: string;
  childName: string;
  currentAge: number;
  collegeAge: number;
  currentSaved: number;
  monthlyContribution: number;
  estimatedYearlyCost: number;
  years529: number;
}

export interface HealthRecord {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface PersonalInfo {
  name: string;
  age: number;
  retirementAge: number;
  retirementGoal: number;
  currentSavingsRate: number;
  expectedReturn: number;  // % annual
  inflationRate: number;   // %
  safeWithdrawalRate: number; // %
}

export interface FinancialData {
  version: number;
  lastUpdated: string;
  personalInfo: PersonalInfo;
  accounts: Account[];
  incomeSources: IncomeSource[];
  expenseCategories: ExpenseCategory[];
  retirementContributions: RetirementContribution[];
  goals: FinancialGoal[];
  taxInfo: TaxInfo;
  portfolioHoldings: PortfolioHolding[];
  collegePlans: CollegePlan[];
  healthRecords: HealthRecord[];
  hsaBalance: number;
  hsaMonthlyContribution: number;
}
