import {
  Menu,
  Shield,
  Cloud,
  Lock,
  Moon,
  Sun,
  Dumbbell,
  Sparkles,
  AlertCircle,
  Trophy,
  Layers,
  Droplets,
  Timer,
  Globe,
  Bell,
  BellOff,
  UserCheck,
  User,
  LogOut,
} from "lucide-react";
import { UserProfile, CloudSyncState, GymMembership, UserRole } from "../types";
import { Language, TRANSLATIONS } from "../utils/i18n";

interface NavbarProps {
  profile: UserProfile;
  sync: CloudSyncState;
  membership: GymMembership;
  darkMode: boolean;
  userRole?: UserRole;
  unreadNotificationsCount?: number;
  notificationsEnabled?: boolean;
  onToggleNotificationsEnabled?: () => void;
  onToggleDarkMode: () => void;
  onOpenProfile: () => void;
  onOpenDrawer?: () => void;
  onLockApp: () => void;
  onOpenAILab: () => void;
  onOpenAchievements?: () => void;
  onOpenCloudSync?: () => void;
  onOpenPlateCalculator?: () => void;
  onOpenPersonalRecords?: () => void;
  onOpenWaterTracker?: () => void;
  onOpenAudioCoach?: () => void;
  onOpenEnterpriseAuth?: () => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  lang?: Language;
  onToggleLanguage?: () => void;
}

export function Navbar({
  profile,
  sync,
  membership,
  darkMode,
  userRole = "Admin",
  unreadNotificationsCount = 0,
  notificationsEnabled = false,
  onToggleNotificationsEnabled,
  onToggleDarkMode,
  onOpenProfile,
  onOpenDrawer,
  onLockApp,
  onOpenAILab,
  onOpenAchievements,
  onOpenCloudSync,
  onOpenPlateCalculator,
  onOpenPersonalRecords,
  onOpenWaterTracker,
  onOpenAudioCoach,
  onOpenEnterpriseAuth,
  onOpenNotifications,
  onLogout,
  lang = "en",
  onToggleLanguage,
}: NavbarProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Calculate membership days remaining
  const expiry = new Date(membership.expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2.5 sm:px-6">
        {/* Left: Navigation Drawer Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Menu Toggle (Requirement 10) */}
          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition cursor-pointer shrink-0"
              title="Open Navigation Menu / नेव्हिगेशन मेनू उघडा"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* App Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md shadow-emerald-500/20 font-black shrink-0">
              <Dumbbell className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-100">
                  FitPulse<span className="text-emerald-400">Pro</span>
                </span>
                {/* Enterprise Role Badge */}
                {onOpenEnterpriseAuth && (
                  <button
                    onClick={onOpenEnterpriseAuth}
                    className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                    title="Enterprise Role & Cloud Authentication"
                  >
                    <Shield className="w-3 h-3" />
                    <span>{userRole}</span>
                  </button>
                )}
              </div>
              <p className="hidden lg:block text-[11px] text-slate-400">
                {lang === "mr" ? "लक्ष्य:" : "Target:"} {profile.targetWeightKg} kg • {membership.gymName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions: Clean, accessible, profile guaranteed top-right */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Direct Firebase Console Sync Button (Desktop) */}
          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-[11px] text-emerald-300 font-bold cursor-pointer transition shrink-0 shadow-sm"
              title="Save All Data to Firebase Console / फायरबेस कन्सोलमध्ये सर्व डेटा सेव्ह करा"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>कन्सोल</span>
            </button>
          )}

          {/* AI Coach Quick CTA (Desktop/Tablet) */}
          <button
            onClick={onOpenAILab}
            className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition shadow-sm cursor-pointer shrink-0"
            title="Open AI Fitness Coach"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{t.aiCoach}</span>
          </button>

          {/* Notifications Trigger */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition cursor-pointer shrink-0 ${
                notificationsEnabled
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700"
                  : "bg-slate-900/80 border-rose-500/30 text-rose-300/80 hover:text-rose-200 hover:border-rose-500/50"
              }`}
              title={
                notificationsEnabled
                  ? "Enterprise Notifications: Active"
                  : "Enterprise Notifications: OFF"
              }
            >
              {notificationsEnabled ? (
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400" />
              )}
              {notificationsEnabled && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Language Toggle (मराठी / EN) */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 px-2 py-1.5 text-xs font-bold text-indigo-300 transition shadow-sm cursor-pointer shrink-0"
              title={lang === "mr" ? "Switch to English" : "मराठी भाषेत वापरा"}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px]">{lang === "mr" ? "मराठी" : "EN"}</span>
            </button>
          )}

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer shrink-0"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-200" />}
          </button>

          {/* Security Lock Screen Trigger */}
          <button
            onClick={onLockApp}
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer shrink-0"
            title={t.lockApp}
          >
            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* REQUIREMENT 1: Dedicated Profile Icon & Button in App Bar (Top-Right Corner) */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 transition cursor-pointer shrink-0 shadow-sm group"
            title={lang === "mr" ? "माझी प्रोफाइल (Profile)" : "Profile & Account"}
            aria-label="Profile"
          >
            <div className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-lg overflow-hidden border border-emerald-400 bg-slate-800 shrink-0">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-800 text-emerald-400 font-bold text-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition max-w-[85px] truncate">
              {profile.fullName.split(" ")[0] || "Profile"}
            </span>
          </button>

          {/* Direct Logout Button in Top Bar (Requirement 2 / Problem 2) */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition cursor-pointer shrink-0"
              title={lang === "mr" ? "लॉगआउट करा (Logout)" : "Logout"}
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
