import { useState, useMemo } from 'react';
import { useFinancialData } from './hooks/useFinancialData';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import { Header } from './components/Header';
import { OverviewTab } from './components/tabs/OverviewTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { IncomeTab } from './components/tabs/IncomeTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { RetirementTab } from './components/tabs/RetirementTab';
import { FireTab } from './components/tabs/FireTab';
import { TaxTab } from './components/tabs/TaxTab';
import { PortfolioTab } from './components/tabs/PortfolioTab';
import { GoalsTab } from './components/tabs/GoalsTab';
import { HealthTab } from './components/tabs/HealthTab';
import { CollegeTab } from './components/tabs/CollegeTab';
import { RetirementAnalysisTab } from './components/tabs/RetirementAnalysisTab';
import { AdvancedTab } from './components/tabs/AdvancedTab';
import { EditDataTab } from './components/tabs/EditDataTab';
import { CloudSyncTab } from './components/tabs/CloudSyncTab';
import {
  PieChart, LayoutDashboard, Wallet, TrendingUp, TrendingDown,
  PiggyBank, Flame, Landmark, Briefcase, Target, Heart, GraduationCap,
  Calculator, Settings2, Database, Cloud
} from 'lucide-react';

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'accounts',   label: 'Accounts',   icon: Wallet },
  { id: 'income',     label: 'Income',     icon: TrendingUp },
  { id: 'expenses',   label: 'Expenses',   icon: TrendingDown },
  { id: 'retirement', label: 'Retirement', icon: PiggyBank },
  { id: 'fire',       label: 'F.I.R.E.',   icon: Flame },
  { id: 'taxes',      label: 'Taxes',      icon: Landmark },
  { id: 'portfolio',  label: 'Portfolio',  icon: Briefcase },
  { id: 'goals',      label: 'Goals',      icon: Target },
  { id: 'health',     label: 'Health (HSA)', icon: Heart },
  { id: 'college',    label: 'College (529)', icon: GraduationCap },
  { id: 'analysis',   label: 'Retirement Analysis', icon: Calculator },
  { id: 'advanced',   label: 'Advanced',   icon: Settings2 },
  { id: 'edit-data',  label: 'Edit Raw Data', icon: Database },
  { id: 'sync',       label: 'Cloud Sync', icon: Cloud },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  // Core Data State
  const finance = useFinancialData();

  // Google Drive State (auto-saves on changes when connected)
  const drive = useGoogleDrive(finance.data, finance.setDataFromDrive);

  // Render active tab dynamically
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':   return <OverviewTab {...finance} />;
      case 'accounts':   return <AccountsTab data={finance.data} updateData={finance.updateData} totalNetWorth={finance.totalNetWorth} />;
      case 'income':     return <IncomeTab data={finance.data} updateData={finance.updateData} totalMonthlyIncome={finance.totalMonthlyIncome} totalGrossIncome={finance.totalGrossIncome} />;
      case 'expenses':   return <ExpensesTab data={finance.data} updateData={finance.updateData} totalMonthlyExpenses={finance.totalMonthlyExpenses} />;
      case 'retirement': return <RetirementTab data={finance.data} updateData={finance.updateData} totalNetWorth={finance.totalNetWorth} totalContributions={finance.totalContributions} projectedAtRetirement={finance.projectedAtRetirement} yearsToRetirement={finance.yearsToRetirement} />;
      case 'fire':       return <FireTab data={finance.data} updateData={finance.updateData} totalNetWorth={finance.totalNetWorth} totalGrossIncome={finance.totalGrossIncome} estimatedAnnualExpenses={finance.estimatedAnnualExpenses} />;
      case 'taxes':      return <TaxTab data={finance.data} updateData={finance.updateData} totalGrossIncome={finance.totalGrossIncome} />;
      case 'portfolio':  return <PortfolioTab data={finance.data} updateData={finance.updateData} />;
      case 'goals':      return <GoalsTab data={finance.data} updateData={finance.updateData} />;
      case 'health':     return <HealthTab data={finance.data} updateData={finance.updateData} />;
      case 'college':    return <CollegeTab data={finance.data} updateData={finance.updateData} />;
      case 'analysis':   return <RetirementAnalysisTab data={finance.data} totalNetWorth={finance.totalNetWorth} totalContributions={finance.totalContributions} estimatedAnnualExpenses={finance.estimatedAnnualExpenses} />;
      case 'advanced':   return <AdvancedTab />;
      case 'edit-data':  return <EditDataTab data={finance.data} updateData={finance.setDataFromDrive} resetData={finance.resetToDefaults} />;
      case 'sync':       return <CloudSyncTab driveStatus={drive.status} lastSync={drive.lastSync} error={drive.error} userEmail={drive.userEmail} onConnect={drive.connect} onDisconnect={drive.disconnect} onManualSync={drive.manualSync} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1b26] text-[#c0caf5] font-sans">
      <Header
        netWorth={finance.totalNetWorth}
        driveStatus={drive.status}
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-64
          border-r p-4 transition-transform duration-300 z-40
          ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto custom-scrollbar bg-black/50 backdrop-blur-xl md:bg-transparent
        `} style={{ borderColor: '#1e2030' }}>
          <div className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setMenuOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${isActive
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'opacity-70'} />
                  {t.label}
                  {t.id === 'sync' && drive.status === 'connected' && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-success" />
                  )}
                  {t.id === 'sync' && drive.status === 'syncing' && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-info animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 p-4 rounded-xl border border-border bg-black/20 text-xs text-center text-muted-foreground">
            <p>WealthDash © 2024</p>
            <p className="mt-1 opacity-70">Client-side only. Data stored exclusively in browser and connected Drive.</p>
          </div>
        </aside>

        {/* Overlay for mobile menu */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-20">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
