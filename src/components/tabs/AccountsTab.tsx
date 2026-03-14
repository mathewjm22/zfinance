import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface Props {
  data: FinancialData;
  updateData: (fn: (d: FinancialData) => FinancialData) => void;
  totalNetWorth: number;
}

export function AccountsTab({ data, updateData, totalNetWorth }: Props) {
  const addAccount = () => updateData(d => ({
    ...d, accounts: [...d.accounts, { id: uid(), name: 'New Account', balance: 0, color: '#a9b1d6', type: 'brokerage' }],
  }));

  const remove = (id: string) => updateData(d => ({ ...d, accounts: d.accounts.filter(a => a.id !== id) }));

  const ACCOUNT_TYPES = [
    { value: 'brokerage', label: 'Taxable Brokerage' },
    { value: 'retirement', label: 'Retirement (IRA/401k/TSP)' },
    { value: 'hsa', label: 'Health Savings (HSA)' },
    { value: 'bond', label: 'Treasury/I-Bonds' },
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'High Yield Savings' },
    { value: 'other', label: 'Other Asset' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: '#565f89' }}>Total Net Worth</p>
          <p className="text-3xl font-bold" style={{ color: '#7aa2f7' }}>{fmt.currency(totalNetWorth)}</p>
        </div>
        <button onClick={addAccount} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(122,162,247,0.12)', color: '#7aa2f7' }}>
          <Plus size={12} /> Add Account
        </button>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#c0caf5' }}>
          <Building2 size={16} style={{ color: '#7aa2f7' }} /> Link / Manage Accounts
        </h3>
        <div className="space-y-3">
          {data.accounts.map(acc => (
            <div key={acc.id} className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: '#1a1b26', border: '1px solid #2a2a3d' }}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={acc.color}
                  onChange={e => updateData(d => ({ ...d, accounts: d.accounts.map(a => a.id === acc.id ? { ...a, color: e.target.value } : a) }))}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
                <div>
                  <input
                    value={acc.name}
                    onChange={e => updateData(d => ({ ...d, accounts: d.accounts.map(a => a.id === acc.id ? { ...a, name: e.target.value } : a) }))}
                    className="bg-transparent border-0 p-0 font-semibold text-sm w-full block"
                    style={{ color: '#c0caf5' }}
                  />
                  <select
                    value={acc.type}
                    onChange={e => updateData(d => ({ ...d, accounts: d.accounts.map(a => a.id === acc.id ? { ...a, type: e.target.value as any } : a) }))}
                    className="bg-transparent border-0 p-0 text-xs mt-1"
                    style={{ color: '#565f89', outline: 'none' }}
                  >
                    {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <EditableValue
                  value={acc.balance}
                  onChange={v => updateData(d => ({ ...d, accounts: d.accounts.map(a => a.id === acc.id ? { ...a, balance: v } : a) }))}
                  size="lg"
                  className="font-bold font-mono"
                />
                <button onClick={() => remove(acc.id)} className="p-2 rounded-lg hover:bg-red-900/20 transition-colors">
                  <Trash2 size={16} style={{ color: '#f7768e' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
