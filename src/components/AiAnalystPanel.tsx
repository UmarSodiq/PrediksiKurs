import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  TrendingUp,
  Shield,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { ModelProfile, AIAnalysisResult, ModelMetrics } from "../types";

interface AiAnalystPanelProps {
  currentSpot: number;
  forecast30d: number;
  selectedModel: ModelProfile;
  metrics: ModelMetrics;
}

export const AiAnalystPanel: React.FC<AiAnalystPanelProps> = ({
  currentSpot,
  forecast30d,
  selectedModel,
  metrics,
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/ai-forecast-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRate: currentSpot,
          forecastRate30d: forecast30d,
          trend: forecast30d >= currentSpot ? "depreciation" : "appreciation",
          metrics: {
            mape: metrics.mape,
            rmse: metrics.rmse,
            mae: metrics.mae,
            r2: metrics.r2,
            directionalAccuracy: metrics.directionalAccuracy,
          },
          selectedModel: selectedModel.name,
          macroContext: {
            dxy: 103.85,
            biRate: "6.00%",
            fedRate: "4.75%",
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setIsAiPowered(data.source === "gemini_ai");
      } else {
        throw new Error(data.error || "Gagal memuat analisis AI");
      }
    } catch (_err) {
      // Fallback structured analysis
      setAnalysis({
        summary: `Berdasarkan inferensi model ${selectedModel.name}, nilai tukar USD/IDR diproyeksikan berada di kisaran Rp ${forecast30d.toLocaleString("id-ID")} dalam horizon 30 hari ke depan dengan tingkat akurasi tinggi (MAPE ${metrics.mape}%).`,
        keyDrivers: [
          "Divergensi arah kebijakan suku bunga The Fed (FFR) vs BI-Rate",
          "Permintaan valas korporasi untuk pembayaran dividen dan impor migas",
          "Kondisi cadangan devisa Bank Indonesia dan intervensi pasar DNDF",
          "Indeks Dolar AS (DXY) dan imbal hasil US Treasury 10-Year",
        ],
        technicalLevels: {
          support: `Rp ${(currentSpot * 0.988).toFixed(0)} - Rp ${(currentSpot * 0.994).toFixed(0)}`,
          pivot: `Rp ${currentSpot.toFixed(0)}`,
          resistance: `Rp ${(currentSpot * 1.012).toFixed(0)} - Rp ${(currentSpot * 1.025).toFixed(0)}`,
        },
        modelHealthNote: `Evaluasi model menunjukkan kesesuaian kuat dengan koefisien determinasi R² ${(metrics.r2 * 100).toFixed(1)}% dan akurasi arah sebesar ${metrics.directionalAccuracy}%.`,
        recommendations: [
          "Eksportir: Manfaatkan level kurs tinggi untuk konversi valas bertahap melalui instrumen TD Valas DHE.",
          "Importir: Pertimbangkan kontrak Forward Hedging jika kurs mendekati level resistensi teknikal.",
          "Treasury: Pantau rilis data inflasi AS dan hasil Rapat Dewan Gubernur Bank Indonesia.",
        ],
      });
      setIsAiPowered(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [currentSpot, forecast30d, selectedModel.id]);

  return (
    <div id="ai-analyst-panel" className="bg-slate-900/90  rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Macroeconomic & Forex Insights
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isAiPowered
                    ? "bg-indigo-950 text-indigo-300 border-indigo-700/60"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isAiPowered ? "Powered by Gemini AI" : "Quantitative Rule Engine"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Analisis cerdas proyeksi kurs, level teknikal, dan rekomendasi lindung nilai (hedging).
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Menganalisis..." : "Perbarui Analisis AI"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-300 font-medium">Sedang memproses evaluasi ekonometrika & makroekonomi...</p>
        </div>
      ) : analysis ? (
        <div className="mt-4 space-y-4 text-xs">
          {/* Executive Summary */}
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 text-slate-200 leading-relaxed">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1 text-xs">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              Ringkasan Eksekutif Ramalan Kurs
            </div>
            <p className="text-slate-300">{analysis.summary}</p>
          </div>

          {/* Grid: Drivers + Technical Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Drivers */}
            <div className="bg-slate-950/60  rounded-xl p-3.5">
              <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Faktor Pemicu Utama (Key Macro Drivers):
              </div>
              <ul className="space-y-1.5 text-slate-300">
                {analysis.keyDrivers?.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Levels */}
            <div className="bg-slate-950/60  rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Level Psikologis & Rentang Teknikal:
                </div>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg ">
                    <span className="text-slate-400">Area Support:</span>
                    <span className="font-mono font-bold text-emerald-400">{analysis.technicalLevels?.support}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg ">
                    <span className="text-slate-400">Pivot Spot:</span>
                    <span className="font-mono font-bold text-indigo-300">{analysis.technicalLevels?.pivot}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg ">
                    <span className="text-slate-400">Area Resistance:</span>
                    <span className="font-mono font-bold text-rose-400">{analysis.technicalLevels?.resistance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Health Evaluation Note */}
          <div className="bg-slate-950/60  rounded-xl p-3.5 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Kualitas & Reliabilitas Model: </span>
              <span className="text-slate-400">{analysis.modelHealthNote}</span>
            </div>
          </div>

          {/* Tactical Recommendations */}
          <div className="bg-slate-950/60  rounded-xl p-3.5">
            <div className="font-bold text-white mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              Rekomendasi Taktis Manajemen Risiko:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {analysis.recommendations?.map((rec, rIdx) => (
                <div key={rIdx} className="bg-slate-900 p-2.5 rounded-lg /80 text-slate-300 text-[11px] leading-relaxed">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
