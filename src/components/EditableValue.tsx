import { useState, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { fmt } from '../utils';

interface Props {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
};

export function EditableValue({ value, onChange, prefix = '', suffix = '', className = '', size = 'md' }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const commit = () => {
    const num = parseFloat(draft.replace(/[$,]/g, ''));
    if (!isNaN(num) && num >= 0) onChange(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className={`w-28 text-right ${sizeClasses[size]} ${className}`}
        style={{ maxWidth: '160px' }}
        autoFocus
      />
    );
  }

  return (
    <span
      className={`editable-value ${sizeClasses[size]} ${className}`}
      onClick={start}
      title="Click to edit"
    >
      {prefix}{fmt.currency(value)}{suffix}
      <Pencil size={10} className="text-gray-500 opacity-50" />
    </span>
  );
}
