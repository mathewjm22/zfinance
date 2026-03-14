import { TrendingDown, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalMonthlyExpenses: number;
}

export function ExpensesTab({ data, updateData, totalMonthlyExpenses }: Props) {
  const addCategory = () => updateData(d => ({
    ...d,
    expenseCategories: [...d.expenseCategories, { id: uid(), name: 'New Category', amount: 0, budget: 0, color: '#7aa2f7' }],
  }));

  const remove = (id: string) => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.filter(e => e.id !== id) }));

  const totalBudget = data.expenseCategories.reduce((s, e) => s + e.budget, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Spending', value: totalMonthlyExpenses, color: '#f7768e' },
          { label: 'Total Budget',   value: totalBudget,          color: '#7aa2f7' },
          { label: 'Over/Under',     value: totalBudget - totalMonthlyExpenses, color: totalBudget >= totalMonthlyExpenses ? '#9ece6a' : '#f7768e' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.label === 'Over/Under' && s.value >= 0 ? '+' : ''}{fmt.compact(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Budget vs Actual</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.expenseCategories} barSize={12} barGap={2}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
            <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
            <Bar dataKey="budget" name="Budget" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
            <Bar dataKey="amount" name="Actual" radius={[4, 4, 0, 0]}>
              {data.expenseCategories.map((e, i) => <Cell key={i} fill={e.amount > e.budget ? '#f7768e' : e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
            <TrendingDown size={16} style={{ color: '#f7768e' }} /> Expense Categories
          </h3>
          <button onClick={addCategory} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(247,118,142,0.12)', color: '#f7768e' }}>
            <Plus size={12} /> Add Category
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2030' }}>
                {['Category', 'Actual/mo', 'Budget/mo', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-xs font-medium" style={{ color: '#565f89' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.expenseCategories.map(exp => {
                const over = exp.amount > exp.budget && exp.budget > 0;
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #1e203060' }}>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: exp.color }} />
                        <input value={exp.name} onChange={e => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, name: e.target.value } : c) }))}
                          className="bg-transparent border-0 p-0 text-sm w-full" style={{ color: '#c0caf5' }} />
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <EditableValue value={exp.amount} size="sm"
                        onChange={v => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, amount: v } : c) }))} />
                    </td>
                    <td className="py-2 px-2">
                      <EditableValue value={exp.budget} size="sm"
                        onChange={v => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, budget: v } : c) }))} />
                    </td>
                    <td className="py-2 px-2">
                      <span className={`chip ${over ? 'chip-danger' : 'chip-success'}`}>{over ? 'Over' : '✓ OK'}</span>
                    </td>
                    <td className="py-2 px-2">
                      <button onClick={() => remove(exp.id)} className="p-1 rounded hover:bg-red-900/20">
                        <Trash2 size={12} style={{ color: '#f7768e' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
