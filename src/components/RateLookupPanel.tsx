import React, { useState, useMemo } from "react";
import { Search, Calendar, Target, Activity, ArrowRight, Info } from "lucide-react";
import { ForexDataPoint } from "../types";
import { useTheme } from "../context/ThemeContext";

interface RateLookupPanelProps {
  data: ForexDataPoint[];
  selectedModelName: string;
}

export const RateLookupPanel: React.FC<RateLookupPanelProps> = ({ data, selectedModelName }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  
  const [searchDate, setSearchDate] = useState<string>("");

  const result = useMemo(() => {
    if (!searchDate) return null;
    return data.find((d) => d.date === searchDate) || null;
  }, [data, searchDate]);

  return (
    <div className={`rounded-2xl p-5 shadow-sm transition-colors ${isLight ? "bg-white" : "bg-slate-900/90"}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
            <Search className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
            Pencarian Spesifik Tanggal
          </h3>
          <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Pilih tanggal untuk melihat nilai kurs aktual dan hasil prediksi pada hari tersebut secara rinci.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Calendar className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className={`pl-9 pr-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isLight 
                  ? "bg-slate-50 border-slate-300 text-slate-900" 
                  : "bg-slate-950 border-slate-700 text-slate-200"
              }`}
            />
          </div>
        </div>
      </div>

      {searchDate && (
        <div className={`mt-4 pt-4 border-t ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          {result ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Aktual */}
              <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/50 border-slate-800"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className={`w-4 h-4 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>Kurs Aktual</span>
                </div>
                {result.actual ? (
                  <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-white"}`}>
                    Rp {result.actual.toLocaleString("id-ID")}
                  </div>
                ) : (
                  <div className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    Belum ada data aktual
                  </div>
                )}
              </div>

              {/* Prediksi */}
              <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/50 border-slate-800"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>Prediksi Model</span>
                </div>
                {result.forecast ? (
                  <div>
                    <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-white"}`}>
                      Rp {Math.round(result.forecast).toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[10px] mt-1 truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Model: {selectedModelName}
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    Tidak ada prediksi
                  </div>
                )}
              </div>

              {/* Selisih */}
              <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/50 border-slate-800"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowRight className={`w-4 h-4 ${isLight ? "text-amber-600" : "text-amber-400"}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>Selisih (Error)</span>
                </div>
                {result.actual && result.forecast ? (
                  <div>
                    <div className={`text-xl font-bold font-mono ${isLight ? "text-slate-900" : "text-white"}`}>
                      Rp {Math.abs(Math.round(result.forecast) - result.actual).toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Deviasi: {Math.abs(((result.actual - result.forecast) / result.actual) * 100).toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm italic ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    -
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-6 text-center flex flex-col items-center justify-center border rounded-xl border-dashed ${
              isLight ? "bg-slate-50 border-slate-300 text-slate-500" : "bg-slate-950/50 border-slate-800 text-slate-400"
            }`}>
              <Info className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-sm font-medium">Data tidak ditemukan untuk tanggal {searchDate}</p>
              <p className="text-xs mt-1 opacity-75">Pastikan Anda memilih hari kerja (bukan akhir pekan/libur) dalam rentang data yang tersedia.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
