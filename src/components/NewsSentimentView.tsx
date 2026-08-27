import React, { useState, useMemo } from "react";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Send,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Info,
  Clock,
  Compass,
  Radio,
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
  CartesianGrid,
} from "recharts";
import {
  mockNewsSentimentList,
  mockSentimentTrendHistory,
  computeSentimentMetrics,
  NewsSentimentItem,
} from "../data/newsSentimentData";

interface NewsSentimentViewProps {
  currentSpot?: number;
}

export const NewsSentimentView: React.FC<NewsSentimentViewProps> = ({
  currentSpot = 17705,
}) => {
  const [newsList, setNewsList] = useState<NewsSentimentItem[]>(mockNewsSentimentList);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("ALL");
  const [isScanning, setIsScanning] = useState(false);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>("news-01");

  // Custom AI Evaluator state
  const [customHeadline, setCustomHeadline] = useState("");
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customAnalysisResult, setCustomAnalysisResult] = useState<{
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    score: number;
    explanation: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
  } | null>(null);

  // Compute live sentiment summary metrics
  const metrics = useMemo(() => computeSentimentMetrics(newsList), [newsList]);

  // Filtered news items
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      // Sentiment filter
      if (selectedSentiment !== "ALL" && item.sentiment !== selectedSentiment) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHeadline = item.headline.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesSource = item.source.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesHeadline && !matchesSummary && !matchesSource && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [newsList, selectedCategory, selectedSentiment, searchQuery]);

  // Simulated AI scanner refresh
  const handleScanLatestNews = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // Custom user headline AI analyzer
  const handleEvaluateCustomHeadline = () => {
    if (!customHeadline.trim()) return;
    setIsAnalyzingCustom(true);

    setTimeout(() => {
      const lower = customHeadline.toLowerCase();
      let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
      let score = 0;
      let impact: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let explanation = "";

      // Heuristic rule-based NLP classifier
      const bullishKeywords = [
        "naik", "surplus", "menguat", "inflow", "cadangan devisa", "bi-rate", "turun suku bunga the fed", 
        "pemangkasan", "rate cut", "pertumbuhan", "oversubscribed", "ekspor", "positif", "investasi"
      ];
      const bearishKeywords = [
        "melemah", "defisit", "outflow", "minyak naik", "dolar perkasa", "dxy menguat", "inflasi as", 
        "geopolitik", "perang", "tarif", "bunga the fed naik", "ketegangan", "ancaman", "kontraksi"
      ];

      let bullMatches = 0;
      let bearMatches = 0;

      bullishKeywords.forEach((k) => {
        if (lower.includes(k)) bullMatches++;
      });
      bearishKeywords.forEach((k) => {
        if (lower.includes(k)) bearMatches++;
      });

      if (bullMatches > bearMatches) {
        sentiment = "BULLISH";
        score = Number((0.45 + Math.min(0.5, bullMatches * 0.2)).toFixed(2));
        impact = bullMatches >= 2 ? "HIGH" : "MEDIUM";
        explanation = "Berita ini mengandung sentimen positif yang memperkuat kepercayaan terhadap aset Rupiah dan berpotensi menarik likuiditas valas ke pasar domestik.";
      } else if (bearMatches > bullMatches) {
        sentiment = "BEARISH";
        score = Number((-0.45 - Math.min(0.5, bearMatches * 0.2)).toFixed(2));
        impact = bearMatches >= 2 ? "HIGH" : "MEDIUM";
        explanation = "Berita ini mengindikasikan tekanan eksternal atau kenaikan permintaan Dolar AS yang berpotensi memicu pelemahan nilai tukar Rupiah dalam jangka pendek.";
      } else {
        sentiment = "NEUTRAL";
        score = 0.05;
        impact = "LOW";
        explanation = "Dampak berita ini relatif berimbang atau telah terantisipasi oleh pasar valas sebelumnya (priced-in).";
      }

      setCustomAnalysisResult({
        sentiment,
        score,
        explanation,
        impact,
      });
      setIsAnalyzingCustom(false);
    }, 600);
  };

  const handleAddAnalyzedToFeed = () => {
    if (!customAnalysisResult || !customHeadline.trim()) return;

    const newItem: NewsSentimentItem = {
      id: `custom-${Date.now()}`,
      headline: customHeadline,
      summary: customAnalysisResult.explanation,
      source: "Input Pengguna (Terverifikasi AI)",
      sourceType: "national",
      publishedAt: new Date().toISOString(),
      timeAgo: "Baru saja",
      category: "monetary",
      categoryLabel: "Analisis Kustom",
      sentiment: customAnalysisResult.sentiment,
      sentimentScore: customAnalysisResult.score,
      impactLevel: customAnalysisResult.impact,
      idrEffectSummary: customAnalysisResult.explanation,
      mechanismExplanation: `Evaluasi NLP Otomatis: Skor Polaritas ${customAnalysisResult.score > 0 ? "+" : ""}${customAnalysisResult.score}`,
      tags: ["#AnalisisKustom", "#UserFeed", "#RealtimeAI"],
      confidenceScore: 90,
    };

    setNewsList([newItem, ...newsList]);
    setCustomHeadline("");
    setCustomAnalysisResult(null);
  };

  return (
    <div id="news-sentiment-view" className="space-y-6">
      {/* 1. Header Banner & Sentiment Score Meter */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <Newspaper className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Analisis Sentimen Berita & Dampak Nilai Tukar Rupiah
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold flex items-center gap-1.5">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                Live NLP Feed
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Memproses dan mengukur polaritas berita ekonomi makro (Bank Indonesia, The Fed, Neraca Dagang, Komoditas) secara real-time untuk memproyeksikan arah pergerakan kurs USD/IDR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleScanLatestNews}
              disabled={isScanning}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Memindai Berita..." : "Pindai Berita Terkini"}</span>
            </button>
          </div>
        </div>

        {/* Sentiment Gauge & Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-800/80">
          {/* Card 1: Overall Sentiment Index */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Indeks Sentimen Pasar</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">0 - 100</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {metrics.overallScore}
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                / 100
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{metrics.statusLabel}</span>
            </div>
          </div>

          {/* Card 2: Bullish vs Bearish Ratio */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Distribusi Polaritas</span>
              <span className="text-[10px] font-mono text-slate-400">{metrics.totalArticles} Berita</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-emerald-400">{metrics.bullishPct}% Positif</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">{metrics.bearishPct}% Negatif</span>
            </div>
            {/* Visual Ratio Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${metrics.bullishPct}%` }}
              />
              <div
                className="bg-slate-600 h-full"
                style={{ width: `${metrics.neutralPct}%` }}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${metrics.bearishPct}%` }}
              />
            </div>
          </div>

          {/* Card 3: Market Volatility Impact */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Sensitivitas Kurs</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">High</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              Rp {currentSpot.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-slate-300">
              Korelasi Sentimen: <span className="text-indigo-400 font-semibold font-mono">r = -0.74</span> (IDR Kuat)
            </div>
          </div>

          {/* Card 4: Dominant News Theme */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Tema Utama Pasar</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">Trending</span>
            </div>
            <div className="text-xs font-bold text-slate-200 line-clamp-1">
              {metrics.dominantTheme}
            </div>
            <div className="text-[10px] text-indigo-400 font-mono">
              #BankIndonesia #TheFed #SurplusDagang
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive AI Headline Evaluator (Custom Input Tool) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Simulator Evaluator Sentimen Berita AI Mandiri
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">
            Instant NLP Analyzer
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Ketikkan atau tempelkan berita/pernyataan ekonomi makro untuk mengevaluasi dampak langsungnya terhadap pergerakan kurs Rupiah.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customHeadline}
            onChange={(e) => setCustomHeadline(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEvaluateCustomHeadline()}
            placeholder="Contoh: Bank Indonesia naikkan suku bunga 25 bps untuk stabilisasi devisa..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={handleEvaluateCustomHeadline}
            disabled={isAnalyzingCustom || !customHeadline.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzingCustom ? "Menganalisis..." : "Analisis Sentimen"}</span>
          </button>
        </div>

        {/* Custom Analysis Output Card */}
        {customAnalysisResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs animate-fadeIn space-y-2 ${
              customAnalysisResult.sentiment === "BULLISH"
                ? "bg-emerald-950/40 border-emerald-800/60"
                : customAnalysisResult.sentiment === "BEARISH"
                ? "bg-rose-950/40 border-rose-800/60"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {customAnalysisResult.sentiment === "BULLISH" && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    BULLISH IDR (Menguatkan Rupiah)
                  </span>
                )}
                {customAnalysisResult.sentiment === "BEARISH" && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                    BEARISH IDR (Menekan Rupiah)
                  </span>
                )}
                {customAnalysisResult.sentiment === "NEUTRAL" && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    NETRAL IDR
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[11px]">
                  Skor Polaritas: <b className="text-white">{customAnalysisResult.score > 0 ? `+${customAnalysisResult.score}` : customAnalysisResult.score}</b>
                </span>
              </div>
              <button
                onClick={handleAddAnalyzedToFeed}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[11px] font-semibold transition"
              >
                + Tambahkan ke Daftar Berita
              </button>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {customAnalysisResult.explanation}
            </p>
          </div>
        )}
      </div>

      {/* 3. Historical Sentiment Trend vs USD/IDR Correlation Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Dinamika Historis: Indeks Sentimen Berita vs Pergerakan Kurs USD/IDR
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik membandingkan skor sentimen berita (Sumbu Kanan) terhadap kurs aktual USD/IDR (Sumbu Kiri) bulan berjalan.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              30 Hari Terakhir
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={mockSentimentTrendHistory}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis
                yAxisId="left"
                stroke="#818cf8"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => `Rp ${val.toLocaleString("id-ID")}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => `${val} pts`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0]?.payload;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 text-xs shadow-xl backdrop-blur-md space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          Tanggal: {label}
                        </div>
                        <div className="text-indigo-300 font-semibold flex justify-between gap-4">
                          <span>USD/IDR Spot:</span>
                          <span className="font-mono font-bold">Rp {row.usdIdr.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="text-emerald-400 font-semibold flex justify-between gap-4">
                          <span>Indeks Sentimen:</span>
                          <span className="font-mono font-bold">{row.sentimentIndex} pts ({row.tone})</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="usdIdr"
                name="Kurs USD/IDR (Rp)"
                stroke="#818cf8"
                strokeWidth={2.2}
                dot={{ r: 4 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="sentimentIndex"
                name="Indeks Sentimen (0-100)"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#sentimentGrad)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Search, Filter & News Feed List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Live News Direct Portals Bar */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <span>Portal Berita Keuangan & Makro Live:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <a
              href="https://news.google.com/search?q=kurs+rupiah+hari+ini&hl=id&gl=ID&ceid=ID:id"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-semibold flex items-center gap-1 transition"
            >
              <span>🌐 Google News (Rupiah Hari Ini)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://www.cnbcindonesia.com/tag/rupiah"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition"
            >
              <span>📈 CNBC Indonesia</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://www.bi.go.id/id/publikasi/ruang-media/news-release/Default.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition"
            >
              <span>🏛️ Bank Indonesia Press</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://www.bps.go.id/id/pressrelease"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition"
            >
              <span>📊 BPS Siaran Pers</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Controls: Search & Category Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci berita (misal: BI-Rate, The Fed, Minyak, SBN)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Sentiment Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedSentiment("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSentiment === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Semua Sentimen
            </button>
            <button
              onClick={() => setSelectedSentiment("BULLISH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                selectedSentiment === "BULLISH"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-emerald-400 hover:bg-slate-700"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Bullish IDR</span>
            </button>
            <button
              onClick={() => setSelectedSentiment("BEARISH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                selectedSentiment === "BEARISH"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-800 text-rose-400 hover:bg-slate-700"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Bearish IDR</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
          {[
            { id: "ALL", label: "Semua Kategori" },
            { id: "monetary", label: "🏦 Kebijakan Moneter BI" },
            { id: "global", label: "🇺🇸 Global & The Fed" },
            { id: "fiscal", label: "📊 Cadangan Devisa & Fiskal" },
            { id: "commodity", label: "🛢️ Komoditas & Energi" },
            { id: "geopolitics", label: "🏛️ Geopolitik & Regional" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                  : "bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Cards Feed */}
        <div className="space-y-3 pt-2">
          {filteredNews.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Tidak ditemukan berita yang sesuai dengan filter atau kata kunci pencarian.</p>
            </div>
          ) : (
            filteredNews.map((item) => {
              const isExpanded = expandedNewsId === item.id;
              const isBullish = item.sentiment === "BULLISH";
              const isBearish = item.sentiment === "BEARISH";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isExpanded
                      ? "bg-slate-950/90 border-slate-700 shadow-md"
                      : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Source & Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-indigo-400 flex items-center gap-1">
                          {item.source}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.timeAgo}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {item.categoryLabel}
                        </span>
                      </div>

                      {/* Headline (Clickable to external news website) */}
                      <div className="flex items-start gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka berita langsung di website sumber resmi"
                          className="text-sm font-bold text-white hover:text-indigo-400 leading-snug transition flex items-start gap-1.5 group"
                        >
                          <span className="group-hover:underline">{item.headline}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Action Bar: External Link & AI Mechanism Toggle */}
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition"
                        >
                          <span>Buka Website Sumber Asli</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => setExpandedNewsId(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition"
                        >
                          <span>{isExpanded ? "Tutup Analisis" : "Mekanisme Transmisi AI"}</span>
                          <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Sentiment Badge & Score */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1 border shadow-xs ${
                          isBullish
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                            : isBearish
                            ? "bg-rose-950/80 text-rose-300 border-rose-700/60"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isBullish ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : isBearish ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        <span>{item.sentiment} IDR</span>
                      </span>

                      <div className="text-[11px] font-mono text-slate-400">
                        Skor: <strong className={isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-slate-300"}>
                          {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Deep-Dive Mechanism */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-2.5 text-xs animate-fadeIn">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
                        <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Mekanisme Transmisi Finansial terhadap Nilai Tukar Rupiah
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {item.mechanismExplanation}
                        </p>
                        <div className="pt-1 text-[11px] text-slate-400">
                          <strong>Prospek Kurs:</strong> {item.idrEffectSummary}
                        </div>
                      </div>

                      {/* Tags & External Link Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.tags.map((tag) => (
                            <a
                              key={tag}
                              href={`https://news.google.com/search?q=${encodeURIComponent(tag.replace("#", "") + " Rupiah terbaru")}&hl=id&gl=ID&ceid=ID:id`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Cari berita terbaru untuk topik ${tag}`}
                              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 text-[10px] font-mono transition flex items-center gap-1"
                            >
                              <span>{tag}</span>
                              <ExternalLink className="w-2 h-2 opacity-60" />
                            </a>
                          ))}
                        </div>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <span>Kunjungi {item.source}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
