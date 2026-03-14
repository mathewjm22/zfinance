import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalNetWorth: number;
  totalContributions: number;
  projectedAtRetirement: number;
  yearsToRetirement: number;
}

export function RetirementTab({ data, updateData, totalNetWorth, totalContributions, projectedAtRetirement, yearsToRetirement }: Props) {
  const annualContributions = totalContributions * 12;

  const addContrib = () => updateData(d => ({
    ...d,
    retirementContributions: [...d.retirementContributions, { id: uid(), accountName: 'New Account', monthlyAmount: 0, annualMax: 0, employerMatch: 0 }],
  }));

  const remove = (id: string) => updateData(d => ({
    ...d, retirementContributions: d.retirementContributions.filter(r => r.id !== id),
  }));

  const fireNumber = data.personalInfo.retirementGoal;
  const progress = Math.min(100, (totalNetWorth / fireNumber) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Current Net Worth', value: totalNetWorth, color: '#7aa2f7' },
          { label: 'Retirement Goal', value: fireNumber, color: '#bb9af7' },
          { label: 'Monthly Contributions', value: totalContributions, color: '#9ece6a' },
          { label: 'Projected at Retirement', value: projectedAtRetirement, color: '#e0af68' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{fmt.compact(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>Path to Retirement</h3>
          <span className="text-sm font-bold" style={{ color: '#7aa2f7' }}>{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar h-3">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: '#565f89' }}>
          <span>{fmt.compact(totalNetWorth)} today</span>
          <span>{yearsToRetirement} years remaining</span>
          <span>{fmt.compact(fireNumber)} goal</span>
        </div>
      </div>

      {/* Contributions table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
            <PiggyBank size={16} style={{ color: '#9ece6a' }} /> Retirement Contributions
          </h3>
          <button onClick={addContrib} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(158,206,106,0.12)', color: '#9ece6a' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2030' }}>
              {['Account', 'Monthly', 'Annual', 'Max Allowed', 'Employer %', ''].map(h => (
                <th key={h} className="text-left py-2 px-2 text-xs" style={{ color: '#565f89' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.retirementContributions.map(rc => (
              <tr key={rc.id} style={{ borderBottom: '1px solid #1e203060' }}>
                <td className="py-2 px-2">
                  <input value={rc.accountName} onChange={e => updateData(d => ({ ...d, retirementContributions: d.retirementContributions.map(r => r.id === rc.id ? { ...r, accountName: e.target.value } : r) }))}
                    className="bg-transparent border-0 p-0 text-sm w-full" style={{ color: '#c0caf5' }} />
                </td>
                <td className="py-2 px-2">
                  <EditableValue value={rc.monthlyAmount} size="sm" onChange={v => updateData(d => ({ ...d, retirementContributions: d.retirementContributions.map(r => r.id === rc.id ? { ...r, monthlyAmount: v } : r) }))} />
                </td>
                <td className="py-2 px-2" style={{ color: '#9ece6a' }}>{fmt.currency(rc.monthlyAmount * 12)}</td>
                <td className="py-2 px-2">
                  <EditableValue value={rc.annualMax} size="sm" onChange={v => updateData(d => ({ ...d, retirementContributions: d.retirementContributions.map(r => r.id === rc.id ? { ...r, annualMax: v } : r) }))} />
                </td>
                <td className="py-2 px-2">
                  <EditableValue value={rc.employerMatch} size="sm" suffix="%" onChange={v => updateData(d => ({ ...d, retirementContributions: d.retirementContributions.map(r => r.id === rc.id ? { ...r, employerMatch: v } : r) }))} />
                </td>
                <td className="py-2 px-2">
                  <button onClick={() => remove(rc.id)} className="p-1 rounded hover:bg-red-900/20">
                    <Trash2 size={12} style={{ color: '#f7768e' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 px-2 font-semibold text-sm" style={{ color: '#c0caf5' }}>Total</td>
              <td className="py-3 px-2 font-bold" style={{ color: '#9ece6a' }}>{fmt.currency(totalContributions)}</td>
              <td className="py-3 px-2 font-bold" style={{ color: '#bb9af7' }}>{fmt.currency(annualContributions)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Assumptions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Assumptions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Expected Return', key: 'expectedReturn', suffix: '%' },
            { label: 'Inflation Rate', key: 'inflationRate', suffix: '%' },
            { label: 'Withdrawal Rate', key: 'safeWithdrawalRate', suffix: '%' },
            { label: 'Retirement Age', key: 'retirementAge', suffix: '' },
          ].map(f => (
            <div key={f.key} className="p-3 rounded-lg" style={{ background: '#1a1b26' }}>
              <p className="text-xs mb-1" style={{ color: '#565f89' }}>{f.label}</p>
              <EditableValue
                value={data.personalInfo[f.key as keyof typeof data.personalInfo] as number}
                suffix={f.suffix}
                onChange={v => updateData(d => ({ ...d, personalInfo: { ...d.personalInfo, [f.key]: v } }))}
                size="md"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
