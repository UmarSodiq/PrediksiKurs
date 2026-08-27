import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";

interface TickerItem {
  id: string;
  pair: string;
  name: string;
  flag: string;
  rate: number;
  changePct: number;
  isCustomFormatted?: boolean;
  formattedRate?: string;
}

interface RunningForexTickerBarProps {
  usdIdrSpot?: number;
}

const INITIAL_TICKER_ITEMS: TickerItem[] = [
  {
    id: "USD",
    pair: "USD/IDR",
    name: "Dolar AS",
    flag: "🇺🇸",
    rate: 17705,
    changePct: 0.12,
  },
  {
    id: "EUR",
    pair: "EUR/IDR",
    name: "Euro Uni Eropa",
    flag: "🇪🇺",
    rate: 19340,
    changePct: -0.08,
  },
  {
    id: "JPY",
    pair: "JPY/IDR",
    name: "Yen Jepang",
    flag: "🇯🇵",
    rate: 118.5,
    changePct: 0.25,
  },
  {
    id: "SGD",
    pair: "SGD/IDR",
    name: "Dolar Singapura",
    flag: "🇸🇬",
    rate: 13520,
    changePct: 0.05,
  },
  {
    id: "CNY",
    pair: "CNY/IDR",
    name: "Yuan China (RMB)",
    flag: "🇨🇳",
    rate: 2475,
    changePct: -0.04,
  },
  {
    id: "GBP",
    pair: "GBP/IDR",
    name: "Poundsterling Inggris",
    flag: "🇬🇧",
    rate: 22840,
    changePct: 0.19,
  },
  {
    id: "AUD",
    pair: "AUD/IDR",
    name: "Dolar Australia",
    flag: "🇦🇺",
    rate: 11620,
    changePct: -0.15,
  },
  {
    id: "SAR",
    pair: "SAR/IDR",
    name: "Riyal Arab Saudi",
    flag: "🇸🇦",
    rate: 4720,
    changePct: 0.08,
  },
  {
    id: "MYR",
    pair: "MYR/IDR",
    name: "Ringgit Malaysia",
    flag: "🇲🇾",
    rate: 3980,
    changePct: 0.02,
  },
  {
    id: "DXY",
    pair: "DXY",
    name: "US Dollar Index",
    flag: "🌐",
    rate: 103.85,
    changePct: 0.14,
    isCustomFormatted: true,
    formattedRate: "103.85 pts",
  },
  {
    id: "BRENT",
    pair: "BRENT OIL",
    name: "Minyak Brent",
    flag: "🛢️",
    rate: 76.4,
    changePct: -0.45,
    isCustomFormatted: true,
    formattedRate: "$76.40/bbl",
  },
];

export const RunningForexTickerBar: React.FC<RunningForexTickerBarProps> = ({
  usdIdrSpot = 17705,
}) => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(INITIAL_TICKER_ITEMS);

  // Sync USD/IDR from prop whenever updated
  useEffect(() => {
    if (usdIdrSpot && usdIdrSpot > 0) {
      setTickerItems((prev) =>
        prev.map((item) => {
          if (item.id === "USD") {
            const diff = usdIdrSpot - 17700;
            const diffPct = Number(((diff / 17700) * 100).toFixed(2));
            return {
              ...item,
              rate: usdIdrSpot,
              changePct: diffPct,
            };
          }
          return item;
        })
      );
    }
  }, [usdIdrSpot]);

  // Periodic micro-tick simulation for other currency market changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerItems((prev) =>
        prev.map((item) => {
          if (item.id === "USD") return item; // USD handled by main spot sync
          const delta = (Math.random() - 0.49) * 0.02;
          const newChange = Number((item.changePct + delta).toFixed(2));
          let newRate = item.rate;

          if (item.id === "JPY") {
            newRate = Number((item.rate + (Math.random() - 0.5) * 0.05).toFixed(2));
          } else if (item.id === "DXY") {
            newRate = Number((item.rate + (Math.random() - 0.5) * 0.03).toFixed(2));
          } else if (item.id === "BRENT") {
            newRate = Number((item.rate + (Math.random() - 0.5) * 0.08).toFixed(2));
          } else {
            newRate = Math.round(item.rate + (Math.random() - 0.5) * 4);
          }

          let formattedRate = item.formattedRate;
          if (item.id === "DXY") {
            formattedRate = `${newRate.toFixed(2)} pts`;
          } else if (item.id === "BRENT") {
            formattedRate = `$${newRate.toFixed(2)}/bbl`;
          }

          return {
            ...item,
            rate: newRate,
            changePct: newChange,
            formattedRate,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const renderTickerList = (keyPrefix: string) => (
    <div className="flex items-center gap-6 sm:gap-8 shrink-0 pr-6 sm:pr-8">
      {tickerItems.map((item) => {
        const isUp = item.changePct >= 0;
        return (
          <div
            key={`${keyPrefix}-${item.id}`}
            className="flex items-center gap-2 text-xs shrink-0 select-none py-0.5"
          >
            {/* Flag & Pair */}
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span className="text-sm leading-none">{item.flag}</span>
              <span className="font-mono tracking-tight">{item.pair}</span>
            </div>

            {/* Rate Value */}
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {item.isCustomFormatted
                ? item.formattedRate
                : item.id === "JPY"
                ? `Rp ${item.rate.toFixed(2)}`
                : `Rp ${item.rate.toLocaleString("id-ID")}`}
            </span>

            {/* Change Percentage */}
            <span
              className={`flex items-center gap-0.5 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isUp
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                  : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50"
              }`}
            >
              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              <span>
                {isUp ? `+${item.changePct}%` : `${item.changePct}%`}
              </span>
            </span>

            {/* Divider Dot */}
            <span className="text-slate-300 dark:text-slate-700 ml-2">•</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      id="forex-running-bar"
      className="bg-white/95 dark:bg-[#070b14]/95 border-b border-slate-200 dark:border-slate-800/80 w-full overflow-hidden flex items-center h-8 sm:h-9 shadow-xs shrink-0 z-20 backdrop-blur-md"
    >
      {/* Pinned Left Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold tracking-wider shrink-0 border-r border-slate-200 dark:border-slate-800 z-10 shadow-xs">
        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">LIVE FOREX TICKER</span>
        <span className="sm:hidden">LIVE</span>
      </div>

      {/* Marquee Infinite Scrolling Track */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        {/* Left/Right subtle fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-[#070b14] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-[#070b14] to-transparent pointer-events-none z-10" />

        <div className="animate-marquee hover:cursor-grab active:cursor-grabbing">
          {renderTickerList("first")}
          {renderTickerList("second")}
        </div>
      </div>
    </div>
  );
};
