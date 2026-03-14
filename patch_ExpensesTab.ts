import * as fs from 'fs';

let content = fs.readFileSync('src/components/tabs/ExpensesTab.tsx', 'utf8');

// Imports update
const importSearch = `import { parseChaseStatement, ParsedTransaction } from '../../utils/pdfParser';`;
const importReplace = `import { parseChaseStatement, parseYearlySummaryText, ParsedTransaction } from '../../utils/pdfParser';
import { PieChart, Pie, Cell as PieCell } from 'recharts';`;

content = content.replace(importSearch, importReplace);

// Add state for Yearly/Monthly
const propsSearch = `export function ExpensesTab({ data, updateData, totalMonthlyExpenses }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ParsedTransaction[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);`;

const propsReplace = `export function ExpensesTab({ data, updateData, totalMonthlyExpenses }: Props) {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [yearlyText, setYearlyText] = useState('');
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());

  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ParsedTransaction[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategoryIndex, setAddingCategoryIndex] = useState<number | null>(null);
`;

content = content.replace(propsSearch, propsReplace);

// Update review modal handleFile logic (add 'Other' category mapping and Auto Create)
const handleFileSearch = `const parsed = await parseChaseStatement(file, data.expenseCategories);`;
const handleFileReplace = `const parsed = await parseChaseStatement(file, data.expenseCategories);

      // Auto-create categories or map to Other
      let currentCategories = [...data.expenseCategories];
      let categoriesChanged = false;

      // Ensure 'Other' exists
      let otherCat = currentCategories.find(c => c.name.toLowerCase() === 'other');
      if (!otherCat) {
        otherCat = { id: uid(), name: 'Other', budget: 0, color: '#a9b1d6', lastUpdatedDate: new Date().toISOString().slice(0, 10) };
        currentCategories.push(otherCat);
        categoriesChanged = true;
      }

      for (let item of parsed) {
        if (!item.suggestedCategoryId && item.suggestedCategoryName) {
           let matched = currentCategories.find(c => c.name.toLowerCase() === item.suggestedCategoryName!.toLowerCase());
           if (!matched) {
             matched = { id: uid(), name: item.suggestedCategoryName!, budget: 0, color: '#7aa2f7', lastUpdatedDate: new Date().toISOString().slice(0, 10) };
             currentCategories.push(matched);
             categoriesChanged = true;
           }
           item.suggestedCategoryId = matched.id;
        } else if (!item.suggestedCategoryId) {
           item.suggestedCategoryId = otherCat.id; // Default to Other
        }
      }

      if (categoriesChanged) {
        updateData(d => ({ ...d, expenseCategories: currentCategories }));
      }`;

content = content.replace(handleFileSearch, handleFileReplace);

// Add handleYearlyText
const handleYearlySearch = `const handleDrop = (e: React.DragEvent) => {`;
const handleYearlyReplace = `const handleProcessYearly = () => {
    if (!yearlyText.trim()) return;
    const parsed = parseYearlySummaryText(yearlyText, yearlyYear, data.expenseCategories);

    let currentCategories = [...data.expenseCategories];
    let categoriesChanged = false;

    // Ensure 'Other' exists
    let otherCat = currentCategories.find(c => c.name.toLowerCase() === 'other');
    if (!otherCat) {
      otherCat = { id: uid(), name: 'Other', budget: 0, color: '#a9b1d6', lastUpdatedDate: new Date().toISOString().slice(0, 10) };
      currentCategories.push(otherCat);
      categoriesChanged = true;
    }

    for (let item of parsed) {
      if (!item.suggestedCategoryId && item.suggestedCategoryName) {
          let matched = currentCategories.find(c => c.name.toLowerCase() === item.suggestedCategoryName!.toLowerCase());
          if (!matched) {
            matched = { id: uid(), name: item.suggestedCategoryName!, budget: 0, color: '#7aa2f7', lastUpdatedDate: new Date().toISOString().slice(0, 10) };
            currentCategories.push(matched);
            categoriesChanged = true;
          }
          item.suggestedCategoryId = matched.id;
      } else if (!item.suggestedCategoryId) {
          item.suggestedCategoryId = otherCat.id;
      }
    }

    if (categoriesChanged) {
      updateData(d => ({ ...d, expenseCategories: currentCategories }));
    }

    if (parsed.length === 0) {
      alert("No valid data found in text.");
    } else {
      setReviewItems(parsed);
      setYearlyText('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {`;

content = content.replace(handleYearlySearch, handleYearlyReplace);

