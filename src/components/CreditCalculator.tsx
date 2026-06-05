/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calculator, Download, CheckCircle, Percent, AlertCircle } from "lucide-react";

interface ScheduleRow {
  month: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endingBalance: number;
  isHarvestMonth: boolean;
}

export default function CreditCalculator() {
  const [plafon, setPlafon] = useState<number>(30000000);
  const [bungaAnualRate, setBungaAnualRate] = useState<number>(12); // in % per annum
  const [tenor, setTenor] = useState<number>(12); // months
  const [paymentType, setPaymentType] = useState<"BULANAN" | "SEASONAL">("BULANAN");
  const [seasonalPeriod, setSeasonalPeriod] = useState<number>(3); // 3, 4, 5, or 6 months

  const calculateSchedule = (): ScheduleRow[] => {
    const interestMonthlyRate = (bungaAnualRate / 100) / 12;
    const schedule: ScheduleRow[] = [];
    let currentBalance = plafon;

    if (paymentType === "BULANAN") {
      // Standard Annuity interest calculation where monthly installment is equal
      const monthlyPayment = interestMonthlyRate > 0
        ? (plafon * interestMonthlyRate * Math.pow(1 + interestMonthlyRate, tenor)) / (Math.pow(1 + interestMonthlyRate, tenor) - 1)
        : plafon / tenor;

      for (let m = 1; m <= tenor; m++) {
        const interest = currentBalance * interestMonthlyRate;
        let principalPaid = monthlyPayment - interest;
        
        // Handle rounding adjustments on final month
        if (m === tenor) {
          principalPaid = currentBalance;
        }

        const ending = Math.max(0, currentBalance - principalPaid);
        
        schedule.push({
          month: m,
          beginningBalance: Math.round(currentBalance),
          principalPaid: Math.round(principalPaid),
          interestPaid: Math.round(interest),
          totalPayment: Math.round(principalPaid + interest),
          endingBalance: Math.round(ending),
          isHarvestMonth: false,
        });
        currentBalance = ending;
      }
    } else {
      // Seasonal/Harvest Amortization Scheme:
      // - Principal is paid only during harvest months (every 3, 4, 5, or 6 months)
      // - Interest is paid MONTHLY based on outstanding principal.
      
      const numberOfHarvests = Math.floor(tenor / seasonalPeriod);
      const harvestPrincipal = numberOfHarvests > 0 ? plafon / numberOfHarvests : plafon;

      for (let m = 1; m <= tenor; m++) {
        const isHarvestMonth = m % seasonalPeriod === 0 || m === tenor;
        const interest = currentBalance * interestMonthlyRate;
        
        let principalPaid = 0;
        if (isHarvestMonth) {
          principalPaid = m === tenor ? currentBalance : harvestPrincipal;
        }

        const ending = Math.max(0, currentBalance - principalPaid);
        
        schedule.push({
          month: m,
          beginningBalance: Math.round(currentBalance),
          principalPaid: Math.round(principalPaid),
          interestPaid: Math.round(interest),
          totalPayment: Math.round(principalPaid + interest),
          endingBalance: Math.round(ending),
          isHarvestMonth,
        });
        currentBalance = ending;
      }
    }

    return schedule;
  };

  const schedule = calculateSchedule();
  const totalInterest = schedule.reduce((sum, row) => sum + row.interestPaid, 0);
  const totalPayments = plafon + totalInterest;

  const exportCSV = () => {
    let csv = "Bulan,Outstanding Awal (Rp),Bayar Pokok (Rp),Bayar Bunga (Rp),Total Angsuran (Rp),Sisa Pokok (Rp),Keterangan\n";
    schedule.forEach((row) => {
      csv += `${row.month},${row.beginningBalance},${row.principalPaid},${row.interestPaid},${row.totalPayment},${row.endingBalance},${row.isHarvestMonth ? "Panen / Pokok" : "Rutin / Bunga Saja"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Simulasi_BPR_Tulungagung_${paymentType}_Plafon_${plafon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <Calculator className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="font-bold text-slate-800 text-base">Kalkulator Simulasi Kredit Mikro (Anuitas)</h2>
          <p className="text-xs text-slate-500">Simulasi bunga anuitas untuk sektor perdagangan, perikanan & pertanian</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Input Parameters */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nominal Kredit / Plafon (Rp)
            </label>
            <input
              type="number"
              value={plafon}
              onChange={(e) => setPlafon(Number(e.target.value) || 0)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              placeholder="Contoh: 30000000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Suku Bunga Anuitas Tahunan (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={bungaAnualRate}
                onChange={(e) => setBungaAnualRate(Number(e.target.value) || 0)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">Yaitu {Math.round(bungaAnualRate / 12 * 100) / 100}% per bulan</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tenor Pinjaman (Bulan)
              </label>
              <input
                type="number"
                value={tenor}
                onChange={(e) => setTenor(Number(e.target.value) || 1)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                min="1"
                max="360"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Skema Amortisasi Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType("BULANAN")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                  paymentType === "BULANAN"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Bulanan (Rutin Pokok+Bunga)
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("SEASONAL")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                  paymentType === "SEASONAL"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Seasonal (Kontra-Panen)
              </button>
            </div>
          </div>

          {paymentType === "SEASONAL" && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <label className="block text-xs font-semibold text-indigo-900 mb-1.5">
                Frekuensi Pokok Panen (Bulan sekali)
              </label>
              <select
                value={seasonalPeriod}
                onChange={(e) => setSeasonalPeriod(Number(e.target.value))}
                className="w-full text-xs font-medium border border-indigo-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value={3}>Setiap 3 Bulan (Musiman Ternak/Padi)</option>
                <option value={4}>Setiap 4 Bulan (Tebu/Jagung Musim Rendeng)</option>
                <option value={5}>Setiap 5 Bulan</option>
                <option value={6}>Setiap 6 Bulan (Panen Tahunan/Gurame Khas)</option>
              </select>
              <div className="flex gap-1.5 mt-2 text-[10px] text-indigo-700 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <p>Pokok pinjaman akan dicicil penuh saat bulan panen. Sedangkan bunga efektif wajib dibayar rutin setiap bulan berdasarkan sisa saldo pinjaman.</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Overview Tabular */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Pokok</p>
              <p className="text-sm font-bold text-slate-800">Rp {plafon.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Bunga</p>
              <p className="text-sm font-bold text-indigo-600">Rp {totalInterest.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 text-center">
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-0.5">Total Bayar</p>
              <p className="text-sm font-bold text-indigo-700">Rp {totalPayments.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="flex-1 bg-slate-50/70 border border-slate-200 rounded-lg overflow-hidden flex flex-col h-48 md:h-52">
            <div className="bg-slate-200 px-3 py-2 border-b border-slate-300 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tabel Amortisasi</span>
              <button
                type="button"
                onClick={exportCSV}
                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
              >
                <Download className="w-3 h-3" /> Unduh Simulasi CSV
              </button>
            </div>

            <div className="flex-1 overflow-y-auto text-[11px] p-2">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-1">Bln</th>
                    <th className="pb-1 text-right">Saldo Awal</th>
                    <th className="pb-1 text-right">Bayar Pokok</th>
                    <th className="pb-1 text-right">Bayar Bunga</th>
                    <th className="pb-1 text-right">Angsuran</th>
                    <th className="pb-1 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {schedule.map((row) => (
                    <tr
                      key={row.month}
                      className={`${
                        row.isHarvestMonth ? "bg-amber-100/60 font-medium" : "hover:bg-slate-100"
                      }`}
                    >
                      <td className="py-1">
                        <span className="flex items-center gap-1">
                          {row.month}
                          {row.isHarvestMonth && (
                            <span className="bg-amber-600 text-white text-[8px] px-1 rounded font-sans font-semibold">
                              Panen
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-1 text-right">Rp {row.beginningBalance.toLocaleString("id-ID")}</td>
                      <td className="py-1 text-right text-slate-600">Rp {row.principalPaid.toLocaleString("id-ID")}</td>
                      <td className="py-1 text-right text-indigo-600">Rp {row.interestPaid.toLocaleString("id-ID")}</td>
                      <td className="py-1 text-right font-bold text-slate-800">Rp {row.totalPayment.toLocaleString("id-ID")}</td>
                      <td className="py-1 text-right">Rp {row.endingBalance.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
