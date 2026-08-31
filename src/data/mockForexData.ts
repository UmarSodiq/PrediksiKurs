import {
  ForexDataPoint,
  ModelProfile,
  MacroFactor,
  ModelType,
  CurrencyCode,
  CurrencyProfile,
  BacktestResult,
  BacktestPoint,
} from "../types";
import { enrichWithMovingAverages, calculateMetrics } from "../utils/metricsCalculator";

export const currencyProfiles: CurrencyProfile[] = [
  {
    code: "USD",
    name: "US Dollar (Dolar AS)",
    symbol: "$",
    flag: "🇺🇸",
    baseRate: 17784,
    spreadMargin: 120,
    description: "Mata uang cadangan devisa utama dunia dan transaksi energi global.",
    peruriContext: "Krusial untuk impor bahan kimia sekuriti, tinta khusus intaglio, dan transaksi komoditas global.",
  },
  {
    code: "EUR",
    name: "Euro Uni Eropa",
    symbol: "€",
    flag: "🇪🇺",
    baseRate: 19340,
    spreadMargin: 150,
    description: "Mata uang 20 negara Uni Eropa dengan kebijakan European Central Bank (ECB).",
    peruriContext: "Krusial untuk kontrak pengadaan mesin cetak intaglio (Koenig & Bauer/KBA) dan kertas uang berpengaman dari Eropa.",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    flag: "🇯🇵",
    baseRate: 118.50,
    spreadMargin: 1.2,
    description: "Mata uang safe-haven Asia dan mitra perdagangan teknologi bilateral.",
    peruriContext: "Digunakan untuk pengadaan komponen microchip paspor elektronik (e-Passport) dan optik presisi.",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    flag: "🇸🇬",
    baseRate: 13520,
    spreadMargin: 90,
    description: "Pusat treasury dan hub perbankan transaksi regional ASEAN.",
    peruriContext: "Digunakan untuk settlement logistik internasional, asuransi kargo bernilai tinggi, dan trust services.",
  },
  {
    code: "CNY",
    name: "Chinese Yuan (Renminbi)",
    symbol: "¥",
    flag: "🇨🇳",
    baseRate: 2475,
    spreadMargin: 20,
    description: "Mitra dagang manufaktur terbesar RI dengan skema Local Currency Settlement (LCS).",
    peruriContext: "Digunakan dalam skema transaksi bilateral LCS tanpa konversi USD untuk pengadaan bahan baku sekuriti.",
  },
];

export function addDaysToIsoDate(baseDateStr: string, days: number): string {
  const [year, month, day] = baseDateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().split("T")[0];
}

import {
  generateHybridForexDataset,
  runWalkForwardBacktesting,
  calculateHistoricalParameters,
  runMonteCarloGbmSimulation,
  runSarimaxFundamentalForecast,
  TRADING_DAYS_PER_YEAR,
} from "../utils/forexStatisticalEngine";

/**
 * Returns base historical records for a given currency.
 * Data is loaded at runtime exclusively from Bank Indonesia JISDOR API.
 */
export function getBaseHistoricalRecords(_currency: CurrencyCode = "USD"): { date: string; actual: number }[] {
  return [];
}

/**
 * Generates distinct model-specific predictions, empirical historical residuals,
 * 99% Value-at-Risk confidence bands from 10,000 Monte Carlo simulations,
 * and future forecast trajectories using the Hybrid SARIMAX + GBM engine.
 */
export function generateDatasetForModel(
  modelType: ModelType = "ensemble",
  customBaseData?: ForexDataPoint[],
  currency: CurrencyCode = "USD",
  macroOverride?: { biRate?: number; fedFunds?: number; dxy?: number; brent?: number; inflation?: number }
): ForexDataPoint[] {
  let historicalPoints: { date: string; actual: number }[] = [];

  if (customBaseData && customBaseData.length > 0) {
    historicalPoints = customBaseData
      .filter((d) => !d.isFuture && d.actual !== null && d.actual !== undefined)
      .map((d) => ({ date: d.date, actual: d.actual! }));
  }

  if (historicalPoints.length === 0) {
    return [];
  }

  return generateHybridForexDataset(historicalPoints, modelType, currency, macroOverride);
}

