import React, { useState, useMemo } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Info,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ForexDataPoint, ModelType, CurrencyCode, BacktestResult } from "../types";
import { modelProfiles, runBacktestSimulation } from "../data/mockForexData";
import { useTheme } from "../context/ThemeContext";

interface BacktestReplayViewProps {
  data: ForexDataPoint[];
  selectedCurrency: CurrencyCode;
}

export const BacktestReplayView: React.FC<BacktestReplayViewProps> = ({
  data,
  selectedCurrency,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Extract valid historical actual dates
  const actualDates = useMemo(() => {
    return data
      .filter((d) => !d.isFuture && d.actual !== null && d.actual !== undefined)
      .map((d) => d.date);
  }, [data]);

  // Default cutoff dates
  const defaultCutoff = useMemo(() => {
    if (actualDates.length > 90) {
      return actualDates[actualDates.length - 65]; // approx 3 months ago
    }
    return actualDates[Math.floor(actualDates.length * 0.75)] || "2026-05-15";
  }, [actualDates]);

  const [selectedModel, setSelectedModel] = useState<ModelType>("ensemble");
  const [cutoffDate, setCutoffDate] = useState<string>(defaultCutoff);
  const [testHorizon, setTestHorizon] = useState<number>(60);

  // Re-run backtest simulation whenever parameters change
  const backtestResult: BacktestResult = useMemo(() => {
    return runBacktestSimulation(data, cutoffDate, testHorizon, selectedModel);
  }, [data, cutoffDate, testHorizon, selectedModel]);

  // Prepare chart dataset for rendering
  const chartData = useMemo(() => {
    const pointsToShow = backtestResult.points;

    // Combine in-sample history and out-of-sample test
    const combined: any[] = [];

    // In-sample historical training data
    backtestResult.inSampleData.forEach((h) => {
      combined.push({
        date: h.date,
        inSampleActual: h.actual,
        outOfSampleActual: null,
        modelPredicted: null,
        lowerBound: null,
        upperBound: null,
        isTest: false,
      });
    });

    // Bridge point at cutoff date for continuous lines
    const lastInSample = backtestResult.inSampleData[backtestResult.inSampleData.length - 1];
    if (lastInSample && pointsToShow.length > 0) {
      combined[combined.length - 1] = {
        ...combined[combined.length - 1],
        outOfSampleActual: lastInSample.actual,
        modelPredicted: lastInSample.actual,
      };
    }

    // Out-of-sample test data
    pointsToShow.forEach((p) => {
      combined.push({
        date: p.date,
        inSampleActual: null,
        outOfSampleActual: p.actual,
        modelPredicted: p.predicted,
        lowerBound: p.lowerBound,
        upperBound: p.upperBound,
        isTest: true,
      });
    });

    return combined;
  }, [backtestResult]);

  // Export Backtest Log CSV
  const handleExportCsv = () => {
    let csv = "Tanggal,Kurs_Aktual_Realisasi,Prediksi_Model,Lower_99CI,Upper_99CI,Error_Rp,Error_Pct,Masuk_Koridor,Arah_Aktual,Arah_Prediksi,Hit_Arah\n";
    backtestResult.points.forEach((p) => {
      csv += `${p.date},${p.actual},${p.predicted},${p.lowerBound},${p.upperBound},${p.residual},${p.pctError}%,${p.inCorridor ? "YA" : "TIDAK"},${p.actualDirection},${p.predictedDirection},${p.directionHit ? "TEPAT" : "MELESET"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backtest_${selectedModel}_${cutoffDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Preset Cutoff buttons
  const presetCutoffs = useMemo(() => {
    const total = actualDates.length;
    if (total < 40) return [];
    return [
      { label: "1 Bulan Lalu (30 Hari)", date: actualDates[Math.max(0, total - 22)] },
      { label: "3 Bulan Lalu (1 Kuartal)", date: actualDates[Math.max(0, total - 65)] },
      { label: "6 Bulan Lalu (1 Semester)", date: actualDates[Math.max(0, total - 130)] },
      { label: "1 Tahun Lalu", date: actualDates[Math.max(0, total - 252)] },
    ];
  }, [actualDates]);

  return (
    <div id="backtest-replay-view" className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/40 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                <History className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                Simulasi Mundur & Backtesting Model (*Walk-Forward Replay*)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold">
                Out-of-Sample Validation
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl">
              Uji keandalan model dengan "kembali ke masa lalu". Pilih tanggal *cut-off* lampau untuk melihat bagaimana model memprediksi masa depan, lalu bandingkan secara langsung dengan data realisasi pasar yang sesungguhnya terjadi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Ekspor Log Hasil Backtest ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Log CSV</span>
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Model Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Arsitektur Model yang Diuji
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value as ModelType);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {modelProfiles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Cutoff Date Picker */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Tanggal Titik Potong (Cut-off Date)
            </label>
            <input
              type="date"
              value={cutoffDate}
              min={actualDates[15] || "2024-02-01"}
              max={actualDates[actualDates.length - 10] || "2026-08-01"}
              onChange={(e) => {
                setCutoffDate(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* 3. Horizon Days */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Horizon Pengujian (Hari Bursa)
            </label>
            <select
              value={testHorizon}
              onChange={(e) => {
                setTestHorizon(Number(e.target.value));
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={22}>22 Hari (1 Bulan Kalender)</option>
              <option value={45}>45 Hari (2 Bulan Kalender)</option>
              <option value={65}>65 Hari (1 Kuartal / 3 Bulan)</option>
              <option value={130}>130 Hari (1 Semester / 6 Bulan)</option>
              <option value={252}>252 Hari (1 Tahun Penuh)</option>
            </select>
          </div>

          {/* 4. Audit Download */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Aksi Laporan Audit
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Audit CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Cutoff Preset Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Preset Cepat:
          </span>
          {presetCutoffs.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setCutoffDate(preset.date);
              }}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition border ${
                cutoffDate === preset.date
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700"
              }`}
            >
              {preset.label} ({preset.date})
            </button>
          ))}
        </div>
      </div>

      {/* Scorecard Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Walk-Forward MAPE */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
            <span>Walk-Forward MAPE</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                backtestResult.mape <= 0.6
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {backtestResult.mape <= 0.6 ? "Sangat Presisi" : "Akurat"}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
            {backtestResult.mape}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Rata-rata kesalahan persentase out-of-sample
          </p>
        </div>

        {/* Metric 2: Directional Hit Rate */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
            <span>Akurasi Arah Tren</span>
            <Target className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {backtestResult.directionalAccuracy}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ketepatan memprediksi kenaikan / penurunan kurs
          </p>
        </div>

        {/* Metric 3: Corridor Containment (99% CL) */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
            <span>Coverage 99% CL</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
            {backtestResult.corridorHitRate}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Harga riil pasar yang mendarat di koridor keyakinan
          </p>
        </div>

        {/* Metric 4: RMSE Out-of-Sample */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
            <span>RMSE Backtest</span>
            <span className="text-[10px] font-mono text-slate-500">Root Mean Sq</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-slate-100">
            Rp {backtestResult.rmse.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Deviasi absolut rata-rata: Rp {backtestResult.mae}
          </p>
        </div>

        {/* Metric 5: Max Deviation */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm col-span-2 lg:col-span-1 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
            <span>Max Deviation</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            Rp {backtestResult.maxOverestimate}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Selisih deviasi terjauh selama horizon uji coba
          </p>
        </div>
      </div>

      {/* Main Backtesting Interactive Chart */}
      <div
        className={`p-5 rounded-2xl border transition-colors shadow-sm ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Kurva Backtesting: Data Latihan vs Prediksi Model vs Realisasi Pasar</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Titik Potong Cut-off: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{backtestResult.cutoffDate}</strong> • Horizon Pengujian: <strong className="font-mono">{backtestResult.testSampleSize} Hari Bursa</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 inline-block" />
              <span className="text-slate-500 text-[11px]">Training Set</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500 border-b border-dashed border-indigo-500 inline-block" />
              <span className="text-indigo-500 font-semibold text-[11px]">Prediksi Model</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              <span className="text-emerald-500 font-semibold text-[11px]">Realisasi Nyata Pasar</span>
            </div>
          </div>
        </div>

        {/* Recharts Component */}
        <div className="h-80 sm:h-96 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1e293b"} />
              <XAxis
                dataKey="date"
                stroke={isLight ? "#94a3b8" : "#64748b"}
                fontSize={11}
                tickFormatter={(val) => {
                  const parts = val.split("-");
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                }}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke={isLight ? "#94a3b8" : "#64748b"}
                fontSize={11}
                tickFormatter={(val) => `Rp ${(val / 1000).toFixed(1)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0]?.payload;
                    return (
                      <div
                        className={`p-3 rounded-xl shadow-xl border text-xs space-y-1.5 ${
                          isLight
                            ? "bg-white/95 border-slate-300 text-slate-900"
                            : "bg-slate-900/95 border-slate-700 text-white backdrop-blur-md"
                        }`}
                      >
                        <div className="font-bold border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between gap-3">
                          <span>Tanggal: {label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              dataPoint.isTest
                                ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {dataPoint.isTest ? "Out-of-Sample Test" : "In-Sample Training"}
                          </span>
                        </div>

                        {dataPoint.inSampleActual && (
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>Kurs Historis Training:</span>
                            <span className="font-mono font-bold text-slate-200">
                              Rp {dataPoint.inSampleActual.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}

                        {dataPoint.modelPredicted && (
                          <div className="flex justify-between gap-4 text-indigo-400">
                            <span>Prediksi Model:</span>
                            <span className="font-mono font-bold">
                              Rp {dataPoint.modelPredicted.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}

                        {dataPoint.outOfSampleActual && (
                          <div className="flex justify-between gap-4 text-emerald-400 font-bold">
                            <span>Realisasi Nyata Pasar:</span>
                            <span className="font-mono">
                              Rp {dataPoint.outOfSampleActual.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}

                        {dataPoint.lowerBound && dataPoint.upperBound && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 font-mono">
                            Koridor 99% CL: Rp {dataPoint.lowerBound.toLocaleString("id-ID")} - Rp {dataPoint.upperBound.toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Confidence Band Area on Out-of-Sample */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#6366f1"
                fillOpacity={isLight ? 0.08 : 0.15}
                name="Koridor Keyakinan 99%"
              />

              {/* In-sample Training Line */}
              <Line
                type="monotone"
                dataKey="inSampleActual"
                stroke="#64748b"
                strokeWidth={1.5}
                dot={false}
                name="Data Training (Lalu)"
              />

              {/* Model Predicted Line */}
              <Line
                type="monotone"
                dataKey="modelPredicted"
                stroke="#6366f1"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#6366f1" }}
                name="Prediksi Model"
              />

              {/* Real Out-of-Sample Actual Line */}
              <Line
                type="monotone"
                dataKey="outOfSampleActual"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981" }}
                name="Realisasi Nyata Pasar"
              />

              {/* Vertical Reference Line for Cutoff */}
              <ReferenceLine
                x={backtestResult.cutoffDate}
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: "Cut-off Simulasi",
                  fill: "#ec4899",
                  fontSize: 11,
                  position: "top",
                  fontWeight: "bold",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Out-of-Sample Audit Table */}
      <div
        className={`p-5 rounded-2xl border transition-colors shadow-sm ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tabel Audit Harian: Prediksi Model vs Realisasi Pasar
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {backtestResult.points.length} Hari Pengujian
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className={`w-full text-left text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            <thead
              className={`sticky top-0 uppercase tracking-wider font-semibold text-[10px] border-b ${
                isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
              }`}
            >
              <tr>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3 text-right">Prediksi Model</th>
                <th className="py-2.5 px-3 text-right">Realisasi Pasar</th>
                <th className="py-2.5 px-3 text-right">Error (Rp)</th>
                <th className="py-2.5 px-3 text-right">Error (%)</th>
                <th className="py-2.5 px-3 text-center">Masuk Koridor 99%</th>
                <th className="py-2.5 px-3 text-center">Akurasi Arah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {backtestResult.points.map((p) => {
                return (
                  <tr
                    key={p.date}
                    className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      !p.inCorridor ? "bg-rose-500/5" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-200 font-sans">
                      {p.date}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                      Rp {p.predicted.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      Rp {p.actual.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {p.residual >= 0 ? `+Rp ${p.residual}` : `-Rp ${Math.abs(p.residual)}`}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {p.pctError}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.inCorridor
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50"
                        }`}
                      >
                        {p.inCorridor ? "✓ In Corridor" : "✗ Out"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.directionHit
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {p.directionHit ? "Tepat (Hit)" : "Meleset"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
