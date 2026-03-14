import { Database, Download, Upload, AlertCircle } from 'lucide-react';
import { FinancialData } from '../../types';
import { defaultData } from '../../data/defaultData';
import { useRef, useState } from 'react';

interface Props {
  data: FinancialData;
  updateData: (d: FinancialData) => void;
  resetData: () => void;
}

export function EditDataTab({ data, updateData, resetData }: Props) {
  const [jsonError, setJsonError] = useState('');
  const [jsonSuccess, setJsonSuccess] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zfinance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      if (!textRef.current) return;
      const parsed = JSON.parse(textRef.current.value);
      if (typeof parsed !== 'object' || !parsed.version) throw new Error("Invalid format");
      updateData({ ...defaultData, ...parsed });
      setJsonError('');
      setJsonSuccess('Data imported successfully!');
      setTimeout(() => setJsonSuccess(''), 3000);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON format');
      setJsonSuccess('');
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data to default? This cannot be undone unless you have a backup.")) {
      resetData();
      if (textRef.current) textRef.current.value = JSON.stringify(defaultData, null, 2);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Database size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Raw Data Editor</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Actions panel */}
        <div className="glass-card p-5 space-y-4 h-fit">
          <h3 className="text-sm font-semibold mb-2">Actions</h3>
          <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Download size={16} /> Export to JSON
          </button>
          <button onClick={handleImport} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
            <Upload size={16} /> Import from Editor
          </button>
          <div className="pt-4 mt-4 border-t border-border">
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
              <AlertCircle size={16} /> Factory Reset
            </button>
          </div>

          {jsonError && <p className="text-xs text-destructive mt-2">{jsonError}</p>}
          {jsonSuccess && <p className="text-xs text-success mt-2">{jsonSuccess}</p>}
        </div>

        {/* JSON Editor panel */}
        <div className="md:col-span-2 glass-card p-5 flex flex-col h-[600px]">
          <h3 className="text-sm font-semibold mb-3">Manual JSON Editor</h3>
          <p className="text-xs text-muted-foreground mb-4">You can paste a full backup here and click "Import" to apply it, or manually edit values.</p>
          <textarea
            ref={textRef}
            defaultValue={JSON.stringify(data, null, 2)}
            className="flex-1 w-full bg-[#1a1b26] border border-[#2a2a3d] rounded-lg p-4 font-mono text-xs text-[#a9b1d6] resize-none focus:outline-none focus:border-primary custom-scrollbar"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