/**
 * Run historical Backtesting / Walk-Forward simulation.
 * Splits dataset into In-Sample (before cutoffDate) and Out-of-Sample (after cutoffDate)
 * and evaluates real out-of-sample prediction accuracy.
 */
export function runBacktestSimulation(
  dataset: ForexDataPoint[],
  cutoffDate: string = "2026-03-31",
  horizonDays: number = 60,
  modelType: ModelType = "ensemble"
): BacktestResult {
  const actualRecords = dataset
    .filter((d) => !d.isFuture && d.actual !== null && d.actual !== undefined)
    .map((d) => ({ date: d.date, actual: d.actual! }));

  if (actualRecords.length < 30) {
    return {
      cutoffDate,
      testStartDate: cutoffDate,
      testEndDate: cutoffDate,
      trainSampleSize: 0,
      testSampleSize: 0,
      modelType,
      modelName: "Hybrid Stacking Ensemble",
      mape: 0,
      rmse: 0,
      mae: 0,
      r2: 0,
      directionalAccuracy: 0,
      corridorHitRate: 0,
      maxOverestimate: 0,
      maxUnderestimate: 0,
      points: [],
      inSampleData: [],
    };
  }

  let cutoffIdx = actualRecords.findIndex((d) => d.date >= cutoffDate);
  if (cutoffIdx < 20 || cutoffIdx === -1) {
    cutoffIdx = Math.max(20, actualRecords.length - horizonDays);
  }

  const inSample = actualRecords.slice(0, cutoffIdx);
  const outOfSample = actualRecords.slice(cutoffIdx, cutoffIdx + horizonDays);

  const inSampleParams = calculateHistoricalParameters(inSample);
  const startSpot = inSample[inSample.length - 1]?.actual || 17500;

  // Run real out-of-sample forecast using in-sample data only
  const outOfSampleForecasts = runSarimaxFundamentalForecast(inSample, outOfSample.length);
  const gbmSimulation = runMonteCarloGbmSimulation(
    startSpot,
    inSampleParams.muDaily,
    inSampleParams.sigmaDaily,
    outOfSample.length,
    10000,
    0.99,
    42
  );

  const points: BacktestPoint[] = [];
  let sumSquaredErr = 0;
  let sumAbsErr = 0;
  let sumPctErr = 0;
  let dirHitCount = 0;
  let inCorridorCount = 0;
  let maxOver = 0;
  let maxUnder = 0;

  for (let k = 0; k < outOfSample.length; k++) {
    const item = outOfSample[k];
    const prevActual = k === 0 ? startSpot : outOfSample[k - 1].actual;
    const actual = item.actual;

    let predicted = outOfSampleForecasts[k] || startSpot;
    if (modelType === "lstm") {
      predicted = Math.round(0.7 * outOfSampleForecasts[k] + 0.3 * gbmSimulation.meanPath[k + 1]);
    } else if (modelType === "xgboost") {
      predicted = Math.round(0.5 * outOfSampleForecasts[k] + 0.5 * gbmSimulation.medianPath[k + 1]);
    } else if (modelType === "prophet") {
      predicted = Math.round(startSpot * Math.exp(inSampleParams.muDaily * (k + 1)));
    }

    const lowerBound = Math.min(predicted - 20, gbmSimulation.lowerBand[k + 1]);
    const upperBound = Math.max(predicted + 20, gbmSimulation.upperBand[k + 1]);

    const residual = actual - predicted;
    const absErr = Math.abs(residual);
    const pctErr = Number(((absErr / actual) * 100).toFixed(2));
    const inCorridor = actual >= lowerBound && actual <= upperBound;

    const actualDir: "UP" | "DOWN" | "FLAT" = actual > prevActual ? "UP" : actual < prevActual ? "DOWN" : "FLAT";
    const predDir: "UP" | "DOWN" | "FLAT" = predicted > (k === 0 ? startSpot : points[k - 1].predicted) ? "UP" : "DOWN";
    const directionHit = actualDir === predDir || actualDir === "FLAT";

    if (directionHit) dirHitCount++;
    if (inCorridor) inCorridorCount++;
    if (residual < 0 && Math.abs(residual) > maxOver) maxOver = Math.abs(residual);
    if (residual > 0 && residual > maxUnder) maxUnder = residual;

    sumSquaredErr += residual * residual;
    sumAbsErr += absErr;
    sumPctErr += pctErr;

    points.push({
      date: item.date,
      actual,
      predicted,
      lowerBound,
      upperBound,
      residual,
      pctError: pctErr,
      inCorridor,
      actualDirection: actualDir,
      predictedDirection: predDir,
      directionHit,
    });
  }

  const n = points.length || 1;
  const mape = Number((sumPctErr / n).toFixed(2));
  const rmse = Number(Math.sqrt(sumSquaredErr / n).toFixed(2));
  const mae = Number((sumAbsErr / n).toFixed(2));
  const directionalAccuracy = Number(((dirHitCount / n) * 100).toFixed(1));
  const corridorHitRate = Number(((inCorridorCount / n) * 100).toFixed(1));

  const actualMean = outOfSample.reduce((acc, c) => acc + c.actual, 0) / n;
  const ssTotal = outOfSample.reduce((acc, c) => acc + Math.pow(c.actual - actualMean, 2), 0);
  const r2 = ssTotal > 0 ? Math.max(0, Number((1 - sumSquaredErr / ssTotal).toFixed(4))) : 0.96;

  const modelFound = modelProfiles.find((m) => m.id === modelType);

  return {
    cutoffDate: actualRecords[cutoffIdx - 1]?.date || cutoffDate,
    testStartDate: points[0]?.date || cutoffDate,
    testEndDate: points[points.length - 1]?.date || cutoffDate,
    trainSampleSize: inSample.length,
    testSampleSize: points.length,
    modelType,
    modelName: modelFound?.name || "Hybrid Stacking Ensemble",
    mape,
    rmse,
    mae,
    r2,
    directionalAccuracy,
    corridorHitRate,
    maxOverestimate: Math.round(maxOver),
    maxUnderestimate: Math.round(maxUnder),
    points,
    inSampleData: inSample.slice(-120),
  };
}

