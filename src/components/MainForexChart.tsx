import React, { useState, useMemo } from "react";
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
  Brush,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  Eye,
  TrendingUp,
  Maximize2,
  Minimize2,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";
import { ForexDataPoint, ModelProfile } from "../types";
import { useTheme } from "../context/ThemeContext";

interface MainForexChartProps {
  data: ForexDataPoint[];
  selectedModel: ModelProfile;
  currentSpot: number;
}

export const MainForexChart: React.FC<MainForexChartProps> = ({
  data,
  selectedModel,
  currentSpot,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL">("1Y");
  const [forecastHorizon, setForecastHorizon] = useState<"30d" | "90d" | "180d" | "1y" | "2y">("2y");
  const [confidenceLevel, setConfidenceLevel] = useState<"99%" | "95%" | "90%">("99%");
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [showMovingAverages, setShowMovingAverages] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Scale bounds dynamically according to selected Confidence Level (z-scores: 99%=2.576, 95%=1.960, 90%=1.645)
  // and process historical + future subsets cleanly
  const { filteredData, todayIndex } = useMemo(() => {
    const zMultiplier =
      confidenceLevel === "99%" ? 1.0 : confidenceLevel === "95%" ? 1.96 / 2.576 : 1.645 / 2.576;

    // 1. Separate historical and future subsets
    const historical = data.filter((d) => !d.isFuture && d.actual !== null && d.actual !== undefined);
    const future = data.filter((d) => d.isFuture);

    // 2. Determine how many historical calendar days to include based on timeRange
    const histDaysCount =
      timeRange === "1M"
        ? 30
        : timeRange === "3M"
        ? 90
        : timeRange === "6M"
        ? 180
        : timeRange === "1Y"
        ? 365
        : timeRange === "2Y"
        ? 730
        : historical.length;

    const slicedHistorical = historical.slice(-Math.min(histDaysCount, historical.length));

    // 3. Determine how many future calendar days to include based on forecastHorizon
    const futureDaysCount =
      forecastHorizon === "30d"
        ? 30
        : forecastHorizon === "90d"
        ? 90
        : forecastHorizon === "180d"
        ? 180
        : forecastHorizon === "1y"
        ? 365
        : 730;

    const slicedFuture = future.slice(0, futureDaysCount).map((d) => {
      if (d.forecast && d.upperBound && d.lowerBound) {
        const halfWidth = (d.upperBound - d.forecast) * zMultiplier;
        return {
          ...d,
          upperBound: Math.round(d.forecast + halfWidth),
          lowerBound: Math.round(d.forecast - halfWidth),
        };
      }
      return d;
    });

    // 4. Merge historical and future, ensuring clean transition at spot rate
    const merged: ForexDataPoint[] = [];

    // Add historical items
    slicedHistorical.forEach((h, idx) => {
      const isLastHist = idx === slicedHistorical.length - 1;
      merged.push({
        ...h,
        // On the last historical point, ensure forecast starts exactly from actual for continuous line
        forecast: isLastHist ? h.actual : h.forecast,
      });
    });

    // Add future items
    slicedFuture.forEach((f) => {
      merged.push({
        ...f,
        actual: null, // Future points have no actual rate
      });
    });

    const splitIdx = Math.max(0, slicedHistorical.length - 1);

    return {
      filteredData: merged,
      todayIndex: splitIdx,
    };
  }, [data, confidenceLevel, forecastHorizon, timeRange]);

  // Find boundaries for domain
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    filteredData.forEach((d) => {
      if (d.actual !== null && d.actual !== undefined) {
        if (d.actual < min) min = d.actual;
        if (d.actual > max) max = d.actual;
      }
      if (d.forecast !== null && d.forecast !== undefined) {
        if (d.forecast < min) min = d.forecast;
        if (d.forecast > max) max = d.forecast;
      }
      if (d.lowerBound !== null && d.lowerBound !== undefined && d.lowerBound < min) {
        min = d.lowerBound;
      }
      if (d.upperBound !== null && d.upperBound !== undefined && d.upperBound > max) {
        max = d.upperBound;
      }
    });

    const padding = 80;
    return {
      minVal: Math.floor((min === Infinity ? 15000 : min - padding) / 50) * 50,
      maxVal: Math.ceil((max === -Infinity ? 18500 : max + padding) / 50) * 50,
    };
  }, [filteredData]);

  const todayDate = filteredData[todayIndex]?.date;

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const currentPoint = payload[0]?.payload as ForexDataPoint;
    if (!currentPoint) return null;

    const isFuturePoint = currentPoint.isFuture;
    const actual = currentPoint.actual;
    const forecast = currentPoint.forecast;
    const residual = currentPoint.residual;
    const pctError = currentPoint.percentageError;

    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[240px] z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {currentPoint.date}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isFuturePoint
                ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                : "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
            }`}
          >
            {isFuturePoint ? "Proyeksi Horizon" : "Data Historis"}
          </span>
        </div>

        <div className="space-y-1.5">
          {actual !== null && actual !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Kurs Aktual:
              </span>
              <span className="font-bold text-emerald-300 text-sm">
                Rp {actual.toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {forecast !== null && forecast !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                Nilai Prediksi ({selectedModel.id.toUpperCase()}):
              </span>
              <span className="font-bold text-indigo-300 text-sm">
                Rp {forecast.toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {actual !== null && actual !== undefined && forecast !== null && forecast !== undefined && (
            <div className="pt-1.5 mt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400">
                <span>Error Residu (Aktual - Prediksi):</span>
                <span
                  className={`font-semibold ${
                    (residual || 0) >= 0 ? "text-amber-400" : "text-cyan-400"
                  }`}
                >
                  {(residual || 0) >= 0 ? `+Rp ${residual}` : `-Rp ${Math.abs(residual || 0)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 mt-0.5">
                <span>Deviasi Relatif (%):</span>
                <span className="font-semibold text-slate-200">
                  {pctError ? `${pctError}%` : "-"}
                </span>
              </div>
            </div>
          )}

          {currentPoint.lowerBound && currentPoint.upperBound && (
            <div className="pt-1 mt-1 text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
              <span>{confidenceLevel} Confidence Band (CL={confidenceLevel}):</span>
              <span className="text-purple-300 font-mono font-bold">
                Rp {currentPoint.lowerBound} - Rp {currentPoint.upperBound}
              </span>
            </div>
          )}

          {showMovingAverages && currentPoint.ma20 && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>MA(20):</span>
              <span className="text-amber-300 font-mono">Rp {currentPoint.ma20}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="main-chart-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm transition-all ${
        isExpanded ? "fixed inset-3 z-50 overflow-y-auto bg-slate-900" : ""
      }`}
    >
      {/* Chart Control Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Pergerakan Kurs USD/IDR: Aktual vs. Forecast
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Model: <strong className="text-indigo-300 font-semibold">{selectedModel.name}</strong>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Garis hijau menunjukkan kurs aktual JISDOR/ECB, garis biru adalah prediksi dengan rentang keyakinan (Confidence Level {confidenceLevel}).
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Confidence Level Selector (CL 99% / 95% / 90%) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-[9px] uppercase font-bold text-slate-500 px-1.5">CL:</span>
            {(["99%", "95%", "90%"] as const).map((cl) => (
              <button
                key={cl}
                id={`btn-cl-${cl}`}
                onClick={() => setConfidenceLevel(cl)}
                className={`px-2 py-0.5 rounded font-semibold transition text-[11px] ${
                  confidenceLevel === cl
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={`Tingkat Kepercayaan (Confidence Level) ${cl}`}
              >
                {cl}
              </button>
            ))}
          </div>

          {/* Forecast Horizon selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-indigo-900/60 text-xs">
            <span className="text-[9px] uppercase font-bold text-indigo-400 px-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Horizon:
            </span>
            {(
              [
                { key: "30d", label: "30D" },
                { key: "90d", label: "90D" },
                { key: "180d", label: "6B" },
                { key: "1y", label: "1T (1Y)" },
                { key: "2y", label: "2T (2Y)" },
              ] as const
            ).map((h) => (
              <button
                key={h.key}
                id={`btn-horizon-${h.key}`}
                onClick={() => setForecastHorizon(h.key)}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition ${
                  forecastHorizon === h.key
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={`Tampilkan proyeksi horizon ${h.label}`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(["1M", "3M", "6M", "1Y", "2Y", "ALL"] as const).map((r) => (
              <button
                key={r}
                id={`btn-timerange-${r}`}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  timeRange === r
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === "1M"
                  ? "1B"
                  : r === "3M"
                  ? "3B"
                  : r === "6M"
                  ? "6B"
                  : r === "1Y"
                  ? "1T"
                  : r === "2Y"
                  ? "2T"
                  : "Semua"}
              </button>
            ))}
          </div>

          {/* Visibility Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showActual}
                onChange={(e) => setShowActual(e.target.checked)}
                className="accent-emerald-500 rounded cursor-pointer w-3 h-3"
              />
              <span className="text-emerald-400 font-medium">Aktual</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
                className="accent-indigo-500 rounded cursor-pointer w-3 h-3"
              />
              <span className="text-indigo-400 font-medium">Forecast</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showConfidenceBand}
                onChange={(e) => setShowConfidenceBand(e.target.checked)}
                className="accent-purple-500 rounded cursor-pointer w-3 h-3"
              />
              <span className="text-purple-300 font-medium">{confidenceLevel} Band</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showMovingAverages}
                onChange={(e) => setShowMovingAverages(e.target.checked)}
                className="accent-amber-500 rounded cursor-pointer w-3 h-3"
              />
              <span className="text-amber-400">MA</span>
            </label>
          </div>

          {/* Expand Fullscreen */}
          <button
            id="btn-expand-chart"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={isExpanded ? "Kecilkan" : "Perbesar Grafik"}
            aria-label={isExpanded ? "Kecilkan Grafik" : "Perbesar Grafik"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`w-full ${isExpanded ? "h-[70vh]" : "h-[420px] sm:h-[460px]"} relative`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              {/* Gradient for Actual Line Area */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              {/* Gradient for Confidence Interval Band */}
              <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1e293b"} vertical={false} />

            <XAxis
              dataKey="date"
              stroke={isLight ? "#94a3b8" : "#64748b"}
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }}
              tickLine={false}
              tickFormatter={(val) => {
                if (!val) return "";
                const parts = val.split("-");
                return `${parts[2]}/${parts[1]}`;
              }}
              dy={8}
            />

            <YAxis
              domain={[minVal, maxVal]}
              stroke={isLight ? "#94a3b8" : "#64748b"}
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 11 }}
              tickLine={false}
              orientation="right"
              tickFormatter={(val) => `Rp ${(val / 1000).toFixed(1)}k`}
              dx={5}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
            />

            {/* Confidence Band Area */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill="url(#ciGradient)"
                name={`Pita Keyakinan ${confidenceLevel} (CL = ${confidenceLevel})`}
                isAnimationActive={false}
              />
            )}

            {/* Actual Series Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#10b981", stroke: "#047857", strokeWidth: 2 }}
                name="Kurs Aktual (USD/IDR)"
                connectNulls={false}
                isAnimationActive={false}
              />
            )}

            {/* Forecast Series Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#818cf8"
                strokeWidth={2.2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 5, fill: "#818cf8", stroke: "#4f46e5", strokeWidth: 2 }}
                name={`Forecast (${selectedModel.name})`}
                isAnimationActive={false}
              />
            )}

            {/* Moving Averages */}
            {showMovingAverages && (
              <>
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  dot={false}
                  name="MA(20)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ma50"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  dot={false}
                  name="MA(50)"
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Reference Line for Current Date / Spot transition */}
            {todayDate && (
              <ReferenceLine
                x={todayDate}
                stroke="#ec4899"
                strokeDasharray="3 3"
                label={{
                  value: "Batas Historis / Hari Ini",
                  fill: isLight ? "#db2777" : "#f472b6",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}

            {/* Reference Line for Current Spot Rate */}
            <ReferenceLine
              y={currentSpot}
              stroke={isLight ? "#94a3b8" : "#64748b"}
              strokeDasharray="2 2"
              label={{
                value: `Spot: Rp ${currentSpot.toLocaleString("id-ID")}`,
                fill: isLight ? "#475569" : "#cbd5e1",
                fontSize: 10,
                position: "insideBottomLeft",
              }}
            />

            {/* Interactive Brush for Range Navigation */}
            <Brush
              dataKey="date"
              height={26}
              stroke="#6366f1"
              fill={isLight ? "#f1f5f9" : "#0f172a"}
              tickFormatter={(val) => val?.substring(5) || ""}
              style={{ fontSize: "10px" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes & Legend Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span>Aktual: Data transaksi spot pasar valas BI / JISDOR</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-400 inline-block" />
            <span>Forecast: Proyeksi inferensi model time-series</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Horizon Proyeksi:{" "}
            <strong className="text-indigo-300">
              {forecastHorizon === "30d"
                ? "30 Hari"
                : forecastHorizon === "90d"
                ? "90 Hari (1 Kuartal)"
                : forecastHorizon === "180d"
                ? "180 Hari (6 Bulan)"
                : forecastHorizon === "1y"
                ? "1 Tahun (365 Hari Kalender)"
                : "2 Tahun (730 Hari Kalender)"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
