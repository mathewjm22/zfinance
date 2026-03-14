import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalMonthlyIncome: number;
  totalGrossIncome: number;
}

export function IncomeTab({ data, updateData, totalMonthlyIncome, totalGrossIncome }: Props) {
  const addSource = () => updateData(d => ({
    ...d,
    incomeSources: [...d.incomeSources, { id: uid(), name: 'New Source', amount: 0, gross: 0, type: 'other' }],
  }));

  const removeSource = (id: string) => updateData(d => ({
    ...d, incomeSources: d.incomeSources.filter(i => i.id !== id),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Net Monthly Income', value: totalMonthlyIncome, color: '#9ece6a' },
          { label: 'Gross Monthly Income', value: totalGrossIncome, color: '#7aa2f7' },
          { label: 'Annual Gross', value: totalGrossIncome * 12, color: '#bb9af7' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{fmt.compact(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Sources table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
            <TrendingUp size={16} style={{ color: '#9ece6a' }} /> Income Sources
          </h3>
          <button onClick={addSource} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(158,206,106,0.12)', color: '#9ece6a' }}>
            <Plus size={12} /> Add Source
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2030' }}>
                {['Source', 'Net/mo', 'Gross/mo', 'Annual Gross', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-xs font-medium" style={{ color: '#565f89' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.incomeSources.map(src => (
                <tr key={src.id} style={{ borderBottom: '1px solid #1e203060' }}>
                  <td className="py-2 px-2">
                    <input value={src.name} onChange={e => updateData(d => ({ ...d, incomeSources: d.incomeSources.map(i => i.id === src.id ? { ...i, name: e.target.value } : i) }))}
                      className="bg-transparent border-0 p-0 text-sm w-full" style={{ color: '#c0caf5' }} />
                  </td>
                  <td className="py-2 px-2">
                    <EditableValue value={src.amount} size="sm"
                      onChange={v => updateData(d => ({ ...d, incomeSources: d.incomeSources.map(i => i.id === src.id ? { ...i, amount: v } : i) }))} />
                  </td>
                  <td className="py-2 px-2">
                    <EditableValue value={src.gross} size="sm"
                      onChange={v => updateData(d => ({ ...d, incomeSources: d.incomeSources.map(i => i.id === src.id ? { ...i, gross: v } : i) }))} />
                  </td>
                  <td className="py-2 px-2" style={{ color: '#9ece6a' }}>{fmt.currency(src.gross * 12)}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeSource(src.id)} className="p-1 rounded hover:bg-red-900/20">
                      <Trash2 size={12} style={{ color: '#f7768e' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-3 px-2 font-semibold text-sm" style={{ color: '#c0caf5' }}>Total</td>
                <td className="py-3 px-2 font-bold" style={{ color: '#9ece6a' }}>{fmt.currency(totalMonthlyIncome)}</td>
                <td className="py-3 px-2 font-bold" style={{ color: '#7aa2f7' }}>{fmt.currency(totalGrossIncome)}</td>
                <td className="py-3 px-2 font-bold" style={{ color: '#bb9af7' }}>{fmt.currency(totalGrossIncome * 12)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
