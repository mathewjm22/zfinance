import { Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  totalNetWorth: number;
  totalContributions: number;
  estimatedAnnualExpenses: number;
  breakdown: { categoryId: string; name: string; amount: number; }[];
}

export function RetirementAnalysisTab({ data, totalNetWorth, totalContributions, estimatedAnnualExpenses, breakdown }: Props) {
  const pi = data.personalInfo;
  const currentAge = pi.age;
  const rAge = pi.retirementAge;
  const endAge = 95;
  const realReturn = pi.expectedReturn - pi.inflationRate;
  const annualContrib = totalContributions * 12;

  // Generate projection data
  const projection = [];
  let balance = totalNetWorth;
  for (let age = currentAge; age <= endAge; age++) {
    projection.push({ age, balance: Math.max(0, balance), target: pi.retirementGoal });
    if (age < rAge) {
      // Accumulation phase
      balance = balance * (1 + realReturn / 100) + annualContrib;
    } else {
      // Decumulation phase (withdrawing expenses)
      balance = balance * (1 + realReturn / 100) - estimatedAnnualExpenses;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-6" style={{ color: '#c0caf5' }}>
          <Calculator size={16} style={{ color: '#bb9af7' }} /> Monte Carlo / Deterministic Projection
        </h3>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2030" />
              <XAxis dataKey="age" tick={{ fill: '#565f89', fontSize: 11 }} />
              <YAxis tickFormatter={v => fmt.compact(v)} tick={{ fill: '#565f89', fontSize: 11 }} width={50} />
              <Tooltip 
                formatter={(v: any) => fmt.currency(v)}
                labelFormatter={(v) => `Age ${v}`}
                contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} 
              />
              <Line type="monotone" dataKey="balance" name="Projected Portfolio" stroke="#7aa2f7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="target" name="Retirement Goal" stroke="#f7768e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Retirement Expense Breakdown */}
      <div className="glass-card p-6 mt-6">
        <h3 className="text-sm font-semibold mb-2" style={{ color: '#c0caf5' }}>Estimated Retirement Expenses</h3>
        <p className="text-xs text-muted-foreground mb-4">
          This is an estimate of your annual expenses in retirement based on your highest historical spending per category.
          <br/><span className="text-info font-bold">Missing expenses?</span> (e.g., bills a spouse pays). Go to the <span className="text-primary cursor-pointer underline" onClick={() => document.querySelector('button:has(svg.lucide-trending-down)')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>Expenses Tab &gt; Yearly View</span> to manually add un-tracked transactions!
        </p>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2030] text-xs text-[#565f89] text-left">
                <th className="py-2 px-2 font-medium">Category</th>
                <th className="py-2 px-2 font-medium text-right">Estimated Annual Expense</th>
              </tr>
            </thead>
            <tbody>
              {[...breakdown].sort((a,b) => b.amount - a.amount).map(b => (
                <tr key={b.categoryId} className="border-b border-[#1e203060] hover:bg-white/5 transition-colors">
                  <td className="py-2 px-2 font-medium" style={{ color: '#c0caf5' }}>{b.name}</td>
                  <td className="py-2 px-2 text-right">{fmt.currency(b.amount)}</td>
                </tr>
              ))}
              <tr className="border-t border-[#1e2030] font-bold">
                <td className="py-3 px-2 text-primary">Total Estimated</td>
                <td className="py-3 px-2 text-right text-primary">{fmt.currency(estimatedAnnualExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
