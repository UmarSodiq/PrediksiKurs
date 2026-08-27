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
  confidenceScore: number;
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
    headline: "Bank Indonesia Perkuat Kebijakan Moneter Pro-Stability & Intervensi DNDF untuk Menjaga Stabilitas Kurs Rupiah",
    summary: "Rapat Dewan Gubernur (RDG) Bank Indonesia konsisten mengoptimalkan instrumen moneter SRBI, SVBI, dan SUVBI guna menarik aliran modal asing (inflow) dan memperkuat ketahanan nilai tukar Rupiah di tengah dinamika global.",
    source: "Bank Indonesia (Live Press Releases)",
    sourceType: "official",
    publishedAt: "2026-08-27T08:15:00Z",
    timeAgo: "15 menit yang lalu",
    category: "monetary",
    categoryLabel: "Kebijakan Moneter BI",
    sentiment: "BULLISH",
    sentimentScore: 0.78,
    impactLevel: "HIGH",
    idrEffectSummary: "Meredam tekanan depresiasi IDR dan menarik foreign inflow ke instrumen SRBI/SVBI.",
    mechanismExplanation: "Suku bunga yang kompetitif mempertahankan spread yield positif terhadap obligasi AS (US Treasury) dan menekan aksi spekulasi valas di pasar domestik.",
    tags: ["#BIRate", "#SRBI", "#IntervensiDevisa", "#BankIndonesia"],
    confidenceScore: 96,
    url: "https://news.google.com/search?q=Bank+Indonesia+BI-Rate+Rupiah+terbaru&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-02",
    headline: "The Fed Beri Sinyal Arah Suku Bunga Acuan & Ekspektasi Pelonggaran Moneter Global",
    summary: "Federal Reserve AS mencermati data inflasi dan ketenagakerjaan terkini, membuka peluang pergeseran stance kebijakan moneter yang memicu pelemahan indeks Dolar global (DXY).",
    source: "Bloomberg / CNBC Market Live",
    sourceType: "international",
    publishedAt: "2026-08-27T06:30:00Z",
    timeAgo: "2 jam yang lalu",
    category: "global",
    categoryLabel: "Kebijakan The Fed & Global",
    sentiment: "BULLISH",
    sentimentScore: 0.85,
    impactLevel: "HIGH",
    idrEffectSummary: "Melemahkan indeks DXY dan memicu arus modal masuk (capital inflow) ke pasar emerging markets.",
    mechanismExplanation: "Penurunan ekspektasi imbal hasil aset USD mendorong investor global merotasi likuiditas ke aset pasar berkembang termasuk SBN dan pasar saham Indonesia.",
    tags: ["#TheFed", "#RateCut", "#DXYIndex", "#FOMC"],
    confidenceScore: 92,
    url: "https://news.google.com/search?q=The+Fed+Suku+Bunga+Kurs+Rupiah+terbaru&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-03",
    headline: "Posisi Cadangan Devisa Indonesia Tetap Kuat dan Jauh di Atas Standar Kecukupan Internasional",
    summary: "Cadangan devisa Bank Indonesia setara dengan pembiayaan di atas 6 bulan impor dan pembayaran utang luar negeri pemerintah, memberikan bantalan stabilitas makroekonomi yang solid.",
    source: "Bank Indonesia & Kemenkeu",
    sourceType: "official",
    publishedAt: "2026-08-26T14:00:00Z",
    timeAgo: "1 hari yang lalu",
    category: "fiscal",
    categoryLabel: "Cadangan Devisa & Fiskal",
    sentiment: "BULLISH",
    sentimentScore: 0.72,
    impactLevel: "HIGH",
    idrEffectSummary: "Menyediakan amunisi intervensi pasar valas yang kredibel bagi otoritas moneter.",
    mechanismExplanation: "Tingginya cadangan devisa meningkatkan kepercayaan investor institusional global terhadap solvabilitas eksternal dan peringkat utang Republik Indonesia.",
    tags: ["#CadanganDevisa", "#KetahananEksternal", "#RatingKredit"],
    confidenceScore: 95,
    url: "https://news.google.com/search?q=Cadangan+Devisa+Bank+Indonesia+terbaru&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-04",
    headline: "Dinamika Harga Minyak Mentah Brent & Pengaruhnya terhadap Neraca Energi Impor Indonesia",
    summary: "Pergerakan harga minyak internasional di bursa komoditas ICE dipantau ketat pelaku pasar terkait dampaknya terhadap beban subsidi energi dan transaksi valas korporasi migas.",
    source: "Reuters / CNBC Energy Live",
    sourceType: "international",
    publishedAt: "2026-08-27T04:20:00Z",
    timeAgo: "4 jam yang lalu",
    category: "commodity",
    categoryLabel: "Komoditas & Energi",
    sentiment: "BEARISH",
    sentimentScore: -0.62,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Meningkatkan permintaan valas korporasi migas untuk settlement impor energi.",
    mechanismExplanation: "Sebagai net-oil importer, kenaikan harga minyak global memicu kenaikan permintaan Dolar AS untuk pembelian bahan bakar dan membebani neraca transaksi berjalan.",
    tags: ["#MinyakBrent", "#Energi", "#NeracaMigas", "#InflasiImpor"],
    confidenceScore: 89,
    url: "https://news.google.com/search?q=Harga+Minyak+Mentah+Brent+Kurs+Rupiah&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-05",
    headline: "BPS: Neraca Perdagangan Indonesia Terus Mencatatkan Surplus Beruntun Ditopang Komoditas Ekspor",
    summary: "Kinerja ekspor produk manufaktur, hilirisasi tambang, dan produk pertanian konsisten menyumbang surplus perdagangan bulanan, memperkuat pasokan likuiditas devisa nasional.",
    source: "Badan Pusat Statistik (BPS)",
    sourceType: "official",
    publishedAt: "2026-08-26T11:00:00Z",
    timeAgo: "1 hari yang lalu",
    category: "fiscal",
    categoryLabel: "Perdagangan & Ekspor",
    sentiment: "BULLISH",
    sentimentScore: 0.68,
    impactLevel: "HIGH",
    idrEffectSummary: "Menjamin suplai devisa hasil ekspor (DHE) di pasar keuangan domestik.",
    mechanismExplanation: "Surplus neraca perdagangan menghasilkan pasokan Dolar riil dari aktivitas perdagangan fisik barang yang masuk ke sistem perbankan nasional.",
    tags: ["#SurplusDagang", "#BPS", "#EksporCPO", "#Hilirisasi"],
    confidenceScore: 94,
    url: "https://news.google.com/search?q=BPS+Neraca+Perdagangan+Surplus+Indonesia+terbaru&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-06",
    headline: "Pergerakan Indeks Dolar AS (DXY) dan Fluktuasi Mata Uang Kawasan Asia terhadap USD",
    summary: "Kekuatan Dolar AS di pasar global mengalami penyesuaian seiring dinamika data ekonomi negara-negara maju, memengaruhi sentimen perdagangan valuta asing Asia.",
    source: "CNBC Indonesia (Tag: Kurs Rupiah)",
    sourceType: "national",
    publishedAt: "2026-08-27T07:45:00Z",
    timeAgo: "1 jam yang lalu",
    category: "global",
    categoryLabel: "Pasar Keuangan Global",
    sentiment: "NEUTRAL",
    sentimentScore: -0.15,
    impactLevel: "LOW",
    idrEffectSummary: "Pergerakan kurs USD/IDR cenderung bergerak sideways dalam rentang tipis.",
    mechanismExplanation: "Sentimen wait-and-see pelaku pasar menahan volume transaksi agresif hingga muncul katalis makroekonomi berikutnya.",
    tags: ["#DXY", "#KursRupiah", "#PasarUang", "#CNBCIndonesia"],
    confidenceScore: 87,
    url: "https://www.cnbcindonesia.com/tag/rupiah",
  },
  {
    id: "news-07",
    headline: "Lelang Surat Berharga Negara (SBN) Catat Minat Tinggi Investor dan Penguatan Permintaan Domestik",
    summary: "Partisipasi investor dalam lelang obligasi pemerintah membuktikan stabilitas persepsi risiko fiskal dan prospek imbal hasil investasi berdenominasi Rupiah yang menarik.",
    source: "Kemenkeu DJPPR & Pasar Obligasi",
    sourceType: "official",
    publishedAt: "2026-08-25T16:30:00Z",
    timeAgo: "2 hari yang lalu",
    category: "monetary",
    categoryLabel: "Pasar Obligasi & Modal",
    sentiment: "BULLISH",
    sentimentScore: 0.65,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Arus modal masuk asing di pasar sekunder memperkuat likuiditas Rupiah.",
    mechanismExplanation: "Investor luar negeri yang membeli obligasi pemerintah mengonversi valuta asing menjadi Rupiah, menciptakan tekanan beli langsung pada spot IDR.",
    tags: ["#SBN", "#Kemenkeu", "#Oversubscribed", "#ForeignInflow"],
    confidenceScore: 91,
    url: "https://news.google.com/search?q=Lelang+SBN+Surat+Berharga+Negara+Kemenkeu+terbaru&hl=id&gl=ID&ceid=ID:id",
  },
  {
    id: "news-08",
    headline: "Kondisi Manufaktur Global & Prospek Permintaan Rantai Pasok Ekspor Komoditas Indonesia",
    summary: "Aktivitas purchasing managers index (PMI) mitra dagang utama menjadi barometer penting proyeksi volume ekspor industri dan arus penerimaan valas ke depan.",
    source: "Bisnis.com Market & Finansial",
    sourceType: "national",
    publishedAt: "2026-08-26T09:15:00Z",
    timeAgo: "1 hari yang lalu",
    category: "geopolitics",
    categoryLabel: "Ekonomi Global & Regional",
    sentiment: "BEARISH",
    sentimentScore: -0.45,
    impactLevel: "MEDIUM",
    idrEffectSummary: "Potensi penyesuaian penerimaan ekspor non-migas dalam jangka menengah.",
    mechanismExplanation: "Fluktuasi aktivitas industri mitra dagang global memengaruhi proyeksi penerimaan Dolar AS eksportir domestik.",
    tags: ["#PMIManufacturing", "#MitraDagang", "#EksporGlobal"],
    confidenceScore: 86,
    url: "https://finansial.bisnis.com/",
  },
];

