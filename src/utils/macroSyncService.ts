export interface MacroSyncResult {
  usdIdr: number;
  usdIdrDate: string;
  biRate: number;
  fedFunds: number;
  dxy: number;
  brent: number;
  neraca: number;
  inflasi: number;
  reserve: number;
  sources: Record<string, string>;
  hasFredKey: boolean;
  lastSyncTimestamp: string;
}

export async function fetchLatestMacroIndicators(
  fredApiKey?: string
): Promise<{ success: boolean; data?: MacroSyncResult; message?: string }> {
  try {
    const url = fredApiKey
      ? `/api/macro/latest?fredApiKey=${encodeURIComponent(fredApiKey)}`
      : "/api/macro/latest";

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json;
  } catch (err: any) {
    console.error("Failed to fetch macro indicators:", err);
    return {
      success: false,
      message: err.message || "Gagal menghubungi server untuk sinkronisasi data makro",
    };
  }
}
