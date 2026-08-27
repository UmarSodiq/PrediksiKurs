import React, { useState, useMemo, useEffect } from "react";
import {
  Globe,
  DollarSign,
  Landmark,
  Layers,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  BarChart2,
  FileSpreadsheet,
  Info,
  RefreshCw,
  Zap,
  Key,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
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
import { MacroFactor } from "../types";
import {
  macroHistoricalDataset,
  getComputedMacroCorrelations,
  rawMacroCsv,
} from "../data/macroDatasetHistorical";
import {
  fetchLatestMacroIndicators,
  MacroSyncResult,
  getCachedMacroIndicators,
} from "../utils/macroSyncService";

interface MacroDriversViewProps {
  macroFactors?: MacroFactor[];
}

type MacroVariableKey =
  | "dxy"
  | "biRate"
  | "fedFunds"
  | "brent"
  | "neraca"
  | "inflasi"
  | "reserve";

interface VariableConfig {
  key: MacroVariableKey;
  name: string;
  shortName: string;
  unit: string;
  color: string;
  description: string;
  impactNote: string;
}

const VARIABLE_CONFIGS: Record<MacroVariableKey, VariableConfig> = {
  dxy: {
    key: "dxy",
    name: "US Dollar Index (DXY)",
    shortName: "DXY Index",
    unit: "Index Pts",
    color: "#818cf8", // Indigo
    description: "Kekuatan Dolar AS relatif terhadap 6 mata uang utama dunia (EUR, JPY, GBP, CAD, SEK, CHF).",
    impactNote: "Kenaikan DXY mendorong penguatan Dolar global dan memicu tekanan depresiasi pada nilai tukar Rupiah.",
  },
  biRate: {
    key: "biRate",
    name: "BI-Rate (Suku Bunga Acuan BI)",
    shortName: "BI-Rate",
    unit: "% p.a.",
    color: "#10b981", // Emerald
    description: "Suku bunga kebijakan Bank Indonesia untuk transmisi moneter dan stabilitas inflasi/kurs.",
    impactNote: "Kenaikan suku bunga BI memperlebar interest rate differential untuk menarik aliran modal asing (inflow) ke aset domestik.",
  },
  fedFunds: {
    key: "fedFunds",
    name: "US Fed Funds Rate (FFR)",
    shortName: "Fed Funds",
    unit: "% p.a.",
    color: "#f59e0b", // Amber
    description: "Suku bunga acuan kebijakan moneter Federal Reserve Amerika Serikat.",
    impactNote: "Kenaikan suku bunga The Fed mempersempit spread imbal hasil dengan aset Rupiah, memicu potensi capital outflow.",
  },
  brent: {
    key: "brent",
    name: "Minyak Mentah Brent (Brent Crude)",
    shortName: "Minyak Brent",
    unit: "USD/Bbl",
    color: "#ec4899", // Pink
    description: "Harga patokan minyak mentah internasional yang memengaruhi neraca migas dan subsidi energi.",
    impactNote: "Kenaikan harga minyak meningkatkan tagihan impor migas RI, berpotensi menekan neraca transaksi berjalan.",
  },
  neraca: {
    key: "neraca",
    name: "Neraca Perdagangan RI",
    shortName: "Neraca Dagang",
    unit: "Juta USD",
    color: "#06b6d4", // Cyan
    description: "Selisih nilai ekspor dan impor barang non-migas serta migas Indonesia.",
    impactNote: "Surplus perdagangan yang konsisten menyuplai likuiditas valuta asing eksportir untuk menopang ketahanan kurs Rupiah.",
  },
  inflasi: {
    key: "inflasi",
    name: "Tingkat Inflasi RI (YoY CPI)",
    shortName: "Tingkat Inflasi",
    unit: "% YoY",
    color: "#f43f5e", // Rose
    description: "Laju perubahan Indeks Harga Konsumen tahunan yang dirilis Badan Pusat Statistik (BPS).",
    impactNote: "Inflasi yang terkendali dalam rentang target BI (2.5% ± 1%) menjaga daya beli domestik dan premi risiko aset Rupiah.",
  },
  reserve: {
    key: "reserve",
    name: "Cadangan Devisa RI (Foreign Reserves)",
    shortName: "Cadangan Devisa",
    unit: "Juta USD",
    color: "#a855f7", // Purple
    description: "Total aset cadangan devisa resmi luar negeri yang dikelola Bank Indonesia.",
    impactNote: "Fondasi amunisi Bank Indonesia untuk melakukan intervensi stabilisasi pasar spot, DNDF, dan pasar SBN sekunder.",
  },
};

export const MacroDriversView: React.FC<MacroDriversViewProps> = () => {
  const [selectedVariable, setSelectedVariable] = useState<MacroVariableKey>("dxy");
  const [timeRange, setTimeRange] = useState<"ALL" | "10Y" | "5Y">("ALL");
  const [copied, setCopied] = useState(false);

  // Auto-Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customFredKey, setCustomFredKey] = useState("");

  // Auto-Refresh Engine
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState<number>(300); // 5 minutes default
  const [secondsUntilNextSync, setSecondsUntilNextSync] = useState<number>(300);

  // Live indicators state (initialized from localStorage cache for 0ms delay)
  const [liveIndicators, setLiveIndicators] = useState<MacroSyncResult | null>(() => getCachedMacroIndicators());

  // Edit form state
  const [editValues, setEditValues] = useState<{
    usdIdr: string;
    biRate: string;
    fedFunds: string;
    dxy: string;
    brent: string;
    neraca: string;
    inflasi: string;
    reserve: string;
  }>({
    usdIdr: "17705",
    biRate: "5.75",
    fedFunds: "3.63",
    dxy: "118.90",
    brent: "84.49",
    neraca: "-450.5",
    inflasi: "3.34",
    reserve: "145.6",
  });

  const correlations = useMemo(() => getComputedMacroCorrelations(), []);

  // Filter dataset by selected time range
  const filteredData = useMemo(() => {
    if (timeRange === "5Y") {
      return macroHistoricalDataset.filter((d) => d.date >= "2021-01-01");
    }
    if (timeRange === "10Y") {
      return macroHistoricalDataset.filter((d) => d.date >= "2016-01-01");
    }
    return macroHistoricalDataset;
  }, [timeRange]);

  const baselineLatest = useMemo(() => {
    return macroHistoricalDataset[macroHistoricalDataset.length - 1];
  }, []);

  const prevReading = useMemo(() => {
    return macroHistoricalDataset[macroHistoricalDataset.length - 2] || baselineLatest;
  }, [baselineLatest]);

  // Current active readings (live if synced, otherwise baseline)
  const currentReadings = useMemo(() => {
    if (liveIndicators) {
      return {
        usdIdr: liveIndicators.usdIdr,
        biRate: liveIndicators.biRate,
        fedFunds: liveIndicators.fedFunds,
        dxy: liveIndicators.dxy,
        brent: liveIndicators.brent,
        neraca: liveIndicators.neraca,
        inflasi: liveIndicators.inflasi,
        reserve: liveIndicators.reserve,
        sources: liveIndicators.sources,
      };
    }
    return {
      usdIdr: baselineLatest.usdIdr,
      biRate: baselineLatest.biRate,
      fedFunds: baselineLatest.fedFunds,
      dxy: baselineLatest.dxy,
      brent: baselineLatest.brent,
      neraca: baselineLatest.neraca,
      inflasi: baselineLatest.inflasi,
      reserve: baselineLatest.reserve || 145600,
      sources: {
        usdIdr: "Frankfurter API / JISDOR",
        biRate: "Bank Indonesia RDG",
        fedFunds: "Federal Reserve Board",
        dxy: "ICE Dollar Index",
        brent: "EIA Crude Benchmark",
        neraca: "Badan Pusat Statistik (BPS)",
        inflasi: "Badan Pusat Statistik (BPS)",
        reserve: "Bank Indonesia (Rilis Resmi: $145.6 Miliar)",
      },
    };
  }, [liveIndicators, baselineLatest]);

  const formatReserveDisplay = (resVal: number) => {
    if (!resVal) return "$145.6 Miliar";
    if (resVal > 1000) return `${(resVal / 1000).toFixed(1)} Miliar`;
    return `${resVal.toFixed(1)} Miliar`;
  };

  const handleOpenEditModal = () => {
    setEditValues({
      usdIdr: currentReadings.usdIdr.toString(),
      biRate: currentReadings.biRate.toString(),
      fedFunds: currentReadings.fedFunds.toString(),
      dxy: currentReadings.dxy.toString(),
      brent: currentReadings.brent.toString(),
      neraca: currentReadings.neraca.toString(),
      inflasi: currentReadings.inflasi.toString(),
      reserve: (currentReadings.reserve > 1000 ? currentReadings.reserve / 1000 : currentReadings.reserve).toFixed(1),
    });
    setShowEditModal(true);
  };

  const handleSaveEditValues = () => {
    const parsedReserve = parseFloat(editValues.reserve) || 145.6;
    const reserveInMillions = parsedReserve < 1000 ? parsedReserve * 1000 : parsedReserve;

    const newObj: MacroSyncResult = {
      usdIdr: parseFloat(editValues.usdIdr) || 17705,
      usdIdrDate: new Date().toISOString().split("T")[0],
      biRate: parseFloat(editValues.biRate) || 5.75,
      fedFunds: parseFloat(editValues.fedFunds) || 3.63,
      dxy: parseFloat(editValues.dxy) || 118.9,
      brent: parseFloat(editValues.brent) || 84.49,
      neraca: parseFloat(editValues.neraca) || -450.5,
      inflasi: parseFloat(editValues.inflasi) || 3.34,
      reserve: reserveInMillions,
      sources: {
        usdIdr: "User Verified",
        biRate: "User Verified",
        fedFunds: "User Verified",
        dxy: "User Verified",
        brent: "User Verified",
        neraca: "User Verified",
        inflasi: "User Verified",
        reserve: "Bank Indonesia (Rilis Resmi: $145.6 Miliar)",
      },
      hasFredKey: Boolean(customFredKey),
      lastSyncTimestamp: new Date().toISOString(),
    };

    setLiveIndicators(newObj);
    setShowEditModal(false);
    setSyncStatus({
      type: "success",
      message: "Data faktor makroekonomi berhasil diperbarui dan diselaraskan ke dashboard!",
    });
  };

  const activeConfig = VARIABLE_CONFIGS[selectedVariable];

  // Auto-sync handler
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchLatestMacroIndicators(customFredKey || undefined, true);
      if (res.success && res.data) {
        setLiveIndicators(res.data);
        setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSecondsUntilNextSync(syncIntervalSeconds);
        setSyncStatus({
          type: "success",
          message: res.message || "Data makroekonomi berhasil disinkronkan secara real-time!",
        });
      } else {
        setSyncStatus({
          type: "error",
          message: res.message || "Gagal menyinkronkan data makroekonomi",
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Gagal terhubung ke gateway API makro",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Background Auto-Sync Timer Countdown
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilNextSync((prev) => {
        if (prev <= 1) {
          handleTriggerSync();
          return syncIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalSeconds]);

  // Initial auto sync on component mount
  useEffect(() => {
    handleTriggerSync();
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(rawMacroCsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([rawMacroCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "macroeconomic_factors_2009_2026.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="macro-drivers-view" className="space-y-6">
      {/* Auto-Sync & Gateway Toolbar */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-slate-900/95 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Sinkronisasi Otomatis Feed Makroekonomi & Kurs
              </h2>
              {autoSyncEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Aktif ({formatCountdown(secondsUntilNextSync)})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                  Auto-Sync Dijeda
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Gateway otomatis menarik kurs spot live, DXY, Brent crude, dan kalibrasi indikator moneter (BI-Rate, Fed Funds, BPS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Sync Toggle Switch */}
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                autoSyncEnabled
                  ? "bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title="Aktifkan atau jeda pembaruan otomatis berkala"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoSyncEnabled ? "text-emerald-400" : "text-slate-400"}`} />
              <span>Auto-Sync: {autoSyncEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Interval Selector */}
            <select
              value={syncIntervalSeconds}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSyncIntervalSeconds(val);
                setSecondsUntilNextSync(val);
              }}
              aria-label="Pilih Interval Sinkronisasi Otomatis"
              className="bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value={60}>Setiap 1 Menit (High-Freq)</option>
              <option value={300}>Setiap 5 Menit (Optimal)</option>
              <option value={900}>Setiap 15 Menit</option>
              <option value={3600}>Setiap 1 Jam</option>
            </select>

            <button
              onClick={handleOpenEditModal}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Kustomisasi & Verifikasi Angka Makro Terkini"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Nilai</span>
            </button>

            <button
              onClick={() => setShowApiModal(true)}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Pengaturan API Feed (FRED / BPS / EIA)"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Kunci FRED</span>
              {customFredKey && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div
            className={`mt-3.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition animate-fadeIn ${
              syncStatus.type === "success"
                ? "bg-emerald-950/70 border-emerald-800/80 text-emerald-200"
                : "bg-rose-950/70 border-rose-800/80 text-rose-200"
            }`}
          >
            {syncStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span>{syncStatus.message}</span>
              {lastSyncTime && (
                <span className="text-[11px] opacity-80 font-mono">
                  Waktu Terakhir: {lastSyncTime} {autoSyncEnabled ? `(Berikutnya dalam ${formatCountdown(secondsUntilNextSync)})` : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* API Setup Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Integrasi API Feed Makroekonomi Eksternal
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Konfigurasikan kunci API resmi untuk pembaruan data otomatis langsung dari sumbernya.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Frankfurter Info */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Frankfurter API (Kurs USD/IDR Live)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Aktif (Tanpa API Key)
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Menyediakan data kurs nilai tukar valuta asing resmi Bank Sentral Eropa (ECB) secara gratis dan real-time.
                </p>
              </div>

              {/* FRED API Input */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    St. Louis Fed (FRED API)
                  </span>
                  <a
                    href="https://fred.stlouisfed.org/docs/api/api_key.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    Dapatkan Kunci Gratis <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Sumber resmi data Fed Funds Rate (`FEDFUNDS`), US Dollar Index (`DTWEXBGS`), Suku Bunga Kebijakan BI (`INTDSRIDM`), dan Cadangan Devisa.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    FRED API Key (Opsional)
                  </label>
                  <input
                    type="password"
                    value={customFredKey}
                    onChange={(e) => setCustomFredKey(e.target.value)}
                    placeholder="Contoh: abc123def456..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* BPS & EIA Info */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    BPS & EIA Open Data Feeds
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    Kalibrasi Otomatis
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Data inflasi IHK, neraca perdagangan bulanan, dan harga minyak mentah Brent disinkronkan secara konsisten melalui pipeline server.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowApiModal(false);
                  handleTriggerSync();
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3 h-3" />
                Simpan & Uji Sinkronisasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Verified Macro Value Customizer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Verifikasi & Kustomisasi Angka Makroekonomi Terkini
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sesuaikan atau perbarui langsung angka indikator makroekonomi (Bank Indonesia, The Fed, BPS).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Cadangan Devisa */}
              <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-purple-300">
                  Cadangan Devisa RI (Miliar USD)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editValues.reserve}
                    onChange={(e) => setEditValues({ ...editValues, reserve: e.target.value })}
                    placeholder="145.6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-slate-400 text-[10px] whitespace-nowrap">Miliar</span>
                </div>
                <p className="text-[10px] text-slate-400">Posisi Resmi BI: ~145,6 Miliar USD</p>
              </div>

              {/* BI-Rate */}
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-emerald-300">
                  BI-Rate Suku Bunga (% p.a.)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.25"
                    value={editValues.biRate}
                    onChange={(e) => setEditValues({ ...editValues, biRate: e.target.value })}
                    placeholder="5.75"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Rapat Dewan Gubernur Bank Indonesia</p>
              </div>

              {/* US Fed Funds Rate */}
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-amber-300">
                  US Fed Funds Rate (% p.a.)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.25"
                    value={editValues.fedFunds}
                    onChange={(e) => setEditValues({ ...editValues, fedFunds: e.target.value })}
                    placeholder="3.63"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Target Range Suku Bunga The Fed AS</p>
              </div>

              {/* DXY */}
              <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-indigo-300">
                  US Dollar Index (DXY)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editValues.dxy}
                  onChange={(e) => setEditValues({ ...editValues, dxy: e.target.value })}
                  placeholder="118.90"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400">Indeks Kekuatan Dolar ICE</p>
              </div>

              {/* Brent Oil */}
              <div className="p-2.5 rounded-xl bg-pink-950/20 border border-pink-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-pink-300">
                  Minyak Mentah Brent (USD/Bbl)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editValues.brent}
                    onChange={(e) => setEditValues({ ...editValues, brent: e.target.value })}
                    placeholder="84.49"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Harga Spot Minyak Acuan Dunia</p>
              </div>

              {/* Inflasi BPS */}
              <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                <label className="block text-[11px] font-bold text-rose-300">
                  Tingkat Inflasi RI (% YoY)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={editValues.inflasi}
                    onChange={(e) => setEditValues({ ...editValues, inflasi: e.target.value })}
                    placeholder="3.34"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Rilis Resmi Indeks IHK BPS</p>
              </div>

              {/* Neraca Dagang */}
              <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-cyan-300">
                  Neraca Perdagangan (Juta USD)
                </label>
                <input
                  type="number"
                  step="1"
                  value={editValues.neraca}
                  onChange={(e) => setEditValues({ ...editValues, neraca: e.target.value })}
                  placeholder="-450.5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400">Surplus (+) / Defisit (-) Perdagangan Bulanan BPS</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditValues}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan Angka Terkini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8-Card Macroeconomic Scorecard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* USD/IDR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">USD/IDR Spot</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">Live Feed</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            Rp {currentReadings.usdIdr ? currentReadings.usdIdr.toLocaleString("id-ID") : "17.917"}
          </div>
          <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            +{(currentReadings.usdIdr - prevReading.usdIdr).toLocaleString("id-ID")} IDR (MoM)
          </div>
        </div>

        {/* DXY */}
        <div
          onClick={() => setSelectedVariable("dxy")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "dxy"
              ? "border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-indigo-300">US Dollar Index (DXY)</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">r = +{correlations.dxy}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{currentReadings.dxy.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.dxy || "ICE Index"}</div>
        </div>

        {/* BI-Rate */}
        <div
          onClick={() => setSelectedVariable("biRate")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "biRate"
              ? "border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-emerald-300">BI-Rate</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono">r = {correlations.biRate}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{currentReadings.biRate.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.biRate || "Bank Indonesia"}</div>
        </div>

        {/* Fed Funds Rate */}
        <div
          onClick={() => setSelectedVariable("fedFunds")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "fedFunds"
              ? "border-amber-500 bg-amber-950/20 shadow-md shadow-amber-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">US Fed Funds</span>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-mono">r = +{correlations.fedFunds}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{currentReadings.fedFunds.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.fedFunds || "The Fed"}</div>
        </div>

        {/* Brent Crude */}
        <div
          onClick={() => setSelectedVariable("brent")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "brent"
              ? "border-pink-500 bg-pink-950/20 shadow-md shadow-pink-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-pink-300">Minyak Mentah Brent</span>
            <span className="text-[10px] bg-pink-950 text-pink-300 px-1.5 py-0.5 rounded font-mono">r = {correlations.brent}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">${currentReadings.brent.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.brent || "EIA Benchmark"}</div>
        </div>

        {/* Neraca Dagang */}
        <div
          onClick={() => setSelectedVariable("neraca")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "neraca"
              ? "border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cyan-300">Neraca Perdagangan</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-mono">r = {correlations.neraca}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {currentReadings.neraca >= 0 ? `+$${currentReadings.neraca.toLocaleString("id-ID")}` : `-$${Math.abs(currentReadings.neraca).toLocaleString("id-ID")}`} M
          </div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.neraca || "BPS Rilis"}</div>
        </div>

        {/* Inflasi */}
        <div
          onClick={() => setSelectedVariable("inflasi")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "inflasi"
              ? "border-rose-500 bg-rose-950/20 shadow-md shadow-rose-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-rose-300">Tingkat Inflasi RI</span>
            <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded font-mono">r = {correlations.inflasi}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{currentReadings.inflasi.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.inflasi || "BPS IHK"}</div>
        </div>

        {/* Cadangan Devisa */}
        <div
          onClick={() => setSelectedVariable("reserve")}
          className={`cursor-pointer bg-slate-900/90 border rounded-xl p-3.5 space-y-1 transition ${
            selectedVariable === "reserve"
              ? "border-purple-500 bg-purple-950/20 shadow-md shadow-purple-950/40"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-purple-300">Cadangan Devisa</span>
            <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded font-mono">r = +{correlations.reserve}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatReserveDisplay(currentReadings.reserve)}
          </div>
          <div className="text-[11px] text-slate-400">{currentReadings.sources.reserve || "Bank Indonesia (Rilis: $145.6 Miliar)"}</div>
        </div>
      </div>

      {/* Main Dual-Axis Interactive Historical Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Dinamika Historis: USD/IDR vs {activeConfig.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik sumbu ganda (Dual Y-Axis) membandingkan kurs USD/IDR (Sumbu Kiri) dan variabel makroekonomi {activeConfig.shortName} (Sumbu Kanan).
            </p>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setTimeRange("ALL")}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                timeRange === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua (2009–2026)
            </button>
            <button
              onClick={() => setTimeRange("10Y")}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                timeRange === "10Y"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              10 Tahun Terakhir
            </button>
            <button
              onClick={() => setTimeRange("5Y")}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                timeRange === "5Y"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              5 Tahun Terakhir
            </button>
          </div>
        </div>

        {/* Variable Selector Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
          {(Object.keys(VARIABLE_CONFIGS) as MacroVariableKey[]).map((k) => {
            const cfg = VARIABLE_CONFIGS[k];
            const isSelected = selectedVariable === k;
            return (
              <button
                key={k}
                onClick={() => setSelectedVariable(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                {cfg.shortName}
              </button>
            );
          })}
        </div>

        {/* Chart Stage */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="usdIdrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(0, 7)}
                minTickGap={30}
              />
              <YAxis
                yAxisId="left"
                stroke="#818cf8"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                label={{
                  value: "USD/IDR (Rp)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#818cf8",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={activeConfig.color}
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => val.toLocaleString("id-ID")}
                label={{
                  value: `${activeConfig.shortName} (${activeConfig.unit})`,
                  angle: 90,
                  position: "insideRight",
                  fill: activeConfig.color,
                  fontSize: 11,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0]?.payload;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 text-xs shadow-2xl backdrop-blur-md space-y-1.5">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                          <span>Periode: {label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">BPS & BI Data</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-indigo-300 font-semibold">
                          <span>USD/IDR:</span>
                          <span className="font-mono font-bold">
                            Rp {row?.usdIdr ? row.usdIdr.toLocaleString("id-ID") : "-"}
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between gap-4 font-semibold"
                          style={{ color: activeConfig.color }}
                        >
                          <span>{activeConfig.name}:</span>
                          <span className="font-mono font-bold">
                            {row?.[selectedVariable] !== undefined
                              ? `${row[selectedVariable].toLocaleString("id-ID")} ${activeConfig.unit}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="usdIdr"
                name="USD/IDR Kurs"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#usdIdrGrad)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={selectedVariable}
                name={`${activeConfig.shortName} (${activeConfig.unit})`}
                stroke={activeConfig.color}
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Variable Econometric Note */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white">
              Analisis Ekonometrika: Hubungan {activeConfig.name} terhadap Kurs Rupiah
            </div>
            <p className="text-slate-300 leading-relaxed">
              {activeConfig.description} {activeConfig.impactNote}
            </p>
          </div>
        </div>
      </div>

      {/* Econometric Correlation Matrix Table (Computed from 2009-2026) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Matriks Korelasi Pearson Empiris (2009 – 2026)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Koefisien korelasi linier Pearson (r) dihitung langsung dari 210 titik data time-series terhadap nilai tukar USD/IDR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCsv}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Tersalin!" : "Salin CSV"}
            </button>
            <button
              onClick={handleDownloadCsv}
              className="py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Variabel Makroekonomi</th>
                <th className="py-2.5 px-3">Simbol</th>
                <th className="py-2.5 px-3 font-mono">Koefisien Korelasi (r)</th>
                <th className="py-2.5 px-3">Kekuatan Hubungan</th>
                <th className="py-2.5 px-3">Dampak terhadap Rupiah</th>
                <th className="py-2.5 px-3">Nilai Terkini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">US Dollar Index</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400">DXY</td>
                <td className="py-2.5 px-3 font-mono font-bold text-rose-400">+{correlations.dxy}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/50 text-[10px] font-bold">
                    Sangat Kuat (+)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Melemahkan IDR (Pelemahan sistemik)</td>
                <td className="py-2.5 px-3 font-mono text-white">{currentReadings.dxy.toFixed(2)}</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">Cadangan Devisa RI</td>
                <td className="py-2.5 px-3 font-mono text-purple-400">RESERVE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">+{correlations.reserve}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 text-[10px] font-bold">
                    Sangat Kuat (+)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Tumbuh seiring skala ekonomi & intervensi</td>
                <td className="py-2.5 px-3 font-mono text-white">{formatReserveDisplay(currentReadings.reserve)}</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">US Fed Funds Rate</td>
                <td className="py-2.5 px-3 font-mono text-amber-400">FEDFUNDS</td>
                <td className="py-2.5 px-3 font-mono font-bold text-rose-400">+{correlations.fedFunds}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/50 text-[10px] font-bold">
                    Kuat (+)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Kenaikan suku bunga AS menekan IDR</td>
                <td className="py-2.5 px-3 font-mono text-white">{currentReadings.fedFunds.toFixed(2)}%</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">BI-Rate (Suku Bunga BI)</td>
                <td className="py-2.5 px-3 font-mono text-emerald-400">BIRATE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{correlations.biRate}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold">
                    Moderat (-)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Kenaikan suku bunga BI menopang IDR</td>
                <td className="py-2.5 px-3 font-mono text-white">{currentReadings.biRate.toFixed(2)}%</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">Neraca Perdagangan</td>
                <td className="py-2.5 px-3 font-mono text-cyan-400">NERACA</td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{correlations.neraca}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 text-[10px] font-bold">
                    Negatif (-)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Surplus perdagangan menyuplai devisa IDR</td>
                <td className="py-2.5 px-3 font-mono text-white">
                  {currentReadings.neraca >= 0 ? `+$${currentReadings.neraca.toFixed(1)}M` : `-$${Math.abs(currentReadings.neraca).toFixed(1)}M`}
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">Harga Minyak Brent</td>
                <td className="py-2.5 px-3 font-mono text-pink-400">BRENT</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{correlations.brent}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    Rendah
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Dipengaruhi siklus komoditas global</td>
                <td className="py-2.5 px-3 font-mono text-white">${currentReadings.brent.toFixed(2)}</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 font-bold text-white">Inflasi Tahunan (YoY)</td>
                <td className="py-2.5 px-3 font-mono text-rose-400">INFLASI</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{correlations.inflasi}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold">
                    Negatif (-)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">Tren disinflasi jangka panjang</td>
                <td className="py-2.5 px-3 font-mono text-white">{currentReadings.inflasi.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