export const mockSentimentTrendHistory = [
  { date: "2026-08-01", sentimentIndex: 58, usdIdr: 17740, tone: "Netral-Positif" },
  { date: "2026-08-05", sentimentIndex: 52, usdIdr: 17765, tone: "Netral" },
  { date: "2026-08-10", sentimentIndex: 44, usdIdr: 17820, tone: "Agak Negatif" },
  { date: "2026-08-14", sentimentIndex: 61, usdIdr: 17750, tone: "Positif" },
  { date: "2026-08-18", sentimentIndex: 67, usdIdr: 17720, tone: "Sangat Positif" },
  { date: "2026-08-22", sentimentIndex: 63, usdIdr: 17710, tone: "Positif" },
  { date: "2026-08-27", sentimentIndex: 71, usdIdr: 17784, tone: "Sangat Bullish IDR" },
];

export function computeSentimentMetrics(newsList: NewsSentimentItem[] = mockNewsSentimentList): SentimentMetricsSummary {
  const total = newsList.length || 1;
  const bullish = newsList.filter((n) => n.sentiment === "BULLISH").length;
  const bearish = newsList.filter((n) => n.sentiment === "BEARISH").length;
  const neutral = newsList.filter((n) => n.sentiment === "NEUTRAL").length;

  const totalScoreWeighted = newsList.reduce((acc, n) => acc + n.sentimentScore, 0);
  const avgScore = totalScoreWeighted / total;

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
