import React, { useState, useMemo } from "react";
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ForexDataPoint, ScenarioParameters } from "../types";
import { useTheme } from "../context/ThemeContext";

interface ScenarioSimulatorProps {
  data: ForexDataPoint[];
  currentSpot: number;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  data,
  currentSpot,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [simHorizon, setSimHorizon] = useState<"30d" | "90d" | "180d" | "1y" | "2y">("1y");
  const [params, setParams] = useState<ScenarioParameters>({
    fedRateChangeBps: 0,
    biRateChangeBps: 0,
    dxyChangePct: 0,
    oilPriceChangePct: 0,
    riskSentiment: "neutral",
  });

  const [activePreset, setActivePreset] = useState<string>("baseline");

  // Presets handler
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "baseline") {
      setParams({
        fedRateChangeBps: 0,
        biRateChangeBps: 0,
        dxyChangePct: 0,
        oilPriceChangePct: 0,
        riskSentiment: "neutral",
      });
    } else if (presetKey === "hawkish_fed") {
      setParams({
        fedRateChangeBps: 50,
        biRateChangeBps: 0,
        dxyChangePct: 2.5,
        oilPriceChangePct: 10,
        riskSentiment: "risk_off",
      });
    } else if (presetKey === "dovish_pivot") {
      setParams({
        fedRateChangeBps: -50,
        biRateChangeBps: -25,
        dxyChangePct: -3.0,
        oilPriceChangePct: -8,
        riskSentiment: "risk_on",
      });
    } else if (presetKey === "oil_shock") {
      setParams({
        fedRateChangeBps: 25,
        biRateChangeBps: 25,
        dxyChangePct: 1.8,
        oilPriceChangePct: 25,
        riskSentiment: "risk_off",
      });
    }
  };

  // Compute simulated forecast trajectory across selected horizon
  const simulationChartData = useMemo(() => {
    // Exogenous sensitivities (elasticities derived from SARIMAX/Vector AutoRegression)
    // 100 bps Fed Hike -> ~ +220 IDR depreciation (baseline 30D), compounding to +450 IDR over 1-2 years
    // 100 bps BI Hike -> ~ -160 IDR appreciation (countermeasure)
    // +1% DXY -> ~ +110 IDR
    // +10% Oil Price -> ~ +45 IDR
    // Risk-off premium -> ~ +90 IDR

    const horizonDays =
      simHorizon === "30d"
        ? 30
        : simHorizon === "90d"
        ? 90
        : simHorizon === "180d"
        ? 180
        : simHorizon === "1y"
        ? 365
        : 730;

    const fedImpact = (params.fedRateChangeBps / 100) * 220;
    const biImpact = (params.biRateChangeBps / 100) * -160;
    const dxyImpact = params.dxyChangePct * 110;
    const oilImpact = (params.oilPriceChangePct / 10) * 45;
    const sentimentImpact =
      params.riskSentiment === "risk_off"
        ? 95
        : params.riskSentiment === "risk_on"
        ? -95
        : 0;

    const baseShockIDR = fedImpact + biImpact + dxyImpact + oilImpact + sentimentImpact;

    // Filter historical baseline (past 45 days) + future up to horizonDays
    const historical = data.filter((d) => !d.isFuture);
    const future = data.filter((d) => d.isFuture).slice(0, horizonDays);
    const recentHistory = historical.slice(-45);

    const merged = [...recentHistory, ...future];

    let futureIndex = 0;
    return merged.map((d) => {
      const isFuture = d.isFuture;
      const baseForecast = d.forecast || d.actual || currentSpot;

      let simulatedVal: number | null = null;
      if (isFuture) {
        futureIndex++;
        // Progressive cumulative compounding over time
        const progress = Math.min(1.5, futureIndex / Math.min(horizonDays, 60));
        const compoundingFactor = 1 + (futureIndex / 252) * 0.4;
        const totalShock = baseShockIDR * Math.max(0.15, progress) * compoundingFactor;
        simulatedVal = Math.round(baseForecast + totalShock);
      } else {
        simulatedVal = d.forecast || null;
      }

      return {
        date: d.date,
        actual: d.actual,
        baseForecast: d.forecast,
        simulatedForecast: simulatedVal,
        isFuture,
      };
    });
  }, [data, currentSpot, params, simHorizon]);

  const endSimulatedPoint = simulationChartData[simulationChartData.length - 1];
  const endBasePoint =
    simulationChartData.filter((d) => d.isFuture).pop() || endSimulatedPoint;
  const netDeviation =
    (endSimulatedPoint?.simulatedForecast || 0) - (endBasePoint?.baseForecast || 0);

  const horizonLabelMap: Record<string, string> = {
    "30d": "30 Hari",
    "90d": "90 Hari (1 Kuartal)",
    "180d": "180 Hari (6 Bulan)",
    "1y": "1 Tahun (252 Hari)",
    "2y": "2 Tahun (504 Hari)",
  };

  return (
    <div id="scenario-simulator-view" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Simulator Skenario Makro & Uji Tekan (What-If Stress Testing)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uji dampak perubahan suku bunga The Fed, respons BI-Rate, gejolak Indeks Dolar (DXY), dan harga minyak mentah terhadap lintasan kurs USD/IDR.
            </p>
          </div>

          <button
            onClick={() => applyPreset("baseline")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Baseline
          </button>
        </div>

        {/* Preset Skenario Badges */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Pilihan Skenario Cepat:</span>
          {[
            { id: "baseline", label: "Konsensus Baseline (Normal)" },
            { id: "hawkish_fed", label: "Hawkish Fed & DXY Rally (+50 bps Fed)" },
            { id: "dovish_pivot", label: "Dovish Pivot The Fed (-50 bps Fed)" },
            { id: "oil_shock", label: "Shock Minyak & Inflasi Global (+25% Minyak)" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activePreset === preset.id
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls + Real-time Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders & Controls (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Parameter Shock Eksogen</span>
              <span className="text-[10px] text-slate-500 font-mono">Sensitivitas VAR Model</span>
            </h3>

            {/* Fed Rate Shock Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Perubahan Fed Funds Rate (FFR):</span>
                <span
                  className={`font-mono font-bold ${
                    params.fedRateChangeBps > 0
                      ? "text-rose-400"
                      : params.fedRateChangeBps < 0
                      ? "text-emerald-400"
                      : "text-slate-300"
                  }`}
                >
                  {params.fedRateChangeBps > 0
                    ? `+${params.fedRateChangeBps} bps`
                    : `${params.fedRateChangeBps} bps`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="25"
                value={params.fedRateChangeBps}
                onChange={(e) => {
                  setActivePreset("custom");
                  setParams({ ...params, fedRateChangeBps: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>-100 bps (Dovish)</span>
                <span>0 (Netral)</span>
                <span>+100 bps (Hawkish)</span>
              </div>
            </div>

            {/* BI Rate Reaction Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Respons Suku Bunga BI-Rate:</span>
                <span
                  className={`font-mono font-bold ${
                    params.biRateChangeBps > 0
                      ? "text-emerald-400"
                      : params.biRateChangeBps < 0
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  {params.biRateChangeBps > 0
                    ? `+${params.biRateChangeBps} bps`
                    : `${params.biRateChangeBps} bps`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="25"
                value={params.biRateChangeBps}
                onChange={(e) => {
                  setActivePreset("custom");
                  setParams({ ...params, biRateChangeBps: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>-100 bps (Pangkas)</span>
                <span>0 (Pertahankan)</span>
                <span>+100 bps (Kenaikan)</span>
              </div>
            </div>

            {/* US Dollar Index (DXY) Shift */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Fluktuasi Indeks Dolar AS (DXY):</span>
                <span
                  className={`font-mono font-bold ${
                    params.dxyChangePct > 0
                      ? "text-rose-400"
                      : params.dxyChangePct < 0
                      ? "text-emerald-400"
                      : "text-slate-300"
                  }`}
                >
                  {params.dxyChangePct > 0
                    ? `+${params.dxyChangePct}%`
                    : `${params.dxyChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={params.dxyChangePct}
                onChange={(e) => {
                  setActivePreset("custom");
                  setParams({ ...params, dxyChangePct: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>-5% (Dolar Lemah)</span>
                <span>0%</span>
                <span>+5% (Dolar Kuat)</span>
              </div>
            </div>

            {/* Crude Oil Price Shift */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Harga Minyak Mentah (Brent):</span>
                <span
                  className={`font-mono font-bold ${
                    params.oilPriceChangePct > 0
                      ? "text-rose-400"
                      : params.oilPriceChangePct < 0
                      ? "text-emerald-400"
                      : "text-slate-300"
                  }`}
                >
                  {params.oilPriceChangePct > 0
                    ? `+${params.oilPriceChangePct}%`
                    : `${params.oilPriceChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="5"
                value={params.oilPriceChangePct}
                onChange={(e) => {
                  setActivePreset("custom");
                  setParams({ ...params, oilPriceChangePct: Number(e.target.value) });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>-25%</span>
                <span>0%</span>
                <span>+25%</span>
              </div>
            </div>

            {/* Global Risk Sentiment Selection */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Sentimen Risiko Global (Risk Mood):
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(
                  [
                    { id: "risk_on", label: "Risk-On (Inflow)" },
                    { id: "neutral", label: "Netral" },
                    { id: "risk_off", label: "Risk-Off (Flight)" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActivePreset("custom");
                      setParams({ ...params, riskSentiment: s.id });
                    }}
                    className={`py-2 px-1 rounded-lg font-medium border text-center transition ${
                      params.riskSentiment === s.id
                        ? "bg-indigo-600/30 text-indigo-300 border-indigo-500 font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shock Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400 mb-1">Estimasi Deviasi dari Baseline:</div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  netDeviation > 0
                    ? "text-rose-400"
                    : netDeviation < 0
                    ? "text-emerald-400"
                    : "text-slate-300"
                }`}
              >
                {netDeviation > 0 ? `+Rp ${netDeviation}` : netDeviation < 0 ? `-Rp ${Math.abs(netDeviation)}` : "Rp 0"}
              </span>
              <span className="text-xs text-slate-400">pada akhir horizon 30D</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {netDeviation > 0
                ? "Skenario ini memberikan tekanan pelemahan (depresiasi) tambahan terhadap Rupiah."
                : netDeviation < 0
                ? "Skenario ini mendukung penguatan (apresiasi) nilai tukar Rupiah."
                : "Skenario berada dalam trayek baseline normal konsensus."}
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Simulation Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Lintasan Proyeksi Kurs: Baseline vs. Simulasi Skenario
              </h3>
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono">
                Horizon 30D
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Garis ungu putus-putus menunjukkan baseline forecast saat ini, sedangkan garis merah/oranye menunjukkan lintasan jika terjadi shock makro.
            </p>

            {/* Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1e293b"} />
                  <XAxis dataKey="date" stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 10 }} />
                  <YAxis stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 10 }} orientation="right" domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "#020617",
                      borderColor: isLight ? "#cbd5e1" : "#334155",
                      color: isLight ? "#0f172a" : "#ffffff",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => [`Rp ${val?.toLocaleString("id-ID")}`, name]}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Kurs Aktual"
                  />
                  <Line
                    type="monotone"
                    dataKey="baseForecast"
                    stroke="#818cf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Baseline Forecast"
                  />
                  <Line
                    type="monotone"
                    dataKey="simulatedForecast"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={false}
                    name="Hasil Simulasi Shock"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Target Akhir Baseline: <strong className="text-indigo-300">Rp {endSimulatedPoint?.baseForecast?.toLocaleString("id-ID")}</strong></span>
            <span>Target Akhir Skenario: <strong className="text-rose-400">Rp {endSimulatedPoint?.simulatedForecast?.toLocaleString("id-ID")}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
