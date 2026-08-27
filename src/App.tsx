/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar, MainTabType } from "./components/Sidebar";
import { MetricCards } from "./components/MetricCards";
import { MainForexChart } from "./components/MainForexChart";
import { ActualRateExplorer } from "./components/ActualRateExplorer";
import { ModelComparisonView } from "./components/ModelComparisonView";
import { ResidualAnalysisView } from "./components/ResidualAnalysisView";
import { MacroDriversView } from "./components/MacroDriversView";
import { ScenarioSimulator } from "./components/ScenarioSimulator";
import { BacktestReplayView } from "./components/BacktestReplayView";
import { AiAnalystPanel } from "./components/AiAnalystPanel";
import { RateLookupPanel } from "./components/RateLookupPanel";
import { RunningForexTickerBar } from "./components/RunningForexTickerBar";
import { DataModelManagerModal } from "./components/DataModelManagerModal";
import { InfoModal } from "./components/InfoModal";
import {
  initialForexData,
  modelProfiles,
  macroFactors,
  currencyProfiles,
  generateDatasetForModel,
} from "./data/mockForexData";
import { ForexDataPoint, ModelProfile, ModelType, CurrencyCode } from "./types";
import { calculateMetrics, enrichWithMovingAverages } from "./utils/metricsCalculator";
import { fetchLatestFrankfurterRate } from "./utils/frankfurterService";
import { RealtimeForexChart } from "./components/RealtimeForexChart";
import {
  TrendingUp,
  Layers,
  BarChart2,
  PieChart,
  Sliders,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
} from "lucide-react";

import { ThemeProvider, useTheme } from "./context/ThemeContext";

