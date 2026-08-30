import { Shield, Cloud, Lock, Moon, Sun, Dumbbell, Sparkles, AlertCircle, Trophy } from "lucide-react";
import { UserProfile, CloudSyncState, GymMembership } from "../types";

interface NavbarProps {
  profile: UserProfile;
  sync: CloudSyncState;
  membership: GymMembership;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenProfile: () => void;
  onLockApp: () => void;
  onOpenAILab: () => void;
  onOpenAchievements?: () => void;
  onOpenCloudSync?: () => void;
}

export function Navbar({
  profile,
  sync,
  membership,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  onLockApp,
  onOpenAILab,
  onOpenAchievements,
  onOpenCloudSync,
}: NavbarProps) {
  // Calculate membership days remaining
  const expiry = new Date(membership.expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md shadow-emerald-500/20 font-black">
            <Dumbbell className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-100">
                FitPulse<span className="text-emerald-400">Pro</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                {profile.fitnessGoal}
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Target: {profile.targetWeightKg} kg • {membership.gymName}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Achievements Trophy Trigger */}
          {onOpenAchievements && (
            <button
              onClick={onOpenAchievements}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition shadow-sm cursor-pointer"
              title="Achievements & Streaks (Section 41)"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="hidden md:inline text-[11px]">Badges</span>
            </button>
          )}

          {/* AI Coach Quick CTA */}
          <button
            onClick={onOpenAILab}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition shadow-sm cursor-pointer"
            title="Open AI Fitness Coach"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          {/* Membership Badge if expiring soon */}
          {diffDays <= 30 && (
            <div
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
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

          {/* Cloud Sync Trigger */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer transition"
            title={`Cloud Database: ${sync.syncStatus === "synced" ? "Online & Synchronized" : "Local Offline Mode"}. Click to manage.`}
          >
            <Cloud className={`h-3.5 w-3.5 ${sync.syncStatus === "synced" ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="hidden sm:inline font-medium">{sync.syncStatus === "synced" ? "Synced" : "Cloud"}</span>
          </button>

          {/* Security Lock Screen Trigger */}
          <button
            onClick={onLockApp}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer"
            title="Lock FitPulse with PIN"
          >
            <Lock className="h-4 w-4" />
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-200" />}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            title="Profile & Settings"
          >
            <div className="h-7 w-7 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-800">
              <img
                src={profile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-200">
              {profile.fullName.split(" ")[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