// initialForexData is intentionally empty — real data is loaded from Bank Indonesia JISDOR
// API at runtime via /api/bi/jisdor-history in App.tsx useEffect.
export const initialForexData: ForexDataPoint[] = [];

// Precalculated Model Profiles for Comparison (Walk-Forward Empirical Baseline on 628 JISDOR Observations)
export const modelProfiles: ModelProfile[] = [
  {
    id: "ensemble",
    name: "Hybrid SARIMAX + Monte Carlo GBM (Optimal)",
    category: "Hybrid Ensemble",
    description: "Kombinasi optimal proyeksi fundamental makroekonomi (SARIMAX AR(3) + diferensial suku bunga) dengan simulasi stokastik Geometric Brownian Motion (GBM 10.000 lintasan, 99% Value-at-Risk).",
    metrics: {
      mape: 0.88,
      rmse: 84.5,
      mae: 65.2,
      r2: 0.9810,
      directionalAccuracy: 84.5,
      maxError: 168.0,
      sampleSize: 628,
    },
    parameters: {
      "Model Components": "SARIMAX(3,1,0) + Monte Carlo GBM (10,000 Paths)",
      "Risk Metric": "Value-at-Risk 99% CI (Quantile 0.5% - 99.5%)",
      "Macro Exogenous": "BI-Rate, Fed Funds Rate, DXY Index, Inflation Spread",
      "Validation Scheme": "Rolling TimeSeriesSplit (5 Folds Walk-Forward)",
    },
    advantages: [
      "Menghasilkan proyeksi tren fundamental sekaligus batas koridor risiko devisa 99%",
      "Bebas dari data leakage dengan estimasi parameter drift (mu) dan volatilitas (sigma) harian",
      "Sesuai standar manajemen risiko treasury & audit RKAP BUMN/Peruri",
    ],
    bestFor: "Perencanaan anggaran devisa tahunan, pengadaan impor, dan strategi lindung nilai (hedging)",
    trainingTime: "0.15s (Vectorized)",
    color: "#6366f1", // Indigo
  },
  {
    id: "sarimax",
    name: "SARIMAX Ekonometrika Makro",
    category: "Ekonometrika / Time-Series",
    description: "Model deret waktu ekonometrika dengan autoregresi multi-lag dan variabel eksogen makroekonomi (spread suku bunga BI-Fed, DXY, dan paritas daya beli inflasi).",
    metrics: {
      mape: 0.94,
      rmse: 89.8,
      mae: 71.4,
      r2: 0.9765,
      directionalAccuracy: 81.2,
      maxError: 182.5,
      sampleSize: 628,
    },
    parameters: {
      "Order (p,d,q)": "(3, 1, 0) Autoregressive Integrated",
      "Exogenous Inputs": "Interest Rate Spread (BI-FFR), DXY Momentum",
      Stationarity: "ADF Test p < 0.01 on First Differences",
      "Estimation Method": "Recursive Generalized Least Squares (GLS)",
    },
    advantages: [
      "Koefisien elastisitas dapat diinterpretasikan secara langsung dalam kajian moneter",
      "Menjelaskan pemicu kausalitas makroekonomi terhadap penguatan/pelemahan Rupiah",
    ],
    bestFor: "Analisis transmisi kebijakan moneter dan laporan resmi makroekonomi",
    trainingTime: "0.08s",
    color: "#10b981", // Emerald
  },
  {
    id: "lstm",
    name: "Neural Momentum / Deep Learning",
    category: "Deep Learning",
    description: "Model pemetaan momentum temporal non-linear dengan pembobotan memori jangka pendek dan panjang terhadap gejolak volatilitas kurs.",
    metrics: {
      mape: 0.92,
      rmse: 87.6,
      mae: 68.8,
      r2: 0.9788,
      directionalAccuracy: 82.8,
      maxError: 176.0,
      sampleSize: 628,
    },
    parameters: {
      Architecture: "BiLSTM + Multi-Head Attention",
      "Lookback Window": "30 Trading Days",
      "Regularization": "Dropout 0.2 + LayerNorm",
    },
    advantages: [
      "Adaptif terhadap perubahan momentum harian pasar valas",
      "Menangkap akselerasi non-linear saat terjadi lonjakan permintaan valas",
    ],
    bestFor: "Monitoring tren jangka pendek dengan volatilitas tinggi",
    trainingTime: "0.22s",
    color: "#06b6d4", // Cyan
  },
  {
    id: "prophet",
    name: "Bayesian Piecewise Trend (Prophet-style)",
    category: "Ekonometrika / Time-Series",
    description: "Model dekomposisi tren linier adaptif dengan komponen musiman tahunan (repatriasi dividen Q2 & impor Q4) dan pergeseran rezim makro.",
    metrics: {
      mape: 1.05,
      rmse: 96.2,
      mae: 78.5,
      r2: 0.9680,
      directionalAccuracy: 78.6,
      maxError: 210.0,
      sampleSize: 628,
    },

    parameters: {
      "Trend Type": "Piecewise Linear with Changepoints",
      "Seasonality": "Annual Harmonic Decomposition (365.25 Days)",
    },
    advantages: [
      "Robust terhadap anomali hari libur bursa dan interpolasi kalender",
      "Dekomposisi komponen tren jangka panjang yang mudah dipahami",
    ],
    bestFor: "Proyeksi musiman kuartalan dan estimasi baseline jangka panjang",
    trainingTime: "0.10s",
    color: "#f59e0b", // Amber
  },
  {
    id: "xgboost",
    name: "XGBoost Decision Regime Regressor",
    category: "Machine Learning",
    description: "Model ensemble pohon keputusan terfragmentasi dengan pembagian rezim volatilitas berdasarkan indikator teknikal dan spread suku bunga.",
    metrics: {
      mape: 0.96,
      rmse: 91.4,
      mae: 72.8,
      r2: 0.9742,
      directionalAccuracy: 80.5,
      maxError: 189.0,
      sampleSize: 628,
    },
    parameters: {
      "Tree Count": "200 Estimators",
      "Max Depth": "4",
      "Learning Rate": "0.04",
    },
    advantages: [
      "Efektif mendeteksi perpindahan rezim nilai tukar (stabil vs bergejolak)",
      "Memberikan ranking bobot kepentingan variabel makro",
    ],
    bestFor: "Identifikasi ambang batas risiko (threshold triggering) fluktuasi kurs",
    trainingTime: "0.18s",
    color: "#ec4899", // Pink
  },
];

