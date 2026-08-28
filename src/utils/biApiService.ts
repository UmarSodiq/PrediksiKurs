/**
 * Bank Indonesia Official Exchange Rate API & XML Parser
 * Web Service: https://www.bi.go.id/biweb/services/wskursbi.asmx
 * Schema: DataSet / Diffgram / SubKursAsing (id, nil, beli, jual, tgl, mts)
 */

import { CurrencyCode } from "../types";

export interface BiKursRecord {
  id: string;
  currency: string; // mts_subkursasing (e.g. USD, EUR, JPY)
  unit: number;     // nil_subkursasing (e.g. 1.00, 100.00)
  beli: number;     // beli_subkursasing (e.g. 17673.18)
  jual: number;     // jual_subkursasing (e.g. 17850.82)
  tengah: number;   // (beli + jual) / (2 * unit)
  date: string;     // YYYY-MM-DD from tgl_subkursasing
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
 * Parses Bank Indonesia XML DataSet response (<DataSet><diffgr:diffgram><NewDataSet><Table>...)
 * Works in both browser (DOMParser / Regex) and Node environments.
 */
export function parseBiXmlDataSet(xmlString: string): BiKursRecord[] {
  const records: BiKursRecord[] = [];

  // Match all <Table> ... </Table> blocks in the Diffgram
  const tableRegex = /<Table[\s\S]*?<\/Table>/gi;
  const matches = xmlString.match(tableRegex);

  if (matches && matches.length > 0) {
    for (const tableXml of matches) {
      const idMatch = tableXml.match(/<id_subkursasing>([\s\S]*?)<\/id_subkursasing>/i);
      const nilMatch = tableXml.match(/<nil_subkursasing>([\s\S]*?)<\/nil_subkursasing>/i);
      const beliMatch = tableXml.match(/<beli_subkursasing>([\s\S]*?)<\/beli_subkursasing>/i);
      const jualMatch = tableXml.match(/<jual_subkursasing>([\s\S]*?)<\/jual_subkursasing>/i);
      const tglMatch = tableXml.match(/<tgl_subkursasing>([\s\S]*?)<\/tgl_subkursasing>/i);
      const mtsMatch = tableXml.match(/<mts_subkursasing>([\s\S]*?)<\/mts_subkursasing>/i);

      if (mtsMatch && (beliMatch || jualMatch)) {
        const currency = mtsMatch[1].trim().toUpperCase();
        const id = idMatch ? idMatch[1].trim() : "";
        const unit = nilMatch ? parseFloat(nilMatch[1].trim()) || 1 : 1;
        const beli = beliMatch ? parseFloat(beliMatch[1].trim().replace(/,/g, "")) || 0 : 0;
        const jual = jualMatch ? parseFloat(jualMatch[1].trim().replace(/,/g, "")) || 0 : 0;
        const rawTimestamp = tglMatch ? tglMatch[1].trim() : new Date().toISOString();
        const date = rawTimestamp.includes("T") ? rawTimestamp.split("T")[0] : rawTimestamp.split(" ")[0];

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
    }
  }

  return records;
}

/**
 * Converts array of BiKursRecord to structured BiRatesMap
 */
export function buildBiRatesMap(records: BiKursRecord[]): BiRatesMap {
  const map: Record<string, BiKursRecord> = {};
  let date = new Date().toISOString().split("T")[0];

  for (const r of records) {
    map[r.currency] = r;
    if (r.date) date = r.date;
  }

  const usdRec = map["USD"];
  const eurRec = map["EUR"];
  const jpyRec = map["JPY"];
  const sgdRec = map["SGD"];
  const cnyRec = map["CNY"];

  return {
    date,
    source: "Bank Indonesia (wskursbi.asmx)",
    records: map,
    usdIdr: usdRec ? usdRec.tengah : 17762,
    eurIdr: eurRec ? eurRec.tengah : 19340,
    jpyIdr: jpyRec ? jpyRec.tengah : 118.5,
    sgdIdr: sgdRec ? sgdRec.tengah : 13520,
    cnyIdr: cnyRec ? cnyRec.tengah : 2475,
    usdBeli: usdRec ? Math.round(usdRec.beli) : 17673,
    usdJual: usdRec ? Math.round(usdRec.jual) : 17850,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch latest live exchange rates from Bank Indonesia via backend proxy or direct endpoints
 */
export async function fetchBankIndonesiaLatest(): Promise<BiRatesMap | null> {
  // 1. Try Backend Proxy endpoint
  try {
    const res = await fetch("/api/bi/latest");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.rates) {
        return data.rates as BiRatesMap;
      }
    }
  } catch (e) {
    console.warn("Backend Bank Indonesia proxy failed:", e);
  }

  // 2. Try Backend XML Parser with default today template
  try {
    const res = await fetch("/api/bi/kurs-xml");
    if (res.ok) {
      const xml = await res.text();
      const records = parseBiXmlDataSet(xml);
      if (records.length > 0) {
        return buildBiRatesMap(records);
      }
    }
  } catch (e) {
    console.warn("Backend Bank Indonesia XML endpoint failed:", e);
  }

  return null;
}
