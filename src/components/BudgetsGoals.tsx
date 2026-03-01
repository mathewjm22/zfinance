import { useState } from 'react';
import { FinancialData, Budget, SavingsGoal } from '../types';
import { Plus, Trash2, Edit2, Save, Target } from 'lucide-react';

export default function BudgetsGoals({ data, setData }: { data: FinancialData, setData: (d: FinancialData) => void }) {
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const handleUpdateBudget = (id: string, field: keyof Budget, value: string | number) => {
    setData({
      ...data,
      budgets: data.budgets.map(b => b.id === id ? { ...b, [field]: value } : b)
    });
  };

  const handleUpdateGoal = (id: string, field: keyof SavingsGoal, value: string | number) => {
    setData({
      ...data,
      savingsGoals: data.savingsGoals.map(g => g.id === id ? { ...g, [field]: value } : g)
    });
  };

  const addBudget = () => {
    const newBudget: Budget = { id: Date.now().toString(), category: 'New Category', amount: 0 };
    setData({ ...data, budgets: [...(data.budgets || []), newBudget] });
    setEditingBudget(newBudget.id);
  };

  const addGoal = () => {
    const newGoal: SavingsGoal = { id: Date.now().toString(), name: 'New Goal', targetAmount: 1000, currentAmount: 0 };
    setData({ ...data, savingsGoals: [...(data.savingsGoals || []), newGoal] });
    setEditingGoal(newGoal.id);
  };

  const deleteBudget = (id: string) => {
    setData({ ...data, budgets: data.budgets.filter(b => b.id !== id) });
  };

  const deleteGoal = (id: string) => {
    setData({ ...data, savingsGoals: data.savingsGoals.filter(g => g.id !== id) });
  };

  const getCategorySpent = (category: string) => {
    return (data.expenses || [])
      .filter(e => (e.category || '').toLowerCase() === (category || '').toLowerCase())
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-zinc-100">Budgets & Goals</h2>
        <p className="text-zinc-400 mt-1">Track your spending limits and savings targets.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Budgets Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-zinc-100">Monthly Budgets</h3>
            <button onClick={addBudget} className="flex items-center space-x-2 text-sm bg-lime-500 hover:bg-lime-400 text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Budget</span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(data.budgets || []).map(budget => {
              const spent = getCategorySpent(budget.category);
              const percent = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
              const isOver = spent > budget.amount;

              return (
                <div key={budget.id} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl group">
                  {editingBudget === budget.id ? (
                    <div className="flex items-center space-x-4 mb-2">
                      <input 
                        type="text" 
                        value={budget.category} 
                        onChange={(e) => handleUpdateBudget(budget.id, 'category', e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                        placeholder="Category"
                      />
                      <input 
                        type="number" 
                        value={budget.amount} 
                        onChange={(e) => handleUpdateBudget(budget.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                        placeholder="Limit"
                      />
                      <button onClick={() => setEditingBudget(null)} className="p-2 text-lime-400 hover:bg-lime-500/10 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-zinc-200">{budget.category}</p>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-zinc-400">
                          <span className={isOver ? 'text-red-400' : 'text-zinc-100'}>${spent.toLocaleString()}</span> / ${budget.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingBudget(budget.id)} className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteBudget(budget.id)} className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-lime-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goals Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-zinc-100">Savings Goals</h3>
            <button onClick={addGoal} className="flex items-center space-x-2 text-sm bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(data.savingsGoals || []).map(goal => {
              const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

              return (
                <div key={goal.id} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl group">
                  {editingGoal === goal.id ? (
                    <div className="flex flex-col space-y-2 mb-2">
                      <input 
                        type="text" 
                        value={goal.name} 
                        onChange={(e) => handleUpdateGoal(goal.id, 'name', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                        placeholder="Goal Name"
                      />
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          value={goal.currentAmount} 
                          onChange={(e) => handleUpdateGoal(goal.id, 'currentAmount', parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                          placeholder="Current Amount"
                        />
                        <input 
                          type="number" 
                          value={goal.targetAmount} 
                          onChange={(e) => handleUpdateGoal(goal.id, 'targetAmount', parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-lime-500"
                          placeholder="Target Amount"
                        />
                        <button onClick={() => setEditingGoal(null)} className="p-2 text-lime-400 hover:bg-lime-500/10 rounded-lg">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-lime-400" />
                        <p className="font-medium text-zinc-200">{goal.name}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-zinc-400">
                          <span className="text-zinc-100">${goal.currentAmount.toLocaleString()}</span> / ${goal.targetAmount.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingGoal(goal.id)} className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteGoal(goal.id)} className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-lime-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 text-right">{percent.toFixed(1)}% Complete</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
