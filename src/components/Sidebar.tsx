import React from "react";
import {
  Activity,
  TrendingUp,
  Layers,
  BarChart2,
  PieChart,
  Sliders,
  X,
  Database,
  Info,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
  activeTab: "overview" | "actuals" | "comparison" | "residuals" | "macro" | "simulator";
  setActiveTab: (tab: "overview" | "actuals" | "comparison" | "residuals" | "macro" | "simulator") => void;
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

  const tabs = [
    { id: "overview", label: "Forecasting & Metrics", icon: Activity },
    { id: "actuals", label: "Kurs Aktual (JISDOR)", icon: TrendingUp },
    { id: "comparison", label: "Model Benchmark", icon: Layers },
    { id: "residuals", label: "Analisis Residu", icon: BarChart2 },
    { id: "macro", label: "Faktor Makro", icon: PieChart },
    { id: "simulator", label: "Simulasi Skenario", icon: Sliders },
  ] as const;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:opacity-0 lg:overflow-hidden lg:border-none"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0 lg:hidden bg-slate-50 dark:bg-[#0b0f19]">
          <span className="font-bold text-slate-900 dark:text-white">Menu</span>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-[#0b0f19]">
          <button
            onClick={onOpenDataManager}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition"
            title="Kelola & Import Dataset Kustom"
          >
            <Database className="w-4 h-4" />
            <span>Kelola Data</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInfo}
              className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center gap-2"
              title="Metodologi & Sumber Data"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              className={`flex-1 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center gap-2 ${
                isSyncing ? "opacity-75 cursor-not-allowed text-indigo-500 dark:text-indigo-400" : ""
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
