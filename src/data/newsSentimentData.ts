export interface NewsSentimentItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceType: "official" | "international" | "national";
  publishedAt: string;
  timeAgo: string;
  category: "monetary" | "global" | "commodity" | "fiscal" | "geopolitics";
  categoryLabel: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentimentScore: number; // -1.0 (Very Bearish IDR) to +1.0 (Very Bullish IDR)
  impactLevel: "HIGH" | "MEDIUM" | "LOW";
  idrEffectSummary: string;
  mechanismExplanation: string;
  tags: string[];
  confidenceScore: number; // e.g. 94%
  url: string;
}

export interface SentimentMetricsSummary {
  overallScore: number; // 0 to 100 (where > 50 is Bullish IDR)
  statusLabel: string;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  bullishPct: number;
  bearishPct: number;
  neutralPct: number;
  totalArticles: number;
  averageImpact: string;
  dominantTheme: string;
}

export const mockNewsSentimentList: NewsSentimentItem[] = [
  {
    id: "news-01",
    headline: "Bank Indonesia Pertahankan BI-Rate di 6,00% dan Perkuat Intervensi DNDF untuk Stabilisasi Rupiah",
    summary: "Rapat Dewan Gubernur (RDG) Bank Indonesia memutuskan mempertahankan suku bunga acuan dan mempertegas komitmen triple intervention di pasar spot, DNDF, dan SBN sekunder guna menjaga stabilitas nilai tukar.",
    source: "Bank Indonesia (Rilis Resmi)",
    sourceType: "official",
    publishedAt: "2026-08-27T08:15:00Z",
    timeAgo: "25 menit yang lalu",
    category: "monetary",
    categoryLabel: "Kebijakan Moneter BI",
    sentiment: "BULLISH",
    sentimentScore: 0.78,
    impactLevel: "HIGH",
    idrEffectSummary: "Menahan pelemahan Rupiah dan menarik foreign inflow ke instrumen SRBI/SVBI.",
    mechanismExplanation: "Suku bunga yang kompetitif mempertahankan spread yield positif terhadap obligasi AS (US Treasury) dan menekan aksi spekulasi valas di pasar domestik.",
    tags: ["#BIRate", "#SRBI", "#IntervensiDevisa", "#BankIndonesia"],
    confidenceScore: 96,
    url: "https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2615024.aspx",
  },
  {
    id: "news-02",
    headline: "The Fed Beri Sinyal Pelonggaran Moneter (Rate Cut) 25 bps pada Pertemuan FOMC Mendatang",
    summary: "Ketua Federal Reserve Jerome Powell mengindikasikan bahwa data inflasi inti AS yang melandai membuka ruang penurunan Fed Funds Rate lebih awal dari ekspektasi pasar.",
    source: "Bloomberg Financial",
    sourceType: "international",
    publishedAt: "2026-08-27T06:30:00Z",
    timeAgo: "2 jam yang lalu",
    category: "global",
    categoryLabel: "Kebijakan The Fed & Global",
    sentiment: "BULLISH",
    sentimentScore: 0.85,
    impactLevel: "HIGH",
    idrEffectSummary: "Melemahkan indeks DXY dan memicu arus modal masuk (capital inflow) ke pasar berkembang termasuk RI.",
    mechanismExplanation: "Penurunan suku bunga AS menurunkan daya tarik aset berbasis Dolar, mendorong investor global merotasi likuiditas ke aset berimbal hasil lebih tinggi di emerging markets.",
    tags: ["#TheFed", "#RateCut", "#DXYIndex", "#FOMC"],
    confidenceScore: 92,
    url: "https://www.bloomberg.com/markets",
  },
  {
    id: "news-03",
    headline: "Cadangan Devisa Indonesia Meningkat Menjadi USD 149,9 Miliar per Akhir Bulan",
    summary: "Posisi cadangan devisa setara dengan pembiayaan 6,8 bulan impor atau 6,6 bulan impor dan pembayaran utang luar negeri pemerintah, jauh di atas standar kecukupan internasional 3 bulan.",
    source: "Bank Indonesia Press",
    sourceType: "official",
    publishedAt: "2026-08-26T14:00:00Z",
    timeAgo: "1 hari yang lalu",
    category: "fiscal",
    categoryLabel: "Cadangan Devisa & Fiskal",
    sentiment: "BULLISH",
    sentimentScore: 0.72,
    impactLevel: "HIGH",
    idrEffectSummary: "Memperkuat amunisi Bank Indonesia untuk meredam volatilitas pasar valuta asing.",
    mechanismExplanation: "Cadangan devisa yang tebal meningkatkan persepsi kredibilitas stabilitas eksternal RI di mata lembaga pemeringkat kredit internasional (S&P, Moody's, Fitch).",
    tags: ["#CadanganDevisa", "#KetahananEksternal", "#RatingKredit"],
    confidenceScore: 95,
    url: "https://www.bi.go.id/id/statistik/ekonomi-keuangan/ssp/cadangan-devisa.aspx",
  },
  {
    id: "news-04",
    headline: "Harga Minyak Mentah Brent Naik 2,4% Akibat Ketegangan Geopolitik Jalur Distribusi Timur Tengah",
    summary: "Kekhawatiran gangguan rantai pasok minyak dunia mendorong harga Brent menembus USD 84 per barel, berpotensi membebani tagihan impor minyak Indonesia.",
    source: "Reuters Energy",
    sourceType: "international",
    publishedAt: "2026-08-27T04:20:00Z",
    timeAgo: "4 jam yang lalu",
    category: "commodity",
    categoryLabel: "Komoditas & Energi",
    sentiment: "BEARISH",
    sentimentScore: -0.62,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Meningkatkan permintaan valas korporasi migas dan memperlebar defisit neraca migas.",
    mechanismExplanation: "Sebagai net-oil importer, kenaikan harga minyak dunia memicu kenaikan kebutuhan USD untuk pembelian BBM dan menekan neraca transaksi berjalan (Current Account Deficit).",
    tags: ["#MinyakBrent", "#Energi", "#NeracaMigas", "#InflasiImpor"],
    confidenceScore: 89,
    url: "https://www.reuters.com/business/energy/",
  },
  {
    id: "news-05",
    headline: "BPS: Neraca Perdagangan RI Catat Surplus USD 2,85 Miliar, Berlanjut Selama 52 Bulan Beruntun",
    summary: "Surplus perdagangan ditopang oleh kinerja ekspor komoditas hilirisasi mineral (nikel, tembaga) dan produk turunan kelapa sawit (CPO) yang tetap resilien.",
    source: "Badan Pusat Statistik (BPS)",
    sourceType: "official",
    publishedAt: "2026-08-26T11:00:00Z",
    timeAgo: "1 hari yang lalu",
    category: "fiscal",
    categoryLabel: "Perdagangan & Ekspor",
    sentiment: "BULLISH",
    sentimentScore: 0.68,
    impactLevel: "HIGH",
    idrEffectSummary: "Menjamin suplai devisa hasil ekspor (DHE) yang konsisten di pasar keuangan domestik.",
    mechanismExplanation: "Aliran dana surplus ekspor yang terparkir dalam rekening valas domestik memberikan likuiditas devisa alami tanpa menguras cadangan devisa bank sentral.",
    tags: ["#SurplusDagang", "#BPS", "#EksporCPO", "#Hilirisasi"],
    confidenceScore: 94,
    url: "https://www.bps.go.id/id/pressrelease",
  },
  {
    id: "news-06",
    headline: "Indeks Dolar AS (DXY) Bertahan di Level 103,8 Mengantisipasi Rilis Data Tenaga Kerja Non-Farm Payrolls",
    summary: "Pelaku pasar valas global mengambil sikap *wait-and-see* menjelang rilis data tenaga kerja AS, menahan laju penguatan mata uang kawasan Asia termasuk Rupiah.",
    source: "CNBC Indonesia Market",
    sourceType: "national",
    publishedAt: "2026-08-27T07:45:00Z",
    timeAgo: "1 jam yang lalu",
    category: "global",
    categoryLabel: "Pasar Keuangan Global",
    sentiment: "NEUTRAL",
    sentimentScore: -0.15,
    impactLevel: "LOW",
    idrEffectSummary: "Pergerakan kurs USD/IDR cenderung bergerak sideways dalam rentang tipis.",
    mechanismExplanation: "Ketidakpastian arah data tenaga kerja menahan volume transaksi besar antar-bank sebelum ada kepastian sinyal fundamental baru.",
    tags: ["#DXY", "#NonFarmPayrolls", "#PasarUang", "#Sideways"],
    confidenceScore: 87,
    url: "https://www.cnbcindonesia.com/market",
  },
  {
    id: "news-07",
    headline: "Lelang Surat Berharga Negara (SBN) Catat Incoming Bids Rp 58 Triliun, Oversubscribed 2,4 Kali",
    summary: "Tingginya minat investor asing dan institusi domestik mencerminkan kepercayaan kuat terhadap fundamental makroekonomi dan pengelolaan fiskal APBN.",
    source: "Kementerian Keuangan RI (DJPPR)",
    sourceType: "official",
    publishedAt: "2026-08-25T16:30:00Z",
    timeAgo: "2 hari yang lalu",
    category: "monetary",
    categoryLabel: "Pasar Obligasi & Modal",
    sentiment: "BULLISH",
    sentimentScore: 0.65,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Arus modal masuk asing di pasar sekunder memperkuat posisi likuiditas Rupiah.",
    mechanismExplanation: "Konversi mata uang asing menjadi Rupiah oleh investor institusi luar negeri untuk membeli obligasi negara meningkatkan permintaan spot IDR.",
    tags: ["#SBN", "#Kemenkeu", "#Oversubscribed", "#ForeignInflow"],
    confidenceScore: 91,
    url: "https://www.djppr.kemenkeu.go.id/",
  },
  {
    id: "news-08",
    headline: "Kekhawatiran Perlambatan Ekonomi Manufaktur Mitra Dagang Utama Tekan Prospek Permintaan Ekspor",
    summary: "Indeks PMI manufaktur sejumlah negara mitra dagang utama mengalami kontraksi tipis ke 49,2, memicu kekhawatiran melambatnya permintaan bahan baku.",
    source: "Bisnis Indonesia",
    sourceType: "national",
    publishedAt: "2026-08-26T09:15:00Z",
    timeAgo: "1 hari yang lalu",
    category: "geopolitics",
    categoryLabel: "Ekonomi Global & Regional",
    sentiment: "BEARISH",
    sentimentScore: -0.45,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Potensi penurunan penerimaan ekspor non-migas dalam 1-2 kuartal ke depan.",
    mechanismExplanation: "Penurunan aktivitas industri manufaktur global mengurangi volume ekspor komoditas industri Indonesia.",
    tags: ["#PMIManufacturing", "#MitraDagang", "#EksporGlobal"],
    confidenceScore: 86,
    url: "https://market.bisnis.com/",
  },
];

