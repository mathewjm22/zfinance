import { Landmark } from 'lucide-react';
import { FinancialData } from '../../types';
import { EditableValue } from '../EditableValue';
import { fmt } from '../../utils';

interface Props {
  data: FinancialData;
  updateData: (fn: (p: FinancialData) => FinancialData) => void;
  totalGrossIncome: number;
}

const BRACKETS_MFJ_2024 = [
  { rate: 0.10, min: 0,       max: 23_200 },
  { rate: 0.12, min: 23_200,  max: 94_300 },
  { rate: 0.22, min: 94_300,  max: 201_050 },
  { rate: 0.24, min: 201_050, max: 383_900 },
  { rate: 0.32, min: 383_900, max: 487_450 },
  { rate: 0.35, min: 487_450, max: 731_200 },
  { rate: 0.37, min: 731_200, max: Infinity },
];

function calcFederalTax(taxableIncome: number) {
  let tax = 0;
  for (const b of BRACKETS_MFJ_2024) {
    if (taxableIncome <= b.min) break;
    tax += (Math.min(taxableIncome, b.max) - b.min) * b.rate;
  }
  return tax;
}

export function TaxTab({ data, updateData, totalGrossIncome }: Props) {
  const ti = data.taxInfo;
  const annualGross = totalGrossIncome * 12;
  const agi = annualGross - ti.preTaxContributions;
  const deduction = Math.max(ti.standardDeduction, ti.itemizedDeductions);
  const taxableIncome = Math.max(0, agi - deduction);
  const federalTax = calcFederalTax(taxableIncome);
  const stateTax = taxableIncome * (ti.stateTaxRate / 100);
  const ficaTax = Math.min(annualGross, 168_600) * 0.0765;
  const totalTax = federalTax + stateTax + ficaTax;
  const effectiveRate = annualGross > 0 ? (totalTax / annualGross) * 100 : 0;
  const currentBracket = BRACKETS_MFJ_2024.find(b => taxableIncome >= b.min && taxableIncome < b.max);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Federal Tax', value: federalTax / 12, color: '#f7768e', sub: fmt.currency(federalTax) + '/year' },
          { label: 'State Tax', value: stateTax / 12, color: '#e0af68', sub: `${ti.stateTaxRate}% rate` },
          { label: 'FICA/SS', value: ficaTax / 12, color: '#bb9af7', sub: '7.65% (employee)' },
          { label: 'Effective Rate', value: effectiveRate, color: '#7aa2f7', isPercent: true, sub: 'of gross income' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs mb-1" style={{ color: '#565f89' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.isPercent ? `${effectiveRate.toFixed(1)}%` : fmt.currency(s.value) + '/mo'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#565f89' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#c0caf5' }}>
            <Landmark size={16} style={{ color: '#e0af68' }} /> Tax Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Annual Gross Income', value: annualGross, color: '#9ece6a' },
              { label: 'Pre-Tax Contributions', value: -ti.preTaxContributions, color: '#7aa2f7' },
              { label: 'AGI', value: agi, color: '#c0caf5', bold: true },
              { label: `Deduction (${deduction === ti.standardDeduction ? 'Standard' : 'Itemized'})`, value: -deduction, color: '#bb9af7' },
              { label: 'Taxable Income', value: taxableIncome, color: '#e0af68', bold: true },
              { label: 'Federal Tax', value: -federalTax, color: '#f7768e' },
              { label: 'State Tax', value: -stateTax, color: '#f7768e' },
              { label: 'FICA', value: -ficaTax, color: '#f7768e' },
              { label: 'After-Tax Income', value: annualGross - totalTax, color: '#9ece6a', bold: true },
            ].map(row => (
              <div key={row.label} className={`flex justify-between text-sm ${row.bold ? 'pt-2 border-t' : ''}`} style={{ borderColor: '#1e2030' }}>
                <span style={{ color: '#a9b1d6' }}>{row.label}</span>
                <span className={row.bold ? 'font-bold' : ''} style={{ color: row.color }}>
                  {row.value < 0 ? '−' : ''}{fmt.currency(Math.abs(row.value))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#c0caf5' }}>Tax Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#565f89' }}>State Tax Rate (%)</label>
              <EditableValue value={ti.stateTaxRate} suffix="%" onChange={v => updateData(d => ({ ...d, taxInfo: { ...d.taxInfo, stateTaxRate: v } }))} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#565f89' }}>Itemized Deductions</label>
              <EditableValue value={ti.itemizedDeductions} onChange={v => updateData(d => ({ ...d, taxInfo: { ...d.taxInfo, itemizedDeductions: v } }))} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#565f89' }}>Pre-Tax Contributions</label>
              <EditableValue value={ti.preTaxContributions} onChange={v => updateData(d => ({ ...d, taxInfo: { ...d.taxInfo, preTaxContributions: v } }))} />
            </div>
            <div className="p-3 rounded-lg mt-4" style={{ background: '#1a1b26', border: '1px solid #2a2a3d' }}>
              <p className="text-xs mb-1" style={{ color: '#565f89' }}>Marginal Tax Bracket</p>
              <p className="text-2xl font-bold" style={{ color: '#e0af68' }}>
                {currentBracket ? `${(currentBracket.rate * 100).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#565f89' }}>Federal (MFJ 2024)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
