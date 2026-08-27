import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Globe,
  Menu,
  ShieldCheck,
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
    <header className="bg-white dark:bg-[#070a10] border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shrink-0 z-30 shadow-xs">
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shrink-0 shadow-sm border border-blue-950/40">
              <Landmark className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                  Prediksi<span className="text-blue-700 dark:text-blue-400">Kurs</span>
                </span>
                <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                  TREASURY
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                  <Globe className="w-2.5 h-2.5" />
                  JISDOR Reference
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block leading-none mt-0.5">
                Sistem Analisis & Proyeksi Nilai Tukar Valuta Asing • Multi-Model AI
              </p>
            </div>
          </div>

          {/* Right: Live Spot & Model Selector */}
          <div className="flex items-center gap-3">
            {/* Live Spot Card (Compact & Tabular) */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 shadow-2xs">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono font-semibold block leading-none mb-0.5">
                  Spot USD/IDR
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-none">
                  Rp {currentSpot.toLocaleString("id-ID")}
                </span>
              </div>
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  isDepreciating
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
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
                className="bg-white dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-3 pr-7 py-1.5 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer appearance-none shadow-2xs"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (MAPE {m.metrics.mape}%)
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
