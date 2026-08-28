import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  FileCode,
  Table,
  Check,
  Copy,
  Plus,
  Trash2,
  Database,
  Sparkles,
  AlertCircle,
  FileText,
  Globe,
  RefreshCw,
} from "lucide-react";
import { ForexDataPoint } from "../types";
import { enrichWithMovingAverages, getPythonExportSnippet } from "../utils/metricsCalculator";
import {
  fetchHistoricalFrankfurterSeries,
  mergeFrankfurterDataIntoDataset,
} from "../utils/frankfurterService";
import {
  parseBiXmlDataSet,
  fetchBankIndonesiaLatest,
  BiRatesMap,
} from "../utils/biApiService";
import { Landmark } from "lucide-react";

interface DataModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ForexDataPoint[];
  onSaveData: (newData: ForexDataPoint[]) => void;
  onResetToDefault: () => void;
}

export const DataModelManagerModal: React.FC<DataModelManagerModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onSaveData,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "bi_xml" | "editor" | "code" | "presets">("upload");
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Inline table state
  const [editableRows, setEditableRows] = useState<ForexDataPoint[]>(currentData);
  const [searchQuery, setSearchQuery] = useState("");

  // New record form state
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newActual, setNewActual] = useState("");
  const [newForecast, setNewForecast] = useState("");
  const [isSyncingFrankfurter, setIsSyncingFrankfurter] = useState(false);
  const [isSyncingBi, setIsSyncingBi] = useState(false);
  const [biXmlText, setBiXmlText] = useState("");

  if (!isOpen) return null;

  // Sync latest rate directly from Bank Indonesia API (wskursbi.asmx)
  const handleSyncBankIndonesia = async () => {
    setIsSyncingBi(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const biRates = await fetchBankIndonesiaLatest();
      if (!biRates) throw new Error("Gagal terhubung ke service wskursbi.asmx Bank Indonesia.");
      
      const newPoint: ForexDataPoint = {
        date: biRates.date,
        actual: biRates.usdIdr,
        forecast: biRates.usdIdr,
        lowerBound: biRates.usdIdr - 100,
        upperBound: biRates.usdIdr + 100,
        isFuture: false,
      };

      const existingIdx = currentData.findIndex((d) => d.date === biRates.date);
      let updated: ForexDataPoint[];
      if (existingIdx >= 0) {
        updated = [...currentData];
        updated[existingIdx] = { ...updated[existingIdx], actual: biRates.usdIdr, isFuture: false };
      } else {
        updated = [...currentData, newPoint].sort((a, b) => a.date.localeCompare(b.date));
      }

      const enriched = enrichWithMovingAverages(updated);
      setEditableRows(enriched);
      onSaveData(enriched);
      setUploadSuccess(
        `Berhasil menyinkronkan data resmi Bank Indonesia (${biRates.date}): USD/IDR Rp ${biRates.usdIdr.toLocaleString("id-ID")} (Beli: Rp ${biRates.usdBeli.toLocaleString("id-ID")}, Jual: Rp ${biRates.usdJual.toLocaleString("id-ID")})`
      );
    } catch (err: any) {
      setUploadError(err.message || "Gagal menarik data Bank Indonesia");
    } finally {
      setIsSyncingBi(false);
    }
  };

  // Import raw XML DataSet from Bank Indonesia
  const handleImportBiXml = () => {
    setUploadError(null);
    setUploadSuccess(null);
    try {
      if (!biXmlText.trim()) throw new Error("Silakan tempelkan konten XML DataSet Bank Indonesia terlebih dahulu.");
      const records = parseBiXmlDataSet(biXmlText);
      if (records.length === 0) {
        throw new Error("Format XML tidak valid atau tidak memuat elemen <Table> subkursasing Bank Indonesia.");
      }

      const usdRec = records.find((r) => r.currency === "USD") || records[0];
      const newPoint: ForexDataPoint = {
        date: usdRec.date,
        actual: usdRec.tengah,
        forecast: usdRec.tengah,
        lowerBound: usdRec.tengah - 100,
        upperBound: usdRec.tengah + 100,
        isFuture: false,
      };

      const existingIdx = currentData.findIndex((d) => d.date === usdRec.date);
      let updated: ForexDataPoint[];
      if (existingIdx >= 0) {
        updated = [...currentData];
        updated[existingIdx] = { ...updated[existingIdx], actual: usdRec.tengah, isFuture: false };
      } else {
        updated = [...currentData, newPoint].sort((a, b) => a.date.localeCompare(b.date));
      }

      const enriched = enrichWithMovingAverages(updated);
      setEditableRows(enriched);
      onSaveData(enriched);
      setUploadSuccess(
        `Berhasil memproses XML DataSet BI: Ditemukan ${records.length} valuta asing. Kurs USD/IDR ${usdRec.date} diperbarui ke Rp ${usdRec.tengah.toLocaleString("id-ID")}.`
      );
    } catch (err: any) {
      setUploadError(err.message || "Gagal memproses XML Bank Indonesia");
    }
  };

  // Sync historical series directly from Frankfurter API
  const handleSyncFrankfurter = async () => {
    setIsSyncingFrankfurter(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const series = await fetchHistoricalFrankfurterSeries("2024-01-01");
      const merged = mergeFrankfurterDataIntoDataset(currentData, series);
      setEditableRows(merged);
      onSaveData(merged);
      setUploadSuccess(
        `Berhasil menarik dan menyinkronkan ${series.length} data aktual USD/IDR dari Frankfurter API!`
      );
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengambil data dari Frankfurter API");
    } finally {
      setIsSyncingFrankfurter(false);
    }
  };

  // Handle CSV/JSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const enriched = enrichWithMovingAverages(parsed);
            onSaveData(enriched);
            setEditableRows(enriched);
            setUploadSuccess(`Berhasil mengimpor ${parsed.length} baris data dari ${file.name}`);
          } else {
            throw new Error("Format JSON harus berupa Array of Objects.");
          }
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) throw new Error("File CSV tidak memiliki baris data yang cukup.");

          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("tanggal"));
          const actualIdx = headers.findIndex((h) => h.includes("actual") || h.includes("aktual") || h.includes("kurs"));
          const forecastIdx = headers.findIndex((h) => h.includes("forecast") || h.includes("prediksi"));
          const lowerIdx = headers.findIndex((h) => h.includes("lower") || h.includes("bawah"));
          const upperIdx = headers.findIndex((h) => h.includes("upper") || h.includes("atas"));

          if (dateIdx === -1) {
            throw new Error("Kolom tanggal ('date') tidak ditemukan dalam header CSV.");
          }

          const parsedData: ForexDataPoint[] = [];

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim());
            if (cols.length <= dateIdx) continue;

            const dateStr = cols[dateIdx];
            const actualVal = actualIdx !== -1 && cols[actualIdx] ? parseFloat(cols[actualIdx]) : null;
            const forecastVal = forecastIdx !== -1 && cols[forecastIdx] ? parseFloat(cols[forecastIdx]) : null;
            const lowerVal = lowerIdx !== -1 && cols[lowerIdx] ? parseFloat(cols[lowerIdx]) : null;
            const upperVal = upperIdx !== -1 && cols[upperIdx] ? parseFloat(cols[upperIdx]) : null;

            parsedData.push({
              date: dateStr,
              actual: isNaN(actualVal as number) ? null : actualVal,
              forecast: isNaN(forecastVal as number) ? null : forecastVal,
              lowerBound: lowerVal,
              upperBound: upperVal,
              isFuture: actualVal === null,
            });
          }

          if (parsedData.length === 0) {
            throw new Error("Tidak ada data valid yang dapat diproses dari CSV.");
          }

          const enriched = enrichWithMovingAverages(parsedData);
          onSaveData(enriched);
          setEditableRows(enriched);
          setUploadSuccess(`Berhasil memuat ${parsedData.length} baris data kurs aktual & forecast.`);
        }
      } catch (err: any) {
        setUploadError(err.message || "Gagal memproses file. Pastikan format file sesuai.");
      }
    };

    reader.readAsText(file);
  };

  // Download Sample CSV
  const downloadSampleCSV = () => {
    const csvContent =
      "date,actual,forecast,lowerBound,upperBound\n" +
      "2026-08-01,17780,17760,17680,17840\n" +
      "2026-08-04,17810,17795,17715,17875\n" +
      "2026-08-05,17825,17815,17735,17895\n" +
      "2026-08-06,17835,17830,17750,17910\n" +
      "2026-08-07,,17850,17740,17960\n" +
      "2026-08-08,,17870,17750,17990\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "format_usdidr_forecast_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Python Snippet
  const copyPythonCode = () => {
    navigator.clipboard.writeText(getPythonExportSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add new single row to table
  const handleAddNewRow = () => {
    if (!newDate) return;
    const act = newActual ? parseFloat(newActual) : null;
    const fore = newForecast ? parseFloat(newForecast) : null;

    const newRow: ForexDataPoint = {
      date: newDate,
      actual: act,
      forecast: fore,
      lowerBound: fore ? Math.round(fore - 120) : null,
      upperBound: fore ? Math.round(fore + 120) : null,
      isFuture: act === null,
    };

    const updated = enrichWithMovingAverages([...editableRows, newRow].sort((a, b) => a.date.localeCompare(b.date)));
    setEditableRows(updated);
    onSaveData(updated);
    setNewActual("");
    setNewForecast("");
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const updated = enrichWithMovingAverages(editableRows.filter((_, idx) => idx !== index));
    setEditableRows(updated);
    onSaveData(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Data & Model Integration Manager
              </h2>
              <p className="text-xs text-slate-400">
                Kelola dataset aktual vs. forecast, upload file kustom CSV/JSON, atau integrasikan output model Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "upload"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV / JSON
          </button>

          <button
            onClick={() => setActiveTab("bi_xml")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "bi_xml"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            API & XML Bank Indonesia (wskursbi)
          </button>

          <button
            onClick={() => setActiveTab("editor")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "editor"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Tabel Editor Data ({editableRows.length})
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "code"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Panduan & Skrip Python Model
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
          {/* TAB 1: UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              {/* Bank Indonesia Live Sync Card (Primary Source) */}
              <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-300">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>Sinkronisasi Resmi Bank Indonesia</span>
                      <span className="text-[10px] bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">wskursbi.asmx</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Tarik kurs acuan resmi JISDOR dan kurs transaksi perbankan (Beli & Jual) langsung dari Web Service Bank Indonesia.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncBankIndonesia}
                  disabled={isSyncingBi}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 text-xs shrink-0 shadow-sm"
                >
                  {isSyncingBi ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Landmark className="w-3.5 h-3.5" />
                  )}
                  <span>{isSyncingBi ? "Menyinkronkan BI..." : "Tarik Data Bank Indonesia"}</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 text-center bg-slate-950/40 transition">
                <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">
                  Upload File Hasil Prediksi Model Anda (CSV atau JSON)
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Mendukung kolom <code>date</code>, <code>actual</code>, <code>forecast</code>, <code>lowerBound</code>, dan <code>upperBound</code>.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition shadow-md">
                    Pilih File CSV / JSON
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={downloadSampleCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Format Template CSV
                  </button>
                </div>
              </div>

              {/* Frankfurter Live Sync Option */}
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-900/60 text-indigo-300">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>Tarik Data Historis dari Frankfurter API</span>
                      <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1.5 py-0.2 rounded font-mono">ECB Data</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Otomatis unduh data kurs harian USD/IDR resmi dari European Central Bank (2024 - sekarang).
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncFrankfurter}
                  disabled={isSyncingFrankfurter}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 text-xs shrink-0 shadow-sm"
                >
                  {isSyncingFrankfurter ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{isSyncingFrankfurter ? "Menyinkronkan..." : "Tarik Data Frankfurter"}</span>
                </button>
              </div>

              {uploadSuccess && (
                <div className="bg-emerald-950/70 border border-emerald-700/60 p-3 rounded-xl text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="bg-rose-950/70 border border-rose-700/60 p-3 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Reset to Default */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">
                  Sedang menggunakan dataset aktif: <strong>{editableRows.length} rekaman</strong>
                </span>
                <button
                  onClick={() => {
                    onResetToDefault();
                    setUploadSuccess("Dataset default USD/IDR berhasil dipulihkan.");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Pulihkan ke Dataset Default (2024-2026)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BANK INDONESIA XML DATASET */}
          {activeTab === "bi_xml" && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Import XML DataSet Web Service Bank Indonesia
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40 font-mono">
                    wskursbi.asmx / getSubKursLokal
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Tempelkan respon XML dari Web Service Bank Indonesia (format <code>&lt;DataSet&gt;&lt;diffgr:diffgram&gt;&lt;NewDataSet&gt;&lt;Table&gt;...</code>). Sistem akan otomatis mengekstrak seluruh mata uang (USD, EUR, JPY, SGD, CNY, AED, dll.), kurs beli, kurs jual, serta menghitung kurs tengah acuan JISDOR.
                </p>

                <textarea
                  rows={8}
                  value={biXmlText}
                  onChange={(e) => setBiXmlText(e.target.value)}
                  placeholder={`<DataSet xmlns="http://tempuri.org/">\n<diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">\n<NewDataSet xmlns="">\n<Table diffgr:id="Table1" msdata:rowOrder="0">\n  <id_subkursasing>982735</id_subkursasing>\n  <nil_subkursasing>1.00</nil_subkursasing>\n  <beli_subkursasing>17673.18</beli_subkursasing>\n  <jual_subkursasing>17850.82</jual_subkursasing>\n  <tgl_subkursasing>2026-08-28T00:00:00+07:00</tgl_subkursasing>\n  <mts_subkursasing>USD</mts_subkursasing>\n</Table>\n</NewDataSet>\n</diffgr:diffgram>\n</DataSet>`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      const sampleXml = `<DataSet xmlns="http://tempuri.org/">
<diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">
<NewDataSet xmlns="">
<Table diffgr:id="Table1" msdata:rowOrder="0">
<id_subkursasing>982735</id_subkursasing>
<lnk_subkursasing>1</lnk_subkursasing>
<nil_subkursasing>1.00</nil_subkursasing>
<beli_subkursasing>17673.18</beli_subkursasing>
<jual_subkursasing>17850.82</jual_subkursasing>
<tgl_subkursasing>2026-08-28T00:00:00+07:00</tgl_subkursasing>
<mts_subkursasing>USD</mts_subkursasing>
</Table>
<Table diffgr:id="Table2" msdata:rowOrder="1">
<id_subkursasing>982736</id_subkursasing>
<lnk_subkursasing>1</lnk_subkursasing>
<nil_subkursasing>1.00</nil_subkursasing>
<beli_subkursasing>4699.96</beli_subkursasing>
<jual_subkursasing>4972.50</jual_subkursasing>
<tgl_subkursasing>2026-08-28T00:00:00+07:00</tgl_subkursasing>
<mts_subkursasing>AED</mts_subkursasing>
</Table>
</NewDataSet>
</diffgr:diffgram>
</DataSet>`;
                      setBiXmlText(sampleXml);
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Isi Contoh XML Bank Indonesia
                  </button>

                  <button
                    onClick={handleImportBiXml}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Proses & Terapkan Data BI
                  </button>
                </div>
              </div>

              {uploadSuccess && (
                <div className="bg-emerald-950/70 border border-emerald-700/60 p-3 rounded-xl text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="bg-rose-950/70 border border-rose-700/60 p-3 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE TABLE EDITOR */}
          {activeTab === "editor" && (
            <div className="space-y-4">
              {/* Add New Row Toolbar */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Tanggal:</span>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Kurs Aktual (Rp):</span>
                  <input
                    type="number"
                    placeholder="Contoh: 16250"
                    value={newActual}
                    onChange={(e) => setNewActual(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs w-32"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Forecast (Rp):</span>
                  <input
                    type="number"
                    placeholder="Contoh: 16280"
                    value={newForecast}
                    onChange={(e) => setNewForecast(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs w-32"
                  />
                </div>

                <button
                  onClick={handleAddNewRow}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-semibold flex items-center gap-1 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Rekaman
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3 text-right">Aktual (IDR)</th>
                      <th className="py-2.5 px-3 text-right">Forecast (IDR)</th>
                      <th className="py-2.5 px-3 text-right">Error Residu</th>
                      <th className="py-2.5 px-3 text-right">95% CI</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {editableRows.slice(-60).reverse().map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-slate-300">{row.date}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400 font-mono">
                          {row.actual ? `Rp ${row.actual.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-300 font-mono">
                          {row.forecast ? `Rp ${row.forecast.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {row.residual !== null && row.residual !== undefined ? `Rp ${row.residual}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-[11px] text-slate-400 font-mono">
                          {row.lowerBound && row.upperBound ? `${row.lowerBound} - ${row.upperBound}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleDeleteRow(editableRows.length - 1 - idx)}
                            className="p-1 text-rose-400 hover:bg-rose-950/50 rounded"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CODE INTEGRATION */}
          {activeTab === "code" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  Gunakan boilerplate Python berikut pada notebook/skrip training model Anda (ARIMA, LSTM, SARIMAX, XGBoost, Prophet) untuk mengekspor data ke format dashboard ini:
                </p>
                <button
                  onClick={copyPythonCode}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Tersalin!" : "Salin Kode"}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                {getPythonExportSnippet()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Perubahan langsung tersinkronisasi ke seluruh chart dan kartu metrik error.
          </span>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Tutup & Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
