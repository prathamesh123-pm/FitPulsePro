import { useEffect, useState } from "react";
import { Dumbbell, Cloud, Shield, RefreshCw } from "lucide-react";

interface SplashScreenProps {
  onFinish: (isLoggedIn: boolean) => void;
  isLoggedIn: boolean | null; // null = checking, boolean = resolved
}

export function SplashScreen({ onFinish, isLoggedIn }: SplashScreenProps) {
  const [statusMessage, setStatusMessage] = useState("Initializing Cloud Firebase...");
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage("Checking Firebase Authentication Session...");
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusMessage("Verifying Multi-Device Cloud Sync...");
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn !== null) {
      setProgress(100);
      setStatusMessage(
        isLoggedIn
          ? "Authentication verified! Launching Dashboard..."
          : "Session not found. Redirecting to Login..."
      );

      const finishTimer = setTimeout(() => {
        onFinish(isLoggedIn);
      }, 500);

      return () => clearTimeout(finishTimer);
    }
  }, [isLoggedIn, onFinish]);

  // Fallback timeout in case of slow or offline network check (max 3.5s)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoggedIn === null) {
        onFinish(false);
      }
    }, 3500);

    return () => clearTimeout(safetyTimer);
  }, [isLoggedIn, onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Main Brand Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated App Logo */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-60 blur-md animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-2xl border border-emerald-400/50">
            <Dumbbell className="h-12 w-12 text-slate-950 stroke-[2.4]" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="text-3xl font-black tracking-tight text-slate-100 mb-1">
          FitPulse<span className="text-emerald-400">Pro</span>
        </h1>
        <p className="text-xs font-semibold text-emerald-400/90 tracking-wider uppercase mb-1">
          Firebase Cloud Database & Sync
        </p>
        <p className="text-xs text-slate-400 mb-8 max-w-xs">
          Multi-Device Live Synchronization Engine & Cloud Backup
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-4 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-3 mt-10 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Firestore</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Encrypted Auth</span>
          </div>
          <span>•</span>
          <span>Offline Ready</span>
        </div>
      </div>
    </div>
  );
}
