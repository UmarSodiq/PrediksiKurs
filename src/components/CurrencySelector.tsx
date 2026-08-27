import React, { useState, useRef, useEffect } from "react";
import { CurrencyCode, CurrencyProfile } from "../types";
import { currencyProfiles } from "../data/mockForexData";
import { ChevronDown, Check, Coins, Sparkles, Building2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  currentSpot: number;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onSelectCurrency,
  currentSpot,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = currencyProfiles.find((c) => c.code === selectedCurrency) || currencyProfiles[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 shadow-sm ${
          isLight
            ? "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-indigo-400"
            : "bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700/80 hover:border-indigo-500/50"
        }`}
        title="Pilih Mata Uang Valas Strategis"
      >
        <span className="text-base leading-none">{activeProfile.flag}</span>
        <div className="text-left">
          <div className="flex items-center gap-1">
            <span className="font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {activeProfile.code}/IDR
            </span>
            <span className="text-[10px] opacity-75 font-normal">
              ({activeProfile.symbol})
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 p-2 animate-fadeIn ${
            isLight
              ? "bg-white border-slate-200 shadow-slate-300/50"
              : "bg-slate-900 border-slate-700 shadow-black/80"
          }`}
        >
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Coins className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pilih Pasangan Valas Strategis</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              5 Mata Uang
            </span>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
            {currencyProfiles.map((item) => {
              const isSelected = item.code === selectedCurrency;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onSelectCurrency(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 ${
                    isSelected
                      ? isLight
                        ? "bg-indigo-50/80 border border-indigo-200 text-indigo-950"
                        : "bg-indigo-950/60 border border-indigo-500/40 text-white"
                      : isLight
                      ? "hover:bg-slate-100 text-slate-700"
                      : "hover:bg-slate-800/80 text-slate-300"
                  }`}
                >
                  <span className="text-2xl mt-0.5 shrink-0">{item.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">
                          {item.code}/IDR
                        </span>
                        <span className="text-[10px] opacity-70">
                          {item.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.code === "JPY"
                          ? `Rp ${item.baseRate.toFixed(2)}`
                          : `Rp ${item.baseRate.toLocaleString("id-ID")}`}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        Spread: ±Rp {item.spreadMargin}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{item.peruriContext}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 mt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Seluruh model & grafik menyesuaikan skala harga otomatis.</span>
          </div>
        </div>
      )}
    </div>
  );
};
