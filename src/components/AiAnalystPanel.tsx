import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  TrendingUp,
  Shield,
  RefreshCw,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ModelProfile, AIAnalysisResult, ModelMetrics } from "../types";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [showFullReview, setShowFullReview] = useState(false);

  const fetchAnalysis = async () => {
    setIsLoading(true);
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
    } catch {
      // Fallback structured analysis
      setAnalysis({
        summary: `Berdasarkan inferensi model ${selectedModel.name}, kurs USD/IDR diproyeksikan berada di kisaran Rp ${forecast30d.toLocaleString("id-ID")} dalam horizon 30 hari ke depan dengan akurasi teruji (MAPE ${metrics.mape}%).`,
        keyDrivers: [
          "Arah kebijakan suku bunga The Fed (FFR) vs BI-Rate",
          "Permintaan valas korporasi untuk impor & dividen",
          "Kondisi cadangan devisa Bank Indonesia & stabilisasi pasar",
          "Indeks Dolar AS (DXY) di pasar global",
        ],
        technicalLevels: {
          support: `Rp ${(currentSpot * 0.988).toFixed(0)}`,
          pivot: `Rp ${currentSpot.toFixed(0)}`,
          resistance: `Rp ${(currentSpot * 1.012).toFixed(0)}`,
        },
        modelHealthNote: `Evaluasi model menunjukkan kesesuaian kuat dengan koefisien determinasi R² ${(metrics.r2 * 100).toFixed(1)}% dan akurasi arah sebesar ${metrics.directionalAccuracy}%.`,
        recommendations: [
          "Lindung Nilai: Pertimbangkan Forward Hedging jika kurs mendekati level resistensi.",
          "Likuiditas: Optimalkan penempatan valas melalui instrumen TD Valas DHE Bank Indonesia.",
          "Pemantauan: Evaluasi berkala rilis data neraca dagang BPS dan keputusan suku bunga RDG BI.",
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
    <div
      id="ai-analyst-panel"
      className={`${
        isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
      } border rounded-2xl p-4 sm:p-5 shadow-sm transition-colors`}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b ${
        isLight ? "border-slate-200" : "border-slate-800"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Rangkuman Eksekutif Analisis AI & Proyeksi Valas
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isAiPowered
                    ? isLight
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-indigo-950 text-indigo-300 border-indigo-700/60"
                    : isLight
                    ? "bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isAiPowered ? "Gemini AI Engine" : "Rule-Based Inference"}
              </span>
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Ringkasan sentimen makroekonomi, rentang batas teknikal, dan rekomendasi treasury.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-50 ${
            isLight
              ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Menganalisis..." : "Perbarui Analisis"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className={`text-xs font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Memproses proyeksi ekonometrika...
          </p>
        </div>
      ) : analysis ? (
        <div className="mt-3.5 space-y-3 text-xs">
          {/* Executive Summary Card */}
          <div className={`p-3.5 rounded-xl border ${
            isLight
              ? "bg-indigo-50/60 border-indigo-100 text-slate-800"
              : "bg-indigo-950/30 border-indigo-900/40 text-slate-200"
          }`}>
            <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1 text-xs">
              <Bot className="w-3.5 h-3.5" />
              Proyeksi Konsensus 30 Hari:
            </div>
            <p className="leading-relaxed">{analysis.summary}</p>
          </div>

          {/* 3 Executive Key Takeaways Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Box 1: Support / Resistance */}
            <div className={`p-3 rounded-xl border ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
            }`}>
              <div className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                Rentang Acuan Kurs (30D):
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Support Min:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{analysis.technicalLevels?.support}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spot Acuan:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{analysis.technicalLevels?.pivot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resistensi Max:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{analysis.technicalLevels?.resistance}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Key Macro Drivers */}
            <div className={`p-3 rounded-xl border ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
            }`}>
              <div className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Faktor Penentu Utama:
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                {analysis.keyDrivers?.slice(0, 3).map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                    <span className="truncate">{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Box 3: Rekomendasi Treasury */}
            <div className={`p-3 rounded-xl border ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
            }`}>
              <div className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Rekomendasi Aksi:
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                {analysis.recommendations?.slice(0, 2).map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="line-clamp-2 leading-tight">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Collapsible Full Review */}
          <div className="pt-1">
            <button
              onClick={() => setShowFullReview(!showFullReview)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showFullReview ? "Sembunyikan Evaluasi Reliabilitas Model" : "Lihat Evaluasi Reliabilitas Model & Audit Lengkap"}</span>
              {showFullReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullReview && (
              <div className={`mt-2 p-3 rounded-xl border text-[11px] flex items-start gap-2.5 animate-fadeIn ${
                isLight ? "bg-emerald-50/50 border-emerald-200 text-slate-700" : "bg-emerald-950/30 border-emerald-800/40 text-slate-300"
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">Validasi Statistik: </span>
                  <span>{analysis.modelHealthNote}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
