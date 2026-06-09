import React, { useState, useMemo } from "react";
import { CreditSurvey, Office, SurveyScheme, SurveyStatus } from "../types";
import { ShieldAlert, Download, Search, Filter, Sparkles, CheckCircle2, ChevronRight, FileDown, AlertTriangle } from "lucide-react";

interface EwsRiskReportProps {
  surveys: CreditSurvey[];
  offices: Office[];
  currentSession: {
    email: string;
    name: string;
    role: string;
    officeId: string;
  } | null;
}

export default function EwsRiskReport({ surveys, offices, currentSession }: EwsRiskReportProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "HIGH" | "MODERATE" | "LOW">("ALL");
  const [schemeFilter, setSchemeFilter] = useState<"ALL" | SurveyScheme>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SurveyStatus>("ALL");
  const [showOnlyWithFlags, setShowOnlyWithFlags] = useState(true);

  // Helper helper to get office details
  const getOfficeName = (officeId: string) => {
    const o = offices.find((item) => item.id === officeId);
    return o ? o.name : officeId;
  };

  const getOfficeRegion = (officeId: string) => {
    const o = offices.find((item) => item.id === officeId);
    return o ? o.region : "UNKNOWN";
  };

  // Filter logic
  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      // 1. Search term (Name, NIK, or Business Type)
      const matchesSearch =
        survey.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.nik.includes(searchTerm) ||
        (survey.businessType && survey.businessType.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. EWS Score Severity Filter
      const score = survey.ewsScore || 0;
      let matchesSeverity = true;
      if (severityFilter === "HIGH") {
        matchesSeverity = score >= 7;
      } else if (severityFilter === "MODERATE") {
        matchesSeverity = score >= 5 && score < 7;
      } else if (severityFilter === "LOW") {
        matchesSeverity = score > 0 && score < 5;
      }

      // 3. Scheme Filter
      const matchesScheme = schemeFilter === "ALL" || survey.scheme === schemeFilter;

      // 4. Status Filter
      const matchesStatus = statusFilter === "ALL" || survey.status === statusFilter;

      // 5. Trigger filter (EWS Alert Triggered is defined as ewsScore >= 5 or having explicit ewsFactors in aiAnalysis)
      const hasFlags = (score >= 5) || (survey.aiAnalysis?.ewsFactors && survey.aiAnalysis.ewsFactors.length > 0);
      const matchesFlagsCondition = !showOnlyWithFlags || hasFlags;

      return matchesSearch && matchesSeverity && matchesScheme && matchesStatus && matchesFlagsCondition;
    });
  }, [surveys, searchTerm, severityFilter, schemeFilter, statusFilter, showOnlyWithFlags]);

  // Aggregate stats from the filtered result set
  const stats = useMemo(() => {
    const highRisk = filteredSurveys.filter((s) => (s.ewsScore || 0) >= 7).length;
    const moderateRisk = filteredSurveys.filter((s) => (s.ewsScore || 0) >= 5 && (s.ewsScore || 0) < 7).length;
    const lowRisk = filteredSurveys.filter((s) => (s.ewsScore || 0) < 5).length;
    const totalPlafond = filteredSurveys.reduce((sum, s) => sum + s.requestedAmount, 0);

    return { highRisk, moderateRisk, lowRisk, totalPlafond };
  }, [filteredSurveys]);

  // Handle Export CSV (Proper RFB 4180 with UTF-8 BOM representation for Excel compability)
  const handleExportCSV = () => {
    const headers = [
      "No",
      "No Tiket / ID",
      "Nama Debitur",
      "NIK",
      "Skema Sektor",
      "Sub Sektor",
      "Kantor Unit BPR",
      "Region",
      "Plafon Diajukan (Rp)",
      "Tenor (Bulan)",
      "Skor Tingkat Risiko EWS (1-10)",
      "Status Keparahan Risiko",
      "Status Rekomendasi Kelayakan AI",
      "Daftar Faktor Detil Peringatan EWS (AI & Evaluasi Lapangan)",
      "Status Berkas"
    ];

    const rows = filteredSurveys.map((survey, index) => {
      const officeName = getOfficeName(survey.officeId);
      const region = getOfficeRegion(survey.officeId);
      const ewsScore = survey.ewsScore || 0;
      let severityLabel = "RENDAH";
      if (ewsScore >= 7) severityLabel = "TINGGI (CRITICAL)";
      else if (ewsScore >= 5) severityLabel = "MODERAT (WARNING)";

      const aiViability = survey.aiAnalysis?.businessViability || "STANDAR";
      // Sanitize arrays and join into a semi-colon safe representation
      const ewsFactorsMerged = survey.aiAnalysis?.ewsFactors && survey.aiAnalysis.ewsFactors.length > 0
        ? survey.aiAnalysis.ewsFactors.map(f => f.replace(/"/g, '""')).join("; ")
        : "Tidak ada detail risiko khusus terdeteksi";

      const subSektor = survey.sectorType || "UMUM";

      return [
        index + 1,
        survey.id,
        `"${survey.borrowerName.replace(/"/g, '""')}"`,
        `"${survey.nik}"`,
        `"${survey.scheme}"`,
        `"${subSektor}"`,
        `"${officeName.replace(/"/g, '""')}"`,
        `"${region}"`,
        survey.requestedAmount,
        survey.requestedTenor,
        ewsScore,
        `"${severityLabel}"`,
        `"${aiViability}"`,
        `"${ewsFactorsMerged}"`,
        `"${survey.status}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    
    // Add UTF-8 BOM so Excel opens with correct character encoding automatically
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    
    const fileDateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Laporan_Mitigasi_EWS_Kredit_${fileDateStr}.csv`;
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="ews-risk-container" className="space-y-6 pt-4 border-t border-slate-200 mt-6">
      {/* Header section with Clean Accent styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Portal Early Warning System (EWS)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-850 mt-1.5">Laporan Detil & Mitigasi Risiko Kredit</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
            Sistem warning otomatis yang mendeteksi rasio agunan rendah, siklus usaha musiman, atau kelayakan finansial rawan. Ekspor tabel dengan format CSV terstandarisasi untuk presentasi Komite Kredit BPR.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredSurveys.length === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4 text-emerald-400" /> Ekspor Laporan CSV
        </button>
      </div>

      {/* Aggregate Stats Bar inside EWS Portals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-rose-100 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Critical (Skor ≥ 7)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-rose-700 font-mono">{stats.highRisk}</span>
            <span className="text-[10px] text-slate-400 font-medium">berkas</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-100 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Warning (Skor 5-6)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-amber-700 font-mono">{stats.moderateRisk}</span>
            <span className="text-[10px] text-slate-400 font-medium">berkas</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">Aman / Rendah (Skor &lt; 5)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-emerald-700 font-mono">{stats.lowRisk}</span>
            <span className="text-[10px] text-slate-400 font-medium">berkas</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Total Eksposur Tersaring</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[13px] font-bold text-indigo-900 font-mono">
              Rp {stats.totalPlafond.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-750 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" /> Kontrol Filter Laporan Mitigasi
          </span>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="flags-only-toggle"
              checked={showOnlyWithFlags}
              onChange={(e) => setShowOnlyWithFlags(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <label htmlFor="flags-only-toggle" className="text-[10px] font-bold text-slate-600 select-none">
              Hanya tampilkan berkas dengan flag Peringatan EWS (Skor ≥ 5 / Peringatan AI)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* 1. Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-450" />
            <input
              type="text"
              placeholder="Cari nama debitur, NIK, tipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-1.5 rounded border border-slate-200 font-semibold focus:outline-none focus:border-indigo-600 bg-white text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* 2. Severity drop */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full text-xs rounded border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-600 font-semibold bg-white text-slate-700"
            >
              <option value="ALL">Semua Tingkat EWS</option>
              <option value="HIGH">Risiko Tinggi / Danger (EWS ≥ 7)</option>
              <option value="MODERATE">Risiko Moderat / Warning (EWS 5-6)</option>
              <option value="LOW">Risiko Rendah / Safe (EWS &lt; 5)</option>
            </select>
          </div>

          {/* 3. Scheme Filter */}
          <div>
            <select
              value={schemeFilter}
              onChange={(e) => setSchemeFilter(e.target.value as any)}
              className="w-full text-xs rounded border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-600 font-semibold bg-white text-slate-700"
            >
              <option value="ALL">Semua Skema Sektor</option>
              <option value="PJI">Komersial (PJI)</option>
              <option value="PPP">Tani/Ternak (PPP)</option>
              <option value="PAYROLL">Payroll (PNS / Karyawan)</option>
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs rounded border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-600 font-semibold bg-white text-slate-700"
            >
              <option value="ALL">Semua Status Berkas</option>
              <option value="DRAFT">Draft Lapangan</option>
              <option value="SUBMITTED_MO">Submitted (Marketing Officer)</option>
              <option value="REVIEWED_KASUBAG">Reviewed (Kasubag)</option>
              <option value="APPROVED">Selesai Disetujui (Approved)</option>
              <option value="REJECTED">Ditolak BPR (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Structured Table Frame */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-44">Debitur &amp; NIK</th>
                <th className="py-3 px-3 w-32">Unit / Region</th>
                <th className="py-3 px-3 w-32">Skema &amp; Plafon</th>
                <th className="py-3 px-3 w-28 text-center">Score EWS</th>
                <th className="py-3 px-4 min-w-[280px]">Penjelasan Indikasi EWS / Risk Flags</th>
                <th className="py-3 px-4 w-28 text-center">Status Berkas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey, index) => {
                  const ewsScore = survey.ewsScore || 0;
                  const officeName = getOfficeName(survey.officeId);
                  const regionName = getOfficeRegion(survey.officeId);

                  // Formatting badges for severity risk levels
                  let severityPillClass = "";
                  let severityText = "";
                  if (ewsScore >= 7) {
                    severityPillClass = "bg-rose-50 text-rose-700 border-rose-200";
                    severityText = "HIGH RISK";
                  } else if (ewsScore >= 5) {
                    severityPillClass = "bg-amber-50 text-amber-700 border-amber-200";
                    severityText = "MODERATE";
                  } else {
                    severityPillClass = "bg-slate-50 text-slate-600 border-slate-150";
                    severityText = "LOW ALERT";
                  }

                  // Determine status styling
                  let statusBadgeStyle = "bg-slate-50 text-slate-500 border-slate-200";
                  if (survey.status === "APPROVED") {
                    statusBadgeStyle = "bg-green-50 text-green-700 border-green-200";
                  } else if (survey.status === "REJECTED") {
                    statusBadgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                  } else if (survey.status === "REVIEWED_KASUBAG") {
                    statusBadgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  } else if (survey.status === "SUBMITTED_MO") {
                    statusBadgeStyle = "bg-sky-50 text-sky-700 border-sky-200";
                  }

                  const ewsFactors = survey.aiAnalysis?.ewsFactors || [];

                  return (
                    <tr key={survey.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3 px-4 font-mono font-bold text-center text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 leading-tight">
                          {survey.borrowerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                          NIK {survey.nik}
                        </div>
                        <div className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded inline-block mt-1 font-semibold">
                          {survey.businessType || "Karyawan / Payroll"}
                        </div>
                      </td>
                      <td className="py-3 px-3 leading-snug">
                        <div className="font-semibold text-slate-700 text-[11px] truncate max-w-[120px]" title={officeName}>
                          {officeName.replace("Kantor Kas ", "Kas ")}
                        </div>
                        <span className="text-[9px] text-indigo-600 font-bold font-mono uppercase bg-indigo-50 px-1 rounded">
                          {regionName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 font-mono">
                          Rp {survey.requestedAmount.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          Tenor: <span className="font-bold text-slate-500">{survey.requestedTenor} bulan</span>
                        </div>
                        <span className="text-[8px] tracking-wider font-bold text-slate-400 bg-slate-100/80 px-1 py-0.5 rounded uppercase mt-0.5 inline-block">
                          SEKTOR: {survey.scheme} {survey.sectorType ? `(${survey.sectorType})` : ""}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-sm font-black text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {ewsScore}<span className="text-[10px] text-slate-400 font-normal">/10</span>
                          </span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 font-sans ${severityPillClass}`}>
                            {severityText}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {ewsFactors.length > 0 ? (
                          <div className="space-y-1.5">
                            {ewsFactors.map((factor, fIdx) => {
                              const isAlert = factor.toLowerCase().includes("ews alert") || factor.toLowerCase().includes("peringatan");
                              return (
                                <div key={fIdx} className="flex items-start gap-1 text-[10px] leading-relaxed">
                                  {isAlert ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <span className={isAlert ? "text-amber-900 font-medium" : "text-slate-600"}>
                                    {factor}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] italic text-slate-400 leading-snug">
                            Tidak terdeteksi parameter peringatan risiko kritis dari analisa baseline lapangan &amp; Gemini AI scoring BPR.
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full border tracking-wide inline-block uppercase ${statusBadgeStyle}`}>
                          {survey.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium font-sans">Tidak ada berkas yang cocok dengan filter EWS Anda.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan pencarian kata kunci, tingkat keparahan risiko, atau nonaktifkan toggle filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Informational table footer matching typography standards */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Menampilkan <strong>{filteredSurveys.length}</strong> dari total <strong>{surveys.length}</strong> berkas kredit mikro.</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Model Evaluasi Berbasis Gemini AI &amp; 5C BPR Tulungagung
          </span>
        </div>
      </div>
    </div>
  );
}
