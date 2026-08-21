import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Menu,
} from "lucide-react";
import { ModelProfile, ModelType } from "../types";

interface HeaderProps {
  currentSpot: number;
  previousSpot: number;
  selectedModel: ModelProfile;
  models: ModelProfile[];
  onSelectModel: (modelId: ModelType) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSpot,
  previousSpot,
  selectedModel,
  models,
  onSelectModel,
  onToggleSidebar,
}) => {
  const diff = currentSpot - previousSpot;
  const diffPct = ((diff / previousSpot) * 100).toFixed(2);
  const isDepreciating = diff >= 0;

  return (
    <header className="bg-white dark:bg-[#0b0f19] border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shrink-0 z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight">
                  USD/IDR <span className="text-indigo-600 dark:text-indigo-400 font-normal">Forecast Studio</span>
                </h1>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  CL 99%
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                  <Globe className="w-3 h-3" />
                  ECB Live Feed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                    Spot USD/IDR (Live)
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Rp {currentSpot.toLocaleString("id-ID")}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                  isDepreciating
                    ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                    : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                }`}
              >
                {isDepreciating ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{diff >= 0 ? `+${diff}` : diff} ({diffPct}%)</span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <label htmlFor="model-select" className="sr-only">Pilih Model Prediksi</label>
              <select
                id="model-select"
                value={selectedModel.id}
                onChange={(e) => onSelectModel(e.target.value as ModelType)}
                aria-label="Pilih Model Prediksi"
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 text-sm rounded-lg pl-3 pr-8 py-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer appearance-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (MAPE {m.metrics.mape}%)
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
