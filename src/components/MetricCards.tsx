import React, { useState } from "react";
import {
  CheckCircle2,
  Percent,
  Gauge,
  Crosshair,
  Compass,
  TrendingUp,
} from "lucide-react";
import { ModelMetrics, ForecastHorizon } from "../types";

interface MetricCardsProps {
  metrics: ModelMetrics;
  modelName: string;
  currentSpot: number;
  forecast30d: number;
  forecast1y?: number;
  forecast2y?: number;
  activeHorizon?: ForecastHorizon;
  onSelectHorizon?: (horizon: ForecastHorizon) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  modelName,
  currentSpot,
  forecast30d,
  forecast1y = Math.round(currentSpot * 1.024),
  forecast2y = Math.round(currentSpot * 1.048),
  activeHorizon = "30d",
  onSelectHorizon,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<"30d" | "1y" | "2y">("30d");

  const effectiveHorizon = onSelectHorizon ? (activeHorizon === "2y" ? "2y" : activeHorizon === "1y" ? "1y" : "30d") : selectedHorizon;

  const currentForecast =
    effectiveHorizon === "2y"
      ? forecast2y
      : effectiveHorizon === "1y"
      ? forecast1y
      : forecast30d;

  const horizonLabel =
    effectiveHorizon === "2y"
      ? "Target 2Y"
      : effectiveHorizon === "1y"
      ? "Target 1Y"
      : "Target 30D";

  const projectedChange = currentForecast - currentSpot;
  const projectedChangePct = ((projectedChange / currentSpot) * 100).toFixed(2);
  const isProjectedDepreciation = projectedChange >= 0;

  const handleHorizonClick = (h: "30d" | "1y" | "2y") => {
    setSelectedHorizon(h);
    if (onSelectHorizon) {
      onSelectHorizon(h);
    }
  };

  // Evaluation criteria for MAPE
  const getMapeStatus = (mape: number) => {
    if (mape < 1.0) return { label: "Sangat Akurat", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40" };
    if (mape < 5.0) return { label: "Akurasi Baik", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40" };
    if (mape < 10.0) return { label: "Wajar", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40" };
    return { label: "Kalibrasi", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40" };
  };

  const mapeStatus = getMapeStatus(metrics.mape);

  return (
    <div id="metrics-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {/* 1. MAPE Card */}
      <div id="card-mape" className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition relative group shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <Percent className="w-3 h-3 text-indigo-500" />
            MAPE
          </span>
          <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${mapeStatus.color}`}>
            {mapeStatus.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {metrics.mape}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Rata-rata galat absolut
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Absolute Percentage Error</p>
          Rata-rata persentase deviasi prediksi terhadap nilai aktual kurs (&lt;1% tergolong istimewa).
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div id="card-rmse" className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition relative group shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <Gauge className="w-3 h-3 text-indigo-500" />
            RMSE
          </span>
          <span className="text-[9px] text-slate-400 font-mono">Volatilitas</span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            Rp {metrics.rmse}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Dispersi kuadrat residu
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Root Mean Squared Error</p>
          Akar rata-rata kuadrat error dalam Rupiah. Mengukur dispersi residu prediksi terhadap nilai riil.
        </div>
      </div>

      {/* 3. MAE Card */}
      <div id="card-mae" className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition relative group shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <Crosshair className="w-3 h-3 text-indigo-500" />
            MAE
          </span>
          <span className="text-[9px] text-slate-400 font-mono">Margin</span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            Rp {metrics.mae}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Maks: Rp {metrics.maxError}
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Absolute Error</p>
          Rata-rata selisih absolut antara nilai tukar riil dan ramalan model dalam satuan Rupiah.
        </div>
      </div>

      {/* 4. R-Squared (R²) Card */}
      <div id="card-r2" className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition relative group shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
            R² Score
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Fit</span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {(metrics.r2 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Skor: {metrics.r2}
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Koefisien Determinasi (R²)</p>
          Mengukur proporsi variansi pergerakan kurs riil yang berhasil dijelaskan secara akurat oleh model prediksi.
        </div>
      </div>

      {/* 5. Directional Accuracy (MDA) Card */}
      <div id="card-mda" className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition relative group shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <Compass className="w-3 h-3 text-indigo-500" />
            Arah (MDA)
          </span>
          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">Trend</span>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {metrics.directionalAccuracy}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Sinyal naik / turun
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Directional Accuracy (MDA)</p>
          Persentase ketepatan model dalam memprediksi arah pergerakan harian kurs.
        </div>
      </div>

      {/* 6. Multi-Horizon Forecast Target Card */}
      <div id="card-projection" className="bg-white dark:bg-[#0b0f19] border border-indigo-500/50 dark:border-indigo-500/50 rounded-xl p-3 hover:border-indigo-500 transition relative flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
              <TrendingUp className="w-3 h-3" />
              {horizonLabel}
            </span>
            {/* Horizon Switcher Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded border border-slate-200 dark:border-slate-800 text-[9px]">
              {(["30d", "1y", "2y"] as const).map((h) => (
                <button
                  key={h}
                  id={`btn-target-horizon-${h}`}
                  onClick={() => handleHorizonClick(h)}
                  className={`px-1 py-0.5 rounded font-mono transition ${
                    effectiveHorizon === h
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title={h === "30d" ? "Horizon 30 Hari" : h === "1y" ? "Horizon 1 Tahun" : "Horizon 2 Tahun"}
                >
                  {h === "30d" ? "30D" : h === "1y" ? "1Y" : "2Y"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              Rp {currentForecast.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span
            className={`font-semibold ${
              isProjectedDepreciation ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isProjectedDepreciation ? `+${projectedChange}` : projectedChange} ({projectedChangePct}%)
          </span>
          <span className="text-slate-400">vs Spot</span>
        </div>
      </div>
    </div>
  );
};
