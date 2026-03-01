/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { FinancialData } from "./types";
import { initialData } from "./data/initialData";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import IncomeExpenses from "./components/IncomeExpenses";
import BudgetsGoals from "./components/BudgetsGoals";
import Accounts from "./components/Accounts";
import Retirement from "./components/Retirement";
import Settings from "./components/Settings";

export default function App() {
  const [data, setData] = useState<FinancialData>(() => {
    const saved = localStorage.getItem("financialData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Ensure new fields exist if loading old data
          return {
            ...initialData,
            ...parsed,
            income: parsed.income || initialData.income,
            expenses: parsed.expenses || initialData.expenses,
            accounts: parsed.accounts || initialData.accounts,
            retirement: parsed.retirement || initialData.retirement,
            budgets: parsed.budgets || initialData.budgets,
            savingsGoals: parsed.savingsGoals || initialData.savingsGoals
          };
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return initialData;
  });

  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    localStorage.setItem("financialData", JSON.stringify(data));
  }, [data]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={data} />;
      case "income-expenses":
        return <IncomeExpenses data={data} setData={setData} />;
      case "budgets-goals":
        return <BudgetsGoals data={data} setData={setData} />;
      case "accounts":
        return <Accounts data={data} setData={setData} />;
      case "retirement":
        return <Retirement data={data} setData={setData} />;
      case "settings":
        return <Settings data={data} setData={setData} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8">{renderContent()}</main>
    </div>
  );
}
