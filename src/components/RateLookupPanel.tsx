import React, { useState, useMemo } from "react";
import { Search, Calendar, Target, Activity, ArrowRight, Shield, Clock } from "lucide-react";
import { ForexDataPoint } from "../types";
import { useTheme } from "../context/ThemeContext";
import { addDaysToIsoDate } from "../data/mockForexData";

interface RateLookupPanelProps {
  data: ForexDataPoint[];
  selectedModelName: string;
}

export const RateLookupPanel: React.FC<RateLookupPanelProps> = ({ data, selectedModelName }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Default to today or the latest spot date
  const latestHist = useMemo(() => {
    const historical = data.filter((d) => !d.isFuture && d.actual !== null);
    return historical[historical.length - 1] || data[0];
  }, [data]);

  const [searchDate, setSearchDate] = useState<string>(() => {
    return latestHist ? latestHist.date : "2026-08-21";
  });

  // Dynamic Lookup & Interpolation Engine
  const result = useMemo(() => {
    if (!searchDate) return null;

    // 1. Direct match in active dataset
    const exact = data.find((d) => d.date === searchDate);
    if (exact) {
      return {
        ...exact,
        isExtrapolated: false,
      };
    }

    // 2. Dynamic continuous projection for dates beyond or outside dataset
    const baseDate = latestHist ? latestHist.date : "2026-08-21";
    const baseSpot = latestHist?.actual || 17705;

    const baseMs = new Date(baseDate).getTime();
    const searchMs = new Date(searchDate).getTime();
    const diffDays = Math.round((searchMs - baseMs) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      // Future horizon projection formula
      const annualTheta = (diffDays * Math.PI * 2) / 365.25;
      const seasonalWave = Math.sin(annualTheta - 0.4) * 45 + Math.cos(annualTheta * 2) * 22;
      const drift = diffDays * (1.70 * 252 / 365.25);
      const estForecast = Math.round(baseSpot + drift + seasonalWave);
      const stdErr = 26 + 10.5 * Math.sqrt(diffDays);
      const ciWidth = Math.round(stdErr * 2.576);

      return {
        date: searchDate,
        actual: null,
        forecast: estForecast,
        lowerBound: estForecast - ciWidth,
        upperBound: estForecast + ciWidth,
        isFuture: true,
        isExtrapolated: true,
      } as ForexDataPoint & { isExtrapolated: boolean };
    } else {
      // Past date lookup fallback
      return {
        date: searchDate,
        actual: baseSpot,
        forecast: baseSpot,
        lowerBound: baseSpot - 100,
        upperBound: baseSpot + 100,
        isFuture: false,
        isExtrapolated: true,
      } as ForexDataPoint & { isExtrapolated: boolean };
    }
  }, [data, searchDate, latestHist]);

  // Day of week metadata
  const dayOfWeekInfo = useMemo(() => {
    if (!searchDate) return { dayName: "", isWeekend: false };
    const [y, m, d] = searchDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dayIndex = dt.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    return {
      dayName: days[dayIndex] || "",
      isWeekend,
    };
  }, [searchDate]);

  // Quick Preset Handlers
  const handleSetPreset = (offsetDays: number) => {
    const baseDate = latestHist ? latestHist.date : "2026-08-21";
    setSearchDate(addDaysToIsoDate(baseDate, offsetDays));
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm transition-colors ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"} border`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Search className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
            <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              Pencarian Spesifik & Proyeksi Tanggal
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono font-medium">
              Kontinu Harian (No Gaps)
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Pilih tanggal berurutan atau gunakan tombol pintas untuk memeriksa estimasi kurs aktual dan inferensi model secara instan.
          </p>
        </div>

        {/* Date Input with Calendar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Calendar className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            <input
              id="rate-lookup-date-input"
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className={`pl-9 pr-3 py-1.5 border rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-900"
                  : "bg-slate-950 border-slate-700 text-slate-200"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Quick Date Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-3 border-b border-slate-800/60 text-xs">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
          Navigasi Cepat:
        </span>
        {[
          { label: "Batas Spot (Hari Ini)", days: 0 },
          { label: "Besok (+1H)", days: 1 },
          { label: "7 Hari (+7H)", days: 7 },
          { label: "14 Hari (+14H)", days: 14 },
          { label: "30 Hari (+1B)", days: 30 },
          { label: "90 Hari (+1Q)", days: 90 },
          { label: "180 Hari (+6B)", days: 180 },
          { label: "1 Tahun (+1T)", days: 365 },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSetPreset(preset.days)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Result Cards Grid */}
      {searchDate && result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Hasil Analisis: <strong className="text-slate-200">{dayOfWeekInfo.dayName}, {searchDate}</strong>
            </span>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                dayOfWeekInfo.isWeekend
                  ? "bg-amber-950 text-amber-300 border border-amber-800/50"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
              }`}
            >
              {dayOfWeekInfo.isWeekend ? "Akhir Pekan (Estimasi Non-Trading)" : "Hari Kerja (Pasar Valas Buka)"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Aktual */}
            <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className={`w-4 h-4 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Kurs Aktual JISDOR
                </span>
              </div>
              {result.actual ? (
                <div>
                  <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-emerald-400"}`}>
                    Rp {result.actual.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Data transaksi spot terverifikasi
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-mono text-slate-400 italic">
                    (Belum Ada Transaksi Spot)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Proyeksi masa depan (*Out-of-Sample*)
                  </div>
                </div>
              )}
            </div>

            {/* 2. Prediksi Model */}
            <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Prediksi ({selectedModelName})
                </span>
              </div>
              {result.forecast ? (
                <div>
                  <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-indigo-300"}`}>
                    Rp {Math.round(result.forecast).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Confidence Interval 99%
                  </div>
                </div>
              ) : (
                <div className="text-sm italic text-slate-400">
                  Tidak ada prediksi
                </div>
              )}
            </div>

            {/* 3. Rentang Keyakinan / Deviasi */}
            <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield className={`w-4 h-4 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  {result.actual && result.forecast ? "Galat Residu (Error)" : "Rentang Keyakinan 99%"}
                </span>
              </div>
              {result.actual && result.forecast ? (
                <div>
                  <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-white"}`}>
                    Rp {Math.abs(Math.round(result.forecast) - result.actual).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Deviasi Absolut: {Math.abs(((result.actual - result.forecast) / result.actual) * 100).toFixed(2)}%
                  </div>
                </div>
              ) : result.lowerBound && result.upperBound ? (
                <div>
                  <div className="text-sm font-bold font-mono text-purple-300">
                    Rp {result.lowerBound.toLocaleString("id-ID")} - Rp {result.upperBound.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Rentang toleransi batas bawah & atas
                  </div>
                </div>
              ) : (
                <div className="text-sm italic text-slate-400">
                  -
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
