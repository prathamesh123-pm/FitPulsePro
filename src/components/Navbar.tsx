import {
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
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md shadow-emerald-500/20 font-black shrink-0">
            <Dumbbell className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-100">
                FitPulse<span className="text-emerald-400">Pro</span>
              </span>
              {/* Enterprise RBAC Role Badge */}
              <button
                onClick={onOpenEnterpriseAuth}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                title="Enterprise Role & Cloud Authentication"
              >
                <Shield className="w-3 h-3" />
                <span>{userRole}</span>
              </button>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              {lang === "mr" ? "लक्ष्य:" : "Target:"} {profile.targetWeightKg} kg • {membership.gymName}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                  : "Enterprise Notifications: OFF (Muted) - Click to manage"
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
              {!notificationsEnabled && (
                <span className="absolute -top-1 -right-1 flex h-3.5 px-1 items-center justify-center rounded-full bg-rose-500/90 text-[8px] font-extrabold text-white leading-none">
                  OFF
                </span>
              )}
            </button>
          )}

          {/* Language Toggle (मराठी / EN) */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 px-2 py-1.5 sm:px-2.5 text-xs font-bold text-indigo-300 transition shadow-sm cursor-pointer shrink-0"
              title={lang === "mr" ? "Switch to English" : "मराठी भाषेत वापरा"}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px]">{lang === "mr" ? "मराठी" : "EN"}</span>
            </button>
          )}

          {/* Barbell Plate Loader Quick Trigger */}
          {onOpenPlateCalculator && (
            <button
              onClick={onOpenPlateCalculator}
              className="hidden xl:flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition shadow-sm cursor-pointer"
              title={lang === "mr" ? "बारबेल प्लेट कॅल्क्युलेटर" : "Barbell Plate Loader Visualizer"}
            >
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px]">{t.plates}</span>
            </button>
          )}

          {/* PRs & Strength Trophy Wall Trigger */}
          {onOpenPersonalRecords && (
            <button
              onClick={onOpenPersonalRecords}
              className="hidden lg:flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition shadow-sm cursor-pointer"
              title={lang === "mr" ? "पर्सनल रेकॉर्ड्स व स्ट्रेंथ ट्रॉफी" : "Personal Records & 1RM Strength"}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px]">{t.prs}</span>
            </button>
          )}

          {/* Audio Coach & Rest Timer HUD Trigger */}
          {onOpenAudioCoach && (
            <button
              onClick={onOpenAudioCoach}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/30 px-2.5 py-1.5 text-xs font-semibold text-teal-300 transition shadow-sm cursor-pointer"
              title={lang === "mr" ? "ऑडिओ रेस्ट टाइमर व टेम्पो" : "Audio Rest Timer & Lifting Metronome"}
            >
              <Timer className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-[11px]">{t.audioCoach}</span>
            </button>
          )}

          {/* Water Tracker Quick Trigger */}
          {onOpenWaterTracker && (
            <button
              onClick={onOpenWaterTracker}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition shadow-sm cursor-pointer"
              title={lang === "mr" ? "पाणी ट्रॅकर" : "Quick Water Logger"}
            >
              <Droplets className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px]">{t.water}</span>
            </button>
          )}

          {/* AI Coach Quick CTA */}
          <button
            onClick={onOpenAILab}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/40 px-2 sm:px-3 py-1.5 text-xs font-semibold text-emerald-300 transition shadow-sm cursor-pointer shrink-0"
            title="Open AI Fitness Coach"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">{t.aiCoach}</span>
          </button>

          {/* Membership Badge if expiring soon */}
          {diffDays <= 30 && (
            <div
              className={`hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                diffDays <= 7
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              }`}
              title={`Gym membership expires in ${diffDays} days`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Gym: {diffDays}d left</span>
            </div>
          )}

          {/* Direct Firebase Console Sync Button */}
          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-[11px] text-emerald-300 font-bold cursor-pointer transition shrink-0 shadow-sm"
              title="Save All Data to Firebase Console / फायरबेस कन्सोलमध्ये सर्व डेटा सेव्ह करा"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">फायरबेस कन्सोल</span>
              <span className="sm:hidden">कन्सोल</span>
            </button>
          )}

          {/* Enterprise Auth & Cloud Sync Trigger */}
          <button
            onClick={onOpenEnterpriseAuth || onOpenCloudSync}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-[11px] text-slate-300 cursor-pointer transition shrink-0"
            title={`Enterprise Authentication & Sync Status: ${sync.syncStatus}. Click to manage.`}
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-300">Auth / Sync</span>
          </button>

          {/* Security Lock Screen Trigger */}
          <button
            onClick={onLockApp}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer shrink-0"
            title={t.lockApp}
          >
            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer shrink-0"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-200" />}
          </button>

          {/* User Profile Avatar & Button (Guaranteed visible and inside screen bounds) */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer shrink-0 ml-0.5"
            title={lang === "mr" ? "प्रोफाइल व सेटिंग्ज उघडा" : "Profile & Settings"}
          >
            <div className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-lg overflow-hidden border border-emerald-500/50 bg-slate-800 shrink-0">
              <img
                src={profile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[80px] truncate">
              {profile.fullName.split(" ")[0]}
            </span>
          </button>

          {/* Logout Quick Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer shrink-0"
              title={lang === "mr" ? "लॉगआउट करा" : "Logout of Account"}
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
