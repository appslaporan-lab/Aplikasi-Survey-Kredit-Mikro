/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CreditSurvey, FieldUser, UserSession, Office, SurveyScheme } from "./types";
import CreditCalculator from "./components/CreditCalculator";
import UserApprovalManager from "./components/UserApprovalManager";
import CreditSurveyForm from "./components/CreditSurveyForm";
import SurveyDashboard from "./components/SurveyDashboard";

import {
  ShieldAlert, Sparkles, Plus, BarChart2, BookOpen, Layers,
  Fingerprint, MonitorPlay, RefreshCw, Layers3, CheckCircle, Smartphone
} from "lucide-react";

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

export default function App() {
  // Navigation active tabs
  const [currentTab, setCurrentTab] = useState<"DASHBOARD" | "CALCULATOR" | "ACCESS" | "ANALYTICS">("DASHBOARD");

  // Multi-user & Sessions state
  // Initial fallback to Kurniawan (MO)
  const [currentSession, setCurrentSession] = useState<UserSession | null>({
    email: "mo.kurniawan@banktulungagung.co.id",
    name: "Kurniawan (MO KP1)",
    role: "MO",
    nik: "3504121508940002",
    officeId: "kp1-kauman",
    status: "APPROVED"
  });

  const [surveys, setSurveys] = useState<CreditSurvey[]>([]);
  const [usersList, setUsersList] = useState<FieldUser[]>([]);
  
  // View states
  const [selectedSurvey, setSelectedSurvey] = useState<CreditSurvey | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<CreditSurvey | null>(null);

  // Mobile viewport PWA simulator filter
  const [simulateMobilePhone, setSimulateMobilePhone] = useState(false);

  const fetchSurveys = async () => {
    try {
      const r = await fetch("/api/surveys");
      if (r.ok) {
        const data = await r.ok ? await r.json() : [];
        setSurveys(data);
        if (data.length > 0 && !selectedSurvey) {
          // Auto select first
          setSelectedSurvey(data[0]);
        }
      }
    } catch (e) {
      console.warn("Surveys load failed, offline mode", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const r = await fetch("/api/users");
      if (r.ok) {
        const data = await r.json();
        setUsersList(data);
      }
    } catch (e) {
      console.warn("Users load failed", e);
    }
  };

  const handleResetApplicationData = async () => {
    if (!confirm("Konfirmasi Reset: Apakah Anda yakin ingin mengembalikan seluruh database ke benih awal (Seed)?")) return;
    try {
      const r = await fetch("/api/reset-data", { method: "POST" });
      if (r.ok) {
        const data = await r.json();
        setSurveys(data.surveys);
        setUsersList(data.users);
        setSelectedSurvey(data.surveys[0] || null);
        alert("Database perbankan berhasil diset ulang!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSurveys();
    fetchUsers();
  }, []);

  const handleSurveySaved = () => {
    setIsAddingNew(false);
    setSurveyToEdit(null);
    fetchSurveys();
  };

  const getOfficeRegion = (oid: string) => {
    return OFFICES.find(o => o.id === oid)?.region || "KP1";
  };

  // Aggregated analytics values
  const countPlafonAgricultural = surveys
    .filter(s => s.scheme === "PPP")
    .reduce((sum, s) => sum + s.requestedAmount, 0);

  const countPlafonKomersial = surveys
    .filter(s => s.scheme === "PJI")
    .reduce((sum, s) => sum + s.requestedAmount, 0);

  const totalOutstanding = countPlafonAgricultural + countPlafonKomersial;

  const countWarningFlag = surveys.filter(s => s.ewsScore && s.ewsScore >= 6).length;

  const averageScoring = Math.round(
    surveys.reduce((sum, s) => {
      const scoringTotal = s.scores5c
        ? (s.scores5c.character + s.scores5c.capacity + s.scores5c.capital + s.scores5c.collateral + s.scores5c.condition) / 5
        : 70;
      return sum + scoringTotal;
    }, 0) / (surveys.length || 1)
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* Top Header Matching Clean Minimalism Template */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layers3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-850">KreditMikro Pro</span>
            <span className="text-[10px] block font-semibold text-indigo-700 uppercase tracking-widest leading-none">BPR Bank Tulungagung</span>
          </div>
        </div>

        {/* Responsive Navigation matching Clean Minimalism */}
        <nav className="hidden md:flex gap-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <button
            onClick={() => {
              setCurrentTab("DASHBOARD");
              setIsAddingNew(false);
              setSurveyToEdit(null);
            }}
            className={`pb-5 pt-5 border-b-2 transition ${
              currentTab === "DASHBOARD" ? "text-indigo-650 border-indigo-600 font-bold" : "border-transparent hover:text-slate-850"
            }`}
          >
            Antrian Survey & Persetujuan
          </button>
          
          <button
            onClick={() => {
              setCurrentTab("CALCULATOR");
              setIsAddingNew(false);
              setSurveyToEdit(null);
            }}
            className={`pb-5 pt-5 border-b-2 transition ${
              currentTab === "CALCULATOR" ? "text-indigo-650 border-indigo-600 font-bold" : "border-transparent hover:text-slate-850"
            }`}
          >
            Aplikasi Kalkulator Kredit
          </button>

          <button
            onClick={() => {
              setCurrentTab("ACCESS");
              setIsAddingNew(false);
              setSurveyToEdit(null);
            }}
            className={`pb-5 pt-5 border-b-2 transition ${
              currentTab === "ACCESS" ? "text-indigo-650 border-indigo-600 font-bold" : "border-transparent hover:text-slate-850"
            }`}
          >
            Manajemen Akses Pegawai
          </button>

          <button
            onClick={() => {
              setCurrentTab("ANALYTICS");
              setIsAddingNew(false);
              setSurveyToEdit(null);
            }}
            className={`pb-5 pt-5 border-b-2 transition ${
              currentTab === "ANALYTICS" ? "text-indigo-650 border-indigo-600 font-bold" : "border-transparent hover:text-slate-850"
            }`}
          >
            Analitik Portfolio & Region
          </button>
        </nav>

        {/* Session Info Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSimulateMobilePhone(!simulateMobilePhone)}
            className={`p-2 rounded-lg border flex items-center gap-1.5 transition text-[11px] font-bold uppercase tracking-wider ${
              simulateMobilePhone
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Simulasi Phone</span>
          </button>

          {currentSession ? (
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{currentSession.name}</p>
                <div className="flex gap-1 justify-end">
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded font-bold">{currentSession.role}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{getOfficeRegion(currentSession.officeId)}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                {currentSession.name.charAt(0)}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCurrentTab("ACCESS")}
              className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-md hover:bg-indigo-700 transition"
            >
              Pilih Sesi
            </button>
          )}
        </div>
      </header>

      {/* Main App Workspace Container Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Real-time Alerts / Early Warning system dashboard for Komite Kredit */}
        {countWarningFlag > 0 && currentTab === "DASHBOARD" && (
          <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl flex items-start gap-3 text-amber-900 text-xs shadow-xs leading-relaxed print:hidden">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold text-[13px] text-amber-950 block mb-1">Peringatan Portofolio Kredit Mikro Aktif (EWS System Alert)</strong>
              <p>
                Terdeteksi sebanyak <strong>{countWarningFlag} pengajuan/analis lapangan</strong> yang memicu peringatan risiko moderat hingga tinggi berdasarkan parameter agunan yang kurang menutup plafon (collateral ratio) atau umur riwayat operasional usaha mikro yang masih di bawah standar 2 tahun. Silakan filter antrian dengan opsi warning.
              </p>
            </div>
            <button
              onClick={handleResetApplicationData}
              className="text-[10px] font-bold text-amber-800 bg-white border border-amber-200 rounded px-2.5 py-1 hover:bg-amber-100"
            >
              Reset Data Seed BPR
            </button>
          </div>
        )}

        {/* Dynamic Core views layout wrapper */}
        <div className={simulateMobilePhone ? "max-w-[420px] mx-auto border-8 border-slate-800 rounded-3xl shadow-2xl p-4 bg-slate-50 relative min-h-[750px] overflow-hidden" : ""}>
          {simulateMobilePhone && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-full z-40 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-black"></span>
            </div>
          )}

          {currentTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs print:hidden">
                <div>
                  <h2 className="text-sm font-bold text-slate-850">Antrian Berkas Survey Lapangan</h2>
                  <p className="text-xs text-slate-400">Verifikasi berkas, geotagging, manual skoring 5C, dan persetujuan bertingkat.</p>
                </div>

                {currentSession?.role === "MO" && !isAddingNew && !surveyToEdit && (
                  <button
                    onClick={() => {
                      setSurveyToEdit(null);
                      setIsAddingNew(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" /> Register Survey Baru
                  </button>
                )}
              </div>

              {isAddingNew || surveyToEdit ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <CreditSurveyForm
                    currentSession={currentSession!}
                    onSurveySaved={handleSurveySaved}
                    surveyToEdit={surveyToEdit}
                    onCancel={() => {
                      setIsAddingNew(false);
                      setSurveyToEdit(null);
                    }}
                  />
                </div>
              ) : (
                <SurveyDashboard
                  surveys={surveys}
                  currentSession={currentSession!}
                  selectedSurvey={selectedSurvey}
                  onSelectSurvey={(srv) => setSelectedSurvey(srv)}
                  onRefreshData={fetchSurveys}
                  onAddNewSurvey={() => setIsAddingNew(true)}
                  onEditSurvey={(srv) => setSurveyToEdit(srv)}
                />
              )}
            </div>
          )}

          {currentTab === "CALCULATOR" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                <h2 className="text-sm font-bold text-slate-850">Kalkulasi Bunga Efektif Bertahap & Panen</h2>
                <p className="text-xs text-slate-400">Gunakan simulator di bawah ini untuk menghitung sisa angsuran panen berkala (sistem pelunasan bertahap 3-6 bulanan).</p>
              </div>
              <CreditCalculator />
            </div>
          )}

          {currentTab === "ACCESS" && (
            <div className="space-y-4">
              <UserApprovalManager
                currentSession={currentSession}
                onSetSession={(sess) => {
                  setCurrentSession(sess);
                  // Ensure we clear adding views to prevent errors
                  setIsAddingNew(false);
                  setSurveyToEdit(null);
                }}
                usersList={usersList}
                onRefreshUsers={fetchUsers}
              />
            </div>
          )}

          {currentTab === "ANALYTICS" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Analisis Kualitatif & Kelayakan Agregat BPR</h2>
                <p className="text-xs text-slate-500">Keseimbangan penyaluran kredit antara sektor Komersial (PJI) dan Pertanian (PPP) Tulungagung</p>
              </div>

              {/* Bento Grid Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual Chart 1: Sektor Portfolio Breakdown */}
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Distribusi Penyaluran Dana</span>
                    <strong className="text-sm text-slate-750 block mt-1">Sektor PPP vs Komersil</strong>
                  </div>

                  {/* Manual Polished SVG Bar Chart for ultimate compilation safety */}
                  <div className="flex-1 flex items-end justify-center gap-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-700" style={{ height: `${totalOutstanding > 0 ? (countPlafonKomersial / totalOutstanding) * 120 : 60}px` }}></div>
                      <span className="text-[9px] font-bold text-slate-600 mt-2">Komersial (PJI)</span>
                      <span className="text-[10px] font-mono font-medium text-indigo-700">Rp {countPlafonKomersial.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-10 bg-emerald-600 rounded-t-lg transition-all hover:bg-emerald-700" style={{ height: `${totalOutstanding > 0 ? (countPlafonAgricultural / totalOutstanding) * 120 : 40}px` }}></div>
                      <span className="text-[9px] font-bold text-slate-600 mt-2">Tani/Ternak (PPP)</span>
                      <span className="text-[10px] font-mono font-medium text-emerald-700">Rp {countPlafonAgricultural.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-450 border-t border-slate-200 pt-2 text-center">
                    Total Portofolio Active: <strong>Rp {totalOutstanding.toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                {/* Visual Chart 2: Regional Performance Index */}
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Index Kelayakan Berdasar Region</span>
                    <strong className="text-sm text-slate-750 block mt-1">Rata-rata Kelayakan Rerata 5C</strong>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-3.5 py-2">
                    {[
                      { reg: "KP 1 (Kauman, Ngantru)", val: 86, color: "bg-indigo-600" },
                      { reg: "KP 2 (Ngunut, Kalidawir)", val: 78, color: "bg-indigo-500" },
                      { reg: "Campurdarat (Bandung/Boyolangu)", val: 81, color: "bg-emerald-600" }
                    ].map((idxItem) => (
                      <div key={idxItem.reg} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-600">
                          <span>{idxItem.reg}</span>
                          <span className="font-bold">{idxItem.val}/100</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${idxItem.color}`} style={{ width: `${idxItem.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-450 border-t border-slate-200 pt-2 text-center">
                    Indeks Kelayakan BPR: <strong>{averageScoring}/100 (Optimal)</strong>
                  </div>
                </div>

                {/* Visual Chart 3: Warning Levels & Portfolio Risk */}
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Indikator Early Warning System (EWS)</span>
                    <strong className="text-sm text-slate-750 block mt-1">Tingkat Risiko Portofolio</strong>
                  </div>

                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-28 h-28 rounded-full border-8 border-slate-200 relative flex flex-col items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent transition-transform duration-500" style={{ transform: "rotate(45deg)" }}></div>
                      <span className="text-xl font-bold text-slate-800 font-mono">
                        {Math.round((countWarningFlag / (surveys.length || 1)) * 100)}%
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">Terindikasi</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-450 border-t border-slate-200 pt-2 text-center">
                    Rasio Peringatan: <strong>{countWarningFlag} pengajuan memicu EWS</strong>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </main>

      {/* Bottom Status Footer Matching Clean Minimalism */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 shrink-0 text-[10px] text-slate-500 print:hidden mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Sistem Geotagging & Database BPR Terkoneksi
          </div>
          <div>Unit Kerja: BPR Bank Tulungagung Perseroda</div>
        </div>
        <div className="text-slate-400 italic">
          BPR Bank Tulungagung KreditMikro Engine • v3.0.0 Stable
        </div>
      </footer>

    </div>
  );
}
