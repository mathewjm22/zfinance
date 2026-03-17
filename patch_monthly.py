import re

with open('src/components/tabs/ExpensesTab.tsx', 'r') as f:
    content = f.read()

# The activeTab === 'monthly' section renders a grid with cards.
# Wait, let's see where activeTab === 'monthly' starts
pattern = r"({activeTab === 'monthly' && \(\n\s*<div className=\{`grid gap-6 \$\{showHistoricalGraph \? 'md:grid-cols-4' : 'md:grid-cols-3'}`\}>)"

replacement = r"""\1

          <div className="md:col-span-full card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Month-over-Month Spending</h3>
              <div className="flex items-center gap-2">
                <select
                  value={monthlyComparisonCategory}
                  onChange={e => setMonthlyComparisonCategory(e.target.value)}
                  className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {monthlyComparisonCategory !== 'ALL' && (
                  <select
                    value={monthlyComparisonStyle}
                    onChange={e => setMonthlyComparisonStyle(e.target.value as any)}
                    className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ONLY">Category Only</option>
                    <option value="STACKED">Stacked with Total</option>
                    <option value="SIDE_BY_SIDE">Side-by-Side vs Total</option>
                  </select>
                )}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyComparisonData} barSize={24} barGap={monthlyComparisonStyle === 'SIDE_BY_SIDE' ? 2 : 0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2030" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#565f89', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#565f89', fontSize: 12 }} tickFormatter={(v) => `$${v}`} width={60} />
                <Tooltip
                  cursor={{ fill: '#1e2030', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#1e2030', color: '#c0caf5', borderRadius: '8px' }}
                  itemStyle={{ color: '#c0caf5' }}
                  formatter={(val: number, name: string) => [fmt.currency(val), name === 'total' ? 'Total Spend' : data.expenseCategories.find(c => c.id === name)?.name || name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#565f89' }} />
                {monthlyComparisonCategory === 'ALL' ? (
                  <Bar dataKey="total" name="Total Spend" fill="#7aa2f7" radius={[4, 4, 0, 0]} />
                ) : (
                  <>
                    <Bar dataKey={monthlyComparisonCategory} name={data.expenseCategories.find(c => c.id === monthlyComparisonCategory)?.name || 'Category'} fill="#bb9af7" radius={[4, 4, 0, 0]} />
                    {monthlyComparisonStyle !== 'ONLY' && (
                      <Bar dataKey="other" name="Other Categories" fill="#3b4261" radius={[4, 4, 0, 0]} stackId={monthlyComparisonStyle === 'STACKED' ? "a" : undefined} />
                    )}
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
"""

new_content = re.sub(pattern, replacement, content)

if new_content == content:
    print("Warning: regex didn't match anything")
else:
    with open('src/components/tabs/ExpensesTab.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
