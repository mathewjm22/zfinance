import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
}

const CLASS_COLORS: Record<string, string> = {
  us_stock: '#7aa2f7', intl_stock: '#9ece6a', bond: '#e0af68',
  reit: '#bb9af7', commodity: '#ff9e64', cash: '#73daca',
};

const CLASS_LABELS: Record<string, string> = {
  us_stock: 'US Stocks', intl_stock: 'Intl Stocks', bond: 'Bonds',
  reit: 'REITs', commodity: 'Commodities', cash: 'Cash',
};

export function PortfolioTab({ data, updateData }: Props) {
  const add = () => updateData(d => ({
    ...d, portfolioHoldings: [...d.portfolioHoldings, { id: uid(), ticker: 'NEW', name: 'New Holding', shares: 0, price: 0, allocation: 0, assetClass: 'us_stock' }],
  }));
  const remove = (id: string) => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.filter(h => h.id !== id) }));

  const totalValue = data.portfolioHoldings.reduce((s, h) => s + h.shares * h.price, 0);

  // Aggregate by asset class
  const byClass = data.portfolioHoldings.reduce((acc, h) => {
    const v = h.shares * h.price;
    acc[h.assetClass] = (acc[h.assetClass] ?? 0) + v;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(byClass).map(([k, v]) => ({
    name: CLASS_LABELS[k] ?? k, value: v, color: CLASS_COLORS[k] ?? '#888',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: '#565f89' }}>Total Portfolio Value</p>
            <Briefcase size={16} style={{ color: '#7aa2f7' }} />
          </div>
          <p className="text-3xl font-bold" style={{ color: '#7aa2f7' }}>{fmt.compact(totalValue)}</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#c0caf5' }}>Asset Allocation</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie dataKey="value" data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={55} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt.compact(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: '#a9b1d6' }}>{d.name}</span>
                  </div>
                  <span style={{ color: '#c0caf5' }}>{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>Holdings</h3>
          <button onClick={add} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(122,162,247,0.12)', color: '#7aa2f7' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2030' }}>
                {['Ticker', 'Name', 'Shares', 'Price', 'Value', 'Class', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-xs" style={{ color: '#565f89' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.portfolioHoldings.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #1e203060' }}>
                  <td className="py-2 px-2">
                    <input value={h.ticker} onChange={e => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.map(p => p.id === h.id ? { ...p, ticker: e.target.value } : p) }))}
                      className="bg-transparent border-0 p-0 text-xs font-mono w-16" style={{ color: '#7aa2f7' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input value={h.name} onChange={e => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.map(p => p.id === h.id ? { ...p, name: e.target.value } : p) }))}
                      className="bg-transparent border-0 p-0 text-xs w-36" style={{ color: '#c0caf5' }} />
                  </td>
                  <td className="py-2 px-2">
                    <EditableValue value={h.shares} size="sm" onChange={v => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.map(p => p.id === h.id ? { ...p, shares: v } : p) }))} />
                  </td>
                  <td className="py-2 px-2">
                    <EditableValue value={h.price} size="sm" onChange={v => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.map(p => p.id === h.id ? { ...p, price: v } : p) }))} />
                  </td>
                  <td className="py-2 px-2" style={{ color: '#9ece6a' }}>{fmt.compact(h.shares * h.price)}</td>
                  <td className="py-2 px-2">
                    <select value={h.assetClass} onChange={e => updateData(d => ({ ...d, portfolioHoldings: d.portfolioHoldings.map(p => p.id === h.id ? { ...p, assetClass: e.target.value as typeof h.assetClass } : p) }))}
                      className="text-xs rounded px-1 py-0.5" style={{ background: '#1a1b26', color: CLASS_COLORS[h.assetClass], border: '1px solid #2a2a3d' }}>
                      {Object.entries(CLASS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => remove(h.id)} className="p-1 rounded hover:bg-red-900/20">
                      <Trash2 size={12} style={{ color: '#f7768e' }} />
                    </button>
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
