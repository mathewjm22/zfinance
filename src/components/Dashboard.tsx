import { FinancialData } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Dashboard({ data }: { data: FinancialData }) {
  const totalNetWorth = (data.accounts || []).reduce(
    (sum, acc) => sum + (acc?.balance || 0),
    0,
  );
  const monthlyIncome = (data.income || []).reduce((sum, inc) => sum + (inc?.amount || 0), 0);
  const monthlyExpenses = (data.expenses || []).reduce(
    (sum, exp) => sum + (exp?.amount || 0),
    0,
  );
  const netCashFlow = monthlyIncome - monthlyExpenses;

  // Group expenses by category
  const expensesByCategory = (data.expenses || []).reduce(
    (acc, exp) => {
      if (!exp) return acc;
      const category = exp.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (exp.amount || 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Group income by source
  const incomePieData = (data.income || [])
    .filter(inc => inc)
    .map((inc) => ({ name: inc.source || 'Unknown', value: inc.amount || 0 }))
    .sort((a, b) => b.value - a.value);

  const COLORS = [
    "#84cc16",
    "#a3e635",
    "#bef264",
    "#d9f99d",
    "#ecfccb",
    "#f4f4f5",
    "#d4d4d8",
    "#a1a1aa",
    "#71717a",
    "#52525b",
  ];

  const INCOME_COLORS = [
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#bfdbfe",
    "#dbeafe",
  ];

  const cashFlowData = [
    { name: "Income", amount: monthlyIncome, fill: "#84cc16" },
    { name: "Expenses", amount: monthlyExpenses, fill: "#ef4444" },
  ];

  // Mock historical net worth data for the past 6 months
  const currentMonth = new Date().getMonth();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const netWorthHistory = Array.from({ length: 6 }).map((_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    // Simulate some growth backwards
    const simulatedPastWorth = totalNetWorth * (1 - (5 - i) * 0.015);
    return {
      name: months[monthIndex],
      value: Math.round(simulatedPastWorth)
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-zinc-400 mt-1">
          Your financial overview at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">Total Net Worth</h3>
            <div className="p-2 bg-lime-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-lime-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100 mt-4">
            $
            {totalNetWorth.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">Monthly Income</h3>
            <div className="p-2 bg-zinc-800 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-lime-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100 mt-4">
            $
            {monthlyIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">Monthly Expenses</h3>
            <div className="p-2 bg-zinc-800 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100 mt-4">
            $
            {monthlyExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Net Cash Flow:{" "}
            <span
              className={netCashFlow >= 0 ? "text-lime-400" : "text-red-400"}
            >
              ${netCashFlow.toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">
            Expenses Breakdown
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0.5rem",
                    color: "#f4f4f5",
                  }}
                  itemStyle={{ color: "#f4f4f5" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">
            Income Breakdown
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {incomePieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={INCOME_COLORS[index % INCOME_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0.5rem",
                    color: "#f4f4f5",
                  }}
                  itemStyle={{ color: "#f4f4f5" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">
            Net Worth Over Time (6 Months)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#a1a1aa" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <RechartsTooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0.5rem",
                    color: "#f4f4f5",
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#84cc16" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">
            Budgets
          </h3>
          <div className="space-y-6">
            {(data.budgets || []).map(budget => {
              const spent = (data.expenses || [])
                .filter(e => (e.category || '').toLowerCase() === (budget.category || '').toLowerCase())
                .reduce((sum, e) => sum + (e.amount || 0), 0);
              const percent = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
              const isOver = spent > budget.amount;

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-zinc-200">{budget.category}</span>
                    <span className="text-zinc-400">
                      <span className={isOver ? 'text-red-400' : 'text-zinc-100'}>
                        ${spent.toLocaleString()}
                      </span>{' '}
                      / ${budget.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-lime-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data.budgets || data.budgets.length === 0) && (
              <p className="text-zinc-500 text-sm">No budgets set yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
