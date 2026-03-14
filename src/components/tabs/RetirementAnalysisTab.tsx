import { Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  totalNetWorth: number;
  totalContributions: number;
  annualExpenses: number;
}

export function RetirementAnalysisTab({ data, totalNetWorth, totalContributions, annualExpenses }: Props) {
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
      balance = balance * (1 + realReturn / 100) - annualExpenses;
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
                formatter={(v: number) => fmt.currency(v)} 
                labelFormatter={(v) => `Age ${v}`}
                contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} 
              />
              <Line type="monotone" dataKey="balance" name="Projected Portfolio" stroke="#7aa2f7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="dashed" dataKey="target" name="Retirement Goal" stroke="#f7768e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
