export interface Income {
  id: string;
  source: string;
  amount: number;
}

export interface Expense {
  id: string;
  category: string;
  subCategory: string;
  amount: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  expectedReturn: number;
}

export interface RetirementPlan {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  inflationRate: number;
  monthlyContribution: number;
  desiredAnnualSpend: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface FinancialData {
  income: Income[];
  expenses: Expense[];
  accounts: Account[];
  retirement: RetirementPlan;
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}
