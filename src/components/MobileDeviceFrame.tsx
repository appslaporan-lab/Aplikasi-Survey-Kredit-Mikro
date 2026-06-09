import React, { useState, useEffect } from "react";
import { Wifi, Battery, Signal, Smartphone, Monitor } from "lucide-react";

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function MobileDeviceFrame({
  children,
  isFullscreen,
  onToggleFullscreen
}: MobileDeviceFrameProps) {
  const [timeStr, setTimeStr] = useState("09:41");

  useEffect(() => {
    // Live update clock in high-fidelity mobile top bar
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, "0");
      let minutes = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isFullscreen) {
    return (
      <div className="w-full h-full relative">
        {/* Simple floating helper bar to switch back to Phone Chassis view */}
        <div className="absolute top-2 right-4 z-50 print:hidden">
          <button
            onClick={onToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Aktifkan Tampilan Handphone</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 min-h-[85vh] w-full select-none">
      {/* Container holding physical phone + descriptive badges */}
      <div className="relative">
        
        {/* Physical side buttons mockup (Left: volume up/down, Right: lock/power) */}
        {/* Volume Up */}
        <div className="absolute left-[-15px] top-[140px] w-[3px] h-[40px] bg-slate-700 rounded-l-md shadow-xs"></div>
        {/* Volume Down */}
        <div className="absolute left-[-15px] top-[195px] w-[3px] h-[40px] bg-slate-700 rounded-l-md shadow-xs"></div>
        {/* Lock Button */}
        <div className="absolute right-[-15px] top-[160px] w-[3px] h-[60px] bg-slate-700 rounded-r-md shadow-xs"></div>

        {/* Outer Phone Bezel Chassis */}
        <div className="w-[390px] h-[812px] bg-slate-900 rounded-[50px] p-[10px] shadow-2xl border-[4px] border-slate-750 relative transition-transform duration-300">
          
          {/* Inner Display screen Frame */}
          <div className="w-full h-full bg-slate-50 rounded-[40px] overflow-hidden relative flex flex-col border border-black/10 select-text">
            
            {/* Top Status Bar Grid */}
            <div className="h-11 bg-white border-b border-slate-100/40 px-6 shrink-0 z-40 flex items-center justify-between relative text-slate-850 font-sans">
              {/* Left: Live Time */}
              <div className="text-[12px] font-bold tracking-tight font-mono">
                {timeStr}
              </div>

              {/* Center: Sleek Dynamic Island / Notch Camera Bubble */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-[110px] h-6 bg-black rounded-full flex items-center justify-end px-3 gap-1 z-55 shadow-inner">
                {/* Simulated Lens reflections */}
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80 border border-slate-800/10"></div>
                <div className="w-1 h-1 rounded-full bg-slate-900"></div>
              </div>

              {/* Right: Technical cellular connectivity & battery indicators */}
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-slate-800" />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">5G</span>
                <Wifi className="w-3.5 h-3.5 text-slate-800" />
                <div className="flex items-center gap-1 text-[11px] font-bold font-mono">
                  <span>98%</span>
                  <Battery className="w-4 h-4 text-slate-800 fill-slate-800" />
                </div>
              </div>
            </div>

            {/* Inner Content Scroller Window */}
            <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col bg-slate-55 pb-10">
              {children}
            </div>

            {/* Simulated Modern Home gesture Indicator Bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-36 h-5 flex items-center justify-center z-50 pointer-events-none">
              <div className="w-28 h-1 bg-slate-850/80 rounded-full"></div>
            </div>

          </div>
        </div>

        {/* Floating instruction flag beneath the phone frame */}
        <div className="mt-4 text-center max-w-[390px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
            <Smartphone className="w-3 h-3 text-indigo-650" /> Mode Simulator Handphone Aktif
          </span>
          <button
            onClick={onToggleFullscreen}
            className="mt-2 block w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition underline decoration-dashed underline-offset-4"
          >
            Beralih ke Tampilan Layar Penuh Desktop
          </button>
        </div>

      </div>
    </div>
  );
}
