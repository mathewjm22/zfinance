import { Heart, Plus, Trash2 } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
}

export function HealthTab({ data, updateData }: Props) {
  const totalHealthSpend = data.healthRecords.reduce((s, r) => s + r.amount, 0);
  const hsaRemaining = data.hsaBalance - totalHealthSpend;

  const addRecord = () => updateData(d => ({
    ...d, healthRecords: [...d.healthRecords, { id: uid(), category: 'Medical', amount: 0, description: 'New', date: new Date().toISOString().slice(0, 10) }],
  }));
  const remove = (id: string) => updateData(d => ({ ...d, healthRecords: d.healthRecords.filter(r => r.id !== id) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'HSA Balance', value: data.hsaBalance, color: '#73daca', editable: true, key: 'hsaBalance' },
          { label: 'Total Health Spend', value: totalHealthSpend, color: '#f7768e' },
          { label: 'HSA Remaining', value: hsaRemaining, color: hsaRemaining >= 0 ? '#9ece6a' : '#f7768e' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: '#565f89' }}>{s.label}</p>
              <Heart size={14} style={{ color: '#f7768e' }} />
            </div>
            {s.editable ? (
              <EditableValue value={s.value} size="lg"
                onChange={v => updateData(d => ({ ...d, hsaBalance: v }))} />
            ) : (
              <p className="text-2xl font-bold" style={{ color: s.color }}>{fmt.currency(s.value)}</p>
            )}
          </div>
        ))}
      </div>

      {/* HSA contribution */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>HSA Contributions</h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>Monthly Contribution</p>
            <EditableValue value={data.hsaMonthlyContribution} size="md"
              onChange={v => updateData(d => ({ ...d, hsaMonthlyContribution: v }))} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>Annual Contribution</p>
            <p className="text-xl font-bold" style={{ color: '#73daca' }}>{fmt.currency(data.hsaMonthlyContribution * 12)}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>2024 Max (family)</p>
            <p className="text-xl font-bold" style={{ color: '#e0af68' }}>{fmt.currency(8_300)}</p>
          </div>
        </div>
      </div>

      {/* Medical records */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>Health Records</h3>
          <button onClick={addRecord} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(247,118,142,0.12)', color: '#f7768e' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2030' }}>
                {['Category', 'Description', 'Amount', 'Date', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-xs" style={{ color: '#565f89' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.healthRecords.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1e203060' }}>
                  <td className="py-2 px-2">
                    <input value={r.category} onChange={e => updateData(d => ({ ...d, healthRecords: d.healthRecords.map(x => x.id === r.id ? { ...x, category: e.target.value } : x) }))}
                      className="bg-transparent border-0 p-0 text-sm w-full" style={{ color: '#7aa2f7' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input value={r.description} onChange={e => updateData(d => ({ ...d, healthRecords: d.healthRecords.map(x => x.id === r.id ? { ...x, description: e.target.value } : x) }))}
                      className="bg-transparent border-0 p-0 text-sm w-full" style={{ color: '#c0caf5' }} />
                  </td>
                  <td className="py-2 px-2">
                    <EditableValue value={r.amount} size="sm" onChange={v => updateData(d => ({ ...d, healthRecords: d.healthRecords.map(x => x.id === r.id ? { ...x, amount: v } : x) }))} />
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: '#565f89' }}>{r.date}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => remove(r.id)} className="p-1 rounded"><Trash2 size={12} style={{ color: '#f7768e' }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
