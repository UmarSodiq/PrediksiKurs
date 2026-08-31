/**
 * Bank Indonesia Official Exchange Rate Service (Single Source of Truth)
 * Web Service: https://www.bi.go.id/biwebservice/wskursbi.asmx
 *
 * Endpoints used:
 *   - getSubKursJisdor1  → JISDOR latest (no params)
 *   - getSubKursJisdor3  → JISDOR historical range (mts, startDate MM/DD/YYYY, endDate MM/DD/YYYY)
 *   - getSubKursLokal1   → BI Transaction Rates latest (beli/jual for multi-currency)
 *
 * XML Schema: DataSet / diffgr:diffgram / NewDataSet / Table
 *   - id_subkursasing, lnk_subkursasing, nil_subkursasing (unit)
 *   - beli_subkursasing, jual_subkursasing, tgl_subkursasing (dateTime), mts_subkursasing (currency)
 *
 * JISDOR note: beli == jual (single rate, no spread). tengah = beli.
 * Kurs Lokal note: beli != jual (bid/ask spread).
 */

import { CurrencyCode } from "../types";

export interface BiKursRecord {
  id: string;
  currency: string;   // mts_subkursasing (e.g. "USD", "EUR")
  unit: number;       // nil_subkursasing (e.g. 1.00, 100.00 for JPY)
  beli: number;       // beli_subkursasing per unit
  jual: number;       // jual_subkursasing per unit
  tengah: number;     // (beli + jual) / 2, normalized per unit
  date: string;       // YYYY-MM-DD
  rawTimestamp: string;
}

export interface BiRatesMap {
  date: string;
  source: string;
  records: Record<string, BiKursRecord>;
  usdIdr: number;
  eurIdr: number;
  jpyIdr: number;
  sgdIdr: number;
  cnyIdr: number;
  usdBeli: number;
  usdJual: number;
  timestamp: string;
}

/**
 * Convert JS Date → BI parameter format: MM/DD/YYYY
 */
export function toBiDateParam(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${m}/${d}/${y}`;
}

/**
 * Convert BI XML tgl_subkursasing → YYYY-MM-DD ISO date string
 */
function tglToIso(tgl: string): string {
  // Format: "2026-08-28T00:00:00+07:00" or "2026-08-28 00:00:00"
  return tgl.split("T")[0].split(" ")[0];
}

/**
 * Parse Bank Indonesia XML DataSet (works for both JISDOR and Kurs Lokal)
 * Schema: <DataSet><diffgr:diffgram><NewDataSet><Table>...</Table>...</NewDataSet></diffgr:diffgram></DataSet>
 */
export function parseBiXmlDataSet(xmlString: string): BiKursRecord[] {
  const records: BiKursRecord[] = [];
  const tableRegex = /<Table[\s\S]*?<\/Table>/gi;
  const matches = xmlString.match(tableRegex);

  if (!matches || matches.length === 0) return records;

  for (const tableXml of matches) {
    const get = (tag: string): string | null => {
      const m = tableXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].trim() : null;
    };

    const mts = get("mts_subkursasing");
    const beliRaw = get("beli_subkursasing");
    const jualRaw = get("jual_subkursasing");

    if (!mts || (!beliRaw && !jualRaw)) continue;

    const currency = mts.trim().toUpperCase();
    const id = get("id_subkursasing") || "";
    const unit = parseFloat(get("nil_subkursasing") || "1") || 1;
    const beli = parseFloat((beliRaw || "0").replace(/,/g, "")) || 0;
    const jual = parseFloat((jualRaw || "0").replace(/,/g, "")) || 0;
    const rawTimestamp = get("tgl_subkursasing") || new Date().toISOString();
    const date = tglToIso(rawTimestamp);

    const rateBeli = unit > 0 ? beli / unit : beli;
    const rateJual = unit > 0 ? jual / unit : jual;
    const rateTengah = (rateBeli + rateJual) / 2;

    records.push({
      id,
      currency,
      unit,
      beli: rateBeli,
      jual: rateJual,
      tengah: currency === "JPY" ? Number(rateTengah.toFixed(2)) : Math.round(rateTengah),
      date,
      rawTimestamp,
    });
  }

  return records;
}

/**
 * Build a structured BiRatesMap from an array of parsed records
 */
export function buildBiRatesMap(records: BiKursRecord[]): BiRatesMap {
  const map: Record<string, BiKursRecord> = {};
  let date = new Date().toISOString().split("T")[0];

  for (const r of records) {
    // Keep the most recent record per currency if multiple exist
    if (!map[r.currency] || r.date > map[r.currency].date) {
      map[r.currency] = r;
    }
    if (r.date > date || date === new Date().toISOString().split("T")[0]) {
      date = r.date;
    }
  }

  const usdRec = map["USD"];
  const eurRec = map["EUR"];
  const jpyRec = map["JPY"];
  const sgdRec = map["SGD"];
  const cnyRec = map["CNY"];

  return {
    date,
    source: "Bank Indonesia JISDOR (wskursbi.asmx)",
    records: map,
    usdIdr: usdRec?.tengah ?? 17784,
    eurIdr: eurRec?.tengah ?? 19340,
    jpyIdr: jpyRec?.tengah ?? 118.5,
    sgdIdr: sgdRec?.tengah ?? 13520,
    cnyIdr: cnyRec?.tengah ?? 2475,
    usdBeli: usdRec ? Math.round(usdRec.beli) : 17717,
    usdJual: usdRec ? Math.round(usdRec.jual) : 17851,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch latest JISDOR USD/IDR rate from Bank Indonesia via backend proxy.
 * Returns { date, rate, source } — compatible with the existing spot rate interface.
 */
export async function fetchBiJisdorLatest(): Promise<{ date: string; rate: number; source: string } | null> {
  try {
    const res = await fetch("/api/bi/jisdor-latest");
    if (res.ok) {
      const json = await res.json();
      if (json.success && typeof json.rate === "number") {
        return { date: json.date, rate: json.rate, source: "Bank Indonesia JISDOR" };
      }
    }
  } catch (e) {
    console.warn("[BI] JISDOR latest fetch failed:", e);
  }
  return null;
}

/**
 * Fetch historical JISDOR series from Bank Indonesia via backend proxy.
 * Returns array of { date: "YYYY-MM-DD", actual: number } sorted ascending.
 */
export async function fetchBiJisdorHistory(
  startDate: string, // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD, defaults to today
): Promise<{ date: string; actual: number }[]> {
  const params = new URLSearchParams({ startDate });
  if (endDate) params.set("endDate", endDate);

  try {
    const res = await fetch(`/api/bi/jisdor-history?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as { date: string; actual: number }[];
      }
    }
  } catch (e) {
    console.warn("[BI] JISDOR history fetch failed:", e);
  }
  return [];
}

/**
 * Fetch latest live exchange rates from Bank Indonesia (all currencies, beli/jual).
 * Uses Kurs Lokal (getSubKursLokal1) for multi-currency spread data.
 */
export async function fetchBankIndonesiaLatest(): Promise<BiRatesMap | null> {
  try {
    const res = await fetch("/api/bi/latest");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.rates) {
        return data.rates as BiRatesMap;
      }
    }
  } catch (e) {
    console.warn("[BI] Backend Bank Indonesia proxy failed:", e);
  }
  return null;
}
