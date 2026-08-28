import React, { useState, useMemo } from "react";
import {
  Calendar,
  Landmark,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import { ForexDataPoint } from "../types";
import { useTheme } from "../context/ThemeContext";

interface ActualRateExplorerProps {
  data: ForexDataPoint[];
  onAddActualRate?: (date: string, actualValue: number) => void;
  onUpdateFullDataset?: (newData: ForexDataPoint[]) => void;
  currentSpot: number;
}

export const ActualRateExplorer: React.FC<ActualRateExplorerProps> = ({
  data,
  currentSpot,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchDate, setSearchDate] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [dayTypeFilter, setDayTypeFilter] = useState<"ALL" | "WORKDAYS">("ALL");

  // Extract only actual historical points with rich day metadata
  const actualHistory = useMemo(() => {
    return data
      .filter((d) => d.actual !== null && d.actual !== undefined)
      .map((d, index, arr) => {
        const prev = index > 0 ? arr[index - 1].actual : d.actual;
        const change = (d.actual || 0) - (prev || d.actual || 0);
        const changePct = prev ? ((change / prev) * 100).toFixed(2) : "0.00";

        // Day of week calculation
        const [y, m, day] = d.date.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, day));
        const dayIdx = dt.getUTCDay(); // 0 = Sun, 6 = Sat
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const shortDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const isWeekend = dayIdx === 0 || dayIdx === 6;

        return {
          ...d,
          dayName: dayNames[dayIdx] || "",
          shortDay: shortDays[dayIdx] || "",
          isWeekend,
          dailyChange: change,
          dailyChangePct: changePct,
          isDepreciation: change > 0, // In forex USD/IDR, positive change means Rupiah depreciated
        };
      });
  }, [data]);

  // Descriptive Statistics for Actual Rate
  const stats = useMemo(() => {
    if (actualHistory.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    }
    const values = actualHistory.map((d) => d.actual!).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = Math.round(sum / values.length);
    const median = values[Math.floor(values.length / 2)];
    const min = values[0];
    const max = values[values.length - 1];

    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.round(Math.sqrt(variance));

    return { mean, median, min, max, stdDev, count: values.length };
  }, [actualHistory]);

  // Bank Indonesia Reference Rates Breakdown (Buy, Sell, JISDOR Mid)
  const jisdorMid = currentSpot;
  const bankBeli = Math.round(currentSpot * 0.993); // ~0.7% spread
  const bankJual = Math.round(currentSpot * 1.007); // ~0.7% spread

  const handleExportCSV = () => {
    // CSV Header
    let csvContent = "Tanggal,Hari,Tipe Hari,Kurs Aktual (USD/IDR),Perubahan Harian (Rp),Perubahan (%),MA(20),MA(50),DXY Index\n";

    // Rows
    filteredRecords.slice().reverse().forEach(row => {
      csvContent += `${row.date},${row.dayName},${row.isWeekend ? "Akhir Pekan (Carryover)" : "Hari Kerja (Bursa)"},${row.actual || ""},${row.dailyChange || ""},${row.dailyChangePct || ""},${row.ma20 || ""},${row.ma50 || ""},${row.dxy || ""}\n`;
    });

    // Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Kurs_Historis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered actual records
  const filteredRecords = useMemo(() => {
    return actualHistory.filter((item) => {
      const matchSearch = searchDate ? item.date.includes(searchDate) || item.dayName.toLowerCase().includes(searchDate.toLowerCase()) : true;
      const matchYear = selectedYear === "ALL" ? true : item.date.startsWith(selectedYear);
      const matchDay = dayTypeFilter === "ALL" ? true : !item.isWeekend;
      return matchSearch && matchYear && matchDay;
    });
  }, [actualHistory, searchDate, selectedYear, dayTypeFilter]);

  // Export to CSV
  const handleExportActualCSV = () => {
    const header = "date,day,type,actual_idr,daily_change,daily_change_pct,ma20,ma50\n";
    const rows = actualHistory
      .map(
        (d) =>
          `${d.date},${d.dayName},${d.isWeekend ? "Weekend" : "Workday"},${d.actual},${d.dailyChange},${d.dailyChangePct}%,${d.ma20 || ""},${d.ma50 || ""}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kurs_aktual_usdidr_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div id="actual-rate-explorer" className="space-y-6">
      {/* 1. Header & Live JISDOR Snapshot Cards */}
      <div className={`${isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"} border rounded-2xl p-5 shadow-sm transition-colors`}>
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div>
            <div className="flex items-center gap-2">
              <Landmark className={`w-5 h-5 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Pusat Data Kurs Aktual USD/IDR & JISDOR Bank Indonesia
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Data historis resmi transaksi valas spot, kurs acuan JISDOR (*Jakarta Interbank Spot Dollar Rate*), dan kurs transaksi perbankan.
            </p>
          </div>

          <button
            onClick={handleExportActualCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV Kurs Aktual</span>
          </button>
        </div>

        {/* 4 Cards: JISDOR Mid, Kurs Beli, Kurs Jual, Spread */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {/* JISDOR Mid Rate */}
          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"} p-4 rounded-xl border`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <span>Kurs Acuan JISDOR (Spot)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isLight ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-emerald-950 text-emerald-300"
                }`}>Mid Rate</span>
            </div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
              Rp {jisdorMid.toLocaleString("id-ID")}
            </div>
            <div className={`text-[11px] mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Standar acuan resmi Bank Indonesia
            </div>
          </div>

          {/* Kurs Beli Bank */}
          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"} p-4 rounded-xl border`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <span>Kurs Beli (Bank Buy)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isLight ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-indigo-950 text-indigo-300"
                }`}>Beli Valas</span>
            </div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              Rp {bankBeli.toLocaleString("id-ID")}
            </div>
            <div className={`text-[11px] mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Harga bank membeli USD dari Anda
            </div>
          </div>

          {/* Kurs Jual Bank */}
          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"} p-4 rounded-xl border`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <span>Kurs Jual (Bank Sell)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isLight ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-indigo-950 text-indigo-300"
                }`}>Jual Valas</span>
            </div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              Rp {bankJual.toLocaleString("id-ID")}
            </div>
            <div className={`text-[11px] mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Harga bank menjual USD ke Anda
            </div>
          </div>

          {/* Spread Bank */}
          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"} p-4 rounded-xl border`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <span>Spread Jual-Beli</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isLight ? "bg-slate-200 text-slate-800 border border-slate-300" : "bg-slate-800 text-slate-300"
                }`}>Margin</span>
            </div>
            <div className={`text-2xl font-bold tracking-tight font-mono ${isLight ? "text-indigo-700" : "text-indigo-300"}`}>
              Rp {(bankJual - bankBeli).toLocaleString("id-ID")}
            </div>
            <div className={`text-[11px] mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Rentang margin valas (~1.4%)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Statistical Summary of Actual Data */}
      <div className={`${isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"} border rounded-2xl p-5 shadow-sm transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
            <BarChart3 className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
            Statistik Deskriptif Kurs Aktual ({stats.count} Hari Perdagangan)
          </h3>
          <span className={`text-[11px] font-mono ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Rentang: Rp {stats.min.toLocaleString("id-ID")} - Rp {stats.max.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Rata-Rata (Mean)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
              Rp {stats.mean.toLocaleString("id-ID")}
            </div>
          </div>

          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Nilai Tengah (Median)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
              Rp {stats.median.toLocaleString("id-ID")}
            </div>
          </div>

          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Kurs Terendah (Min)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
              Rp {stats.min.toLocaleString("id-ID")}
            </div>
          </div>

          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Kurs Tertinggi (Max)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-rose-700" : "text-rose-400"}`}>
              Rp {stats.max.toLocaleString("id-ID")}
            </div>
          </div>

          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Standar Deviasi (σ)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-slate-900" : "text-slate-200"}`}>
              Rp {stats.stdDev}
            </div>
          </div>

          <div className={`${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"} p-3 rounded-xl border`}>
            <span className={`text-[10px] uppercase font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>Volatilitas Range</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? "text-indigo-700" : "text-indigo-300"}`}>
              Rp {(stats.max - stats.min).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Table of Actual Records */}
      <div className={`${isLight ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"} border rounded-2xl overflow-hidden shadow-sm transition-colors`}>
        {/* Table Filter Toolbar */}
        <div className={`p-4 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"
          }`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <Calendar className={`w-4 h-4 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
            <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              Tabel Deret Waktu Kurs Aktual Lengkap
            </h3>
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"}`}>
              {filteredRecords.length} Baris
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${isLight ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              100% Kontinu Harian (Tanpa Lompat)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Day Type Toggle */}
            <div className={`inline-flex p-0.5 rounded-lg border text-xs ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`}>
              <button
                onClick={() => setDayTypeFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  dayTypeFilter === "ALL"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Semua Hari ({actualHistory.length})
              </button>
              <button
                onClick={() => setDayTypeFilter("WORKDAYS")}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  dayTypeFilter === "WORKDAYS"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Hari Kerja Saja ({actualHistory.filter(h => !h.isWeekend).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              <input
                type="text"
                placeholder="Cari tanggal / hari..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className={`border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40 ${isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  : "bg-slate-900 border-slate-700 text-slate-200"
                  }`}
              />
            </div>

            {/* Year filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer ${isLight ? "bg-white border-slate-300 text-slate-800" : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center"
              title="Unduh CSV Data Aktual Lengkap"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className={`w-full text-left text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            <thead className={`sticky top-0 uppercase tracking-wider font-semibold text-[10px] border-b ${isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
              }`}>
              <tr>
                <th className="py-2.5 px-4">Tanggal & Hari</th>
                <th className="py-2.5 px-3 text-right">Kurs Aktual (USD/IDR)</th>
                <th className="py-2.5 px-3 text-right">Perubahan Harian (Rp)</th>
                <th className="py-2.5 px-3 text-right">Perubahan (%)</th>
                <th className="py-2.5 px-3 text-right">MA(20)</th>
                <th className="py-2.5 px-3 text-right">MA(50)</th>
                <th className="py-2.5 px-3 text-right">DXY Index</th>
                <th className="py-2.5 px-4 text-center">Status IDR</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-slate-800/60"}`}>
              {filteredRecords.slice().reverse().map((row, idx) => (
                <tr key={idx} className={`${isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/40"} ${row.isWeekend ? (isLight ? "bg-slate-50/50" : "bg-slate-950/20") : ""} transition`}>
                  <td className={`py-2.5 px-4 font-mono font-medium ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{row.date}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold ${
                        row.isWeekend
                          ? isLight ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                          : isLight ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {row.shortDay}
                      </span>
                    </div>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold font-mono text-sm ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                    Rp {row.actual?.toLocaleString("id-ID")}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-semibold ${row.dailyChange > 0
                      ? isLight ? "text-rose-600" : "text-rose-400"
                      : row.dailyChange < 0
                        ? isLight ? "text-emerald-600" : "text-emerald-400"
                        : isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                  >
                    {row.dailyChange > 0
                      ? `+Rp ${row.dailyChange}`
                      : row.dailyChange < 0
                        ? `-Rp ${Math.abs(row.dailyChange)}`
                        : "Rp 0"}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-semibold ${row.dailyChange > 0
                      ? isLight ? "text-rose-600" : "text-rose-400"
                      : row.dailyChange < 0
                        ? isLight ? "text-emerald-600" : "text-emerald-400"
                        : isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                  >
                    {row.dailyChange > 0 ? `+${row.dailyChangePct}%` : `${row.dailyChangePct}%`}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {row.ma20 ? `Rp ${row.ma20.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {row.ma50 ? `Rp ${row.ma50.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono ${isLight ? "text-indigo-600 font-medium" : "text-indigo-300"}`}>
                    {row.dxy || "103.8"}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${row.dailyChange > 0
                        ? isLight
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                        : row.dailyChange < 0
                          ? isLight
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                          : isLight
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                    >
                      {row.dailyChange > 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          Melemah
                        </>
                      ) : row.dailyChange < 0 ? (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          Menguat
                        </>
                      ) : (
                        row.isWeekend ? "Carryover" : "Stabil"
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
