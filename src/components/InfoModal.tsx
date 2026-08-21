import React from "react";
import { X, Info, Database, Activity, BarChart3, Calculator } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Metodologi & Sumber Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-8">
          
          {/* Sumber Data */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">
              <Database className="w-4 h-4 text-emerald-500" />
              1. Sumber Data Kurs
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Aplikasi ini dirancang dengan sistem <em>multi-source fallback</em> untuk menjamin ketersediaan data secara <em>real-time</em>:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900 dark:text-slate-200">Bank Indonesia (JISDOR):</strong> Nilai tukar acuan resmi dari Bank Indonesia yang menggunakan SOAP API. Digunakan sebagai referensi utama jika server BI dapat diakses.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-200">Frankfurter API:</strong> Jika server BI memblokir koneksi atau <em>timeout</em>, aplikasi secara otomatis menggunakan data dari Frankfurter, sebuah API publik berkinerja tinggi yang mengambil referensi kurs langsung dari <strong>European Central Bank (ECB)</strong>.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-200">Open Exchange Rates:</strong> Sebagai lapisan <em>fallback</em> tambahan untuk memastikan nilai spot USD/IDR tetap <em>up-to-date</em> dan dapat diandalkan setiap saat.
                </li>
              </ul>
            </div>
          </section>

          {/* Metodologi Prediksi */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-blue-500" />
              2. Metodologi Pemodelan & Prediksi
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Aplikasi ini menyediakan berbagai profil pemodelan mulai dari Ekonometrika klasik hingga algoritma Machine Learning modern:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>ARIMA & GARCH:</strong> Digunakan untuk menangkap dependensi linear dan mengestimasi volatilitas (clustering) pada fluktuasi valas harian.</li>
                <li><strong>Prophet:</strong> Baik dalam menangani musiman (seasonality) dan pergeseran tren secara fleksibel.</li>
                <li><strong>LSTM (Deep Learning):</strong> Menangkap pola non-linear kompleks jangka panjang (memori jarak jauh) pada histori kurs.</li>
                <li><strong>Hybrid/Ensemble:</strong> Menggabungkan beberapa model untuk meminimalkan kelemahan individu, umumnya menghasilkan error metrik paling optimal.</li>
              </ul>
              <p>
                Setiap nilai prediksi dalam aplikasi ini dilengkapi dengan pita keyakinan pada <strong>Confidence Level (CL) 99%</strong> yang mencerminkan batas atas dan bawah dari margin of error yang dapat ditoleransi.
              </p>
            </div>
          </section>

          {/* Perhitungan Metrik Error */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">
              <Calculator className="w-4 h-4 text-rose-500" />
              3. Metrik Evaluasi Error (Keandalan)
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>Untuk mengukur kualitas kecocokan model, sistem menggunakan 5 metrik analitik standar:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold text-slate-900 dark:text-slate-200 mb-1">MAPE</span>
                  <span className="text-xs">Mean Absolute Percentage Error. Persentase penyimpangan rata-rata prediksi dari nilai aktual. Angka di bawah 1% tergolong istimewa.</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold text-slate-900 dark:text-slate-200 mb-1">RMSE</span>
                  <span className="text-xs">Root Mean Square Error. Sangat sensitif terhadap outlier (kesalahan besar); ideal untuk mengevaluasi volatilitas ekstrem.</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold text-slate-900 dark:text-slate-200 mb-1">MAE</span>
                  <span className="text-xs">Mean Absolute Error. Deviasi absolut rata-rata dalam nominal Rupiah secara linear, tanpa bobot lebih pada outlier.</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold text-slate-900 dark:text-slate-200 mb-1">R² (R-Squared)</span>
                  <span className="text-xs">Koefisien Determinasi. Proporsi varians nilai aktual yang dapat dijelaskan oleh model. Nilai mendekati 1 sangat ideal.</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 md:col-span-2">
                  <span className="block font-bold text-slate-900 dark:text-slate-200 mb-1">MDA (Mean Directional Accuracy)</span>
                  <span className="text-xs">Mengukur frekuensi di mana model dengan tepat memprediksi arah pergerakan kurs (Naik/Turun). Sangat krusial untuk simulasi trading.</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
