/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CreditSurvey, UserSession, Office, AIAnalysis } from "../types";
import {
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, MapPin, Search, Sparkles, Plus,
  DollarSign, BarChart2, Calendar, FileSpreadsheet, RefreshCw, XCircle, ArrowRight, Layers
} from "lucide-react";

interface SurveyDashboardProps {
  surveys: CreditSurvey[];
  currentSession: UserSession;
  onSelectSurvey: (survey: CreditSurvey) => void;
  selectedSurvey: CreditSurvey | null;
  onRefreshData: () => void;
  onAddNewSurvey: () => void;
  onEditSurvey: (survey: CreditSurvey) => void;
}

const TEMPLATE_PHOTOS = {
  rumah: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
  usaha: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
  stok: "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
  agunan: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
  ktp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
  debitur: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
};

const OFFICES: Office[] = [
  // KP 1
  { id: "kp1-pusat", name: "Kantor Pusat - KP 1", region: "KP1", type: "KANTOR_PUSAT" },
  { id: "kp1-kauman", name: "Kantor Kas Kauman", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-ngantru", name: "Kantor Kas Ngantru", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-ngemplak", name: "Kantor Kas Ngemplak", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-karangrejo", name: "Kantor Kas Karangrejo", region: "KP1", type: "KANTOR_KAS" },
  // KP 2
  { id: "kp2-pusat", name: "Kantor Pusat - KP 2", region: "KP2", type: "KANTOR_PUSAT" },
  { id: "kp2-ngunut", name: "Kantor Kas Ngunut", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-kalidawir", name: "Kantor Kas Kalidawir", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-rejotangan", name: "Kantor Kas Rejotangan", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-pucanglaban", name: "Kantor Kas Pucanglaban", region: "KP2", type: "KANTOR_KAS" },
  // Cabang Campurdarat
  { id: "cab-campurdarat", name: "Kantor Cabang Campurdarat", region: "CAMPURDARAT", type: "CABANG" },
  { id: "cab-bandung", name: "Kantor Kas Bandung", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-boyolangu", name: "Kantor Kas Boyolangu", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-pakel", name: "Kantor Kas Pakel", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-ngentrong", name: "Kantor Kas Ngentrong", region: "CAMPURDARAT", type: "KANTOR_KAS" }
];

export default function SurveyDashboard({
  surveys,
  currentSession,
  onSelectSurvey,
  selectedSurvey,
  onRefreshData,
  onAddNewSurvey,
  onEditSurvey
}: SurveyDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  
  // Kasubag formulation state
  const [kasubagNotes, setKasubagNotes] = useState("");
  const [kasubagApprovedAmount, setKasubagApprovedAmount] = useState<number>(0);

  // Kabag formulation state
  const [kabagNotes, setKabagNotes] = useState("");
  const [kabagApprovedAmount, setKabagApprovedAmount] = useState<number>(0);

  // AI loading and triggers state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Helper office parsing
  const getOfficeName = (oid: string) => {
    return OFFICES.find((o) => o.id === oid)?.name || oid;
  };

  const getOfficeRegion = (oid: string) => {
    return OFFICES.find((o) => o.id === oid)?.region || "KP1";
  };

  // Filter surveys strictly based on regional jurisdiction if applicable
  // KP1 can only see/approve KP1 surveys, Campurdarat sees Campurdarat, etc.
  const filteredSurveys = surveys.filter((item) => {
    const itemRegion = getOfficeRegion(item.officeId);
    const sessionRegion = getOfficeRegion(currentSession.officeId);

    // Filter by role view jurisdiction (Rule: Kasubag/Kabag should observe their assigned region's queue)
    if (currentSession.role !== "ADMIN" && currentSession.role !== "MO") {
      if (itemRegion !== sessionRegion) {
        return false;
      }
    }

    const matchesSearch =
      item.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.includes(searchTerm);

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesRegion = regionFilter === "ALL" || itemRegion === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Calculate stats to display on nice minimal dashboard Cards
  const totalAmountSubmitted = surveys.reduce((sum, s) => sum + s.requestedAmount, 0);
  const totalQuantityApproved = surveys.filter((s) => s.status === "APPROVED").length;
  const averageScoring = Math.round(
    surveys.reduce((sum, s) => {
      const scoringTotal = s.scores5c
        ? (s.scores5c.character + s.scores5c.capacity + s.scores5c.capital + s.scores5c.collateral + s.scores5c.condition) / 5
        : 70;
      return sum + scoringTotal;
    }, 0) / (surveys.length || 1)
  );

  const handleTriggerAIAnalysis = async (sid: string) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch(`/api/surveys/${sid}/analyze`, {
        method: "POST"
      });
      if (!resp.ok) {
        throw new Error("Gagal memperoleh respon analisa cerdas Gemini.");
      }
      const data = await resp.json();
      onSelectSurvey(data);
      onRefreshData();
    } catch (err: any) {
      setAiError(err.message || "Kesalahan konektivitas AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleKasubagAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;
    try {
      const resp = await fetch(`/api/surveys/${selectedSurvey.id}/kasubag-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: kasubagNotes,
          approvedAmount: kasubagApprovedAmount || selectedSurvey.requestedAmount,
          kasubagEmail: currentSession.email
        })
      });
      if (resp.ok) {
        const updated = await resp.json();
        onSelectSurvey(updated);
        onRefreshData();
        setKasubagNotes("");
        setKasubagApprovedAmount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKabagAction = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedSurvey) return;
    try {
      const resp = await fetch(`/api/surveys/${selectedSurvey.id}/kabag-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: kabagNotes,
          approvedAmount: kabagApprovedAmount || selectedSurvey.kasubagApprovedAmount || selectedSurvey.requestedAmount,
          kabagEmail: currentSession.email
        })
      });
      if (resp.ok) {
        const updated = await resp.json();
        onSelectSurvey(updated);
        onRefreshData();
        setKabagNotes("");
        setKabagApprovedAmount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit trigger by MO to forward DRAFT to Kasubag
  const handleSubmitSurveyToReview = async (survey: CreditSurvey) => {
    try {
      const resp = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: survey.id,
          borrowerName: survey.borrowerName,
          status: "SUBMITTED_MO"
        })
      });
      if (resp.ok) {
        const updated = await resp.json();
        if (selectedSurvey && selectedSurvey.id === survey.id) {
          onSelectSurvey(updated);
        }
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data survey kredit ini?")) return;
    try {
      const resp = await fetch(`/api/surveys/${id}`, {
        method: "DELETE"
      });
      if (resp.ok) {
        onRefreshData();
        onSelectSurvey(null as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export beautiful consolidated CSV matching requirements
  const exportExcelCsv = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "ID Survey,Nama Debitur,NIK,No Telepon,Alamat,Sektor,,Target Plafon (Rp),Tenor (Bulan),Skema,Rata-rata Skor 5C,Status,Analis Lapangan,Kantor Wilayah\n";
    
    surveys.forEach((s) => {
      const sRegion = getOfficeRegion(s.officeId);
      const avg5c = s.scores5c
        ? Math.round((s.scores5c.character + s.scores5c.capacity + s.scores5c.capital + s.scores5c.collateral + s.scores5c.condition) / 5)
        : 70;
      csv += `"${s.id}","${s.borrowerName}","${s.nik}","${s.phone}","${s.address.replace(/"/g, '""')}","${s.businessType}","${s.requestedAmount}","${s.requestedTenor}","${s.scheme}","${avg5c}","${s.status}","${s.surveyorEmail}","${sRegion}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Daftar_Survey_Kredit_BPR_Tulungagung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerDirectPDFPrint = () => {
    window.print();
  };

  // Helper calculations for 5C overall display
  const getAverage5CofSurvey = (srv: CreditSurvey) => {
    if (!srv.scores5c) return 0;
    return Math.round(
      (srv.scores5c.character +
        srv.scores5c.capacity +
        srv.scores5c.capital +
        srv.scores5c.collateral +
        srv.scores5c.condition) /
        5
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: SURVEY QUEUE & FILTERS [W-80 Equivalent or xl:4 span] */}
      <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[700px]">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
              Daftar Antrian Kredit
            </h3>
            <span className="bg-indigo-150 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
              {filteredSurveys.length} Berkas
            </span>
          </div>

          <div className="space-y-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Debitur, KTP, Komoditas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Filter Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-[10px] bg-white border border-slate-250 rounded py-1 px-1.5 text-slate-600 font-medium"
                >
                  <option value="ALL">Semua Berkas</option>
                  <option value="DRAFT">DRAFT (MO)</option>
                  <option value="SUBMITTED_MO">SUBMIT (Tingkat MO)</option>
                  <option value="REVIEWED_KASUBAG">KASUBAG (Tier 1)</option>
                  <option value="APPROVED">APPROVED (KABAG)</option>
                  <option value="REJECTED">REJECTED (KABAG)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Filter Kantor</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full text-[10px] bg-white border border-slate-250 rounded py-1 px-1.5 text-slate-600 font-medium"
                >
                  <option value="ALL">Semua Wilayah</option>
                  <option value="KP1">KP 1 (Kauman, Ngantru)</option>
                  <option value="KP2">KP 2 (Ngunut, Kalidawir)</option>
                  <option value="CAMPURDARAT">Campurdarat (Bandung, Boyolangu)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Survey Queue scrollbar LIST with "Clean Minimalism" style */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 divide-dashed">
          {filteredSurveys.length > 0 ? (
            filteredSurveys.map((item) => {
              const itemAvg = getAverage5CofSurvey(item);
              const isSelected = selectedSurvey?.id === item.id;
              const hasWarnings = item.ewsScore && item.ewsScore >= 6;
              const sRegion = getOfficeRegion(item.officeId);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSurvey(item);
                    // Autofill recommendations values nicely
                    setKasubagApprovedAmount(item.kasubagApprovedAmount || item.requestedAmount);
                    setKabagApprovedAmount(item.kabagApprovedAmount || item.kasubagApprovedAmount || item.requestedAmount);
                  }}
                  className={`p-4 text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected ? "bg-indigo-50/40 border-l-4 border-indigo-600" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="font-bold text-slate-800 text-sm">{item.borrowerName}</p>
                    <span
                      className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded leading-none ${
                        item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : item.status === "REVIEWED_KASUBAG"
                          ? "bg-slate-200 text-slate-800"
                          : item.status === "SUBMITTED_MO"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                    <span className="font-mono">ID: {item.id} • {sRegion}</span>
                    <span className="font-semibold text-slate-700">Rp {item.requestedAmount.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-100">
                      {item.sectorType || "UMUM"}
                    </span>
                    <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      (item.slikStatus || "").includes("KOL-1") 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : (item.slikStatus || "").includes("KOL-2")
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>
                      {item.slikStatus ? item.slikStatus.split(" ")[0] : "KOL-1"}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs truncate italic mb-2">
                    "{item.moNotes || "Belum ada opini detail dari surveyor."}"
                  </p>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" /> Skor 5C: <strong className="text-slate-600 font-mono text-[10px]">{itemAvg}/100 ({item.scheme})</strong>
                    </span>
                    {hasWarnings ? (
                      <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px]">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> WARNING
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-semibold px-1 py-0.2 rounded text-[8px]">
                        Aman
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Tidak ada antrian pengajuan survey yang sesuai fiter atau kewenangan Anda.
            </div>
          )}
        </div>

        {/* Excel & PDF Global Download Center */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
          <button
            onClick={exportExcelCsv}
            className="w-full text-[10px] font-bold text-slate-650 bg-white border border-slate-250 py-1.5 px-2 rounded hover:bg-slate-100 flex items-center justify-center gap-1 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor Semua (.CSV)
          </button>
          
          <button
            onClick={triggerDirectPDFPrint}
            className="w-full text-[10px] font-bold text-slate-650 bg-white border border-slate-250 py-1.5 px-2 rounded hover:bg-slate-100 flex items-center justify-center gap-1 transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Cetak Semua (.PDF)
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL WORKFLOW BOARD & ANALYSES */}
      <div className="xl:col-span-8 space-y-6">
        {selectedSurvey ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[700px]">
            
            {/* Survey Header Area */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 relative print:hidden">
              <span className="text-[9px] bg-slate-250 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
                Wilayah {getOfficeRegion(selectedSurvey.officeId)} • {getOfficeName(selectedSurvey.officeId)}
              </span>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3.5 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 bg-slate-100 shrink-0">
                    <img 
                      src={selectedSurvey.photoDebitur || TEMPLATE_PHOTOS.debitur} 
                      alt="Debitur Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">
                      {selectedSurvey.borrowerName}
                    </h1>
                    <div className="text-[11px] text-slate-500 font-medium space-y-0.5 mt-0.5">
                      <div>Petugas Survey Lapangan: <span className="text-slate-700 font-semibold">{selectedSurvey.surveyorEmail}</span></div>
                      <div>No. Handphone: <span className="text-slate-755 font-mono">{selectedSurvey.phone}</span> • NIK: <span className="text-slate-755 font-mono">{selectedSurvey.nik}</span></div>
                      {selectedSurvey.address && <div className="text-slate-400 italic">Alamat: {selectedSurvey.address}</div>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3.5 items-center self-start md:self-auto uppercase tracking-wide">
                  <div className="text-center bg-white p-1 rounded-lg border border-slate-150 shadow-xs">
                    <span className="block text-[7px] font-bold text-slate-400 mb-0.5">Berkas KTP</span>
                    <a 
                      href={selectedSurvey.photoKtp || TEMPLATE_PHOTOS.ktp} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img 
                        src={selectedSurvey.photoKtp || TEMPLATE_PHOTOS.ktp} 
                        alt="KTP" 
                        className="w-14 h-8 object-cover rounded border border-slate-100 active:scale-95 transition"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                  
                  <div className="text-center bg-white p-1 rounded-lg border border-slate-150 shadow-xs">
                    <span className="block text-[7px] font-bold text-slate-400 mb-0.5">Foto diri</span>
                    <a 
                      href={selectedSurvey.photoDebitur || TEMPLATE_PHOTOS.debitur} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img 
                        src={selectedSurvey.photoDebitur || TEMPLATE_PHOTOS.debitur} 
                        alt="Debitur Face" 
                        className="w-14 h-8 object-cover rounded border border-slate-100 active:scale-95 transition"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>

                  <div className="flex gap-2 ml-2">
                    {currentSession.role === "MO" && selectedSurvey.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => onEditSurvey(selectedSurvey)}
                          className="px-3 py-1.5 text-xs font-bold border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap"
                        >
                          Ubah Form Survey
                        </button>
                        
                        <button
                          onClick={() => handleSubmitSurveyToReview(selectedSurvey)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
                        >
                          Kirim ke Atasan
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => deleteSurvey(selectedSurvey.id)}
                      className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-700 hover:bg-red-50 rounded-lg transition whitespace-nowrap"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white p-3 rounded-lg border border-slate-200/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ajuan Plafon</span>
                  <span className="font-bold text-slate-800 text-sm">Rp {selectedSurvey.requestedAmount.toLocaleString("id-ID")}</span>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-slate-200/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Disetujui Kasubag</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {selectedSurvey.kasubagApprovedAmount ? `Rp ${selectedSurvey.kasubagApprovedAmount.toLocaleString("id-ID")}` : "Menunggu"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Putusan Kabag</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {selectedSurvey.kabagApprovedAmount ? `Rp ${selectedSurvey.kabagApprovedAmount.toLocaleString("id-ID")}` : "Menunggu"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Verifikasi GPS</span>
                  <span className="text-slate-650 text-xs font-bold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Terkunci
                  </span>
                </div>
              </div>
            </div>

            {/* Main Detail Core Pane */}
            <div className="p-6 space-y-6 flex-1 bg-slate-50/20">
              
              {/* PRINTING OPTIMIZED BANNER */}
              <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4 text-center">
                <h1 className="text-xl font-bold uppercase">PT BPR Bank Tulungagung Perseroda</h1>
                <h2 className="text-xs font-semibold">LAPORAN ANALISA KREDIT MIKRO PRUDENTIAL (MODEL 5C)</h2>
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  ID: {selectedSurvey.id} • Tanggal: {new Date(selectedSurvey.createdAt).toLocaleString("id-ID")}
                </div>
              </div>

              {/* Sektor Khusus, SLIK, & LTV Agunan Stats Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-2 flex items-center justify-between">
                  <span>Verifikasi SLIK, Karakter Sektor & LTV Agunan</span>
                  <span className="text-[8px] text-slate-400 font-sans">Tulungagung Credit Rating Standard</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SLIK Card */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Riwayat SLIK (Kolektibilitas)</span>
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                        (selectedSurvey.slikStatus || "").includes("KOL-1") 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                          : (selectedSurvey.slikStatus || "").includes("KOL-2")
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}>
                        {selectedSurvey.slikStatus || "KOL-1 (LANCAR - DEFAULT)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                      Kolektibilitas menentukan tingkat scoring kelayakan Character (Watak) debitur dalam persetujuan kredit mikro.
                    </p>
                  </div>

                  {/* Sektor Teknis Card */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Klasifikasi Sektor Usaha</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase font-mono">
                          {selectedSurvey.sectorType || "UMUM"}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {selectedSurvey.businessType}
                        </span>
                      </div>

                      {/* Sector details rendering */}
                      {selectedSurvey.sectorType === "PERIKANAN" && selectedSurvey.sectorDetails && (
                        <div className="mt-2 text-[10px] text-slate-650 space-y-0.5 font-mono bg-white p-2 rounded border border-slate-100">
                          <div>• Banyak Ikan: <span className="font-bold">{selectedSurvey.sectorDetails.fishCount} ekor</span></div>
                          <div>• Berat/Ekor: <span className="font-bold">{selectedSurvey.sectorDetails.fishWeightPerUnit} Kg</span></div>
                          <div>• Total Berat: <span className="font-bold text-indigo-700">{(selectedSurvey.sectorDetails.fishCount * selectedSurvey.sectorDetails.fishWeightPerUnit).toFixed(1)} Kg</span></div>
                          <div>• Harga Jual/Kg: <span className="font-bold text-emerald-700">Rp {(selectedSurvey.sectorDetails.fishPricePerKg || 0).toLocaleString("id-ID")}</span></div>
                        </div>
                      )}

                      {selectedSurvey.sectorType === "PERTANIAN" && selectedSurvey.sectorDetails && (
                        <div className="mt-2 text-[10px] text-slate-650 space-y-0.5 font-mono bg-white p-2 rounded border border-slate-100">
                          <div>• Luas Sawah: <span className="font-bold">{selectedSurvey.sectorDetails.landSize} m²</span></div>
                          <div>• Hasil (Kg/m²): <span className="font-bold">{selectedSurvey.sectorDetails.yieldPerUnit} Kg</span></div>
                          <div>• Hasil Panen: <span className="font-bold text-indigo-700 font-mono">{(selectedSurvey.sectorDetails.landSize * selectedSurvey.sectorDetails.yieldPerUnit).toFixed(1)} Kg</span></div>
                          <div>• Harga Komoditas: <span className="font-bold text-emerald-700">Rp {(selectedSurvey.sectorDetails.pricePerKg || 0).toLocaleString("id-ID")}/Kg</span></div>
                        </div>
                      )}

                      {selectedSurvey.sectorType === "PETERNAKAN" && selectedSurvey.sectorDetails && (
                        <div className="mt-2 text-[10px] text-slate-650 space-y-0.5 font-mono bg-white p-2 rounded border border-slate-100">
                          <div>• Jumlah Ternak: <span className="font-bold">{selectedSurvey.sectorDetails.livestockCount} ekor</span></div>
                          <div>• Taksiran Nilai: <span className="font-bold text-emerald-700">Rp {(selectedSurvey.sectorDetails.livestockPrice || 0).toLocaleString("id-ID")}/ekor</span></div>
                        </div>
                      )}

                      {selectedSurvey.sectorType === "PAYROLL" && selectedSurvey.sectorDetails && (
                        <div className="mt-2 text-[10px] text-slate-650 space-y-0.5 font-mono bg-white p-2 rounded border border-slate-100">
                          <div>• Gaji Pokok: <span className="font-bold text-slate-800">Rp {(selectedSurvey.sectorDetails.payrollBaseSalary || 0).toLocaleString("id-ID")}</span></div>
                          <div>• Tunjangan Tambahan: <span className="font-bold text-emerald-700">Rp {(selectedSurvey.sectorDetails.payrollAllowances || 0).toLocaleString("id-ID")}</span></div>
                          <div>• Potongan Slip Slik: <span className="font-bold text-rose-600">Rp {(selectedSurvey.sectorDetails.payrollDeductions || 0).toLocaleString("id-ID")}</span></div>
                          <div className="border-t border-dashed border-slate-200 pt-1 mt-1 font-bold text-indigo-700">
                            • Take Home Pay: Rp {Math.max(0, (selectedSurvey.sectorDetails.payrollBaseSalary || 0) + (selectedSurvey.sectorDetails.payrollAllowances || 0) - (selectedSurvey.sectorDetails.payrollDeductions || 0)).toLocaleString("id-ID")}
                          </div>
                        </div>
                      )}

                      {(!selectedSurvey.sectorType || selectedSurvey.sectorType === "UMUM") && (
                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                          Analisis perbankan komersial standar dengan penekanan pada modal kerja tunai harian pasar.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* LTV Collateral Card */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Rasio Agunan (LTV Ratio)</span>
                      {(() => {
                        const totalColVal = selectedSurvey.collaterals && selectedSurvey.collaterals.length > 0
                          ? selectedSurvey.collaterals.reduce((sum, c) => sum + (c.value || 0), 0)
                          : (selectedSurvey.collateralValue || 0);
                        return (
                          <>
                            <div className="text-xs font-bold text-slate-800">
                              Total Taksiran: Rp {totalColVal.toLocaleString("id-ID")}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1.5 max-h-24 overflow-y-auto space-y-1 bg-white p-1.5 rounded border border-slate-100">
                              {selectedSurvey.collaterals && selectedSurvey.collaterals.length > 0 ? (
                                selectedSurvey.collaterals.map((c, i) => (
                                  <div key={c.id || i} className="border-b border-slate-100 pb-1 last:border-b-0 last:pb-0">
                                    <div className="font-bold text-indigo-700">{c.type === "SK_ASLI" ? "SK Asli Kerja" : c.type}</div>
                                    <div className="text-slate-600 truncate leading-tight">{c.description || "-"}</div>
                                    <div className="font-semibold text-emerald-700">Rp {(c.value || 0).toLocaleString("id-ID")}</div>
                                  </div>
                                ))
                              ) : (
                                <div>
                                  Jenis: <span className="font-bold">{selectedSurvey.collateralType || "TANPA_AGUNAN"}</span>
                                  <div className="truncate text-slate-600 leading-tight">{selectedSurvey.collateralDescription || "-"}</div>
                                </div>
                              )}
                            </div>

                            {totalColVal > 0 ? (
                              <div className="mt-2.5">
                                <div className="flex justify-between text-[10px] font-bold text-indigo-850">
                                  <span>Loan-to-Value (LTV):</span>
                                  <span>{((selectedSurvey.requestedAmount / totalColVal) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className={`h-full ${((selectedSurvey.requestedAmount / totalColVal) * 100) > 80 ? "bg-rose-500" : "bg-emerald-600"}`}
                                    style={{ width: `${Math.min(100, (selectedSurvey.requestedAmount / totalColVal) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-amber-700 mt-2 font-semibold">
                                {selectedSurvey.scheme === "PAYROLL" ? "Agunan Berupa SK Asli Pegawai (Tanpa LTV)" : "LTV tidak dihitung (KPA / Murni)."}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIK Active Loans Ledger Panel */}
              {selectedSurvey.slikActiveLoans && selectedSurvey.slikActiveLoans.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-2 flex items-center justify-between">
                    <span>📋 Kewajiban Bulanan Aktif di Bank/BPR/LJK Lain (Riwayat SLIK)</span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      Total: {selectedSurvey.slikActiveLoans.length} Pinjaman
                    </span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/50">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-650 uppercase font-bold border-b border-slate-200 font-sans">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Pemberi Kredit (LJK)</th>
                          <th className="py-2 px-3 text-right">Plafond Awal</th>
                          <th className="py-2 px-3 text-right">Baki Debet Sisa</th>
                          <th className="py-2 px-3 text-right">Angsuran / Bulan</th>
                          <th className="py-2 px-3 text-center">Kolektibilitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {selectedSurvey.slikActiveLoans.map((loan, lIdx) => (
                          <tr key={loan.id || lIdx} className="hover:bg-indigo-50/20 font-mono text-slate-700">
                            <td className="py-1.5 px-3 font-sans font-bold text-slate-400">{lIdx + 1}</td>
                            <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">{loan.bankName || "Lembaga Keuangan"}</td>
                            <td className="py-1.5 px-3 text-right">Rp {(loan.plafond || 0).toLocaleString("id-ID")}</td>
                            <td className="py-1.5 px-3 text-right text-rose-700 font-medium">Rp {(loan.bakidebet || 0).toLocaleString("id-ID")}</td>
                            <td className="py-1.5 px-3 text-right text-indigo-700 font-bold">Rp {(loan.monthlyInstallment || 0).toLocaleString("id-ID")}</td>
                            <td className="py-1.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-sans ${
                                (loan.collectibility || "").includes("KOL-1") || loan.collectibility === "KOL-1"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-150"
                                  : "bg-rose-50 text-rose-800 border border-rose-150"
                              }`}>
                                {loan.collectibility || "KOL-1"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5C Matriks Details Review Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-2 flex justify-between items-center">
                  <span>Analisa Kelayakan Matriks 5C ({selectedSurvey.scheme === "PAYROLL" ? "Kredit Payroll" : selectedSurvey.scheme === "PJI" ? "PJI (Komersial)" : "PPP (Pertanian)"})</span>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">Rerata: {getAverage5CofSurvey(selectedSurvey)}/100</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                  {[
                    { label: "1. Character", val: selectedSurvey.scores5c?.character, desc: selectedSurvey.scores5c?.qCharacter || "Karakter debitur dinilai baik tanpa rincian tambahan." },
                    { label: "2. Capacity", val: selectedSurvey.scores5c?.capacity, desc: selectedSurvey.scores5c?.qCapacity || "Kapasitas pembayaran dinilai memadai." },
                    { label: "3. Capital", val: selectedSurvey.scores5c?.capital, desc: selectedSurvey.scores5c?.qCapital || "Permodalan dinilai mencukupi." },
                    { label: "4. Collateral", val: selectedSurvey.scores5c?.collateral, desc: selectedSurvey.scores5c?.qCollateral || "Jaminan fisik memadai." },
                    { label: "5. Condition", val: selectedSurvey.scores5c?.condition, desc: selectedSurvey.scores5c?.qCondition || "Kondisi pasar sektoral sehat." }
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">{item.label}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-bold text-slate-850 font-mono">{item.val}/100</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (item.val ?? 0) >= 80 ? "bg-emerald-600" : (item.val ?? 0) >= 60 ? "bg-indigo-600" : "bg-rose-500"
                          }`}
                          style={{ width: `${item.val || 70}%` }}
                        ></div>
                      </div>
                      <p className="text-[9px] text-slate-400 italic mt-2 leading-tight">"{item.desc}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* GPS Geolocation Tulungagung Location Preview Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-2">
                  Peta Titik Koordinat GPS & Lokasi Geotagging
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 w-full md:w-3/5 text-xs flex flex-col justify-between h-28 font-mono">
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px] font-sans">KOORDINAT TERKUNCI (WGS84)</span>
                      <div className="font-bold text-indigo-700 text-sm mt-1">
                        Latitude: {selectedSurvey.gpsLatitude}° S • Longitude: {selectedSurvey.gpsLongitude}° E
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block text-[9px] font-sans">ALAMAT GOOGLE MAPS GRUNDING</span>
                      <span className="text-[11px] text-slate-700 leading-none">{selectedSurvey.gpsAddress}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-2/5 h-28 bg-[#E2E8F0] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                    <MapPin className="w-8 h-8 text-rose-500" />
                    <span className="text-[10px] font-bold text-slate-650 mt-1 uppercase font-mono">Tulungagung Reg. Verified</span>
                    <span className="text-[8px] text-slate-400">Precision accuracy within 12 meters</span>
                  </div>
                </div>
              </div>

              {/* Photos Gallery Row */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="border-b border-light pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Galeri Foto Kunjungan Lapangan & GPS Geotag (Minimal 4 Foto per Kategori)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Bukti foto otentik HP dengan koordinat satelit tersemat</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "1. Rumah Tinggal Debitur", key: "rumah" },
                    { label: "2. Tempat Usaha / Toko", key: "usaha" },
                    { label: "3. Stok / Hasil Panen / Komoditas", key: "stok" },
                    { label: "4. Jaminan / Agunan Fisik", key: "agunan" }
                  ].map((category) => {
                    const photos = (selectedSurvey.surveyPhotos as any)?.[category.key] || [];
                    const coords = selectedSurvey.photoCoordinates?.[category.key as "rumah"|"usaha"|"stok"|"agunan"] || [];
                    const defaultPhoto = TEMPLATE_PHOTOS[category.key as keyof typeof TEMPLATE_PHOTOS];
                    
                    const photosArray = Array.isArray(photos) ? photos : [photos, null, null, null];
                    
                    return (
                      <div key={category.key} className="border border-slate-150 rounded-lg p-3 bg-slate-50 space-y-2">
                        <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">{category.label}</span>
                        <div className="grid grid-cols-4 gap-2">
                          {photosArray.map((imgSrc, idx) => {
                            const src = imgSrc || defaultPhoto;
                            const coord = Array.isArray(coords) ? coords[idx] : (idx === 0 ? coords : null);
                            return (
                              <div key={idx} className="bg-white border border-slate-150 rounded-lg p-1 flex flex-col justify-between">
                                <div className="relative">
                                  <img
                                    src={src}
                                    alt={`${category.label} ${idx + 1}`}
                                    className="w-full h-14 sm:h-16 object-cover rounded border border-slate-100"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[6px] font-bold px-1 rounded">
                                    Slot {idx + 1}
                                  </span>
                                </div>
                                {coord && coord.lat && (
                                  <div className="mt-1 text-[7px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 px-0.5 py-0.2 rounded flex items-center justify-center gap-0.5 truncate">
                                    <MapPin className="w-1.5 h-1.5 text-emerald-600 shrink-0" />
                                    <span>{coord.lat.toFixed(4)},{coord.lng.toFixed(4)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE SECTION: Gemini AI & EWS Intelligence Card */}
              <div className="bg-indigo-950 text-white rounded-xl p-6 shadow-md transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 font-mono text-[92px] pointer-events-none select-none">AI</div>
                
                <div className="flex justify-between items-center border-b border-indigo-800 pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                    <div>
                      <h4 className="font-bold text-sm tracking-wide uppercase text-indigo-100">Evaluasi Cerdas Gemini AI & Alert EWS</h4>
                      <p className="text-[10px] text-indigo-300">Rekomendasi model prudential perbankan 5C</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerAIAnalysis(selectedSurvey.id)}
                    disabled={aiLoading}
                    className="px-3.5 py-1 text-xs bg-indigo-550 border border-indigo-500 text-indigo-100 hover:bg-indigo-500 hover:text-white rounded-lg transition font-mono font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
                    {aiLoading ? "Menganalisa..." : selectedSurvey.aiAnalysis ? "Mutakhirkan AI" : "Ekstrak Rekomendasi AI"}
                  </button>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-xs leading-relaxed text-red-200 mb-4">
                    {aiError}
                  </div>
                )}

                {selectedSurvey.aiAnalysis ? (
                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-indigo-900 pb-4">
                      <div>
                        <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block">Risk Assessment</span>
                        <span
                          className={`font-bold text-sm leading-none inline-block mt-1 ${
                            selectedSurvey.aiAnalysis.riskAssessment === "LOW" ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {selectedSurvey.aiAnalysis.riskAssessment} RISK
                        </span>
                      </div>

                      <div>
                        <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block">Confidence Scoring</span>
                        <span className="font-bold text-sm text-indigo-100 mt-1 block">{selectedSurvey.aiAnalysis.scoringModel}/100</span>
                      </div>

                      <div>
                        <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block">Kelayakan Usaha (Viability)</span>
                        <span className="font-bold text-sm text-indigo-100 mt-1 block">{selectedSurvey.aiAnalysis.businessViability}</span>
                      </div>

                      <div>
                        <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block">Kapasitas Bayar (Repayment)</span>
                        <span className="font-bold text-sm text-indigo-100 mt-1 block">{selectedSurvey.aiAnalysis.repaymentCapacity}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block mb-1">Rekomendasi Plafon AI Terhedging</span>
                      <span className="text-base font-bold text-indigo-200">
                        Rp {selectedSurvey.aiAnalysis.recommendationLimit.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="bg-indigo-900/50 p-4 border border-indigo-900/80 rounded-lg">
                      <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block mb-1.5">Laporan Opini 5C Gemini Senior Credit Analyst</span>
                      <p className="italic text-[11px] font-medium text-indigo-150 leading-relaxed font-serif">
                        "{selectedSurvey.aiAnalysis.narrativeSummary}"
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-indigo-350 text-[9px] font-bold uppercase tracking-wider block mb-1">Early Warning System (EWS) Factors Checklist</span>
                      <ul className="list-disc ml-4 space-y-1 font-sans text-xs text-indigo-200">
                        {selectedSurvey.aiAnalysis.ewsFactors.map((fact, fIdx) => (
                          <li key={fIdx}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-indigo-200 italic">
                    Belum ada analisa model 5C cerdas Gemini. Klik "Ekstrak Rekomendasi AI" di atas untuk memanggil modul perbankan cerdas.
                  </div>
                )}
              </div>

              {/* ACTION CENTER: Workflow Approval Berjenjang */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-2 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Papan Tindakan Komite & Pemutus Kredit (Approval Workflow)
                </h3>

                {/* TIER 1 ACTION: KASUBAG (Supervisor) */}
                {currentSession.role === "KASUBAG" && selectedSurvey.status === "SUBMITTED_MO" && (
                  <form onSubmit={handleKasubagAction} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-xs uppercase text-slate-505 block tracking-wider">
                      Ulasan & Rekomendasi Kasubag / Kepala Kas ({getOfficeRegion(currentSession.officeId)})
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Rekomendasi Plafon Disetujui (Rp)</label>
                        <input
                          type="number"
                          required
                          value={kasubagApprovedAmount}
                          onChange={(e) => setKasubagApprovedAmount(Number(e.target.value) || 0)}
                          className="w-full text-xs font-bold border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 bg-white text-indigo-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Catatan Supervisor Kasubag</label>
                        <input
                          type="text"
                          required
                          value={kasubagNotes}
                          onChange={(e) => setKasubagNotes(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                          placeholder="Hasil re-verifikasi lapangan..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span>Teruskan Rekomendasi ke Pemutus (Tier 2 Kabag)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* TIER 2 ACTION: KABAG (Pimpinan / Pemutus) */}
                {currentSession.role === "KABAG" && selectedSurvey.status === "REVIEWED_KASUBAG" && (
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-xs uppercase text-slate-505 block tracking-wider">
                      Formulir Keputusan Komite Final (KABAG / Pemimpin Cabang)
                    </h4>

                    <div className="space-y-4">
                      <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-150 text-xs">
                        <span className="block text-[10px] font-bold tracking-widest text-slate-400">Rekomendasi Rekap Kasubag:</span>
                        <p className="font-bold text-indigo-850 mt-1">Plafon: Rp {selectedSurvey.kasubagApprovedAmount?.toLocaleString("id-ID")}</p>
                        <p className="text-slate-505 italic mt-1 font-serif">"{selectedSurvey.kasubagNotes}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Nominal Keputusan Plafon Final (Rp)</label>
                          <input
                            type="number"
                            required
                            value={kabagApprovedAmount}
                            onChange={(e) => setKabagApprovedAmount(Number(e.target.value) || 0)}
                            className="w-full text-xs font-bold border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 bg-white text-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Notes / Syarat Pencairan Final</label>
                          <input
                            type="text"
                            required
                            value={kabagNotes}
                            onChange={(e) => setKabagNotes(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                            placeholder="Contoh: Acc disetujui, cairkan setelah kades tanda tangan..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleKabagAction("APPROVED")}
                          className="py-2 bg-emerald-650 hover:bg-emerald-700 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded flex items-center justify-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Setujui ACC Pengajuan
                        </button>

                        <button
                          type="button"
                          onClick={() => handleKabagAction("REJECTED")}
                          className="py-2 bg-red-650 hover:bg-red-750 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded flex items-center justify-center gap-1 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Tolak Berkas
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow Logs Tracker */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Log & Jalur Berkas</span>
                  
                  <div className="divide-y divide-slate-100 font-sans text-xs">
                    <div className="py-2 flex justify-between gap-4">
                      <div>
                        <strong className="text-slate-700">Tahap 1: Penginputan Survey Lapangan (MO)</strong>
                        <p className="text-slate-450 text-[11px]">Surveyor: {selectedSurvey.surveyorEmail} • Wilayah {getOfficeRegion(selectedSurvey.officeId)}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Selesai • {new Date(selectedSurvey.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>

                    <div className="py-2 flex justify-between gap-4">
                      <div>
                        <strong className="text-slate-700">Tahap 2: Re-Verifikasi Kompetensi Supervisor (KASUBAG)</strong>
                        <p className="text-slate-450 text-[11px]">
                          {selectedSurvey.kasubagNotes ? `Notes: "${selectedSurvey.kasubagNotes}"` : "Sedang diproses oleh Supervisor"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-405">
                        {selectedSurvey.kasubagActionAt ? `Selesai • ${new Date(selectedSurvey.kasubagActionAt).toLocaleDateString("id-ID")}` : "Proses"}
                      </span>
                    </div>

                    <div className="py-2 flex justify-between gap-4">
                      <div>
                        <strong className="text-slate-700">Tahap 3: Keputusan Final Komite (KABAG Kredit / Pimcab)</strong>
                        <p className="text-slate-450 text-[11px]">
                          {selectedSurvey.kabagNotes ? `Notes: "${selectedSurvey.kabagNotes}"` : "Menunggu ulasan pimpinan Cabang"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-405">
                        {selectedSurvey.kabagActionAt ? `Selesai • ${new Date(selectedSurvey.kabagActionAt).toLocaleDateString("id-ID")}` : "Proses"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center text-slate-500 italic flex flex-col items-center justify-center h-[500px]">
            <FileText className="w-12 h-12 text-slate-300 mb-2.5" />
            <p className="text-sm font-semibold text-slate-650">Silakan pilih berkas dari antrian di sebelah kiri</p>
            <p className="text-xs text-slate-400">Atau daftarkan debitur baru dengan menekan tombol "+" di bar atas</p>
          </div>
        )}
      </div>

    </div>
  );
}
