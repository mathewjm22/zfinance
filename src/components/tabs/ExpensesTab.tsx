import { useState, useRef, useMemo } from 'react';
import { TrendingDown, Plus, Trash2, UploadCloud, X, Check, Calendar, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { FinancialData, Transaction } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt, uid } from '../../utils';
import { parseChaseStatement, ParsedTransaction } from '../../utils/pdfParser';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalMonthlyExpenses: number;
}

export function ExpensesTab({ data, updateData, totalMonthlyExpenses }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ParsedTransaction[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCategory = () => updateData(d => ({
    ...d,
    expenseCategories: [...d.expenseCategories, { id: uid(), name: 'New Category', budget: 0, color: '#7aa2f7' }],
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

  // Calculate actuals for current month per category
  const currentMonth = new Date().toISOString().slice(0, 7);
  const categoryActuals = useMemo(() => {
    const actuals: Record<string, number> = {};
    for (const cat of data.expenseCategories) actuals[cat.id] = 0;
    for (const t of data.transactions) {
      if (t.date.startsWith(currentMonth) && actuals[t.categoryId] !== undefined) {
        actuals[t.categoryId] += t.amount;
      }
    }
    return actuals;
  }, [data.transactions, data.expenseCategories, currentMonth]);

  // Data for the Bar Chart
  const chartData = data.expenseCategories.map(c => ({
    name: c.name,
    budget: c.budget,
    actual: categoryActuals[c.id] || 0,
    color: c.color
  }));

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await parseChaseStatement(file, data.expenseCategories);
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
       for (const item of reviewItems) {
          if (!item.suggestedCategoryId) continue;
          newTx.push({
            id: uid(),
            date: item.date,
            description: item.description,
            amount: item.amount,
            categoryId: item.suggestedCategoryId
          });
       }
       return { ...d, transactions: [...d.transactions, ...newTx] };
    });
    
    setReviewItems(null);
  };

  return (
    <div className="space-y-6 animate-fade-in relative block">
      
      {/* Review Modal Overlay */}
      {reviewItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-primary/20">
            <div className="flex items-center justify-between p-5 border-b border-border bg-background">
              <div>
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Check size={20} /> Review Scanned Transactions
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We found {reviewItems.length} transactions. Edit the details and assign categories before importing.
                </p>
              </div>
              <button onClick={() => setReviewItems(null)} className="p-2 hover:bg-white/10 rounded-lg">
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
                        <select 
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
                        </select>
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
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'MTD Spending', value: totalMonthlyExpenses, color: '#f7768e' },
          { label: 'Total Budget',   value: totalBudget,          color: '#7aa2f7' },
          { label: 'Over/Under',     value: totalBudget - totalMonthlyExpenses, color: totalBudget >= totalMonthlyExpenses ? '#9ece6a' : '#f7768e' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}><Calendar size={12} className="inline mr-1 mb-0.5" />{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.label === 'Over/Under' && s.value >= 0 ? '+' : ''}{fmt.compact(s.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold w-full"
          >
            {isParsing ? 'Scanning PDF...' : 'Select PDF File'}
          </button>
        </div>

        {/* Bar chart */}
        <div className="glass-card p-5 md:col-span-2">
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Table - Budget Categories */}
        <div className="glass-card p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c0caf5' }}>
              <TrendingDown size={16} style={{ color: '#f7768e' }} /> Budget Categories
            </h3>
            <button onClick={addCategory} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(247,118,142,0.12)', color: '#f7768e' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-[#1a1b26] z-10" style={{ borderBottom: '1px solid #1e2030' }}>
                  {['Category', 'MTD Actual', 'Budget', ''].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs font-medium" style={{ color: '#565f89' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.expenseCategories.map(exp => {
                  const actual = categoryActuals[exp.id] || 0;
                  const over = actual > exp.budget && exp.budget > 0;
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
                        <span className={`font-medium ${over ? 'text-destructive' : 'text-foreground'}`}>${actual.toFixed(2)}</span>
                      </td>
                      <td className="py-2 px-2">
                        <EditableValue value={exp.budget} size="sm"
                          onChange={v => updateData(d => ({ ...d, expenseCategories: d.expenseCategories.map(c => c.id === exp.id ? { ...c, budget: v } : c) }))} />
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
                      <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{tx.date.slice(5)}</td>
                      <td className="py-2 px-2">
                        <input value={tx.description} onChange={e => updateData(d => ({ ...d, transactions: d.transactions.map(t => t.id === tx.id ? { ...t, description: e.target.value } : t) }))}
                          className="bg-transparent border-0 p-0 text-xs w-full font-medium focus:outline-none focus:text-primary" style={{ color: '#c0caf5' }} />
                      </td>
                      <td className="py-2 px-2">
                        <EditableValue value={tx.amount} size="sm" isCurrency
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
