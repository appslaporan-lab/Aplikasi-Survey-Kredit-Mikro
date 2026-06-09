/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Shield, CheckCircle, XCircle, ChevronRight, Lock, Key, RefreshCw } from "lucide-react";
import { FieldUser, Office, UserRole, UserSession } from "../types";

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

interface UserApprovalManagerProps {
  currentSession: UserSession | null;
  onSetSession: (session: UserSession | null) => void;
  usersList: FieldUser[];
  onRefreshUsers: () => void;
}

export default function UserApprovalManager({
  currentSession,
  onSetSession,
  usersList,
  onRefreshUsers
}: UserApprovalManagerProps) {
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER" | "ADMIN">("LOGIN");
  
  // Registration forms
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regNik, setRegNik] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("MO");
  const [regOfficeId, setRegOfficeId] = useState("kp1-kauman");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Login picker
  const [loginEmail, setLoginEmail] = useState(currentSession?.email || "mo.kurniawan@banktulungagung.co.id");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);
    if (!regName || !regEmail || !regNik || !regOfficeId || !regUsername || !regPassword) {
      setRegMessage({ type: "error", text: "Seluruh kolom wajib diisi lengkap!" });
      return;
    }

    try {
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          name: regName,
          role: regRole,
          nik: regNik,
          officeId: regOfficeId,
          username: regUsername.trim(),
          password: regPassword
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setRegMessage({ type: "error", text: data.error || "Gagal melakukan registrasi." });
      } else {
        setRegMessage({
          type: "success",
          text: "Registrasi akun berhasil dikirim! Mohon tunggu koordinasi approval dari Admin Kredit BPR."
        });
        // Clear form
        setRegName("");
        setRegEmail("");
        setRegNik("");
        setRegUsername("");
        setRegPassword("");
        onRefreshUsers();
      }
    } catch (err) {
      setRegMessage({ type: "error", text: "Kesalahan jaringan, coba beberapa saat lagi." });
    }
  };

  const handleLogin = (emailStr: string) => {
    setLoginError(null);
    const matchedUser = usersList.find(u => u.email.toLowerCase() === emailStr.toLowerCase());
    
    if (!matchedUser) {
      setLoginError("Email tersebut belum terdaftar. Silakan lakukan Registrasi Baru.");
      return;
    }

    if (matchedUser.status === "PENDING" && matchedUser.role !== "ADMIN") {
      setLoginError("Akun Anda berstatus PENDING. Harap menunggu verifikasi status aktif dari Admin Kredit.");
      return;
    }

    if (matchedUser.status === "REJECTED") {
      setLoginError("Akun Anda telah ditolak/nonaktif oleh admin.");
      return;
    }

    // Set active session
    onSetSession({
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      nik: matchedUser.nik,
      officeId: matchedUser.officeId,
      status: matchedUser.status
    });
  };

  const handleUserStatusUpdate = async (email: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const resp = await fetch(`/api/users/${encodeURIComponent(email)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (resp.ok) {
        onRefreshUsers();
        // If current session belongs to updated user, auto-update local storage if possible
        if (currentSession && currentSession.email.toLowerCase() === email.toLowerCase()) {
          onSetSession({
            ...currentSession,
            status: newStatus
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOfficeName = (oid: string) => {
    return OFFICES.find(o => o.id === oid)?.name || oid;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-sm text-slate-800">Manajemen Akses & Sesi Pegawai</span>
        </div>
        <div className="flex bg-slate-200/60 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("LOGIN")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition ${
              activeTab === "LOGIN" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setActiveTab("REGISTER")}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition ${
              activeTab === "REGISTER" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Daftar Baru
          </button>
          {currentSession?.role === "ADMIN" && (
            <button
              onClick={() => setActiveTab("ADMIN")}
              className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition ${
                activeTab === "ADMIN" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Approval Admin ({usersList.filter(u => u.status === "PENDING").length})
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "LOGIN" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 leading-relaxed max-w-lg">
              Untuk melakukan pengujian alur persetujuan berjenjang Bank Tulungagung, Anda dapat dengan mudah berpindah identitas menggunakan menu pemilih cepat di bawah ini.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Simpan Sesi Sebagai:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  {usersList.map((usr) => (
                    <button
                      key={usr.email}
                      type="button"
                      onClick={() => {
                        setLoginEmail(usr.email);
                        handleLogin(usr.email);
                      }}
                      className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border transition ${
                        loginEmail === usr.email
                          ? "bg-indigo-50/60 border-indigo-200"
                          : "bg-white border-transparent hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          {usr.name}
                          {usr.status === "PENDING" && (
                            <span className="bg-amber-100 text-amber-700 text-[8px] px-1 rounded font-bold">PENDING</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono italic">
                          {usr.role === "KASUBAG" ? "KASUBAG / KEPALA KAS" : usr.role} • {getOfficeName(usr.officeId)}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-indigo-50 p-4 rounded-xl bg-indigo-50/25 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider mb-2">Sesi Aktif Anda</h4>
                  {currentSession ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {currentSession.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{currentSession.name}</p>
                          <p className="text-xs font-mono text-slate-500">{currentSession.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-600 border-t border-slate-200/50">
                        <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Jabatan / Role:</span>
                          <span className="bg-indigo-100 text-indigo-800 rounded px-1.5 py-0.5 font-bold">{currentSession.role === "KASUBAG" ? "KASUBAG / KEPALA KAS" : currentSession.role}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">NIK Pegawai:</span>
                          <span className="font-mono font-medium">{currentSession.nik}</span>
                        </div>
                        <div className="col-span-2 pt-1">
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Penempatan Cabang:</span>
                          <span className="font-medium text-slate-800">{getOfficeName(currentSession.officeId)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-3 text-center border-2 border-dashed border-slate-200 rounded-lg">
                      Belum ada sesi aktif. Pilih akun di sebelah kiri.
                    </div>
                  )}
                </div>

                {loginError && (
                  <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-xs text-left">
                    {loginError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">
              Formulir Pendaftaran Mandiri Pegawai
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value.toUpperCase())}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="Contoh: RIAN HIDAYAT"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Kantor (@banktulungagung.co.id)</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value.toUpperCase())}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="RIAN.HIDAYAT@BANKTULUNGAGUNG.CO.ID"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Induk Karyawan (NIK Pegawai)</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={regNik}
                  onChange={(e) => setRegNik(e.target.value.toUpperCase())}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="35041512XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Penempatan Kantor Cabang/Kas</label>
                <select
                  value={regOfficeId}
                  onChange={(e) => setRegOfficeId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                >
                  {OFFICES.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan Kompetensi</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="MO">Marketing Officer (MO - Survey Lapangan)</option>
                  <option value="KASUBAG">KASUBAG / Kepala Kas (Supervisor Reviewer Kredit)</option>
                  <option value="KABAG">KABAG Kredit / Pemutus Utama (Pemutus Kredit)</option>
                  <option value="PIMCAB">Pimpinan Cabang (PIMCAB - Pemutus Kredit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username Pegawai (Untuk Login)</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toUpperCase())}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="Contoh: RIAN.HIDAYAT"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kata Sandi (Min. 6 Karakter)</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Buat sandi baru akun Anda"
                />
              </div>
            </div>

            {regMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  regMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {regMessage.text}
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              Kirim Pengajuan Pendaftaran
            </button>
          </form>
        )}

        {activeTab === "ADMIN" && currentSession?.role === "ADMIN" && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
              <span>Antrian Persetujuan Pendaftaran Akun Baru</span>
              <button
                onClick={onRefreshUsers}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Sinkronkan Database
              </button>
            </h3>

            <div className="overflow-x-auto border border-slate-150 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">NIK / Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Penempatan</th>
                    <th className="p-3">Status Saat Ini</th>
                    <th className="p-3 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList
                    .filter((u) => u.role !== "ADMIN")
                    .map((item) => (
                      <tr key={item.email} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3">
                          <div className="font-mono text-[10px]">{item.nik}</div>
                          <div className="text-slate-400">{item.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-850 px-2 py-0.5 rounded font-bold text-[10px]">
                            {item.role === "KASUBAG" ? "KASUBAG / KEPALA KAS" : item.role}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-500">{getOfficeName(item.officeId)}</td>
                        <td className="p-3">
                          {item.status === "APPROVED" ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Disetujui
                            </span>
                          ) : item.status === "REJECTED" ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Ditolak
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              MENUNGGU APPROVAL
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {item.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUserStatusUpdate(item.email, "APPROVED")}
                                className="bg-green-650 hover:bg-green-700 text-green-800 bg-green-50 border border-green-200 text-[10px] font-bold px-2.5 py-1 rounded transition"
                              >
                                Setujui Akun
                              </button>
                              <button
                                onClick={() => handleUserStatusUpdate(item.email, "REJECTED")}
                                className="bg-red-650 hover:bg-red-750 text-red-800 bg-red-50 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded transition"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {item.status === "APPROVED" && (
                            <button
                              onClick={() => handleUserStatusUpdate(item.email, "REJECTED")}
                              className="text-red-600 hover:text-red-900 text-[10px]"
                            >
                              Blokir
                            </button>
                          )}
                          {item.status === "REJECTED" && (
                            <button
                              onClick={() => handleUserStatusUpdate(item.email, "APPROVED")}
                              className="text-green-600 hover:text-green-900 text-[10px]"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
