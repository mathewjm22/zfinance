import { GraduationCap, Target } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (d: FinancialData) => FinancialData) => void;
}

export function CollegeTab({ data, updateData }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
          <GraduationCap size={16} style={{ color: '#bb9af7' }} /> College Savings (529)
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {data.collegePlans.map(plan => {
          const yearsRemaining = Math.max(0, plan.collegeAge - plan.currentAge);
          // Future value of current savings + future contributions
          const r = data.personalInfo.expectedReturn / 100;
          const projected = plan.currentSaved * Math.pow(1 + r, yearsRemaining) +
            (plan.monthlyContribution * 12) * ((Math.pow(1 + r, yearsRemaining) - 1) / r);

          const totalCost = plan.estimatedYearlyCost * 4; // Assume 4 years
          const pct = Math.min(100, (projected / totalCost) * 100);

          return (
            <div key={plan.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <input
                  value={plan.childName}
                  onChange={e => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, childName: e.target.value } : p) }))}
                  className="bg-transparent border-0 p-0 font-bold text-lg"
                  style={{ color: '#bb9af7' }}
                />
                <div className="p-2 rounded-lg" style={{ background: '#1a1b26' }}>
                  <p className="text-xs" style={{ color: '#565f89' }}>Years until college</p>
                  <p className="text-xl font-bold" style={{ color: '#7aa2f7' }}>{yearsRemaining}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#565f89' }}>Current Age</p>
                  <EditableValue value={plan.currentAge} onChange={v => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, currentAge: v } : p) }))} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#565f89' }}>College Age</p>
                  <EditableValue value={plan.collegeAge} onChange={v => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, collegeAge: v } : p) }))} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#565f89' }}>Current Saved</p>
                  <EditableValue value={plan.currentSaved} onChange={v => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, currentSaved: v } : p) }))} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#565f89' }}>Monthly Contrib.</p>
                  <EditableValue value={plan.monthlyContribution} onChange={v => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, monthlyContribution: v } : p) }))} />
                </div>
                <div className="col-span-2">
                  <p className="text-xs mb-1" style={{ color: '#565f89' }}>Est. Yearly Cost in Today's $</p>
                  <EditableValue value={plan.estimatedYearlyCost} onChange={v => updateData(d => ({ ...d, collegePlans: d.collegePlans.map(p => p.id === plan.id ? { ...p, estimatedYearlyCost: v } : p) }))} />
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#1e2030' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#c0caf5' }}>
                    <Target size={14} style={{ color: '#9ece6a' }} /> Projected at age {plan.collegeAge}
                  </span>
                  <span className="font-bold" style={{ color: pct >= 100 ? '#9ece6a' : '#e0af68' }}>{pct.toFixed(0)}% funded</span>
                </div>
                <div className="progress-bar mb-3 h-3">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#9ece6a' : 'linear-gradient(90deg, #7aa2f7, #bb9af7)' }} />
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#7aa2f7' }}>Projected: {fmt.compact(projected)}</span>
                  <span style={{ color: '#f7768e' }}>Total 4y Cost: {fmt.compact(totalCost)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
