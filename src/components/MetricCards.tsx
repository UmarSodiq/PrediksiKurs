import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Percent,
  Gauge,
  Crosshair,
  Compass,
  Calendar,
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
      ? "Target 2 Tahun"
      : effectiveHorizon === "1y"
      ? "Target 1 Tahun"
      : "Target 30 Hari";

  const horizonTag =
    effectiveHorizon === "2y" ? "2Y" : effectiveHorizon === "1y" ? "1Y" : "30D";

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
    if (mape < 1.0) return { label: "Sangat Akurat", color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60" };
    if (mape < 5.0) return { label: "Akurasi Baik", color: "text-blue-400 bg-blue-950/60 border-blue-800/60" };
    if (mape < 10.0) return { label: "Akurasi Wajar", color: "text-amber-400 bg-amber-950/60 border-amber-800/60" };
    return { label: "Perlu Kalibrasi", color: "text-rose-400 bg-rose-950/60 border-rose-800/60" };
  };

  const mapeStatus = getMapeStatus(metrics.mape);

  return (
    <div id="metrics-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {/* 1. MAPE Card */}
      <div id="card-mape" className="bg-slate-900  rounded-xl p-3 hover:border-slate-700 transition relative group">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Percent className="w-3.5 h-3.5 text-indigo-400" />
            MAPE
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Error</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {metrics.mape}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${mapeStatus.color}`}>
            {mapeStatus.label}
          </span>
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-950 text-slate-300 text-[11px] p-2.5 rounded-lg  shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Absolute Percentage Error</p>
          Rata-rata persentase deviasi prediksi terhadap nilai aktual kurs (&lt;1% tergolong istimewa).
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div id="card-rmse" className="bg-slate-900  rounded-xl p-3 hover:border-slate-700 transition relative group">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            RMSE
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Volatilitas</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Rp {metrics.rmse}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="truncate">Penalti deviasi kuadrat</span>
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-950 text-slate-300 text-[11px] p-2.5 rounded-lg  shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Root Mean Squared Error</p>
          Akar rata-rata kuadrat error dalam Rupiah. Mengukur dispersi residu prediksi terhadap nilai riil.
        </div>
      </div>

      {/* 3. MAE Card */}
      <div id="card-mae" className="bg-slate-900  rounded-xl p-3 hover:border-slate-700 transition relative group">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            MAE
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Margin</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Rp {metrics.mae}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <span>Max: <b className="text-slate-200">Rp {metrics.maxError}</b></span>
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-950 text-slate-300 text-[11px] p-2.5 rounded-lg  shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Absolute Error</p>
          Rata-rata selisih absolut antara nilai tukar riil dan ramalan model dalam satuan Rupiah.
        </div>
      </div>

      {/* 4. R-Squared (R²) Card */}
      <div id="card-r2" className="bg-slate-900  rounded-xl p-3 hover:border-slate-700 transition relative group">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            R² Score
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Fit</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
            {(metrics.r2 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <span>Skor: <b className="text-slate-200">{metrics.r2}</b></span>
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-950 text-slate-300 text-[11px] p-2.5 rounded-lg  shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Koefisien Determinasi (R²)</p>
          Mengukur proporsi variansi pergerakan kurs riil yang berhasil dijelaskan secara akurat oleh model prediksi.
        </div>
      </div>

      {/* 5. Directional Accuracy (MDA) Card */}
      <div id="card-mda" className="bg-slate-900  rounded-xl p-3 hover:border-slate-700 transition relative group">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            Arah (MDA)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Trend</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-purple-300 tracking-tight">
            {metrics.directionalAccuracy}%
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <span className="truncate">Sinyal naik/turun</span>
        </div>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute bottom-full left-0 mb-2 w-56 bg-slate-950 text-slate-300 text-[11px] p-2.5 rounded-lg  shadow-xl z-20">
          <p className="font-semibold text-white mb-1">Mean Directional Accuracy (MDA)</p>
          Persentase ketepatan model dalam memprediksi arah pergerakan harian kurs.
        </div>
      </div>

      {/* 6. Multi-Horizon Forecast Target Card */}
      <div id="card-projection" className="bg-slate-900 border border-indigo-600/60 rounded-xl p-3 hover:border-indigo-500 transition relative flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium mb-1">
            <span className="flex items-center gap-1 text-indigo-200">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              {horizonLabel}
            </span>
            {/* Horizon Switcher Pills */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded  text-[9px]">
              {(["30d", "1y", "2y"] as const).map((h) => (
                <button
                  key={h}
                  id={`btn-target-horizon-${h}`}
                  onClick={() => handleHorizonClick(h)}
                  className={`px-1 py-0.5 rounded font-mono transition ${
                    effectiveHorizon === h
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title={h === "30d" ? "Horizon 30 Hari" : h === "1y" ? "Horizon 1 Tahun" : "Horizon 2 Tahun"}
                >
                  {h === "30d" ? "30D" : h === "1y" ? "1Y" : "2Y"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Rp {currentForecast.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
          <span
            className={`flex items-center gap-0.5 font-semibold ${
              isProjectedDepreciation ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {isProjectedDepreciation ? `+${projectedChange}` : projectedChange} ({projectedChangePct}%)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">vs Spot</span>
        </div>
      </div>
    </div>
  );
};
