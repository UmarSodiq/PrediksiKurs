export interface ForexDataPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  lowerBound?: number | null;
  upperBound?: number | null;
  ma20?: number | null;
  ma50?: number | null;
  residual?: number | null; // actual - forecast (where actual exists)
  percentageError?: number | null; // |actual - forecast| / actual * 100
  // Macro exogenous factors
  dxy?: number;
  biRate?: number;
  fedRate?: number;
  inflationIdr?: number;
  oilPrice?: number;
  isFuture?: boolean;
}

export interface ModelMetrics {
  mape: number; // Mean Absolute Percentage Error (%)
  rmse: number; // Root Mean Squared Error (IDR)
  mae: number; // Mean Absolute Error (IDR)
  r2: number; // R-Squared score (0 to 1)
  directionalAccuracy: number; // % of correct direction predictions
  maxError: number; // Maximum error observed
  theilU?: number; // Theil's U statistic
  sampleSize: number;
}

export type ModelType = "ensemble" | "lstm" | "sarimax" | "prophet" | "xgboost";

export type ForecastHorizon = "30d" | "90d" | "180d" | "1y" | "2y";

export type CurrencyCode = "USD" | "EUR" | "JPY" | "SGD" | "CNY";

export interface CurrencyProfile {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  baseRate: number; // approximate benchmark spot rate in IDR
  spreadMargin: number;
  description: string;
  peruriContext: string;
}

export interface HorizonTargets {
  target30d: number;
  target90d: number;
  target180d: number;
  target1y: number;
  target2y: number;
}

export interface ModelProfile {
  id: ModelType;
  name: string;
  category: "Machine Learning" | "Deep Learning" | "Ekonometrika / Time-Series" | "Hybrid Ensemble";
  description: string;
  metrics: ModelMetrics;
  parameters: Record<string, string | number>;
  advantages: string[];
  bestFor: string;
  trainingTime: string;
  color: string;
}

export interface MacroFactor {
  id: string;
  name: string;
  currentValue: string;
  unit: string;
  change: string;
  impactOnIdr: "Bullish (Menguatkan IDR)" | "Bearish (Melemahkan IDR)" | "Netral";
  correlation: number; // -1 to +1
  description: string;
}

export interface MacroHistoricalRecord {
  date: string;
  usdIdr: number;
  biRate: number;
  fedFunds: number;
  dxy: number;
  brent: number;
  neraca: number; // Trade Balance (Juta USD)
  inflasi: number; // YoY %
  reserve: number; // Foreign Reserves (Juta USD)
}

export interface ScenarioParameters {
  fedRateChangeBps: number; // -100 to +100 bps
  biRateChangeBps: number; // -100 to +100 bps
  dxyChangePct: number; // -5% to +5%
  oilPriceChangePct: number; // -20% to +20%
  riskSentiment: "risk_on" | "neutral" | "risk_off";
}

export interface AIAnalysisResult {
  summary: string;
  keyDrivers: string[];
  technicalLevels: {
    support: string;
    pivot: string;
    resistance: string;
  };
  modelHealthNote: string;
  recommendations: string[];
}

export interface BacktestPoint {
  date: string;
  actual: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  residual: number;
  pctError: number;
  inCorridor: boolean;
  actualDirection: "UP" | "DOWN" | "FLAT";
  predictedDirection: "UP" | "DOWN" | "FLAT";
  directionHit: boolean;
}

export interface BacktestResult {
  cutoffDate: string;
  testStartDate: string;
  testEndDate: string;
  trainSampleSize: number;
  testSampleSize: number;
  modelType: ModelType;
  modelName: string;
  mape: number;
  rmse: number;
  mae: number;
  r2: number;
  directionalAccuracy: number;
  corridorHitRate: number;
  maxOverestimate: number;
  maxUnderestimate: number;
  points: BacktestPoint[];
  inSampleData: { date: string; actual: number }[];
}
