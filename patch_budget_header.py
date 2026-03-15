import re

with open('src/components/tabs/ExpensesTab.tsx', 'r') as f:
    content = f.read()

header_code = """          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
              <TrendingDown size={16} style={{ color: '#f7768e' }} />
              Budget Categories
              {activeTab === 'yearly' && (
                <select
                  value={yearlyYear}
                  onChange={e => setYearlyYear(e.target.value)}
                  className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1 focus:outline-none focus:border-primary cursor-pointer ml-2"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </h3>
            <button onClick={addCategory} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(247,118,142,0.12)', color: '#f7768e' }}>
              <Plus size={12} /> Add
            </button>
          </div>"""

content = re.sub(
    r"          <div className=\"flex items-center justify-between mb-4\">\n            <h3 className=\"text-sm font-semibold flex items-center gap-2\" style=\{\{ color: '\#c0caf5' \}\}>\n              <TrendingDown size=\{16\} style=\{\{ color: '\#f7768e' \}\} \/> Budget Categories\n            <\/h3>\n            <button onClick=\{addCategory\} className=\"flex items-center gap-1 text-xs px-3 py-1\.5 rounded-lg\" style=\{\{ background: 'rgba\(247,118,142,0\.12\)', color: '\#f7768e' \}\}>\n              <Plus size=\{12\} \/> Add\n            <\/button>\n          <\/div>",
    header_code,
    content
)

with open('src/components/tabs/ExpensesTab.tsx', 'w') as f:
    f.write(content)