// Add new category creation logic inside review modal
const selectSearch = `<select
                          className="w-full bg-black/40 border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary"
                          value={item.suggestedCategoryId || ''}
                          onChange={(e) => {
                            const newItems = [...reviewItems];
                            newItems[i].suggestedCategoryId = e.target.value || null;
                            setReviewItems(newItems);
                          }}
                        >
                          <option value="">-- Ignore (Don't Import) --</option>
                          {data.expenseCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>`;

const selectReplace = `{addingCategoryIndex === i ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              className="w-full bg-black/40 border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary"
                              placeholder="Category Name"
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  if (newCategoryName.trim()) {
                                    const newId = uid();
                                    updateData(d => ({
                                      ...d,
                                      expenseCategories: [...d.expenseCategories, { id: newId, name: newCategoryName.trim(), budget: 0, color: '#7aa2f7', lastUpdatedDate: new Date().toISOString().slice(0, 10) }]
                                    }));
                                    const newItems = [...reviewItems];
                                    newItems[i].suggestedCategoryId = newId;
                                    setReviewItems(newItems);
                                  }
                                  setAddingCategoryIndex(null);
                                  setNewCategoryName('');
                                }
                                if (e.key === 'Escape') setAddingCategoryIndex(null);
                              }}
                            />
                            <button onClick={() => {
                               if (newCategoryName.trim()) {
                                  const newId = uid();
                                  updateData(d => ({
                                    ...d,
                                    expenseCategories: [...d.expenseCategories, { id: newId, name: newCategoryName.trim(), budget: 0, color: '#7aa2f7', lastUpdatedDate: new Date().toISOString().slice(0, 10) }]
                                  }));
                                  const newItems = [...reviewItems];
                                  newItems[i].suggestedCategoryId = newId;
                                  setReviewItems(newItems);
                                }
                                setAddingCategoryIndex(null);
                                setNewCategoryName('');
                            }} className="p-1 bg-primary text-black rounded"><Check size={14}/></button>
                            <button onClick={() => setAddingCategoryIndex(null)} className="p-1 bg-white/10 text-white rounded"><X size={14}/></button>
                          </div>
                        ) : (
                          <select
                            className="w-full bg-black/40 border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary"
                            value={item.suggestedCategoryId || ''}
                            onChange={(e) => {
                              if (e.target.value === 'CREATE_NEW') {
                                setAddingCategoryIndex(i);
                                setNewCategoryName('');
                              } else {
                                const newItems = [...reviewItems];
                                newItems[i].suggestedCategoryId = e.target.value || null;
                                setReviewItems(newItems);
                              }
                            }}
                          >
                            <option value="">-- Ignore (Don't Import) --</option>
                            {data.expenseCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            <option value="CREATE_NEW">➕ Create New Category...</option>
                          </select>
                        )}`;

content = content.replace(selectSearch, selectReplace);


// Update JSX structure for sub-tabs
const mainContainerSearch = `<div className="space-y-6 animate-fade-in relative block">`;
const mainContainerReplace = `<div className="space-y-6 animate-fade-in relative block">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('monthly')}
          className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${activeTab === 'monthly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}
        >
          Monthly View
        </button>
        <button
          onClick={() => setActiveTab('yearly')}
          className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${activeTab === 'yearly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}\`}
        >
          Yearly View
        </button>
      </div>`;

content = content.replace(mainContainerSearch, mainContainerReplace);


const gridContainerSearch = `<div className={\`grid gap-6 \${showHistoricalGraph ? 'md:grid-cols-4' : 'md:grid-cols-3'}\`}>
        {/* PDF Dropzone */}
        <div
          className={\`glass-card p-6 flex flex-col items-center justify-center text-center transition-all duration-200 border-2 border-dashed \${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}\`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isParsing ? <TrendingDown size={24} className="text-primary animate-bounce" /> : <UploadCloud size={24} className="text-primary" />}
          </div>
          <h3 className="text-sm font-bold text-primary mb-1">Upload Statement</h3>
          <p className="text-xs text-muted-foreground mb-4">Drag & drop your Chase Credit Card PDF statement here to automatically organize transactions.</p>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full"
          >
            {isParsing ? 'Scanning PDF...' : 'Select PDF File'}
          </button>
        </div>

        {/* Bar chart - MTD */}
        <div className={\`glass-card p-5 \${showHistoricalGraph ? 'md:col-span-2' : 'md:col-span-2'}\`}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Current MTD vs Budget</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={12} barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
              <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
              <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
              <Bar dataKey="budget" name="Budget" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.actual > e.budget ? '#f7768e' : e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Graph */}
        {showHistoricalGraph && (
          <div className="glass-card p-5 md:col-span-1">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Spending Over Time</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={historicalData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#f7768e" strokeWidth={2} dot={{ r: 3, fill: '#f7768e', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="#7aa2f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>`;

