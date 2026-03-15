import { Flame } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalNetWorth: number;
  totalGrossIncome: number;
  estimatedAnnualExpenses: number;
}

export function FireTab({ data, updateData, totalNetWorth, totalGrossIncome, estimatedAnnualExpenses }: Props) {
  const pi = data.personalInfo;
  const annualExpenses = estimatedAnnualExpenses;
  const fireNumber = annualExpenses / (pi.safeWithdrawalRate / 100);
  const leanFire = annualExpenses * 0.75 / (pi.safeWithdrawalRate / 100);
  const fatFire  = annualExpenses * 1.5  / (pi.safeWithdrawalRate / 100);
  const progress = Math.min(100, (totalNetWorth / fireNumber) * 100);
  const annualGross = totalGrossIncome * 12;
  const savingsAmount = Math.max(0, annualGross - annualExpenses);
  const savingsRate = annualGross > 0 ? (savingsAmount / annualGross) * 100 : 0;

  // Years to FIRE from current net worth + contributions
  const r = pi.expectedReturn / 100;
  const annualContrib = data.retirementContributions.reduce((s, c) => s + c.monthlyAmount * 12, 0);
  let yearsToFire = 0;
  if (totalNetWorth < fireNumber) {
    if (r > 0) {
      yearsToFire = Math.log((fireNumber * r + annualContrib) / (totalNetWorth * r + annualContrib)) / Math.log(1 + r);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'FIRE Number', value: fireNumber, color: '#e0af68', sub: `Based on ${pi.safeWithdrawalRate}% SWR` },
          { label: 'Current Progress', value: progress, isPercent: true, color: '#7aa2f7', sub: `${fmt.compact(totalNetWorth)} of ${fmt.compact(fireNumber)}` },
          { label: 'Years to FIRE', value: yearsToFire, isYears: true, color: '#9ece6a', sub: `At ${pi.expectedReturn}% return` },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.isPercent ? `${progress.toFixed(1)}%` : s.isYears ? `${yearsToFire.toFixed(1)} yrs` : fmt.compact(s.value)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#565f89' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
            <Flame size={16} style={{ color: '#e0af68' }} /> FIRE Progress
          </h3>
        </div>
        <div className="progress-bar h-4">
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #e0af68, #ff9e64)' }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: '#565f89' }}>
          <span>$0</span>
          <span style={{ color: '#e0af68' }}>{fmt.compact(totalNetWorth)} → {fmt.compact(fireNumber)}</span>
          <span>{fmt.compact(fireNumber)}</span>
        </div>
      </div>

      {/* FIRE variants */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Lean FIRE', value: leanFire, color: '#9ece6a', desc: '75% of current spending' },
          { label: 'Regular FIRE', value: fireNumber, color: '#e0af68', desc: '100% of current spending' },
          { label: 'Fat FIRE', value: fatFire, color: '#7aa2f7', desc: '150% of current spending' },
        ].map(f => (
          <div key={f.label} className="glass-card p-5 text-center">
            <p className="text-xs mb-2" style={{ color: '#565f89' }}>{f.label}</p>
            <p className="text-2xl font-bold" style={{ color: f.color }}>{fmt.compact(f.value)}</p>
            <p className="text-xs mt-1" style={{ color: '#565f89' }}>{f.desc}</p>
            <div className="progress-bar mt-3">
              <div className="progress-fill" style={{ width: `${Math.min(100, (totalNetWorth / f.value) * 100)}%`, background: f.color }} />
            </div>
            <p className="text-xs mt-1" style={{ color: f.color }}>{((totalNetWorth / f.value) * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>

      {/* SWR slider */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Assumptions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs block mb-2" style={{ color: '#565f89' }}>Safe Withdrawal Rate</label>
            <EditableValue value={pi.safeWithdrawalRate} suffix="%" onChange={v => updateData(d => ({ ...d, personalInfo: { ...d.personalInfo, safeWithdrawalRate: v } }))} />
          </div>
          <div>
            <label className="text-xs block mb-2" style={{ color: '#565f89' }}>Expected Annual Return</label>
            <EditableValue value={pi.expectedReturn} suffix="%" onChange={v => updateData(d => ({ ...d, personalInfo: { ...d.personalInfo, expectedReturn: v } }))} />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: '#565f89' }}>Annual Savings Rate</p>
            <p className="text-xl font-bold" style={{ color: '#9ece6a' }}>{savingsRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
