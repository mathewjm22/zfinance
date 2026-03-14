import { Target, Plus, Trash2 } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
}

export function GoalsTab({ data, updateData }: Props) {
  const addGoal = () => updateData(d => ({
    ...d,
    goals: [...d.goals, { id: uid(), name: 'New Goal', targetAmount: 10_000, currentAmount: 0, targetDate: '2026-12-31', color: '#7aa2f7' }],
  }));
  const remove = (id: string) => updateData(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
          <Target size={16} style={{ color: '#7aa2f7' }} /> Financial Goals
        </h2>
        <button onClick={addGoal} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(122,162,247,0.12)', color: '#7aa2f7' }}>
          <Plus size={12} /> Add Goal
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.goals.map(goal => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          return (
            <div key={goal.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <input
                    value={goal.name}
                    onChange={e => updateData(d => ({ ...d, goals: d.goals.map(g => g.id === goal.id ? { ...g, name: e.target.value } : g) }))}
                    className="bg-transparent border-0 p-0 font-semibold text-sm w-full" style={{ color: '#c0caf5' }}
                  />
                  <p className="text-xs mt-0.5" style={{ color: '#565f89' }}>Due: {goal.targetDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`chip ${pct >= 100 ? 'chip-success' : pct >= 50 ? 'chip-info' : 'chip-warning'}`}>
                    {pct.toFixed(0)}%
                  </span>
                  <button onClick={() => remove(goal.id)} className="p-1 rounded hover:bg-red-900/20">
                    <Trash2 size={12} style={{ color: '#f7768e' }} />
                  </button>
                </div>
              </div>

              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                <div className="p-2 rounded-lg" style={{ background: '#1a1b26' }}>
                  <p style={{ color: '#565f89' }}>Saved</p>
                  <EditableValue value={goal.currentAmount} size="sm"
                    onChange={v => updateData(d => ({ ...d, goals: d.goals.map(g => g.id === goal.id ? { ...g, currentAmount: v } : g) }))} />
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#1a1b26' }}>
                  <p style={{ color: '#565f89' }}>Target</p>
                  <EditableValue value={goal.targetAmount} size="sm"
                    onChange={v => updateData(d => ({ ...d, goals: d.goals.map(g => g.id === goal.id ? { ...g, targetAmount: v } : g) }))} />
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#1a1b26' }}>
                  <p style={{ color: '#565f89' }}>Remaining</p>
                  <p className="text-xs font-medium mt-1" style={{ color: remaining > 0 ? '#f7768e' : '#9ece6a' }}>{fmt.compact(remaining)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
