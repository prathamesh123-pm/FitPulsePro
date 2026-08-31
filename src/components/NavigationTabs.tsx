import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Activity,
  Calculator,
  UserCheck,
  CheckSquare,
  BarChart3,
  Sparkles,
  Footprints,
  Clock,
} from "lucide-react";
import { TabId } from "../types";
import { Language, TRANSLATIONS } from "../utils/i18n";

export type { TabId };

interface NavigationTabsProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  activeWorkoutCount?: number;
  unreadRemindersCount?: number;
  lang?: Language;
}

export function NavigationTabs({
  currentTab,
  onSelectTab,
  activeWorkoutCount = 0,
  lang = "en",
}: NavigationTabsProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const TABS: { id: TabId; label: string; shortLabel: string; icon: any }[] = [
    { id: "dashboard", label: t.dashboard, shortLabel: lang === "mr" ? "डॅशबोर्ड" : "Dashboard", icon: LayoutDashboard },
    { id: "workout", label: t.workout, shortLabel: lang === "mr" ? "व्यायाम" : "Workout", icon: Dumbbell },
    { id: "diet", label: t.diet, shortLabel: lang === "mr" ? "आहार" : "Diet", icon: UtensilsCrossed },
    { id: "activity", label: t.activity, shortLabel: lang === "mr" ? "ऍक्टिव्हिटी" : "Activity", icon: Footprints },
    { id: "lifestyle", label: t.lifestyle, shortLabel: lang === "mr" ? "जीवनशैली" : "Lifestyle", icon: Clock },
    { id: "health", label: t.health, shortLabel: lang === "mr" ? "आरोग्य" : "Health", icon: Activity },
    { id: "calculators", label: t.calculators, shortLabel: lang === "mr" ? "कॅल्क्युलेटर" : "Calc", icon: Calculator },
    { id: "coach", label: t.coach, shortLabel: lang === "mr" ? "कोच" : "Coach", icon: UserCheck },
    { id: "checklist", label: t.checklist, shortLabel: lang === "mr" ? "चेकलिस्ट" : "Checklist", icon: CheckSquare },
    { id: "reports", label: t.reports, shortLabel: lang === "mr" ? "अहवाल" : "Reports", icon: BarChart3 },
    { id: "ailab", label: t.ailab, shortLabel: lang === "mr" ? "AI लॅब" : "AI Lab", icon: Sparkles },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Segmented Bar */}
      <div className="hidden md:block w-full border-b border-slate-800 bg-slate-950/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer relative whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === "workout" && activeWorkoutCount > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Fixed Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-2 py-1.5 shadow-2xl">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition cursor-pointer shrink-0 min-w-[56px] ${
                  isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                    isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="mt-0.5 whitespace-nowrap">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
