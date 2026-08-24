import React from "react";
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  History,
  X,
  Database,
  Info,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export type MainTabType = "overview" | "analysis" | "macro-sim" | "backtest";

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenDataManager: () => void;
  onOpenInfo: () => void;
  onRefreshData: () => void;
  isSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  onOpenDataManager,
  onOpenInfo,
  onRefreshData,
  isSyncing = false
}) => {
  const { theme, toggleTheme } = useTheme();

  const tabs: { id: MainTabType; label: string; subLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { 
      id: "overview", 
      label: "Dashboard", 
      subLabel: "Forecast & Metrik",
      icon: LayoutDashboard 
    },
    { 
      id: "analysis", 
      label: "Analisis & Validasi", 
      subLabel: "JISDOR, Benchmark, Residu",
      icon: BarChart2 
    },
    { 
      id: "macro-sim", 
      label: "Makro & Simulasi", 
      subLabel: "Drivers & Skenario What-If",
      icon: Globe 
    },
    { 
      id: "backtest", 
      label: "Backtesting & Replay", 
      subLabel: "Audit Out-of-Sample",
      icon: History 
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:opacity-0 lg:overflow-hidden lg:border-none"
        }`}
      >
        {/* Mobile Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800/80 shrink-0 lg:hidden bg-slate-50 dark:bg-[#0b0f19]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Navigasi Utama</span>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Title */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
            Enterprise Hub
          </span>
        </div>

        {/* Main 4 Consolidated Tabs */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all group flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`} />
                  <div className="truncate text-left">
                    <span className="block truncate text-xs">{tab.label}</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">{tab.subLabel}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-[#070a10]">
          <button
            onClick={onOpenDataManager}
            className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
            title="Kelola & Import Dataset Kustom"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Kelola Dataset</span>
          </button>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={onOpenInfo}
              className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-center"
              title="Metodologi & Sumber Data"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              className={`flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-center ${
                isSyncing ? "opacity-75 cursor-not-allowed text-indigo-500 dark:text-indigo-400" : ""
              }`}
              title="Refresh Data Pasar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-500" : ""}`} />
            </button>

            <button
              onClick={toggleTheme}
              className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-center"
              title="Ganti Tema (Dark / Light)"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