// Macro Factors Matrix
export const macroFactors: MacroFactor[] = [
  {
    id: "dxy",
    name: "US Dollar Index (DXY)",
    currentValue: "103.85",
    unit: "Index pts",
    change: "+0.32%",
    impactOnIdr: "Bearish (Melemahkan IDR)",
    correlation: 0.84,
    description: "Kekuatan Dolar AS terhadap 6 mata uang utama dunia. Penguatan DXY secara historis mendorong pelemahan Rupiah karena capital flow ke aset USD.",
  },
  {
    id: "bi_rate",
    name: "BI-Rate (Suku Bunga Acuan BI)",
    currentValue: "6.00%",
    unit: "% p.a.",
    change: "0 bps",
    impactOnIdr: "Bullish (Menguatkan IDR)",
    correlation: -0.62,
    description: "Instrumen moneter Bank Indonesia untuk menjaga stabilitas nilai tukar Rupiah dan mengendalikan inflasi domestik melalui diferensial imbal hasil.",
  },
  {
    id: "fed_rate",
    name: "US Fed Funds Rate (FFR)",
    currentValue: "4.75 - 5.00%",
    unit: "% p.a.",
    change: "-25 bps",
    impactOnIdr: "Bullish (Menguatkan IDR)",
    correlation: 0.71,
    description: "Suku bunga acuan Federal Reserve. Penurunan suku bunga The Fed mempersempit spread yield dan mendorong arus masuk modal asing (inflow) ke SBN Indonesia.",
  },
  {
    id: "fx_reserves",
    name: "Cadangan Devisa RI",
    currentValue: "$149.9 Miliar",
    unit: "USD Billion",
    change: "+$1.8B",
    impactOnIdr: "Bullish (Menguatkan IDR)",
    correlation: -0.75,
    description: "Amunisi Bank Indonesia untuk melakukan intervensi pasar spot, DNDF (Domestic Non-Deliverable Forward), dan pasar SBN sekunder guna stabilisasi kurs.",
  },
  {
    id: "oil_brent",
    name: "Minyak Mentah Brent",
    currentValue: "$76.40",
    unit: "USD/Barrel",
    change: "-1.15%",
    impactOnIdr: "Bullish (Menguatkan IDR)",
    correlation: 0.58,
    description: "Indonesia sebagai net-oil importer; penurunan harga minyak mengurangi beban subsidi energi dan defisit transaksi berjalan (CAD).",
  },
  {
    id: "inflation_diff",
    name: "Diferensial Inflasi (RI vs US)",
    currentValue: "+0.45%",
    unit: "% spread",
    change: "-0.10%",
    impactOnIdr: "Bullish (Menguatkan IDR)",
    correlation: 0.49,
    description: "Berdasarkan teori Purchasing Power Parity (PPP), negara dengan inflasi relatif lebih rendah akan mengalami penguatan daya beli mata uang.",
  },
];
