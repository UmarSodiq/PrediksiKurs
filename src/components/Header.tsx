import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Menu,
} from "lucide-react";
import { ModelProfile, ModelType, CurrencyCode } from "../types";

interface HeaderProps {
  currentSpot: number;
  previousSpot: number;
  selectedModel: ModelProfile;
  models: ModelProfile[];
  onSelectModel: (modelId: ModelType) => void;
  onToggleSidebar: () => void;
  selectedCurrency: CurrencyCode;
}

export const Header: React.FC<HeaderProps> = ({
  currentSpot,
  previousSpot,
  selectedModel,
  models,
  onSelectModel,
  onToggleSidebar,
  selectedCurrency,
}) => {
  const diff = currentSpot - previousSpot;
  const diffPct = previousSpot ? ((diff / previousSpot) * 100).toFixed(2) : "0.00";
  const isDepreciating = diff >= 0;

  return (
    <header className="bg-white dark:bg-[#070a10] border-b border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-white shrink-0 z-30">
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-0.5">
                Prediksi<span className="text-indigo-600 dark:text-indigo-400">Kurs</span>
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
                  CL 99%
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                  <Globe className="w-2.5 h-2.5" />
                  JISDOR Live
                </span>
              </div>
            </div>
          </div>

          {/* Right: Live Spot & Model Selector */}
          <div className="flex items-center gap-3">
            {/* Live Spot Card (Compact & Tabular) */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block leading-none mb-0.5">
                  Spot {selectedCurrency}/IDR
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-none">
                  {selectedCurrency === "JPY"
                    ? `Rp ${currentSpot.toFixed(2)}`
                    : `Rp ${currentSpot.toLocaleString("id-ID")}`}
                </span>
              </div>
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                  isDepreciating
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                }`}
              >
                {isDepreciating ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="font-mono">{diffPct}%</span>
              </div>
            </div>

            {/* Model Selector Dropdown */}
            <div className="relative hidden md:block">
              <label htmlFor="model-select" className="sr-only">Model Aktif</label>
              <select
                id="model-select"
                value={selectedModel.id}
                onChange={(e) => onSelectModel(e.target.value as ModelType)}
                aria-label="Pilih Model Prediksi"
                className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-2.5 pr-7 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none transition cursor-pointer appearance-none shadow-sm"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (MAPE {m.metrics.mape}%)
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