// Create new pie chart data
const pieChartLogic = `
  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of data.transactions) {
      if (t.date.startsWith(yearlyYear)) {
        totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
      }
    }
    return data.expenseCategories
      .map(c => ({ name: c.name, value: totals[c.id] || 0, color: c.color }))
      .filter(c => c.value > 0)
      .sort((a,b) => b.value - a.value);
  }, [data.transactions, data.expenseCategories, yearlyYear]);

  // Use the same historicalData for yearly comparisons, but grouped by year instead of month
  const yearlyHistoricalData = useMemo(() => {
    const years: Record<string, number> = {};
    for (const t of data.transactions) {
      const y = t.date.slice(0, 4);
      years[y] = (years[y] || 0) + t.amount;
    }
    return Object.keys(years).sort().map(y => ({ name: y, actual: years[y] }));
  }, [data.transactions]);
`;

// Insert pieChartLogic just before return
content = content.replace(`return (`, `${pieChartLogic}\n  return (`);


const gridContainerReplace = `
      {activeTab === 'monthly' ? (
        <div className={\`grid gap-6 \${showHistoricalGraph ? 'md:grid-cols-4' : 'md:grid-cols-3'}\`}>
          {/* PDF Dropzone */}
          <div
            className={\`glass-card p-6 flex flex-col items-center justify-center text-center transition-all duration-200 border-2 border-dashed \${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}\`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {isParsing ? <TrendingDown size={24} className="text-primary animate-bounce" /> : <UploadCloud size={24} className="text-primary" />}
            </div>
            <h3 className="text-sm font-bold text-primary mb-1">Upload Statement</h3>
            <p className="text-xs text-muted-foreground mb-4">Drag & drop your Chase Credit Card PDF statement here to automatically organize transactions.</p>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="application/pdf"
              onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full"
            >
              {isParsing ? 'Scanning PDF...' : 'Select PDF File'}
            </button>
          </div>

          {/* Bar chart - MTD */}
          <div className={\`glass-card p-5 \${showHistoricalGraph ? 'md:col-span-2' : 'md:col-span-2'}\`}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Current MTD vs Budget</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={12} barGap={2}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                <Bar dataKey="budget" name="Budget" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.actual > e.budget ? '#f7768e' : e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Graph */}
          {showHistoricalGraph && (
            <div className="glass-card p-5 md:col-span-1">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Spending Over Time</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={historicalData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#f7768e" strokeWidth={2} dot={{ r: 3, fill: '#f7768e', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="budget" name="Budget" stroke="#7aa2f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Yearly Import Box */}
          <div className="glass-card p-6 flex flex-col md:col-span-1">
            <h3 className="text-sm font-bold text-primary mb-1">Import Yearly Summary</h3>
            <p className="text-xs text-muted-foreground mb-4">Paste your year-end summary text or raw transaction list here.</p>

            <div className="flex gap-2 mb-2">
              <span className="text-xs text-muted-foreground flex items-center">Year:</span>
              <input
                type="text"
                value={yearlyYear}
                onChange={e => setYearlyYear(e.target.value)}
                className="bg-black/40 border border-border rounded px-2 py-1 text-xs w-20 focus:outline-none focus:border-primary"
              />
            </div>

            <textarea
              value={yearlyText}
              onChange={e => setYearlyText(e.target.value)}
              placeholder="e.g.&#10;Home Show details $31,932.20&#10;or&#10;Dec 31, 2025 ... $75.00"
              className="flex-1 bg-black/40 border border-border rounded-lg p-3 text-xs resize-none focus:outline-none focus:border-primary font-mono custom-scrollbar min-h-[120px]"
            />

            <button
              onClick={handleProcessYearly}
              disabled={!yearlyText.trim()}
              className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full disabled:opacity-50"
            >
              Process Summary
            </button>
          </div>

          {/* Pie Chart & Historical Comparison */}
          <div className="glass-card p-5 md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>{yearlyYear} Category Breakdown</h3>
              </div>
              <div className="h-[200px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5', fontSize: '12px' }} />
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none">
                        {pieData.map((e, i) => <PieCell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No data for {yearlyYear}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#c0caf5' }}>Year-over-Year Spending</h3>
              <div className="h-[200px]">
                {yearlyHistoricalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyHistoricalData} barSize={20}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                      <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                      <Bar dataKey="actual" name="Total Spend" fill="#7aa2f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No historical data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(gridContainerSearch, gridContainerReplace);


fs.writeFileSync('src/components/tabs/ExpensesTab.tsx', content, 'utf8');
