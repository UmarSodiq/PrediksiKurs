import React from "react";
import {
  Layers,
  Award,
  CheckCircle,
  Zap,
  Clock,
  TrendingUp,
  Cpu,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { ModelProfile, ModelType } from "../types";
import { useTheme } from "../context/ThemeContext";

interface ModelComparisonViewProps {
  models: ModelProfile[];
  selectedModel: ModelProfile;
  onSelectModel: (modelId: ModelType) => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  models,
  selectedModel,
  onSelectModel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  // Prepare chart comparison data
  const chartData = models.map((m) => ({
    name: m.id.toUpperCase(),
    fullName: m.name,
    mape: m.metrics.mape,
    rmse: m.metrics.rmse,
    mae: m.metrics.mae,
    r2Pct: Number((m.metrics.r2 * 100).toFixed(1)),
    directionalAccuracy: m.metrics.directionalAccuracy,
    color: m.color,
  }));

  return (
    <div id="model-comparison-view" className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Evaluasi & Perbandingan Model Prediksi Kurs
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Perbandingan komprehensif performa ekonometrika klasik (SARIMAX), Machine Learning (XGBoost), Deep Learning (LSTM), dan Stacking Ensemble.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Model Terbaik:</span>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Hybrid Ensemble (MAPE {models[0].metrics.mape}%)
            </span>
          </div>
        </div>

        {/* Bar Chart Comparison for MAPE and RMSE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* MAPE Chart (Lower is better) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                MAPE (%) — Makin Rendah Makin Akurat
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mean Absolute % Error</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1e293b"} vertical={false} />
                  <XAxis dataKey="name" stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }} />
                  <YAxis stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isLight ? "#ffffff" : "#020617", borderColor: isLight ? "#cbd5e1" : "#334155", color: isLight ? "#0f172a" : "#ffffff", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`${val}%`, "MAPE"]}
                  />
                  <Bar isAnimationActive={false} dataKey="mape" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-mape-${index}`}
                        fill={entry.color}
                        opacity={selectedModel.id.toUpperCase() === entry.name ? 1 : 0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Directional Accuracy Chart (Higher is better) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Akurasi Arah / Directional Hit Rate (%)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Higher is Better</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1e293b"} vertical={false} />
                  <XAxis dataKey="name" stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[60, 100]} stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isLight ? "#ffffff" : "#020617", borderColor: isLight ? "#cbd5e1" : "#334155", color: isLight ? "#0f172a" : "#ffffff", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`${val}%`, "Akurasi Arah"]}
                  />
                  <Bar isAnimationActive={false} dataKey="directionalAccuracy" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-mda-${index}`}
                        fill={entry.color}
                        opacity={selectedModel.id.toUpperCase() === entry.name ? 1 : 0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Tabel Peringkat & Metrik Lengkap Setiap Model
          </h3>
          <span className="text-xs text-slate-400">Total {models.length} Model Teruji</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Model & Kategori</th>
                <th className="py-3 px-3 text-right">MAPE</th>
                <th className="py-3 px-3 text-right">RMSE (IDR)</th>
                <th className="py-3 px-3 text-right">MAE (IDR)</th>
                <th className="py-3 px-3 text-right">R² Score</th>
                <th className="py-3 px-3 text-right">Akurasi Arah</th>
                <th className="py-3 px-3">Waktu Latih</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {models.map((m, idx) => {
                const isSelected = selectedModel.id === m.id;
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isSelected ? "bg-indigo-950/30 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: m.color }}
                            />
                            {m.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{m.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                      {m.metrics.mape}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                      Rp {m.metrics.rmse}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      Rp {m.metrics.mae}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-indigo-300 font-semibold">
                      {m.metrics.r2}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-purple-300">
                      {m.metrics.directionalAccuracy}%
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {m.trainingTime}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 text-white font-semibold text-[11px] shadow-sm">
                          <CheckCircle className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <button
                          id={`btn-apply-model-${m.id}`}
                          onClick={() => onSelectModel(m.id)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition text-[11px]"
                        >
                          Pilih Model
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Deep-Dive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => (
          <div
            key={`profile-${m.id}`}
            className={`bg-slate-900/90 border rounded-xl p-4 transition flex flex-col justify-between ${
              selectedModel.id === m.id
                ? "border-indigo-500 ring-1 ring-indigo-500/50 shadow-md"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${m.color}20`,
                    color: m.color,
                    border: `1px solid ${m.color}40`,
                  }}
                >
                  {m.category}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  MAPE: {m.metrics.mape}%
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight mb-1.5">{m.name}</h4>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{m.description}</p>

              {/* Hyperparameters */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 mb-3">
                <div className="text-slate-500 font-semibold uppercase text-[9px] mb-1">
                  Parameter Konfigurasi:
                </div>
                {Object.entries(m.parameters).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-mono text-slate-200 truncate max-w-[140px]">{val}</span>
                  </div>
                ))}
              </div>

              {/* Advantages */}
              <div className="space-y-1 text-xs mb-4">
                <div className="text-slate-400 font-semibold text-[11px]">Keunggulan Utama:</div>
                {m.advantages.map((adv, aIdx) => (
                  <div key={aIdx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{adv}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Cocok untuk: <strong className="text-slate-200 block truncate max-w-[170px]">{m.bestFor}</strong>
              </div>
              <button
                onClick={() => onSelectModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedModel.id === m.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                }`}
              >
                {selectedModel.id === m.id ? "Aktif" : "Gunakan"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