export const mockSentimentTrendHistory = [
  { date: "2026-08-01", sentimentIndex: 58, usdIdr: 17740, tone: "Netral-Positif" },
  { date: "2026-08-05", sentimentIndex: 52, usdIdr: 17765, tone: "Netral" },
  { date: "2026-08-10", sentimentIndex: 44, usdIdr: 17820, tone: "Agak Negatif" },
  { date: "2026-08-14", sentimentIndex: 61, usdIdr: 17750, tone: "Positif" },
  { date: "2026-08-18", sentimentIndex: 67, usdIdr: 17720, tone: "Sangat Positif" },
  { date: "2026-08-22", sentimentIndex: 63, usdIdr: 17710, tone: "Positif" },
  { date: "2026-08-27", sentimentIndex: 71, usdIdr: 17705, tone: "Sangat Bullish IDR" },
];

export function computeSentimentMetrics(newsList: NewsSentimentItem[] = mockNewsSentimentList): SentimentMetricsSummary {
  const total = newsList.length || 1;
  const bullish = newsList.filter((n) => n.sentiment === "BULLISH").length;
  const bearish = newsList.filter((n) => n.sentiment === "BEARISH").length;
  const neutral = newsList.filter((n) => n.sentiment === "NEUTRAL").length;

  const totalScoreWeighted = newsList.reduce((acc, n) => acc + n.sentimentScore, 0);
  const avgScore = totalScoreWeighted / total; // between -1 and +1

  // Map to 0-100 gauge (0 = Extreme Bearish IDR, 50 = Neutral, 100 = Extreme Bullish IDR)
  const overallScore = Math.round(((avgScore + 1) / 2) * 100);

  let statusLabel = "Netral";
  if (overallScore >= 70) statusLabel = "Sangat Bullish (Menguatkan IDR)";
  else if (overallScore >= 55) statusLabel = "Cenderung Bullish IDR";
  else if (overallScore >= 45) statusLabel = "Netral / Berimbang";
  else if (overallScore >= 30) statusLabel = "Cenderung Bearish IDR";
  else statusLabel = "Sangat Bearish (Menekan IDR)";

  return {
    overallScore,
    statusLabel,
    bullishCount: bullish,
    bearishCount: bearish,
    neutralCount: neutral,
    bullishPct: Number(((bullish / total) * 100).toFixed(1)),
    bearishPct: Number(((bearish / total) * 100).toFixed(1)),
    neutralPct: Number(((neutral / total) * 100).toFixed(1)),
    totalArticles: newsList.length,
    averageImpact: "Tinggi (Volatilitas Terkendali)",
    dominantTheme: "Kebijakan Moneter BI & Ekspektasi Penurunan Bunga The Fed",
  };
}
