import { useMemo } from "react";
import { FinancialData } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function Retirement({
  data,
  setData,
}: {
  data: FinancialData;
  setData: (d: FinancialData) => void;
}) {
  const { retirement = {
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90,
    inflationRate: 2.5,
    monthlyContribution: 1000,
    desiredAnnualSpend: 80000
  }, accounts = [] } = data;

  const handleUpdate = (field: keyof typeof retirement, value: number) => {
    setData({
      ...data,
      retirement: { ...retirement, [field]: value },
    });
  };

  const projectionData = useMemo(() => {
    const startAge = retirement.currentAge;
    const endAge = retirement.lifeExpectancy;
    const retireAge = retirement.retirementAge;

    // Calculate weighted average return of investment/retirement accounts
    const investableAccounts = (accounts || []).filter((a) =>
      ["Investment", "Retirement"].includes(a.type),
    );
    const totalInvestable = investableAccounts.reduce(
      (sum, a) => sum + a.balance,
      0,
    );

    let weightedReturn = 5.75; // default
    if (totalInvestable > 0) {
      weightedReturn = investableAccounts.reduce(
        (sum, a) => sum + (a.balance / totalInvestable) * a.expectedReturn,
        0,
      );
    }

    const realReturn = (weightedReturn - retirement.inflationRate) / 100;

    let currentBalance = totalInvestable;
    const dataPoints = [];

    for (let age = startAge; age <= endAge; age++) {
      dataPoints.push({
        age,
        balance: Math.round(currentBalance),
        isRetired: age >= retireAge,
      });

      if (age < retireAge) {
        // Working years: grow by real return, add contributions
        currentBalance =
          currentBalance * (1 + realReturn) +
          retirement.monthlyContribution * 12;
      } else {
        // Retirement years: grow by real return, subtract spend
        currentBalance =
          currentBalance * (1 + realReturn) - retirement.desiredAnnualSpend;
      }
    }

    return dataPoints;
  }, [retirement, accounts]);

  const balanceAtRetirement =
    projectionData.find((d) => d.age === retirement.retirementAge)?.balance ||
    0;
  const balanceAtEnd = projectionData[projectionData.length - 1]?.balance || 0;
  const success = balanceAtEnd > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-zinc-100">Retirement Planner</h2>
        <p className="text-zinc-400 mt-1">
          Project your wealth into the future.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-xl font-semibold text-zinc-100 mb-4">
            Assumptions
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Current Age
              </label>
              <input
                type="number"
                value={retirement.currentAge}
                onChange={(e) =>
                  handleUpdate("currentAge", parseInt(e.target.value) || 0)
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Retirement Age
              </label>
              <input
                type="number"
                value={retirement.retirementAge}
                onChange={(e) =>
                  handleUpdate("retirementAge", parseInt(e.target.value) || 0)
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Life Expectancy
              </label>
              <input
                type="number"
                value={retirement.lifeExpectancy}
                onChange={(e) =>
                  handleUpdate("lifeExpectancy", parseInt(e.target.value) || 0)
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Monthly Contribution ($)
              </label>
              <input
                type="number"
                value={retirement.monthlyContribution}
                onChange={(e) =>
                  handleUpdate(
                    "monthlyContribution",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Desired Annual Spend ($)
              </label>
              <input
                type="number"
                value={retirement.desiredAnnualSpend}
                onChange={(e) =>
                  handleUpdate(
                    "desiredAnnualSpend",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Inflation Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={retirement.inflationRate}
                onChange={(e) =>
                  handleUpdate("inflationRate", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              className={`border rounded-2xl p-6 shadow-sm ${success ? "bg-lime-500/10 border-lime-500/30" : "bg-red-500/10 border-red-500/30"}`}
            >
              <h3 className="text-zinc-400 font-medium">Plan Status</h3>
              <p
                className={`text-3xl font-bold mt-2 ${success ? "text-lime-400" : "text-red-400"}`}
              >
                {success ? "On Track" : "Needs Adjustment"}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {success
                  ? "Your money outlasts your life expectancy."
                  : "You may run out of money."}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-zinc-400 font-medium">
                Projected Nest Egg at {retirement.retirementAge}
              </h3>
              <p className="text-3xl font-bold text-zinc-100 mt-2">
                ${balanceAtRetirement.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 mt-1">In today's dollars</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-100 mb-6">
              Wealth Projection
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="age"
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "0.5rem",
                      color: "#f4f4f5",
                    }}
                  />
                  <ReferenceLine
                    x={retirement.retirementAge}
                    stroke="#f4f4f5"
                    strokeDasharray="3 3"
                    label={{
                      position: "top",
                      value: "Retirement",
                      fill: "#a1a1aa",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#84cc16"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 8,
                      fill: "#84cc16",
                      stroke: "#18181b",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
