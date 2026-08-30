import React from "react";
import {
  Trophy,
  Flame,
  Award,
  Crown,
  Droplets,
  TrendingDown,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { FitnessAchievement } from "../types";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: FitnessAchievement[];
}

export function AchievementsModal({
  isOpen,
  onClose,
  achievements,
}: AchievementsModalProps) {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="h-5 w-5 text-amber-400" />;
      case "Trophy":
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case "Award":
        return <Award className="h-5 w-5 text-emerald-400" />;
      case "Crown":
        return <Crown className="h-5 w-5 text-purple-400" />;
      case "Droplets":
        return <Droplets className="h-5 w-5 text-cyan-400" />;
      case "TrendingDown":
        return <TrendingDown className="h-5 w-5 text-emerald-400" />;
      case "TrendingUp":
        return <TrendingUp className="h-5 w-5 text-sky-400" />;
      case "Sparkles":
        return <Sparkles className="h-5 w-5 text-amber-300" />;
      case "CheckCircle2":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      default:
        return <Trophy className="h-5 w-5 text-emerald-400" />;
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-100">
                  Section 41 • Achievements & Milestones
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {unlockedCount}/{totalCount} Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track and celebrate streaks, consistency, and fitness milestones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Trophy Progression</span>
            <span className="text-amber-400 font-extrabold">{percentage}% Completed</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>{unlockedCount} badges earned</span>
            <button
              onClick={triggerCelebration}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Celebrate Streak</span>
            </button>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="overflow-y-auto space-y-3 pr-1 max-h-[480px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((item) => {
              const progressPct = Math.min(100, Math.round((item.progress / item.target) * 100));

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.unlocked) triggerCelebration();
                  }}
                  className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                    item.unlocked
                      ? "bg-slate-800/40 border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800/70 cursor-pointer"
                      : "bg-slate-950/50 border-slate-800/80 opacity-75"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                            item.unlocked
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-slate-800 border-slate-700"
                          }`}
                        >
                          {item.unlocked ? getIcon(item.iconName) : <Lock className="h-4 w-4 text-slate-500" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {item.unlocked ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                          Locked
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        Progress: {item.progress} / {item.target} {item.unit || ""}
                      </span>
                      <span className={item.unlocked ? "text-emerald-400 font-bold" : "text-slate-400"}>
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.unlocked ? "bg-emerald-500" : "bg-slate-600"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {item.unlockedDate && (
                      <span className="text-[9px] text-slate-500 block text-right">
                        Earned on {item.unlockedDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">
            Keep logging workouts and meals consistently to claim the 100-day crown!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
