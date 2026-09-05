import { useEffect } from "react";
import {
  X,
  Home,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ArrowLeftRight,
  Shield,
  Copy,
  Check,
  Dumbbell,
  Cloud,
  Flame,
  UtensilsCrossed,
  Activity,
  Award,
} from "lucide-react";
import { useState } from "react";
import { AppState, TabId } from "../types";
import { Language } from "../utils/i18n";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onSwitchAccount: () => void;
  onLogout: () => void;
  lang?: Language;
}

export function NavigationDrawer({
  isOpen,
  onClose,
  state,
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
  onSwitchAccount,
  onLogout,
  lang = "en",
}: NavigationDrawerProps) {
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const account = state.currentUserAccount;
  const uid = account?.uid || state.cloudUser?.uid || "guest";
  const fullName = account?.displayName || state.profile.fullName || "FitPulse Athlete";
  const email = account?.email || state.profile.email || "athlete@fitpulse.app";
  const photoUrl =
    account?.photoURL ||
    state.profile.photoUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

  const handleCopyUid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content sliding from left */}
      <div className="relative flex flex-col w-80 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 shadow-2xl z-10 overflow-hidden">
        {/* Top Header with App Logo & Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md font-black">
              <Dumbbell className="h-4.5 w-4.5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-100">
                FitPulse<span className="text-emerald-400">Pro</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Cloud & Multi-Device Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div
            onClick={() => {
              onOpenProfile();
              onClose();
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group"
          >
            <div className="h-12 w-12 rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-800 shrink-0 shadow-md">
              <img
                src={photoUrl}
                alt={fullName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition">
                  {fullName}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {account?.role || "Athlete"}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                  UID: {uid.slice(0, 10)}...
                </span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                  title="Copy Firebase UID"
                >
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items (Requirement 10: Home, Profile, Settings, Help, Logout) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            {lang === "mr" ? "मुख्य मेनू (Main Menu)" : "Navigation"}
          </div>

          {/* 1. Home */}
          <button
            onClick={() => {
              onSelectTab("dashboard");
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              currentTab === "dashboard"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/80"
            }`}
          >
            <Home className="w-4.5 h-4.5 shrink-0" />
            <span>{lang === "mr" ? "होम डॅशबोर्ड (Home)" : "Home"}</span>
          </button>

          {/* 2. Profile */}
          <button
            onClick={() => {
              onOpenProfile();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition cursor-pointer"
          >
            <User className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <span>{lang === "mr" ? "माझी प्रोफाइल (Profile)" : "Profile"}</span>
          </button>

          {/* 3. Settings */}
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              currentTab === "settings"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/80"
            }`}
          >
            <Settings className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <span>{lang === "mr" ? "सेटिंग्ज (Settings)" : "Settings"}</span>
          </button>

          {/* 4. Help */}
          <button
            onClick={() => {
              onOpenHelp();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition cursor-pointer"
          >
            <HelpCircle className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
            <span>{lang === "mr" ? "मदत व सपोर्ट (Help)" : "Help & FAQ"}</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            {lang === "mr" ? "क्विक ऍक्सेस (Quick Access)" : "Fitness Features"}
          </div>

          {/* Cloud Sync */}
          <button
            onClick={() => {
              onSelectTab("cloud-sync");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lang === "mr" ? "क्लाउड डेटा व बॅकअप" : "Cloud Backup & Sync"}</span>
          </button>

          {/* Workouts */}
          <button
            onClick={() => {
              onSelectTab("workout");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <Activity className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{lang === "mr" ? "वर्कआउट लॉग" : "Workouts"}</span>
          </button>

          {/* Diet & Nutrition */}
          <button
            onClick={() => {
              onSelectTab("diet");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lang === "mr" ? "आहार व न्यूट्रिशन" : "Diet & Nutrition"}</span>
          </button>

          {/* Calorie Tracker */}
          <button
            onClick={() => {
              onSelectTab("calories");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{lang === "mr" ? "कॅलरी ट्रॅकर" : "Calorie Tracker"}</span>
          </button>
        </div>

        {/* Bottom Drawer Actions: Switch Account & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
          {/* Requirement 9: Switch Account */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchAccount();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
            title="Log out and sign in with a different Firebase account"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>{lang === "mr" ? "खाते बदला (Switch Account)" : "Switch Account"}</span>
          </button>

          {/* Requirement 5, 6, 10: Logout */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 transition cursor-pointer"
            title="Sign out of Firebase Authentication and return to Login Screen"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{lang === "mr" ? "लॉगआउट करा (Logout)" : "Logout"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
