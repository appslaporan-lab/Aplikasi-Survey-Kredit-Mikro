import React, { useState, useEffect } from "react";
import { FieldUser, Office, UserRole, UserSession } from "../types";
import { Shield, Sparkles, Fingerprint, LogIn, UserPlus, Building, HelpCircle, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

interface MobileAuthProps {
  usersList: FieldUser[];
  offices: Office[];
  onSetSession: (session: UserSession | null) => void;
  onRefreshUsers: () => void;
}

export default function MobileAuth({
  usersList,
  offices,
  onSetSession,
  onRefreshUsers
}: MobileAuthProps) {
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  
  // Login input state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regNik, setRegNik] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("MO");
  const [regOfficeId, setRegOfficeId] = useState("kp1-kauman");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick Demo account selector helper
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  // Secure CAPTCHA System States
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaNoiseSeed, setCaptchaNoiseSeed] = useState<number[]>([]);

  const generateNewCaptcha = () => {
    // Standard secure banking character subset (avoid misleading symbols like 0, 1, O, I)
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let secureCode = "";
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * charset.length);
      secureCode += charset[idx];
    }
    setCaptchaCode(secureCode);
    setCaptchaInput("");
    
    // Seed some randomized factors for noise & colors
    const seeds = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
    setCaptchaNoiseSeed(seeds);
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  const getOfficeName = (oid: string) => {
    return offices.find((o) => o.id === oid)?.name || oid;
  };

  const handleLogin = async (usernameStr: string, passwordStr: string, bypassCaptcha: boolean = false) => {
    setLoginError(null);

    // Validate CAPTCHA if it is not bypassed via demo selector
    if (!bypassCaptcha) {
      if (!captchaInput.trim()) {
        setLoginError("Harap masukkan kode CAPTCHA terlebih dahulu!");
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
        setLoginError("Kode CAPTCHA salah atau kedaluwarsa! Silakan coba lagi.");
        generateNewCaptcha();
        return;
      }
    }

    setIsLoggingIn(true);

    // Simulate subtle phone connection lag
    setTimeout(() => {
      const cleanUsername = usernameStr.trim().toLowerCase();
      const matchedUser = usersList.find(
        (u) => (u.username || u.email.split("@")[0] || "").toLowerCase() === cleanUsername
      );

      if (!matchedUser) {
        setLoginError("Username tidak ditemukan. Silakan lakukan 'Daftar Baru' di tab sebelah.");
        setIsLoggingIn(false);
        return;
      }

      // Verify password if not bypassed (demo buttons / biometric)
      if (!bypassCaptcha) {
        if (!passwordStr) {
          setLoginError("Harap masukkan password!");
          setIsLoggingIn(false);
          return;
        }
        if ((matchedUser.password || "bank123") !== passwordStr) {
          setLoginError("Password salah!");
          setIsLoggingIn(false);
          return;
        }
      }

      if (matchedUser.status === "PENDING" && matchedUser.role !== "ADMIN") {
        setLoginError("Akun Anda masih ditinjau (PENDING). Mohon gunakan akun demo yang aktif untuk pengujian.");
        setIsLoggingIn(false);
        return;
      }

      if (matchedUser.status === "REJECTED") {
        setLoginError("Akun ini dinonaktifkan atau ditolak oleh admin BPR.");
        setIsLoggingIn(false);
        return;
      }

      // Establish session
      const sessionData: UserSession = {
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        nik: matchedUser.nik,
        officeId: matchedUser.officeId,
        status: matchedUser.status,
        username: matchedUser.username || matchedUser.email.split("@")[0].toLowerCase()
      };
      
      onSetSession(sessionData);
      setIsLoggingIn(false);
    }, 400);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);

    if (!regName || !regEmail || !regNik || !regOfficeId || !regUsername || !regPassword) {
      setRegMessage({ type: "error", text: "Seluruh kolom wajib diisi lengkap!" });
      return;
    }

    if (!regEmail.endsWith("@banktulungagung.co.id") && !regEmail.includes("@gmail.com")) {
      setRegMessage({
        type: "error",
        text: "Harap gunakan email korporasi resmi (@banktulungagung.co.id)."
       });
       return;
     }

     try {
       const resp = await fetch("/api/register", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           email: regEmail.trim(),
           name: regName.trim(),
           role: regRole,
           nik: regNik.trim(),
           officeId: regOfficeId,
           username: regUsername.trim(),
           password: regPassword
         })
       });

       const data = await resp.json();
       if (!resp.ok) {
         setRegMessage({ type: "error", text: data.error || "Gagal mendaftarkan akun." });
       } else {
         setRegMessage({
           type: "success",
           text: "Registrasi sukses dikirim! Minta Admin (alhuda@banktulungagung.co.id) menyetujuinya di Tab 'Akses Pegawai'."
         });
         // Clear registration fields
         setRegName("");
         setRegEmail("");
         setRegNik("");
         setRegUsername("");
         setRegPassword("");
         onRefreshUsers();
       }
     } catch (err) {
       setRegMessage({ type: "error", text: "Gagal terhubung ke server perbankan." });
     }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-12 font-sans">
      
      {/* Top Banner Accent */}
      <div className="bg-indigo-900 text-white pt-10 pb-12 px-6 relative rounded-b-[40px] shadow-md shrink-0">
        <div className="absolute inset-0 bg-linear-to-b from-indigo-900 via-indigo-950 to-indigo-900 opacity-90 rounded-b-[40px]"></div>
        
        <div className="relative flex flex-col items-center text-center z-10">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Building className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white leading-none">KreditMikro Pro</h2>
          <p className="text-[10px] text-indigo-250 font-bold uppercase tracking-widest mt-1.5 leading-none">
            BPR Bank Tulungagung
          </p>
          <p className="text-[11px] text-indigo-200/80 active:text-indigo-200 max-w-[280px] mt-2.5 font-medium leading-normal">
            Sistem Geotagging, Kalkulasi Amortisasi, &amp; Early Warning System Mikro Lapangan
          </p>
        </div>
      </div>

      {/* Switch Form Tabs Bar */}
      <div className="mx-6 -mt-6 bg-white border border-slate-200/60 p-1 rounded-2xl shadow-sm z-30 flex relative">
        <button
          onClick={() => {
            setActiveTab("LOGIN");
            setLoginError(null);
          }}
          className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "LOGIN"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Masuk</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("REGISTER");
            setRegMessage(null);
          }}
          className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "REGISTER"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Daftar Baru</span>
        </button>
      </div>

      {/* Login Form Screen */}
      {activeTab === "LOGIN" && (
        <div className="p-6 space-y-5 animate-fadeIn duration-200">
          
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Username Pegawai
              </label>
              <input
                type="text"
                placeholder="misal: mo.kurniawan atau admin"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                placeholder="Masukkan password Anda"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* HIGH-FIDELITY INTERACTIVE CAPTCHA CARD */}
            <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  Verifikasi Captcha 4-Digit
                </label>
                <button
                  type="button"
                  onClick={generateNewCaptcha}
                  className="text-[9px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition active:scale-95"
                  title="Ganti Captcha Baru"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-500" />
                  <span>Dapatkan Kode Baru</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Visual Security Display with randomized rotations, scale factor, colors and noise lines */}
                <div 
                  className="h-11 flex-1 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-around px-3.5 select-none"
                  style={{
                    backgroundImage: "radial-gradient(#ffffff12 1px, transparent 1px)",
                    backgroundSize: "6px 6px"
                  }}
                >
                  {/* Styled Noise Grid Accent Lines */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-around">
                    <div className="h-[1px] w-full bg-linear-to-r from-transparent via-amber-400 to-transparent transform rotate-3 scale-x-110"></div>
                    <div className="h-[1px] w-full bg-linear-to-r from-transparent via-cyan-400 to-transparent transform -rotate-4 scale-x-110"></div>
                  </div>

                  {captchaCode.split("").map((c, i) => {
                    const styleColors = [
                      "text-rose-400 font-serif",
                      "text-indigo-400 font-sans",
                      "text-emerald-400 font-mono",
                      "text-yellow-400 font-mono",
                      "text-cyan-400 font-serif",
                      "text-violet-400 font-sans"
                    ];
                    // Clean indexing based on captcha noise seed
                    const seedNum = captchaNoiseSeed[i] || 0;
                    const fontStyle = styleColors[(i + seedNum) % styleColors.length];
                    const angle = ((i * 11 + seedNum) % 24) - 12; // rotate -12deg to +12deg
                    const sizeScale = 1 + ((seedNum % 3) / 10); // scale 1.0 to 1.2

                    return (
                      <span
                        key={i}
                        className={`inline-block font-extrabold text-sm uppercase tracking-widest pointer-events-none select-none ${fontStyle}`}
                        style={{
                          transform: `rotate(${angle}deg) scale(${sizeScale})`,
                          textShadow: "0px 1px 3px rgba(0,0,0,0.6)"
                        }}
                      >
                        {c}
                      </span>
                    );
                  })}
                </div>

                {/* Input verification entry field */}
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Kode"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="w-20 text-center text-xs font-black tracking-widest uppercase px-1 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 text-[11px] font-semibold rounded-xl leading-relaxed">
                ⚠️ {loginError}
              </div>
            )}

            <button
              onClick={() => handleLogin(loginUsername, loginPassword, false)}
              disabled={isLoggingIn || !loginUsername || !loginPassword}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-indigo-200" />
              <span>{isLoggingIn ? "Mengautentikasi..." : "Masuk Sistem"}</span>
            </button>
          </div>

          {/* Quick Demo Credentials Panel for streamlined testing */}
          <div className="bg-white rounded-2xl border border-slate-150/80 p-4.5 space-y-3 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Akun Demo Cepat (Fast Access)
              </span>
              <button
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="text-[9px] font-extrabold text-slate-400 hover:text-indigo-600 tracking-wider uppercase"
              >
                {showDemoAccounts ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>

            {showDemoAccounts && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {usersList.map((demoUsr) => {
                  const demoUsername = demoUsr.username || demoUsr.email.split("@")[0].toLowerCase();
                  const demoPassword = demoUsr.password || "bank123";
                  const isSelected = loginUsername === demoUsername;
                  return (
                    <button
                      key={demoUsr.email}
                      onClick={() => {
                        setLoginUsername(demoUsername);
                        setLoginPassword(demoPassword);
                        handleLogin(demoUsername, demoPassword, true); // Bypass CAPTCHA verification for fast demo accounts
                      }}
                      className={`w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 rounded-xl transition flex items-center justify-between text-[11px] ${
                        isSelected ? "border-indigo-500 bg-indigo-50/50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-extrabold text-slate-850 flex items-center gap-1">
                          <span className="truncate">{demoUsr.name}</span>
                          <span className={`text-[8px] px-1 font-mono font-bold rounded uppercase shrink-0 ${
                            demoUsr.role === "ADMIN" ? "bg-red-100 text-red-700" :
                            demoUsr.role === "KABAG" ? "bg-purple-100 text-purple-700" :
                            demoUsr.role === "PIMCAB" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                            demoUsr.role === "KASUBAG" ? "bg-blue-100 text-blue-700 font-extrabold" :
                            "bg-emerald-100 text-emerald-700"
                          }`}>
                            {demoUsr.role === "KASUBAG" ? "KASUBAG / KEPALA KAS" : demoUsr.role}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium mt-0.5 space-x-2">
                          <span>User: <strong className="text-indigo-750 font-mono font-bold">{demoUsername}</strong></span>
                          <span>| Pass: <strong className="text-slate-750 font-mono font-bold">{demoPassword}</strong></span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200/80 flex items-center justify-center shrink-0">
                        <LogIn className="w-3 h-3 text-indigo-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulated FaceID biometric lock */}
          <div className="flex flex-col items-center justify-center pt-2 text-slate-400">
            <button 
              onClick={() => {
                // Instantly log in as Kurniawan (MO) for ultimate convenience
                setLoginUsername("mo.kurniawan");
                setLoginPassword("bank123");
                handleLogin("mo.kurniawan", "bank123", true); // Bypass CAPTCHA during biometric bypass
              }}
              className="p-3.5 bg-slate-100 hover:bg-slate-200/80 rounded-full border border-slate-150 transition active:scale-95 shadow-3xs"
            >
              <Fingerprint className="w-7 h-7 text-indigo-650" />
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2">
              Sandi Sidik Jari Demo Cepat
            </span>
          </div>

        </div>
      )}

      {/* Register Form Screen */}
      {activeTab === "REGISTER" && (
        <form onSubmit={handleRegister} className="p-6 space-y-4 animate-fadeIn duration-200">
          
          <div className="text-[11px] text-slate-500 leading-relaxed border-b border-slate-200/60 pb-2">
            Silakan lengkapi formulir pendaftaran di bawah ini untuk didaftarkan ke server BPR Bank Tulungagung.
          </div>

          <div className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Nama Lengkap Pegawai
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Rian Hidayat"
                value={regName}
                onChange={(e) => setRegName(e.target.value.toUpperCase())}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Email Kerja (@banktulungagung.co.id)
              </label>
              <input
                type="email"
                required
                placeholder="rian.hidayat@banktulungagung.co.id"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value.toUpperCase())}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 font-mono"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Nomor Induk Karyawan (NIK)
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="Masukkan 16 Digit NIK Pegawai"
                value={regNik}
                onChange={(e) => setRegNik(e.target.value.toUpperCase())}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 font-mono"
              />
            </div>

            {/* Office Place Select */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Penempatan Unit Kerja
              </label>
              <select
                value={regOfficeId}
                onChange={(e) => setRegOfficeId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-700"
              >
                {offices.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Competency Role Select */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Posisi Jabatan
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-700"
              >
                <option value="MO">Marketing Officer (MO Lapangan)</option>
                <option value="KASUBAG">KASUBAG / Kepala Kas (Supervisor Kredit)</option>
                <option value="KABAG">KABAG Kredit (Pemutus Kredit)</option>
                <option value="PIMCAB">Pimpinan Cabang (PIMCAB - Pemutus Kredit)</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Username Pilihan Pegawai
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: rian.hidayat"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value.toUpperCase())}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700 font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                Kata Sandi Baru (Password)
              </label>
              <input
                type="password"
                required
                placeholder="Buat sandi baru, min. 6 karakter"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-700"
              />
            </div>
          </div>

          {regMessage && (
            <div
              className={`p-3 rounded-lg text-[11px] font-semibold border leading-relaxed ${
                regMessage.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {regMessage.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            Selesaikan Pendaftaran
          </button>
        </form>
      )}

    </div>
  );
}
