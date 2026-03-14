import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Percent, Calendar } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalNetWorth: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlyNet: number;
  savingsRate: number;
  yearsToRetirement: number;
  netWorthProgress: number;
  totalContributions: number;
  projectedAtRetirement: number;
}

export function OverviewTab({
  data, updateData, totalNetWorth, totalMonthlyIncome, totalMonthlyExpenses,
  monthlyNet, savingsRate, yearsToRetirement, netWorthProgress, totalContributions, projectedAtRetirement,
}: Props) {
  const cashFlowData = [
    { name: 'Income', value: totalMonthlyIncome, fill: '#9ece6a' },
    { name: 'Expenses', value: totalMonthlyExpenses, fill: '#f7768e' },
    { name: 'Savings', value: totalContributions, fill: '#7aa2f7' },
  ];

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (netWorthProgress / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Net Worth', icon: <Wallet size={16} />, color: '#7aa2f7',
            value: totalNetWorth, sub: 'Total across all accounts',
            badge: `+12.4% YTD`, badgeCls: 'chip-success',
          },
          {
            label: 'Monthly Income', icon: <TrendingUp size={16} />, color: '#9ece6a',
            value: totalMonthlyIncome, sub: 'Gross monthly income',
            badge: 'Stable', badgeCls: 'chip-muted',
          },
          {
            label: 'Monthly Expenses', icon: <TrendingDown size={16} />, color: '#f7768e',
            value: totalMonthlyExpenses, sub: 'Total monthly spending',
            badge: monthlyNet > 0 ? 'Cash flow ✓' : 'Over budget', badgeCls: monthlyNet > 0 ? 'chip-success' : 'chip-danger',
          },
          {
            label: 'Monthly Net', icon: <PiggyBank size={16} />, color: monthlyNet >= 0 ? '#9ece6a' : '#f7768e',
            value: monthlyNet, sub: 'Income – Expenses',
            badge: monthlyNet >= 0 ? 'Positive' : 'Negative', badgeCls: monthlyNet >= 0 ? 'chip-success' : 'chip-danger',
          },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#565f89' }}>{kpi.label}</span>
              <span className="p-1.5 rounded-lg" style={{ background: `${kpi.color}18` }}>
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{fmt.compact(kpi.value)}</div>
            <p className="text-xs mt-1" style={{ color: '#565f89' }}>{kpi.sub}</p>
            <span className={`chip ${kpi.badgeCls} mt-2`}>{kpi.badge}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account breakdown */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>Account Breakdown</h3>
            <span className="text-lg font-bold" style={{ color: '#7aa2f7' }}>{fmt.compact(totalNetWorth)}</span>
          </div>
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie dataKey="balance" data={data.accounts} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {data.accounts.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 180 }}>
              {data.accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: account.color }} />
                    <span style={{ color: '#a9b1d6' }} className="truncate max-w-[120px]">{account.name}</span>
                  </div>
                  <EditableValue
                    value={account.balance}
                    onChange={v => updateData(d => ({ ...d, accounts: d.accounts.map(a => a.id === account.id ? { ...a, balance: v } : a) }))}
                    size="sm"
                    className="font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress gauge */}
        <div className="glass-card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Net Worth Progress</h3>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e2030" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke="url(#nwGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
              <defs>
                <linearGradient id="nwGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7aa2f7" />
                  <stop offset="100%" stopColor="#bb9af7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: '#7aa2f7' }}>{netWorthProgress.toFixed(0)}%</span>
              <span className="text-xs" style={{ color: '#565f89' }}>of goal</span>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-lg font-bold" style={{ color: '#c0caf5' }}>{fmt.compact(totalNetWorth)}</p>
            <p className="text-xs" style={{ color: '#565f89' }}>
              of{' '}
              <EditableValue
                value={data.personalInfo.retirementGoal}
                onChange={v => updateData(d => ({ ...d, personalInfo: { ...d.personalInfo, retirementGoal: v } }))}
                size="sm"
              />{' '}goal
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#565f89' }}>Savings Rate</span>
            <Percent size={16} style={{ color: '#7aa2f7' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#7aa2f7' }}>{savingsRate.toFixed(1)}%</div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${Math.min(100, savingsRate)}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: '#565f89' }}>
            {savingsRate >= 50 ? '🔥 Excellent! On track for early retirement' : savingsRate >= 20 ? '👍 Good savings rate' : '⚠️ Try to save more'}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#565f89' }}>Years to Retirement</span>
            <Calendar size={16} style={{ color: '#7aa2f7' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#7aa2f7' }}>{yearsToRetirement} yrs</div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${Math.max(0, 100 - (yearsToRetirement / 40) * 100)}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: '#565f89' }}>Age {data.personalInfo.age} → {data.personalInfo.retirementAge}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#565f89' }}>Monthly Contributions</span>
            <Target size={16} style={{ color: '#7aa2f7' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: '#c0caf5' }}>{fmt.currency(totalContributions)}</div>
          <p className="text-xs mt-1" style={{ color: '#565f89' }}>{fmt.currency(totalContributions * 12)}/year to retirement</p>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1e2030' }}>
            <p className="text-xs" style={{ color: '#565f89' }}>Projected at retirement:</p>
            <p className="text-lg font-semibold" style={{ color: '#7aa2f7' }}>{fmt.compact(projectedAtRetirement)}</p>
          </div>
        </div>
      </div>

      {/* Cash flow bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>Monthly Cash Flow</h3>
          <span className="text-sm font-medium" style={{ color: monthlyNet >= 0 ? '#9ece6a' : '#f7768e' }}>
            {monthlyNet >= 0 ? '+' : ''}{fmt.currency(monthlyNet)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={cashFlowData} barSize={48}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
            <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {cashFlowData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
