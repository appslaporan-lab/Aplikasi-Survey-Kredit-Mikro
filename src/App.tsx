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
import EwsRiskReport from "./components/EwsRiskReport";
import MobileDeviceFrame from "./components/MobileDeviceFrame";
import MobileAuth from "./components/MobileAuth";

import {
  ShieldAlert, Sparkles, Plus, BarChart2, BookOpen, Layers,
  Fingerprint, MonitorPlay, RefreshCw, Layers3, CheckCircle, Smartphone, LogOut
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
  // Initialize from localStorage to maintain persistent session
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("bpr_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Start logged-out to showcase the luxury mobile auth screen first
  });

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("bpr_session", JSON.stringify(currentSession));
    } else {
      localStorage.removeItem("bpr_session");
    }
  }, [currentSession]);

  const [surveys, setSurveys] = useState<CreditSurvey[]>([]);
  const [usersList, setUsersList] = useState<FieldUser[]>([]);
  
  // View states
  const [selectedSurvey, setSelectedSurvey] = useState<CreditSurvey | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<CreditSurvey | null>(null);

  // Mobile viewport PWA simulator filter - default to true!
  const [simulateMobilePhone, setSimulateMobilePhone] = useState(true);

  const fetchSurveys = async () => {
    try {
      const r = await fetch("/api/surveys");
      if (r.ok) {
        const data = await r.json();
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

  // If the user is logged out, render the authentication screens inside the mobile frame
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-slate-100/85 bg-[radial-gradient(#c5cae9_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center py-6 px-4">
        {/* Descriptive greeting message on desktop */}
        <div className="hidden lg:flex flex-col items-center text-center mb-5 max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              Portal Kredit Mikro Digital Active
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Gunakan smartphone simulator di bawah untuk masuk, logout, atau mendaftarkan akun pegawai baru.
          </p>
        </div>

        <MobileDeviceFrame isFullscreen={false} onToggleFullscreen={() => {}}>
          <MobileAuth
            usersList={usersList}
            offices={OFFICES}
            onSetSession={setCurrentSession}
            onRefreshUsers={fetchUsers}
          />
        </MobileDeviceFrame>
        
        <div className="mt-2 text-[10px] text-slate-400 font-medium text-center font-sans">
          © {new Date().getFullYear()} BPR Bank Tulungagung Perseroda. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* Top Header displayed on Wide layouts */}
      {!simulateMobilePhone && (
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSimulateMobilePhone(true)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition text-[11px] font-bold uppercase tracking-wider"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulasi Handphone</span>
            </button>

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
              <button
                onClick={() => {
                  setCurrentSession(null);
                  setCurrentTab("DASHBOARD");
                  setIsAddingNew(false);
                  setSurveyToEdit(null);
                  setSimulateMobilePhone(true);
                }}
                className="text-[10px] font-black text-rose-600 border border-rose-250 bg-rose-50 hover:bg-rose-100 rounded px-2.5 py-1 transition flex items-center gap-1"
                title="Keluar / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>KELUAR</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Dynamic Viewport Switcher */}
      {simulateMobilePhone ? (
        /* Render everything inside the stunning virtual handset chassis mockup */
        <MobileDeviceFrame isFullscreen={false} onToggleFullscreen={() => setSimulateMobilePhone(false)}>
          {/* Mobile Header Inside Screen Display */}
          <div className="bg-indigo-900 text-white p-4 shrink-0 shadow-sm flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                <Layers3 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-[12px] uppercase tracking-wide block">KreditMikro Pro</span>
                <span className="text-[8px] text-indigo-250 block uppercase tracking-wider font-semibold">TULUNGAGUNG</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-indigo-950/60 p-1 px-2 rounded-lg text-right">
                <p className="text-[9px] font-extrabold leading-none truncate max-w-[90px]">{currentSession.name.split(" ")[0]}</p>
                <span className="text-[7px] text-amber-400 font-black tracking-wide uppercase leading-none mt-0.5 inline-block">{currentSession.role}</span>
              </div>
              
              {/* Logout inside Mobile viewport */}
              <button
                onClick={() => {
                  setCurrentSession(null);
                  setCurrentTab("DASHBOARD");
                  setIsAddingNew(false);
                  setSurveyToEdit(null);
                  setSimulateMobilePhone(true);
                }}
                className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center justify-center transition border border-rose-500/20"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Content loaded inside phone container viewport */}
          <div className="p-3.5 space-y-4">
            
            {/* Quick Greeting / Active Branch Info Board */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs mb-1">
              <p className="text-slate-400 font-semibold tracking-wider uppercase text-[8px]">Unit Operasi</p>
              <p className="font-bold text-slate-800 text-[11px] mt-0.5">{OFFICES.find(o => o.id === currentSession.officeId)?.name || currentSession.officeId}</p>
            </div>

            {currentTab === "DASHBOARD" && (
              <div className="space-y-4">
                {currentSession?.role === "MO" && !isAddingNew && !surveyToEdit && (
                  <button
                    onClick={() => {
                      setSurveyToEdit(null);
                      setIsAddingNew(true);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" /> Register Survey Baru
                  </button>
                )}

                {isAddingNew || surveyToEdit ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                    <CreditSurveyForm
                      currentSession={currentSession}
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
                    currentSession={currentSession}
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
              <div className="space-y-4 text-xs">
                <CreditCalculator />
              </div>
            )}

            {currentTab === "ACCESS" && (
              <div className="space-y-4 text-xs">
                <UserApprovalManager
                  currentSession={currentSession}
                  onSetSession={(sess) => {
                    setCurrentSession(sess);
                    setIsAddingNew(false);
                    setSurveyToEdit(null);
                  }}
                  usersList={usersList}
                  onRefreshUsers={fetchUsers}
                />
              </div>
            )}

            {currentTab === "ANALYTICS" && (
              <div className="space-y-5 text-xs">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-850">Seimbang Penyaluran Kredit</h2>
                  
                  {/* SVG Bar Chart adjusted for beautiful mobile phone screen fit */}
                  <div className="flex items-end justify-center gap-6 py-2 border-b border-slate-100 pb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 bg-indigo-600 rounded-t" style={{ height: `${totalOutstanding > 0 ? (countPlafonKomersial / totalOutstanding) * 75 : 40}px` }}></div>
                      <span className="text-[8px] font-bold text-slate-600 mt-1">Komersial</span>
                      <span className="text-[9px] font-mono font-bold text-indigo-700">Rp {countPlafonKomersial.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-7 bg-emerald-600 rounded-t" style={{ height: `${totalOutstanding > 0 ? (countPlafonAgricultural / totalOutstanding) * 75 : 30}px` }}></div>
                      <span className="text-[8px] font-bold text-slate-600 mt-1">Tani/Ternak</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700">Rp {countPlafonAgricultural.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-550 font-medium text-center">
                    Total Sektor: <span className="font-extrabold text-slate-800">Rp {totalOutstanding.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <EwsRiskReport
                  surveys={surveys}
                  offices={OFFICES}
                  currentSession={currentSession}
                />
              </div>
            )}

          </div>

          {/* Smartphone display Inside Bottom Tab Navigator Bar */}
          <div className="absolute bottom-5 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 z-40 select-none pb-1">
            <button
              onClick={() => {
                setCurrentTab("DASHBOARD");
                setIsAddingNew(false);
                setSurveyToEdit(null);
              }}
              className={`flex flex-col items-center justify-center p-1 font-sans ${
                currentTab === "DASHBOARD" ? "text-indigo-650" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[8px] font-bold tracking-tight mt-1">Antrian</span>
            </button>
            
            <button
              onClick={() => {
                setCurrentTab("CALCULATOR");
                setIsAddingNew(false);
                setSurveyToEdit(null);
              }}
              className={`flex flex-col items-center justify-center p-1 font-sans ${
                currentTab === "CALCULATOR" ? "text-indigo-655" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-[8px] font-bold tracking-tight mt-1">Kalkulator</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab("ACCESS");
                setIsAddingNew(false);
                setSurveyToEdit(null);
              }}
              className={`flex flex-col items-center justify-center p-1 font-sans ${
                currentTab === "ACCESS" ? "text-indigo-655" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span className="text-[8px] font-bold tracking-tight mt-1">Akses</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab("ANALYTICS");
                setIsAddingNew(false);
                setSurveyToEdit(null);
              }}
              className={`flex flex-col items-center justify-center p-1 font-sans ${
                currentTab === "ANALYTICS" ? "text-indigo-655" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="text-[8px] font-bold tracking-tight mt-1">Analitik</span>
            </button>
          </div>
        </MobileDeviceFrame>
      ) : (
        /* Widescreen Desktop Mode Layout wrapper */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Real-time Alerts / Early Warning system dashboard for Komite Kredit */}
          {countWarningFlag > 0 && currentTab === "DASHBOARD" && (
            <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl flex items-start gap-3 text-amber-900 text-xs shadow-xs leading-relaxed print:hidden">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold text-[13px] text-amber-900 block mb-1 font-sans">Peringatan Portofolio Kredit Mikro Aktif (EWS System Alert)</strong>
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

          <div className="space-y-6">
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
                      currentSession={currentSession}
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
                    currentSession={currentSession}
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
                  <h2 className="text-base font-bold text-slate-800 font-sans">Analisis Kualitatif & Kelayakan Agregat BPR</h2>
                  <p className="text-xs text-slate-500 font-sans">Keseimbangan penyaluran kredit antara sektor Komersial (PJI) dan Pertanian (PPP) Tulungagung</p>
                </div>

                {/* Bento Grid Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Visual Chart 1: Sektor Portfolio Breakdown */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Distribusi Penyaluran Dana</span>
                      <strong className="text-sm text-slate-750 block mt-1 font-sans">Sektor PPP vs Komersil</strong>
                    </div>

                    <div className="flex-1 flex items-end justify-center gap-6 py-4 font-sans">
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-700" style={{ height: `${totalOutstanding > 0 ? (countPlafonKomersial / totalOutstanding) * 120 : 60}px` }}></div>
                        <span className="text-[9px] font-bold text-slate-600 mt-2 font-sans">Komersial (PJI)</span>
                        <span className="text-[10px] font-mono font-medium text-indigo-700">Rp {countPlafonKomersial.toLocaleString("id-ID")}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-emerald-600 rounded-t-lg transition-all hover:bg-emerald-700" style={{ height: `${totalOutstanding > 0 ? (countPlafonAgricultural / totalOutstanding) * 120 : 40}px` }}></div>
                        <span className="text-[9px] font-bold text-slate-600 mt-2 font-sans">Tani/Ternak (PPP)</span>
                        <span className="text-[10px] font-mono font-medium text-emerald-700">Rp {countPlafonAgricultural.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-450 border-t border-slate-200 pt-2 text-center font-sans">
                      Total Portofolio Active: <strong>Rp {totalOutstanding.toLocaleString("id-ID")}</strong>
                    </div>
                  </div>

                  {/* Visual Chart 2: Regional Performance Index */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64 font-sans">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Index Kelayakan Berdasar Region</span>
                      <strong className="text-sm text-slate-750 block mt-1 font-sans">Rata-rata Kelayakan Rerata 5C</strong>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-3.5 py-2">
                      {[
                        { reg: "KP 1 (Kauman, Ngantru)", val: 86, color: "bg-indigo-600" },
                        { reg: "KP 2 (Ngunut, Kalidawir)", val: 78, color: "bg-indigo-505" },
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
                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-64 font-sans">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Indikator Early Warning System (EWS)</span>
                      <strong className="text-sm text-slate-750 block mt-1 font-sans">Tingkat Risiko Portofolio</strong>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 font-sans">
                      <div className="w-28 h-28 rounded-full border-8 border-slate-200 relative flex flex-col items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent transition-transform duration-500" style={{ transform: "rotate(45deg)" }}></div>
                        <span className="text-xl font-bold text-slate-850 font-mono">
                          {Math.round((countWarningFlag / (surveys.length || 1)) * 100)}%
                        </span>
                        <span className="text-[8px] text-slate-450 uppercase font-bold text-center">Terindikasi</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-450 border-t border-slate-200 pt-2 text-center">
                      Rasio Peringatan: <strong>{countWarningFlag} pengajuan memicu EWS</strong>
                    </div>
                  </div>

                </div>

                {/* Detailed EWS Alerts and Export View Component */}
                <EwsRiskReport
                  surveys={surveys}
                  offices={OFFICES}
                  currentSession={currentSession}
                />
              </div>
            )}
          </div>
        </main>
      )}

      {/* Bottom Status Footer Matching Clean Minimalism */}
      <footer className="h-10 bg-slate-100 border-t border-slate-205 flex items-center justify-between px-6 shrink-0 text-[10px] text-slate-500 print:hidden mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
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
