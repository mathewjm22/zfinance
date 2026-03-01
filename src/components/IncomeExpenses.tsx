import { useState } from "react";
import { FinancialData, Income, Expense } from "../types";
import { Plus, Trash2, Edit2, Save } from "lucide-react";

export default function IncomeExpenses({
  data,
  setData,
}: {
  data: FinancialData;
  setData: (d: FinancialData) => void;
}) {
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  const handleUpdateIncome = (
    id: string,
    field: keyof Income,
    value: string | number,
  ) => {
    setData({
      ...data,
      income: (data.income || []).map((inc) =>
        inc.id === id ? { ...inc, [field]: value } : inc,
      ),
    });
  };

  const handleUpdateExpense = (
    id: string,
    field: keyof Expense,
    value: string | number,
  ) => {
    setData({
      ...data,
      expenses: (data.expenses || []).map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    });
  };

  const addIncome = () => {
    const newIncome: Income = {
      id: Date.now().toString(),
      source: "New Income",
      amount: 0,
    };
    setData({ ...data, income: [...(data.income || []), newIncome] });
    setEditingIncome(newIncome.id);
  };

  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: "New Category",
      subCategory: "New Sub",
      amount: 0,
    };
    setData({ ...data, expenses: [...(data.expenses || []), newExpense] });
    setEditingExpense(newExpense.id);
  };

  const deleteIncome = (id: string) => {
    setData({ ...data, income: (data.income || []).filter((i) => i.id !== id) });
  };

  const deleteExpense = (id: string) => {
    setData({ ...data, expenses: (data.expenses || []).filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-zinc-100">Income & Expenses</h2>
        <p className="text-zinc-400 mt-1">Manage your monthly cash flow.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Income Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-zinc-100">
              Monthly Income
            </h3>
            <button
              onClick={addIncome}
              className="flex items-center space-x-2 text-sm bg-lime-500 hover:bg-lime-400 text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Income</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(data.income || []).map((inc) => (
              <div
                key={inc.id}
                className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl group"
              >
                {editingIncome === inc.id ? (
                  <div className="flex-1 flex items-center space-x-4">
                    <input
                      type="text"
                      value={inc.source}
                      onChange={(e) =>
                        handleUpdateIncome(inc.id, "source", e.target.value)
                      }
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                    />
                    <input
                      type="number"
                      value={inc.amount}
                      onChange={(e) =>
                        handleUpdateIncome(
                          inc.id,
                          "amount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                    />
                    <button
                      onClick={() => setEditingIncome(null)}
                      className="p-2 text-lime-400 hover:bg-lime-500/10 rounded-lg"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-zinc-200">{inc.source}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-lime-400">
                        ${inc.amount.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingIncome(inc.id)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteIncome(inc.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center p-4 border-t border-zinc-800 mt-4">
            <span className="font-semibold text-zinc-400">Total Income</span>
            <span className="font-bold text-xl text-zinc-100">
              $
              {(data.income || [])
                .reduce((sum, i) => sum + (i?.amount || 0), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-zinc-100">
              Monthly Expenses
            </h3>
            <button
              onClick={addExpense}
              className="flex items-center space-x-2 text-sm bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(data.expenses || []).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl group"
              >
                {editingExpense === exp.id ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={exp.category}
                        onChange={(e) =>
                          handleUpdateExpense(
                            exp.id,
                            "category",
                            e.target.value,
                          )
                        }
                        placeholder="Category"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                      />
                      <input
                        type="text"
                        value={exp.subCategory}
                        onChange={(e) =>
                          handleUpdateExpense(
                            exp.id,
                            "subCategory",
                            e.target.value,
                          )
                        }
                        placeholder="Sub-category"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div className="flex space-x-2 justify-end">
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) =>
                          handleUpdateExpense(
                            exp.id,
                            "amount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                      />
                      <button
                        onClick={() => setEditingExpense(null)}
                        className="p-2 text-lime-400 hover:bg-lime-500/10 rounded-lg"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-zinc-200">
                        {exp.category}
                      </p>
                      <p className="text-sm text-zinc-500">{exp.subCategory}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-zinc-100">
                        ${exp.amount.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(exp.id)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center p-4 border-t border-zinc-800 mt-4">
            <span className="font-semibold text-zinc-400">Total Expenses</span>
            <span className="font-bold text-xl text-zinc-100">
              $
              {(data.expenses || [])
                .reduce((sum, e) => sum + (e?.amount || 0), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
