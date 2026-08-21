/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MetricCards } from "./components/MetricCards";
import { MainForexChart } from "./components/MainForexChart";
import { ActualRateExplorer } from "./components/ActualRateExplorer";
import { ModelComparisonView } from "./components/ModelComparisonView";
import { ResidualAnalysisView } from "./components/ResidualAnalysisView";
import { MacroDriversView } from "./components/MacroDriversView";
import { ScenarioSimulator } from "./components/ScenarioSimulator";
import { AiAnalystPanel } from "./components/AiAnalystPanel";
import { RateLookupPanel } from "./components/RateLookupPanel";
import { DataModelManagerModal } from "./components/DataModelManagerModal";
import { InfoModal } from "./components/InfoModal";
import {
  initialForexData,
  modelProfiles,
  macroFactors,
  generateDatasetForModel,
} from "./data/mockForexData";
import { ForexDataPoint, ModelProfile, ModelType } from "./types";
import { calculateMetrics, enrichWithMovingAverages } from "./utils/metricsCalculator";
import { fetchLatestFrankfurterRate } from "./utils/frankfurterService";
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  Info,
} from "lucide-react";

import { ThemeProvider, useTheme } from "./context/ThemeContext";

function DashboardContent() {
  const { theme } = useTheme();
  const [data, setData] = useState<ForexDataPoint[]>(initialForexData);
  const [selectedModelId, setSelectedModelId] = useState<ModelType>("ensemble");
  const [activeTab, setActiveTab] = useState<
    "overview" | "actuals" | "comparison" | "residuals" | "macro" | "simulator"
  >("overview");
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

    return {
      currentSpot: lastHist?.actual || 17844,
      previousSpot: prevHist?.actual || 17838,
      forecast30d: lastFuture?.forecast || 17930,
    };
  }, [data]);

  const handleSelectModel = (modelId: ModelType) => {
    setSelectedModelId(modelId);
    const newModelData = generateDatasetForModel(modelId, data);
    setData(newModelData);
  };

  const handleSaveData = (newData: ForexDataPoint[]) => {
    setData(newData);
  };

  const handleResetToDefault = () => {
    setData(generateDatasetForModel(selectedModelId));
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

    const recalibrated = generateDatasetForModel(selectedModelId, updated);
    setData(enrichWithMovingAverages(recalibrated));
  };

  const handleRefreshData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const latestSpot = await fetchLatestFrankfurterRate().catch(() => null);
      
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

      const recalibrated = generateDatasetForModel(selectedModelId, baseDataset);
      setData(enrichWithMovingAverages(recalibrated));
      setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      const recalibrated = generateDatasetForModel(selectedModelId, data);
      setData(enrichWithMovingAverages(recalibrated));
    } finally {
      setIsSyncing(false);
    }
  }, [data, selectedModelId]);

  useEffect(() => {
    handleRefreshData();

    // Setup live polling every 5 minutes (300000ms) to keep data "real-time"
    const interval = setInterval(() => {
      handleRefreshData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <Header
        currentSpot={currentSpot}
        previousSpot={previousSpot}
        selectedModel={selectedModel}
        models={modelProfiles}
        onSelectModel={handleSelectModel}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
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
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* TAB 1: OVERVIEW (FORECASTING & ERROR METRICS) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 1. Error Metrics Cards Grid */}
            <MetricCards
              metrics={activeMetrics}
              modelName={selectedModel.name}
              currentSpot={currentSpot}
              forecast30d={forecast30d}
            />

            {/* 2. Main Interactive Chart (Actual vs Forecast) */}
            <MainForexChart
              data={data}
              selectedModel={selectedModel}
              currentSpot={currentSpot}
            />

            {/* 3. Rate Lookup Panel (Date Search) */}
            <RateLookupPanel 
              data={data} 
              selectedModelName={selectedModel.name} 
            />

            {/* 4. AI Macro Insights */}
            <div className="grid grid-cols-1 gap-6">
              <AiAnalystPanel
                currentSpot={currentSpot}
                forecast30d={forecast30d}
                selectedModel={selectedModel}
                metrics={activeMetrics}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DATA KURS AKTUAL (JISDOR & SPOT EXPLORER) */}
        {activeTab === "actuals" && (
          <ActualRateExplorer
            data={data}
            onAddActualRate={handleAddActualRate}
            onUpdateFullDataset={handleSaveData}
            currentSpot={currentSpot}
          />
        )}

        {/* TAB 3: MODEL COMPARISON */}
        {activeTab === "comparison" && (
          <ModelComparisonView
            models={modelProfiles}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
          />
        )}

        {/* TAB 3: RESIDUAL & ERROR DIAGNOSTICS */}
        {activeTab === "residuals" && (
          <ResidualAnalysisView
            data={data}
            selectedModel={selectedModel}
          />
        )}

        {/* TAB 4: MACRO DRIVERS & CORRELATIONS */}
        {activeTab === "macro" && (
          <MacroDriversView macroFactors={macroFactors} />
        )}

        {/* TAB 5: SCENARIO SIMULATOR (WHAT-IF) */}
        {activeTab === "simulator" && (
          <ScenarioSimulator
            data={data}
            currentSpot={currentSpot}
          />
        )}
          </div>

          {/* Footer */}
          <footer className="mt-auto py-5 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>USD/IDR Forex Forecasting & Analytics Studio • Bank Indonesia JISDOR & Market Data Reference</span>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Metrik: MAPE, RMSE, MAE, R², MDA</span>
                <span>•</span>
                <span>Ekonometrika & Machine Learning</span>
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
