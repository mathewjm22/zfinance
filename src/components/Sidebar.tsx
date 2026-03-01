import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "../utils/cn";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "income-expenses", label: "Income & Expenses", icon: Wallet },
    { id: "budgets-goals", label: "Budgets & Goals", icon: Target },
    { id: "accounts", label: "Accounts", icon: PiggyBank },
    { id: "retirement", label: "Retirement", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-lime-400">
          Wealth<span className="text-zinc-100">Dash</span>
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
                isActive
                  ? "bg-lime-500/10 text-lime-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-zinc-600 text-center">
        Ultimate Financial Dashboard
      </div>
    </div>
  );
}
