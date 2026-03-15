import { useState, useRef, useMemo } from 'react';
import { TrendingDown, Plus, Trash2, UploadCloud, X, Check, Calendar, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line } from 'recharts';
import { FinancialData, Transaction } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';
import { parseChaseStatement, parseYearlySummaryText, ParsedTransaction } from '../../utils/pdfParser';
import { PieChart, Pie, Cell as PieCell } from 'recharts';

function AddExpenseInput({ total, onAdd }: { total: number, onAdd: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft('');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const commit = () => {
    const num = parseFloat(draft.replace(/[$,]/g, ''));
    if (!isNaN(num) && num > 0) onAdd(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        placeholder="Add..."
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 text-left text-sm bg-black/40 border border-border rounded px-1"
        style={{ maxWidth: '80px' }}
      />
    );
  }

  return (
    <span
      className="editable-value text-sm flex items-center gap-1 group cursor-pointer"
      onClick={start}
      title="Click to add expense"
    >
      {fmt.currency(total)}
      <Plus size={10} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalMonthlyExpenses: number;
}

export function ExpensesTab({ data, updateData, totalMonthlyExpenses }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'quarterly' | 'yearly'>('overview');
  const [yearlyTextMap, setYearlyTextMap] = useState<Record<string, string>>({});
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());
  const [clearExistingYearly, setClearExistingYearly] = useState(false);
  const [globalMonth, setGlobalMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [globalQuarter, setGlobalQuarter] = useState(`Q${Math.floor(new Date().getMonth() / 3) + 1}`);

  const yearlyText = yearlyTextMap[yearlyYear] || '';
  const setYearlyText = (text: string) => setYearlyTextMap(prev => ({ ...prev, [yearlyYear]: text }));
  const [quarterlyTextMap, setQuarterlyTextMap] = useState<Record<string, string>>({});
  const quarterlyText = quarterlyTextMap[`${yearlyYear}-${globalQuarter}`] || '';
  const setQuarterlyText = (text: string) => setQuarterlyTextMap(prev => ({ ...prev, [`${yearlyYear}-${globalQuarter}`]: text }));

  const [monthlyTextMap, setMonthlyTextMap] = useState<Record<string, string>>({});
  const monthlyText = monthlyTextMap[`${yearlyYear}-${globalMonth}`] || '';
  const setMonthlyText = (text: string) => setMonthlyTextMap(prev => ({ ...prev, [`${yearlyYear}-${globalMonth}`]: text }));

  const availableYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 20; i++) {
      years.push((currentYear - i).toString());
    }
    return years;
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ParsedTransaction[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategoryIndex, setAddingCategoryIndex] = useState<number | null>(null);

  const [importMonth, setImportMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [importYear, setImportYear] = useState(new Date().getFullYear().toString());

  const overviewPieData = useMemo(() => {
    const totals: Record<string, number> = {};
    const currentYear = new Date().getFullYear().toString();
    for (const t of data.transactions) {
      if (t.date.startsWith(currentYear)) {
        totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
      }
    }
    return data.expenseCategories
      .map(c => ({ name: c.name, value: totals[c.id] || 0, color: c.color }))
      .filter(c => c.value > 0)
      .sort((a,b) => b.value - a.value);
  }, [data.transactions, data.expenseCategories]);

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

  const addCategory = () => updateData(d => ({
    ...d,
    expenseCategories: [...d.expenseCategories, { id: uid(), name: 'New Category', budget: 0, color: '#7aa2f7', lastUpdatedDate: new Date().toISOString().slice(0, 10) }],
  }));

  const removeCategory = (id: string) => updateData(d => ({ 
    ...d, 
    expenseCategories: d.expenseCategories.filter(e => e.id !== id),
    transactions: d.transactions.filter(t => t.categoryId !== id)
  }));
  
  const removeTransaction = (id: string) => updateData(d => ({
    ...d,
    transactions: d.transactions.filter(t => t.id !== id)
  }));

  const totalBudget = data.expenseCategories.reduce((s, e) => s + e.budget, 0);


  const mtdActuals = useMemo(() => {
    const actuals: Record<string, number> = {};
    for (const cat of data.expenseCategories) actuals[cat.id] = 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    for (const t of data.transactions) {
      if (t.date.startsWith(currentMonth) && actuals[t.categoryId] !== undefined) {
        actuals[t.categoryId] += t.amount;
      }
    }
    return actuals;
  }, [data.transactions, data.expenseCategories]);

  const qtdActuals = useMemo(() => {
    const actuals: Record<string, number> = {};
    for (const cat of data.expenseCategories) actuals[cat.id] = 0;
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentQ = `Q${Math.floor(now.getMonth() / 3) + 1}`;
    for (const t of data.transactions) {
      if (t.date.startsWith(currentYear)) {
        const month = parseInt(t.date.slice(5, 7));
        const q = `Q${Math.floor((month - 1) / 3) + 1}`;
        if (q === currentQ && actuals[t.categoryId] !== undefined) {
          actuals[t.categoryId] += t.amount;
        }
      }
    }
    return actuals;
  }, [data.transactions, data.expenseCategories]);

  const ytdActuals = useMemo(() => {
    const actuals: Record<string, number> = {};
    for (const cat of data.expenseCategories) actuals[cat.id] = 0;
    const currentYear = new Date().getFullYear().toString();
    for (const t of data.transactions) {
      if (t.date.startsWith(currentYear) && actuals[t.categoryId] !== undefined) {
        actuals[t.categoryId] += t.amount;
      }
    }
    return actuals;
  }, [data.transactions, data.expenseCategories]);

  const mtdChartData = data.expenseCategories.map(c => ({
    name: c.name,
    budget: c.budget,
    actual: mtdActuals[c.id] || 0,
    color: c.color
  }));

  const qtdChartData = data.expenseCategories.map(c => ({
    name: c.name,
    budget: c.budget * 3,
    actual: qtdActuals[c.id] || 0,
    color: c.color
  }));

  const mtdTotalActual = useMemo(() => Object.values(mtdActuals).reduce((a,b)=>a+b, 0), [mtdActuals]);
  const qtdTotalActual = useMemo(() => Object.values(qtdActuals).reduce((a,b)=>a+b, 0), [qtdActuals]);
  const ytdTotalActual = useMemo(() => Object.values(ytdActuals).reduce((a,b)=>a+b, 0), [ytdActuals]);

  // Calculate actuals per category based on active tab
  const categoryActuals = useMemo(() => {
    const actuals: Record<string, number> = {};
    for (const cat of data.expenseCategories) actuals[cat.id] = 0;
    
    if (activeTab === 'monthly') {
      const selectedMonth = `${yearlyYear}-${globalMonth}`;
      for (const t of data.transactions) {
        if (t.date.startsWith(selectedMonth) && actuals[t.categoryId] !== undefined) {
          actuals[t.categoryId] += t.amount;
        }
      }
    } else if (activeTab === 'quarterly') {
      for (const t of data.transactions) {
        if (t.date.startsWith(yearlyYear)) {
          const month = parseInt(t.date.slice(5, 7));
          const q = `Q${Math.floor((month - 1) / 3) + 1}`;
          if (q === globalQuarter && actuals[t.categoryId] !== undefined) {
            actuals[t.categoryId] += t.amount;
          }
        }
      }
    } else {
      for (const t of data.transactions) {
        if (t.date.startsWith(yearlyYear) && actuals[t.categoryId] !== undefined) {
          actuals[t.categoryId] += t.amount;
        }
      }
    }
    return actuals;
  }, [data.transactions, data.expenseCategories, activeTab, yearlyYear, globalMonth, globalQuarter]);


  const totalActual = useMemo(() => {
    let sum = 0;
    for (const v of Object.values(categoryActuals)) sum += v;
    return sum;
  }, [categoryActuals]);

  // Data for the Bar Chart
  const chartData = data.expenseCategories.map(c => ({
    name: c.name,
    budget: activeTab === 'quarterly' ? c.budget * 3 : activeTab === 'yearly' ? c.budget * 12 : c.budget,
    actual: categoryActuals[c.id] || 0,
    color: c.color
  }));

  // Historical data for Money Over Time Graph
  const historicalData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const t of data.transactions) {
      const monthStr = t.date.slice(0, 7); // YYYY-MM
      months[monthStr] = (months[monthStr] || 0) + t.amount;
    }
    const sortedMonths = Object.keys(months).sort();
    return sortedMonths.map(m => ({
      name: m, // YYYY-MM
      actual: months[m],
      budget: totalBudget // Using current total budget for historical comparison as we don't track historical budget
    }));
  }, [data.transactions, totalBudget]);

  const showHistoricalGraph = historicalData.length > 1;

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await parseChaseStatement(file, data.expenseCategories);

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
      }
      if (parsed.length === 0) {
        alert("We couldn't detect any transactions in this PDF. It might be formatted differently.");
      } else {
        setReviewItems(parsed);
      }
    } catch (e) {
      alert("Failed to parse statement: " + String(e));
    } finally {
      setIsParsing(false);
    }
  };

  const processSummaryText = (text: string, defaultDate: string, onSuccess: () => void) => {
    if (!text.trim()) return;
    const parsed = parseYearlySummaryText(text, defaultDate, data.expenseCategories);

    let currentCategories = [...data.expenseCategories];
    let categoriesChanged = false;

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
      onSuccess();
    }
  };

  const getLastDay = (y: number, m: number) => new Date(y, m, 0).getDate();

  const handleProcessMonthly = () => {
    const y = parseInt(yearlyYear);
    const m = parseInt(globalMonth);
    const dateStr = `${yearlyYear}-${globalMonth}-${getLastDay(y, m).toString().padStart(2, '0')}`;
    setImportYear(yearlyYear);
    setImportMonth(globalMonth);
    processSummaryText(monthlyText, dateStr, () => setMonthlyText(''));
  };

  const handleProcessQuarterly = () => {
    const qNum = parseInt(globalQuarter.charAt(1));
    const m = qNum * 3;
    const y = parseInt(yearlyYear);
    const dateStr = `${yearlyYear}-${m.toString().padStart(2, '0')}-${getLastDay(y, m).toString().padStart(2, '0')}`;
    setImportYear(yearlyYear);
    setImportMonth(m.toString().padStart(2, '0'));
    processSummaryText(quarterlyText, dateStr, () => setQuarterlyText(''));
  };

  const handleProcessYearly = () => {
    const dateStr = `${yearlyYear}-12-31`;
    setImportYear(yearlyYear);
    setImportMonth('12');
    processSummaryText(yearlyText, dateStr, () => setYearlyText(''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = () => {
    if (!reviewItems) return;
    
    updateData(d => {
       const newTx: Transaction[] = [];
       const categoriesToClear = new Set<string>();
       
       for (const item of reviewItems) {
          if (!item.suggestedCategoryId) continue;
          categoriesToClear.add(item.suggestedCategoryId);
          newTx.push({
            id: uid(),
            date: item.date,
            description: item.description,
            amount: item.amount,
            categoryId: item.suggestedCategoryId
          });
       }

       let existingTxs = d.transactions;
       if (activeTab === 'yearly' && clearExistingYearly) {
         existingTxs = existingTxs.filter(t => 
           !(t.date.startsWith(yearlyYear) && categoriesToClear.has(t.categoryId))
         );
       }

       return { ...d, transactions: [...existingTxs, ...newTx] };
    });
    
    setReviewItems(null);
    setClearExistingYearly(false); // Reset
  };

  return (
    <div className="space-y-6 animate-fade-in relative block">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'monthly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Monthly View
        </button>
        <button
          onClick={() => setActiveTab('quarterly')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quarterly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Quarterly View
        </button>
        <button
          onClick={() => setActiveTab('yearly')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'yearly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Yearly View
        </button>
      </div>
      
      {/* Review Modal Overlay */}
      {reviewItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-primary/20">
            <div className="flex items-center justify-between p-5 border-b border-border bg-background">
              <div>
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Check size={20} /> Review Scanned Transactions
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  We found {reviewItems.length} transactions. Edit the details and assign categories before importing.
                </p>
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-border/50 inline-flex">
                  <span className="text-xs text-muted-foreground font-medium">Import Date:</span>
                  <select
                    value={importMonth}
                    onChange={e => {
                      const newMonth = e.target.value;
                      setImportMonth(newMonth);
                      if (reviewItems) {
                        const newItems = reviewItems.map(item => {
                          const dateParts = item.date.split('-');
                          if (dateParts.length === 3) {
                             const lastDay = new Date(parseInt(importYear), parseInt(newMonth), 0).getDate();
                             const currentDay = parseInt(dateParts[2]);
                             const newDay = currentDay > lastDay ? lastDay : currentDay;
                             return { ...item, date: `${importYear}-${newMonth}-${newDay.toString().padStart(2, '0')}` };
                          }
                          return item;
                        });
                        setReviewItems(newItems);
                      }
                    }}
                    className="bg-background border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m.toString().padStart(2, '0')}>
                        {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={importYear}
                    onChange={e => {
                      const newYear = e.target.value;
                      setImportYear(newYear);
                      if (reviewItems) {
                        const newItems = reviewItems.map(item => {
                          const dateParts = item.date.split('-');
                          if (dateParts.length === 3) {
                             const lastDay = new Date(parseInt(newYear), parseInt(importMonth), 0).getDate();
                             const currentDay = parseInt(dateParts[2]);
                             const newDay = currentDay > lastDay ? lastDay : currentDay;
                             return { ...item, date: `${newYear}-${importMonth}-${newDay.toString().padStart(2, '0')}` };
                          }
                          return item;
                        });
                        setReviewItems(newItems);
                      }
                    }}
                    className="bg-background border border-border text-foreground text-xs rounded-md p-1.5 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => setReviewItems(null)} className="p-2 hover:bg-white/10 rounded-lg self-start">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-background/50">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1b26] sticky top-0 z-10">
                  <tr className="border-b border-border text-xs text-muted-foreground text-left">
                    <th className="py-3 px-4 font-medium w-32">Date</th>
                    <th className="py-3 px-4 font-medium">Description</th>
                    <th className="py-3 px-4 font-medium w-32">Amount</th>
                    <th className="py-3 px-4 font-medium w-48">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewItems.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-4">
                        <input type="date" className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-muted-foreground w-full focus:border-primary focus:outline-none"
                          value={item.date} onChange={(e) => {
                            const newItems = [...reviewItems];
                            newItems[i].date = e.target.value;
                            setReviewItems(newItems);
                          }} />
                      </td>
                      <td className="py-2 px-4">
                         <input type="text" className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-foreground font-medium w-full focus:border-primary focus:outline-none"
                          value={item.description} onChange={(e) => {
                            const newItems = [...reviewItems];
                            newItems[i].description = e.target.value;
                            setReviewItems(newItems);
                          }} />
                      </td>
                      <td className="py-2 px-4 text-info font-bold">
                        <div className="flex items-center">
                          <span className="text-muted-foreground text-xs mr-1">$</span>
                          <input type="number" step="0.01" className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-info font-bold w-full focus:border-primary focus:outline-none"
                            value={item.amount} onChange={(e) => {
                              const newItems = [...reviewItems];
                              newItems[i].amount = parseFloat(e.target.value) || 0;
                              setReviewItems(newItems);
                            }} />
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {addingCategoryIndex === i ? (
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-border bg-background flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-success">
                  {reviewItems.filter(r => r.suggestedCategoryId).reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span> will be added to your transactions history.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => setReviewItems(null)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-white/5 text-foreground hover:bg-white/10 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleImport} className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                  <Check size={16} /> Import Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Top Cards */}
      {activeTab === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'MTD Spending', value: mtdTotalActual, budget: totalBudget, color: '#f7768e' },
            { label: 'QTD Spending', value: qtdTotalActual, budget: totalBudget * 3, color: '#f7768e' },
            { label: 'YTD Spending', value: ytdTotalActual, budget: totalBudget * 12, color: '#f7768e' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs" style={{ color: '#565f89' }}><Calendar size={12} className="inline mr-1 mb-0.5" />{s.label}</p>
                <p className="text-xs" style={{ color: s.budget >= s.value ? '#9ece6a' : '#f7768e' }}>
                  {s.budget >= s.value ? 'Under Budget' : 'Over Budget'}
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {fmt.compact(s.value)} <span className="text-sm font-normal text-muted-foreground">/ {fmt.compact(s.budget)}</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: activeTab === 'monthly' ? 'MTD Spending' : activeTab === 'quarterly' ? 'QTD Spending' : activeTab === 'yearly' ? 'YTD Spending' : 'Total Spending', value: totalActual, color: '#f7768e' },
            { label: 'Total Budget',   value: activeTab === 'quarterly' ? totalBudget * 3 : activeTab === 'yearly' ? totalBudget * 12 : totalBudget,          color: '#7aa2f7' },
            { label: 'Over/Under',     value: (activeTab === 'quarterly' ? totalBudget * 3 : activeTab === 'yearly' ? totalBudget * 12 : totalBudget) - totalActual, color: (activeTab === 'quarterly' ? totalBudget * 3 : activeTab === 'yearly' ? totalBudget * 12 : totalBudget) >= totalActual ? '#9ece6a' : '#f7768e' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <p className="text-xs mb-1" style={{ color: '#565f89' }}><Calendar size={12} className="inline mr-1 mb-0.5" />{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color as string }}>
                {s.label === 'Over/Under' && (s.value as number) >= 0 ? '+' : ''}{fmt.compact(s.value as number)}
              </p>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* MTD vs Budget */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>MTD vs Budget</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={mtdChartData} barSize={12} barGap={2}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                <Bar dataKey="budget" name="Budget" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                  {mtdChartData.map((e, i) => <Cell key={i} fill={e.actual > e.budget ? '#f7768e' : e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* QTD vs Budget */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>QTD vs Budget</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={qtdChartData} barSize={12} barGap={2}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                <Bar dataKey="budget" name="Budget" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                  {qtdChartData.map((e, i) => <Cell key={i} fill={e.actual > e.budget ? '#f7768e' : e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Graph */}
          {showHistoricalGraph && (
            <div className="glass-card p-5 md:col-span-2">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Spending Over Time</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={historicalData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#f7768e" strokeWidth={2} dot={{ r: 3, fill: '#f7768e', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="budget" name="Budget" stroke="#7aa2f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pie Chart & Historical Comparison */}
          <div className="glass-card p-5 md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: '#c0caf5' }}>YTD Category Breakdown</h3>
              </div>
              <div className="h-[200px]">
                {overviewPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5', fontSize: '12px' }} />
                      <Pie data={overviewPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none">
                        {overviewPieData.map((e, i) => <PieCell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No data for YTD</div>
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
                      <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
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
      )}

{activeTab === 'monthly' && (
        <div className={`grid gap-6 ${showHistoricalGraph ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {/* PDF Dropzone */}
          <div
            className={`glass-card p-6 flex flex-col items-center justify-center text-center transition-all duration-200 border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}`}
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
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full mb-4"
            >
              {isParsing ? 'Scanning PDF...' : 'Select PDF File'}
            </button>

            <div className="w-full text-left mt-2 border-t border-border pt-4">
              <h3 className="text-sm font-bold text-primary mb-1">Or Paste Summary</h3>
              <textarea
                value={monthlyText}
                onChange={e => setMonthlyText(e.target.value)}
                placeholder="Paste text summary here..."
                className="w-full bg-black/40 border border-border rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-primary font-mono custom-scrollbar min-h-[80px]"
              />
              <button
                onClick={handleProcessMonthly}
                disabled={!monthlyText.trim()}
                className="mt-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full disabled:opacity-50"
              >
                Process Text
              </button>
            </div>
          </div>

          {/* Bar chart - MTD */}
          <div className={`glass-card p-5 ${showHistoricalGraph ? 'md:col-span-2' : 'md:col-span-2'}`}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Current Period vs Budget</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={12} barGap={2}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
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
                  <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#f7768e" strokeWidth={2} dot={{ r: 3, fill: '#f7768e', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="budget" name="Budget" stroke="#7aa2f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quarterly' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Quarterly Import Box */}
          <div className="glass-card p-6 flex flex-col md:col-span-1">
            <h3 className="text-sm font-bold text-primary mb-1">Import Quarterly Summary</h3>
            <p className="text-xs text-muted-foreground mb-4">Paste your quarterly summary text here.</p>

            <textarea
              value={quarterlyText}
              onChange={e => setQuarterlyText(e.target.value)}
              placeholder="e.g.\nHome Show details $31,932.20"
              className="flex-1 bg-black/40 border border-border rounded-lg p-3 text-xs resize-none focus:outline-none focus:border-primary font-mono custom-scrollbar min-h-[120px]"
            />

            <button
              onClick={handleProcessQuarterly}
              disabled={!quarterlyText.trim()}
              className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full disabled:opacity-50"
            >
              Process Summary
            </button>
          </div>

          <div className="glass-card p-5 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Current Period vs Budget</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={20} barGap={2}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2030" />
                <XAxis dataKey="name" tick={{ fill: '#565f89', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
                <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#565f89' }} />
                <Bar dataKey="budget" name="Budget (Quarterly)" fill="#7aa2f740" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.actual > e.budget ? '#f7768e' : e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'yearly' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Yearly Import Box */}
          <div className="glass-card p-6 flex flex-col md:col-span-1">
            <h3 className="text-sm font-bold text-primary mb-1">Import Yearly Summary</h3>
            <p className="text-xs text-muted-foreground mb-4">Paste your year-end summary text or raw transaction list here.</p>

            <textarea
              value={yearlyText}
              onChange={e => setYearlyText(e.target.value)}
              placeholder="e.g.\nHome Show details $31,932.20\nor\nDec 31, 2025 ... $75.00"
              className="flex-1 bg-black/40 border border-border rounded-lg p-3 text-xs resize-none focus:outline-none focus:border-primary font-mono custom-scrollbar min-h-[120px]"
            />

            <div className="flex items-center gap-2 mt-3 mb-1">
              <input
                type="checkbox"
                id="clearExisting"
                checked={clearExistingYearly}
                onChange={e => setClearExistingYearly(e.target.checked)}
                className="accent-primary"
              />
              <label htmlFor="clearExisting" className="text-xs text-muted-foreground cursor-pointer">
                Clear existing transactions for this year before importing
              </label>
            </div>

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
                      <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5', fontSize: '12px' }} />
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
                      <Tooltip formatter={(v: any) => fmt.currency(v)} contentStyle={{ background: '#1a1b26', border: '1px solid #2a2a3d', borderRadius: 8, color: '#c0caf5' }} />
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
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Table - Budget Categories */}
        <div className="glass-card p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
              <TrendingDown size={16} style={{ color: '#f7768e' }} /> 
              Budget Categories
              <select
                value={yearlyYear}
                onChange={e => setYearlyYear(e.target.value)}
                className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1 focus:outline-none focus:border-primary cursor-pointer ml-2"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {activeTab === 'monthly' && (
                <select
                  value={globalMonth}
                  onChange={e => setGlobalMonth(e.target.value)}
                  className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1 focus:outline-none focus:border-primary cursor-pointer ml-1"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m.toString().padStart(2, '0')}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              )}

              {activeTab === 'quarterly' && (
                <select
                  value={globalQuarter}
                  onChange={e => setGlobalQuarter(e.target.value)}
                  className="bg-black/40 border border-border text-foreground text-xs rounded-md p-1 focus:outline-none focus:border-primary cursor-pointer ml-1"
                >
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              )}
            </h3>
            <button onClick={addCategory} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(247,118,142,0.12)', color: '#f7768e' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-[#1a1b26] z-10" style={{ borderBottom: '1px solid #1e2030' }}>
                  {['Category', activeTab === 'monthly' ? 'Monthly Actual' : activeTab === 'quarterly' ? 'QTD Actual' : `${yearlyYear} Actual`, 'Budget', ''].map((h, i) => (
                    <th key={i} className="text-left py-2 px-2 text-xs font-medium" style={{ color: '#565f89' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.expenseCategories.map(exp => {
                  const actual = categoryActuals[exp.id] || 0;
                  const over = actual > exp.budget && exp.budget > 0;
                  const todayStr = new Date().toISOString().slice(0, 10);
                  
                  const handleActualAdd = (newAmount: number) => {
                    if (newAmount === 0 || isNaN(newAmount)) return;

                    // Function to get last day of month
                    const getLastDay = (y: number, m: number) => new Date(y, m, 0).getDate();

                    if (activeTab === 'monthly') {
                      const y = parseInt(yearlyYear);
                      const m = parseInt(globalMonth);
                      const lastDay = getLastDay(y, m);
                      const dateStr = `${yearlyYear}-${globalMonth}-${lastDay.toString().padStart(2, '0')}`;

                      updateData(d => ({
                        ...d,
                        transactions: [...d.transactions, {
                          id: uid(),
                          date: dateStr,
                          description: 'Manual Entry',
                          amount: newAmount,
                          categoryId: exp.id,
                        }]
                      }));
                    } else if (activeTab === 'quarterly') {
                      const isRecurring = window.confirm(`Is this ${fmt.currency(newAmount)} expense recurring monthly for ${globalQuarter} ${yearlyYear}?\n\nOK = Recurring (Creates 3 monthly transactions)\nCancel = One-Time (Creates 1 transaction for the quarter)`);
                      updateData(d => {
                        const newTxs = [];
                        const qNum = parseInt(globalQuarter.charAt(1));
                        if (isRecurring) {
                          for (let i = 0; i < 3; i++) {
                            const m = (qNum - 1) * 3 + i + 1;
                            const y = parseInt(yearlyYear);
                            const lastDay = getLastDay(y, m);
                            newTxs.push({
                              id: uid(),
                              date: `${yearlyYear}-${m.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
                              description: 'Manual Recurring Entry',
                              amount: newAmount,
                              categoryId: exp.id,
                            });
                          }
                        } else {
                          const m = qNum * 3;
                          const y = parseInt(yearlyYear);
                          const lastDay = getLastDay(y, m);
                          newTxs.push({
                            id: uid(),
                            date: `${yearlyYear}-${m.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
                            description: 'Manual One-Time Entry',
                            amount: newAmount,
                            categoryId: exp.id,
                          });
                        }
                        return {
                          ...d,
                          transactions: [...d.transactions, ...newTxs]
                        };
                      });
                    } else {
                      const isRecurring = window.confirm(`Is this ${fmt.currency(newAmount)} expense recurring monthly for ${yearlyYear}?

OK = Recurring (Creates 12 monthly transactions)
Cancel = One-Time (Creates 1 transaction for the year)`);
                      updateData(d => {
                        const newTxs = [];
                        if (isRecurring) {
                          for (let month = 1; month <= 12; month++) {
                            const monthStr = month.toString().padStart(2, '0');
                            newTxs.push({
                              id: uid(),
                              date: `${yearlyYear}-${monthStr}-28`, // arbitrary day
                              description: 'Manual Recurring Entry',
                              amount: newAmount,
                              categoryId: exp.id,
                            });
                          }
                        } else {
                          newTxs.push({
                            id: uid(),
                            date: `${yearlyYear}-12-31`, // end of year
                            description: 'Manual One-Time Entry',
                            amount: newAmount,
                            categoryId: exp.id,
                          });
                        }
                        return {
                          ...d,
                          transactions: [...d.transactions, ...newTxs],

                        };
                      });
                    }
                  };

                  const handleBudgetEdit = (v: number) => {
                    updateData(d => ({ 
                      ...d, 
                      expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, budget: v } : c)
                    }));
                  };



                  return (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #1e203060' }}>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: exp.color }} />
                          <input value={exp.name} onChange={e => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, name: e.target.value } : c) }))}
                            className="bg-transparent border-0 p-0 text-sm w-full font-medium" style={{ color: '#c0caf5' }} />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`font-medium ${over ? 'text-destructive' : 'text-foreground'}`}>
                          <AddExpenseInput total={actual} onAdd={handleActualAdd} />
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <EditableValue value={exp.budget} size="sm" onChange={handleBudgetEdit} />
                      </td>

                      <td className="py-2 px-2 text-right">
                        <button onClick={() => removeCategory(exp.id)} className="p-1 rounded hover:bg-red-900/20">
                          <Trash2 size={12} style={{ color: '#f7768e' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table - Recent Transactions */}
        <div className="glass-card p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
              <History size={16} className="text-info" /> Recent Transactions
            </h3>
            <span className="text-xs text-muted-foreground">{data.transactions.length} total</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-[#1a1b26] z-10" style={{ borderBottom: '1px solid #1e2030' }}>
                  {['Date', 'For', 'Amt', 'Cat.', ''].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs font-medium" style={{ color: '#565f89' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.transactions.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 100).map(tx => {
                  const cat = data.expenseCategories.find(c => c.id === tx.categoryId);
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                      <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{tx.date}</td>
                      <td className="py-2 px-2">
                        <input value={tx.description} onChange={e => updateData(d => ({ ...d, transactions: d.transactions.map(t => t.id === tx.id ? { ...t, description: e.target.value } : t) }))}
                          className="bg-transparent border-0 p-0 text-xs w-full font-medium focus:outline-none focus:text-primary" style={{ color: '#c0caf5' }} />
                      </td>
                      <td className="py-2 px-2">
                        <EditableValue value={tx.amount} size="sm" 
                          onChange={v => updateData(d => ({ ...d, transactions: d.transactions.map(t => t.id === tx.id ? { ...t, amount: v } : t) }))} />
                      </td>
                      <td className="py-2 px-2">
                        <select 
                          className="bg-transparent text-xs w-24 max-w-[100px] border-0 outline-none truncate" style={{ color: cat?.color || '#a9b1d6' }}
                          value={tx.categoryId}
                          onChange={e => updateData(d => ({ ...d, transactions: d.transactions.map(t => t.id === tx.id ? { ...t, categoryId: e.target.value } : t) }))}
                        >
                          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-1 text-right">
                        <button onClick={() => removeTransaction(tx.id)} className="p-1 rounded opacity-50 hover:opacity-100 hover:text-destructive">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground italic">
                      No transactions yet. Upload a statement to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