function DashboardContent() {
  const { theme } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("USD");
  const [data, setData] = useState<ForexDataPoint[]>(initialForexData);
  const [selectedModelId, setSelectedModelId] = useState<ModelType>("ensemble");
  const [activeTab, setActiveTab] = useState<MainTabType>("overview");
  const [overviewChartMode, setOverviewChartMode] = useState<"realtime" | "forecast">("realtime");
  
  // Sub-tabs for consolidated views
  const [analysisSubTab, setAnalysisSubTab] = useState<"actuals" | "comparison" | "residuals">("actuals");
  const [macroSubTab, setMacroSubTab] = useState<"macro" | "simulator">("macro");

  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dynamic metrics based on current dataset
  const activeMetrics = useMemo(() => {
    return calculateMetrics(data);
  }, [data]);

  // Active Model Profile
  const selectedModel = useMemo(() => {
    const found = modelProfiles.find((m) => m.id === selectedModelId) || modelProfiles[0];
    return {
      ...found,
      metrics: activeMetrics,
    };
  }, [selectedModelId, activeMetrics]);

  // Compute spot rate & 30-day forecast target
  const { currentSpot, previousSpot, forecast30d } = useMemo(() => {
    const historical = data.filter((d) => !d.isFuture && d.actual !== null);
    const lastHist = historical[historical.length - 1];
    const prevHist = historical[historical.length - 2] || lastHist;
    const future = data.filter((d) => d.isFuture && d.forecast !== null);
    const lastFuture = future[future.length - 1] || lastHist;

    const currProfile = currencyProfiles.find((c) => c.code === selectedCurrency);
    const fallbackSpot = currProfile ? currProfile.baseRate : 17705;

    return {
      currentSpot: lastHist?.actual || fallbackSpot,
      previousSpot: prevHist?.actual || fallbackSpot,
      forecast30d: lastFuture?.forecast || Math.round(fallbackSpot * 1.012),
    };
  }, [data, selectedCurrency]);

  const handleSelectModel = (modelId: ModelType) => {
    setSelectedModelId(modelId);
    const newModelData = generateDatasetForModel(modelId, data, selectedCurrency);
    setData(newModelData);
  };

  const handleSelectCurrency = (newCurr: CurrencyCode) => {
    setSelectedCurrency(newCurr);
    const newDataset = generateDatasetForModel(selectedModelId, undefined, newCurr);
    setData(enrichWithMovingAverages(newDataset));
  };

  const handleSaveData = (newData: ForexDataPoint[]) => {
    setData(newData);
  };

  const handleResetToDefault = () => {
    setData(generateDatasetForModel(selectedModelId, undefined, selectedCurrency));
  };

  const handleAddActualRate = (newDateStr: string, actualVal: number) => {
    const existingIndex = data.findIndex((d) => d.date === newDateStr);
    let updated: ForexDataPoint[];

    if (existingIndex >= 0) {
      updated = [...data];
      updated[existingIndex] = {
        ...updated[existingIndex],
        actual: actualVal,
        isFuture: false,
      };
    } else {
      const newPoint: ForexDataPoint = {
        date: newDateStr,
        actual: actualVal,
        forecast: actualVal,
        lowerBound: Math.round(actualVal - 100),
        upperBound: Math.round(actualVal + 100),
        isFuture: false,
      };
      updated = [...data, newPoint].sort((a, b) => a.date.localeCompare(b.date));
    }

    const recalibrated = generateDatasetForModel(selectedModelId, updated, selectedCurrency);
    setData(enrichWithMovingAverages(recalibrated));
  };

  const handleRefreshData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const latestSpot = await fetchLatestFrankfurterRate(selectedCurrency).catch(() => null);
      
      let baseDataset = [...data];
      if (latestSpot && latestSpot.rate) {
        const existingIdx = baseDataset.findIndex((d) => d.date === latestSpot.date);
        if (existingIdx >= 0) {
          baseDataset[existingIdx] = {
            ...baseDataset[existingIdx],
            actual: latestSpot.rate,
            isFuture: false,
          };
        } else {
          baseDataset.push({
            date: latestSpot.date,
            actual: latestSpot.rate,
            forecast: latestSpot.rate,
            lowerBound: latestSpot.rate - 100,
            upperBound: latestSpot.rate + 100,
            isFuture: false,
          });
          baseDataset.sort((a, b) => a.date.localeCompare(b.date));
        }
      }

      const recalibrated = generateDatasetForModel(selectedModelId, baseDataset, selectedCurrency);
      setData(enrichWithMovingAverages(recalibrated));
      setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      const recalibrated = generateDatasetForModel(selectedModelId, data, selectedCurrency);
      setData(enrichWithMovingAverages(recalibrated));
    } finally {
      setIsSyncing(false);
    }
  }, [data, selectedModelId, selectedCurrency]);

  useEffect(() => {
    handleRefreshData();

    // Setup live polling every 5 minutes (300000ms)
    const interval = setInterval(() => {
      handleRefreshData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#070a10] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-hidden">
      {/* Top Header */}
      <Header
        currentSpot={currentSpot}
        previousSpot={previousSpot}
        selectedModel={selectedModel}
        models={modelProfiles}
        onSelectModel={handleSelectModel}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedCurrency={selectedCurrency}
      />

      {/* Live Forex Running Ticker Marquee Bar */}
      <RunningForexTickerBar usdIdrSpot={currentSpot} />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Consolidated Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onOpenDataManager={() => setIsDataManagerOpen(true)}
          onOpenInfo={() => setIsInfoModalOpen(true)}
          onRefreshData={handleRefreshData}
          isSyncing={isSyncing}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto w-full p-3 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* TAB 1: DASHBOARD (OVERVIEW, METRICS, CHART & AI INSIGHTS) */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Control Toolbar: Currency Focus Badge & Workspace Context */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 sm:px-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Fokus Kurs:
                    </span>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 shadow-2xs">
                      <span className="text-sm">🇺🇸</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">USD / IDR</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">(Dolar AS)</span>
                      <span className="ml-1 text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold border border-indigo-200 dark:border-indigo-800/50">
                        JISDOR BI
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      <span>Model: <b className="text-slate-700 dark:text-slate-200 font-semibold">{selectedModel.name}</b></span>
                    </div>
                    {lastSyncTime && (
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        • Sinkron: {lastSyncTime} WIB
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. Error Metrics Cards Grid */}
                <MetricCards
                  metrics={activeMetrics}
                  modelName={selectedModel.name}
                  currentSpot={currentSpot}
                  forecast30d={forecast30d}
                />

                {/* 2. Chart Mode Switcher (Realtime Live Feed vs Time-Series Horizon Forecast) */}
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-switch-realtime"
                      onClick={() => setOverviewChartMode("realtime")}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        overviewChartMode === "realtime"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${overviewChartMode === "realtime" ? "animate-pulse" : ""}`} />
                      <span>Grafik Realtime (Live Stream)</span>
                    </button>

                    <button
                      id="btn-switch-forecast"
                      onClick={() => setOverviewChartMode("forecast")}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        overviewChartMode === "forecast"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Grafik Proyeksi Time-Series (AI Model)</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline pr-2">
                    {overviewChartMode === "realtime" ? "🔴 Live Market Ticks" : "📊 Multi-Horizon Forecasting (99% CL)"}
                  </span>
                </div>

                {/* 3. Interactive Chart Display */}
                {overviewChartMode === "realtime" ? (
                  <RealtimeForexChart
                    selectedCurrency={selectedCurrency}
                    initialSpotRate={currentSpot}
                  />
                ) : (
                  <MainForexChart
                    data={data}
                    selectedModel={selectedModel}
                    currentSpot={currentSpot}
                  />
                )}

                {/* 4. Rate Lookup Panel (Date Search & Continuous Projection) */}
                <RateLookupPanel 
                  data={data} 
                  selectedModelName={selectedModel.name} 
                />

                {/* 5. AI Macro Insights */}
                <AiAnalystPanel
                  currentSpot={currentSpot}
                  forecast30d={forecast30d}
                  selectedModel={selectedModel}
                  metrics={activeMetrics}
                />
              </div>
            )}

            {/* TAB 2: ANALISIS & VALIDASI (SUB-TABS: ACTUALS, BENCHMARK, RESIDUALS) */}
            {activeTab === "analysis" && (
              <div className="space-y-4">
                {/* Clean Enterprise Sub-Navigation Pills */}
                <div className="flex items-center gap-1 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-1.5 shadow-sm overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setAnalysisSubTab("actuals")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      analysisSubTab === "actuals"
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Kurs Aktual JISDOR</span>
                  </button>

                  <button
                    onClick={() => setAnalysisSubTab("comparison")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      analysisSubTab === "comparison"
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Model Benchmark</span>
                  </button>

                  <button
                    onClick={() => setAnalysisSubTab("residuals")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      analysisSubTab === "residuals"
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Analisis Residu & Galat</span>
                  </button>
                </div>

                {/* Sub-view Rendering */}
                {analysisSubTab === "actuals" && (
                  <ActualRateExplorer
                    data={data}
                    onAddActualRate={handleAddActualRate}
                    onUpdateFullDataset={handleSaveData}
                    currentSpot={currentSpot}
                  />
                )}

                {analysisSubTab === "comparison" && (
                  <ModelComparisonView
                    models={modelProfiles}
                    selectedModel={selectedModel}
                    onSelectModel={handleSelectModel}
                  />
                )}

                {analysisSubTab === "residuals" && (
                  <ResidualAnalysisView
                    data={data}
                    selectedModel={selectedModel}
                  />
                )}
              </div>
            )}

            {/* TAB 3: MAKRO & SIMULASI (SUB-TABS: MACRO DRIVERS, SCENARIO SIMULATOR) */}
            {activeTab === "macro-sim" && (
              <div className="space-y-4">
                {/* Clean Enterprise Sub-Navigation Pills */}
                <div className="flex items-center gap-1 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-1.5 shadow-sm overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setMacroSubTab("macro")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      macroSubTab === "macro"
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Faktor Makro & Live Feed</span>
                  </button>

                  <button
                    onClick={() => setMacroSubTab("simulator")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      macroSubTab === "simulator"
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Simulasi Skenario (What-If)</span>
                  </button>
                </div>

                {/* Sub-view Rendering */}
                {macroSubTab === "macro" && (
                  <MacroDriversView macroFactors={macroFactors} />
                )}

                {macroSubTab === "simulator" && (
                  <ScenarioSimulator
                    data={data}
                    currentSpot={currentSpot}
                  />
                )}
              </div>
            )}

            {/* TAB 4: BACKTESTING & TIME-TRAVEL REPLAY */}
            {activeTab === "backtest" && (
              <BacktestReplayView
                data={data}
                selectedCurrency={selectedCurrency}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-mono text-[11px]">PrediksiKurs • Bank Indonesia JISDOR & Market Data ({selectedCurrency}/IDR)</span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span>99% Confidence Interval</span>
                <span>•</span>
                <span>Ensemble ML & Econometrics</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Data & Model Integration Manager Modal */}
      <DataModelManagerModal
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
        currentData={data}
        onSaveData={handleSaveData}
        onResetToDefault={handleResetToDefault}
      />

      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
