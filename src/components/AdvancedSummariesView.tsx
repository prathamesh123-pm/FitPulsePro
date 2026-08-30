import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Dumbbell,
  Apple,
  Building2,
  Flame,
  Zap,
  Droplets,
  Footprints,
  Bike,
  Ruler,
  TrendingDown,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
} from "lucide-react";
import { AppState } from "../types";

interface AdvancedSummariesViewProps {
  appState: AppState;
  onOpenExportModal?: () => void;
}

export type SummaryTabKey =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "exercise"
  | "workout"
  | "diet"
  | "attendance"
  | "calories"
  | "protein"
  | "water"
  | "steps"
  | "running"
  | "cycling"
  | "bodyMeasurements"
  | "weightProgress"
  | "membership"
  | "coach";

interface SummaryDef {
  key: SummaryTabKey;
  title: string;
  icon: any;
  category: "General Timeframe" | "Training & Gym" | "Nutrition & Health" | "Endurance & Cardio" | "Body & Coach";
}

const SUMMARY_TABS: SummaryDef[] = [
  { key: "daily", title: "Daily Summary", icon: Calendar, category: "General Timeframe" },
  { key: "weekly", title: "Weekly Summary", icon: Calendar, category: "General Timeframe" },
  { key: "monthly", title: "Monthly Summary", icon: Calendar, category: "General Timeframe" },
  { key: "yearly", title: "Yearly Summary", icon: Calendar, category: "General Timeframe" },
  { key: "exercise", title: "Exercise Summary", icon: Dumbbell, category: "Training & Gym" },
  { key: "workout", title: "Workout Summary", icon: Dumbbell, category: "Training & Gym" },
  { key: "diet", title: "Diet Summary", icon: Apple, category: "Nutrition & Health" },
  { key: "attendance", title: "Gym Attendance Summary", icon: Building2, category: "Training & Gym" },
  { key: "calories", title: "Calories Summary", icon: Flame, category: "Nutrition & Health" },
  { key: "protein", title: "Protein Summary", icon: Zap, category: "Nutrition & Health" },
  { key: "water", title: "Water Intake Summary", icon: Droplets, category: "Nutrition & Health" },
  { key: "steps", title: "Steps Summary", icon: Footprints, category: "Endurance & Cardio" },
  { key: "running", title: "Running Summary", icon: Footprints, category: "Endurance & Cardio" },
  { key: "cycling", title: "Cycling Summary", icon: Bike, category: "Endurance & Cardio" },
  { key: "bodyMeasurements", title: "Body Measurement Summary", icon: Ruler, category: "Body & Coach" },
  { key: "weightProgress", title: "Weight Progress Summary", icon: TrendingDown, category: "Body & Coach" },
  { key: "membership", title: "Membership Summary", icon: CreditCard, category: "Body & Coach" },
  { key: "coach", title: "Coach Summary", icon: UserCheck, category: "Body & Coach" },
];

export function AdvancedSummariesView({
  appState,
  onOpenExportModal,
}: AdvancedSummariesViewProps) {
  const [activeTab, setActiveTab] = useState<SummaryTabKey>("daily");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const visibleTabs = SUMMARY_TABS.filter(
    (t) => selectedCategory === "All" || t.category === selectedCategory
  );

  const activeDef = SUMMARY_TABS.find((t) => t.key === activeTab) || SUMMARY_TABS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/30">
                18 Advanced Summaries
              </span>
              <span className="text-xs text-slate-400">Complete Fitness Management Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <FileText className="h-6 w-6 text-sky-400" />
              <span>{activeDef.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional analysis providing detailed audits, metrics, adherence checks, and smart coaching diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span>Print</span>
            </button>
            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Export / Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
          {["All", "General Timeframe", "Training & Gym", "Nutrition & Health", "Endurance & Cardio", "Body & Coach"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Summary Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-500 text-sky-300 font-black shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-sky-400" : "text-slate-500"}`} />
                <span className="text-[11px] truncate">{t.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Summary Content Panel */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        {/* 1. Daily Summary */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Target Date</span>
                <span className="text-xl font-black text-slate-100">2026-08-28</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Friday Protocol</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Net Calorie Deficit</span>
                <span className="text-xl font-black text-emerald-400">-420 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">2,150 burned vs 1,730 eaten</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Protein Hit</span>
                <span className="text-xl font-black text-sky-400">162g / 157g</span>
                <span className="text-[10px] text-emerald-400 block mt-1">103% of optimal</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Lifting Volume</span>
                <span className="text-xl font-black text-amber-400">5,840 kg</span>
                <span className="text-[10px] text-slate-500 block mt-1">Chest & Triceps Focus</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Daily Performance Evaluation
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ✔ Today demonstrated exceptional macronutrient compliance with zero missed meals. Caloric intake sat 420 kcal under total daily expenditure, preserving steady adipose tissue loss while 162g high-biological-value protein completely protected lean mass.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                ✔ Lifting session completed in 65 minutes with progressive overload on Flat Barbell Bench Press (82.5kg x 6 reps). Water hydration exceeded target at 3,200ml.
              </p>
            </div>
          </div>
        )}

        {/* 2. Weekly Summary */}
        {activeTab === "weekly" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Week Range</span>
                <span className="text-base font-black text-slate-100">Aug 22 - Aug 28</span>
                <span className="text-[10px] text-emerald-400 block mt-1">7 Days Audited</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Gym Attendance</span>
                <span className="text-xl font-black text-emerald-400">5 / 5 Days</span>
                <span className="text-[10px] text-emerald-400 block mt-1">100% attendance rate</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Energy Balance</span>
                <span className="text-xl font-black text-sky-400">-3,070 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">~0.40 kg pure fat lost</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Step Volume</span>
                <span className="text-xl font-black text-amber-400">68,400 steps</span>
                <span className="text-[10px] text-slate-500 block mt-1">9,770 avg/day</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Weekly Performance Synthesis
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                • <strong>Strengths:</strong> Zero unexcused gym misses. Excellent total volume progression across Upper Body, Posterior Chain, and Quad sessions. Caloric deficit was maintained consistently across 6 of 7 days.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                • <strong>Areas for Improvement:</strong> Mid-week sleep dipped to 6.2 hours on Tuesday due to evening work calls. Maintain pre-sleep magnesium and an earlier bedtime.
              </p>
            </div>
          </div>
        )}

        {/* 3. Monthly Summary */}
        {activeTab === "monthly" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Month</span>
                <span className="text-xl font-black text-slate-100">August 2026</span>
                <span className="text-[10px] text-emerald-400 block mt-1">31 Calendar Days</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Weight Delta</span>
                <span className="text-xl font-black text-emerald-400">-2.70 kg</span>
                <span className="text-[10px] text-slate-500 block mt-1">81.2 kg → 78.5 kg</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Gym Attendance</span>
                <span className="text-xl font-black text-teal-400">92.0%</span>
                <span className="text-[10px] text-slate-500 block mt-1">22 of 24 planned sessions</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Monthly Adherence</span>
                <span className="text-xl font-black text-purple-400">94.1%</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Overall Grade: A+</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
              <h4 className="font-black uppercase text-purple-400 tracking-wider">
                Monthly Audit Highlights
              </h4>
              <p>• Total Calories Consumed: 64,480 kcal | Total Burned: 76,800 kcal (Cumulative Net Deficit: -12,320 kcal).</p>
              <p>• Total Workout Hours: 27.5 hours logged | Total Volume Lifted: 114,800 kg.</p>
              <p>• Body fat percentage shifted from 18.2% down to 15.9% (-2.3% pure fat drop).</p>
            </div>
          </div>
        )}

        {/* 4. Yearly Summary */}
        {activeTab === "yearly" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Year Period</span>
                <span className="text-xl font-black text-slate-100">2026 (YTD)</span>
                <span className="text-[10px] text-emerald-400 block mt-1">8 Months Logged</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Workouts</span>
                <span className="text-xl font-black text-emerald-400">178 Sessions</span>
                <span className="text-[10px] text-slate-500 block mt-1">Avg 22.2/month</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Tonnage</span>
                <span className="text-xl font-black text-sky-400">890 Tonnes</span>
                <span className="text-[10px] text-slate-500 block mt-1">Progressive load peak</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Net Fat Lost</span>
                <span className="text-xl font-black text-amber-400">-5.8 kg</span>
                <span className="text-[10px] text-emerald-400 block mt-1">84.3 kg → 78.5 kg</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-black uppercase text-sky-400 tracking-wider">Annual Progression Summary</h4>
              <p>• Maintained exceptional adherence with over 90% attendance across all quarters.</p>
              <p>• Bench Press 1RM improved from 80kg to 102.5kg (+22.5kg). Squat 1RM from 110kg to 135kg (+25kg).</p>
            </div>
          </div>
        )}

        {/* 5. Exercise Summary */}
        {activeTab === "exercise" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Unique Exercises</span>
                <span className="text-xl font-black text-emerald-400">42 Movements</span>
                <span className="text-[10px] text-slate-500 block mt-1">Spread across 6 muscle splits</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Sets Completed</span>
                <span className="text-xl font-black text-sky-400">540 Sets</span>
                <span className="text-[10px] text-slate-500 block mt-1">100% completion rate</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Top Compound</span>
                <span className="text-xl font-black text-amber-400">Flat Barbell Bench</span>
                <span className="text-[10px] text-emerald-400 block mt-1">PR: 82.5kg x 6</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Exercise Name</th>
                    <th className="p-3">Muscle Group</th>
                    <th className="p-3">Total Sets</th>
                    <th className="p-3">Peak Weight</th>
                    <th className="p-3">Volume (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold text-slate-200">Barbell Bench Press</td>
                    <td className="p-3 text-emerald-400">Chest</td>
                    <td className="p-3">36</td>
                    <td className="p-3 font-mono">82.5 kg</td>
                    <td className="p-3 font-mono">18,400 kg</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-200">Incline Dumbbell Press</td>
                    <td className="p-3 text-emerald-400">Upper Chest</td>
                    <td className="p-3">32</td>
                    <td className="p-3 font-mono">32.0 kg</td>
                    <td className="p-3 font-mono">14,200 kg</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-200">Barbell Deadlift</td>
                    <td className="p-3 text-sky-400">Posterior Chain</td>
                    <td className="p-3">28</td>
                    <td className="p-3 font-mono">140.0 kg</td>
                    <td className="p-3 font-mono">22,800 kg</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-200">Barbell Back Squat</td>
                    <td className="p-3 text-amber-400">Quads & Glutes</td>
                    <td className="p-3">30</td>
                    <td className="p-3 font-mono">120.0 kg</td>
                    <td className="p-3 font-mono">21,600 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Workout Summary */}
        {activeTab === "workout" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Sessions</span>
                <span className="text-xl font-black text-emerald-400">22 Workouts</span>
                <span className="text-[10px] text-slate-500 block mt-1">August 2026</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Duration</span>
                <span className="text-xl font-black text-sky-400">65 Minutes</span>
                <span className="text-[10px] text-slate-500 block mt-1">Pure lifting time</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Volume</span>
                <span className="text-xl font-black text-amber-400">114,800 kg</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Heavy intensity</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Burn / Session</span>
                <span className="text-xl font-black text-rose-400">420 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Calibrated via HR</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-black uppercase text-emerald-400 tracking-wider">Training Protocol Assessment</h4>
              <p>• Split: Push / Pull / Legs with dedicated arm and posterior chain auxiliary work.</p>
              <p>• Recovery: Sunday unconditional active recovery rest day with mobility stretching.</p>
            </div>
          </div>
        )}

        {/* 7. Diet Summary */}
        {activeTab === "diet" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Adherence Rate</span>
                <span className="text-xl font-black text-emerald-400">91.5%</span>
                <span className="text-[10px] text-slate-500 block mt-1">28 / 31 Clean Days</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Cheat Meals</span>
                <span className="text-xl font-black text-amber-400">2 Logged</span>
                <span className="text-[10px] text-slate-500 block mt-1">Aug 15 & Aug 22</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Daily Calories</span>
                <span className="text-xl font-black text-sky-400">2,080 kcal</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Within target budget</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Meals Consumed</span>
                <span className="text-xl font-black text-teal-400">268 Meals</span>
                <span className="text-[10px] text-slate-500 block mt-1">98.2% completed</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-black uppercase text-sky-400 tracking-wider">Nutritional Discipline Audit</h4>
              <p>• Macronutrient Distribution: 30% Protein (152g), 45% Carbs (195g), 25% Fat (58g).</p>
              <p>• Meal timing spaced cleanly across 4 main windows (08:00, 13:00, 17:30, 20:30).</p>
            </div>
          </div>
        )}

        {/* 8. Gym Attendance Summary */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Present Days</span>
                <span className="text-xl font-black text-emerald-400">22 Days</span>
                <span className="text-[10px] text-slate-500 block mt-1">Checked-In</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Rest Days</span>
                <span className="text-xl font-black text-sky-400">5 Days</span>
                <span className="text-[10px] text-slate-500 block mt-1">Sundays</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Holidays</span>
                <span className="text-xl font-black text-indigo-400">1 Day</span>
                <span className="text-[10px] text-slate-500 block mt-1">Aug 15</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Unexcused Misses</span>
                <span className="text-xl font-black text-rose-400">1 Day</span>
                <span className="text-[10px] text-rose-400 block mt-1">Aug 11 (Travel)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-black uppercase text-teal-400 tracking-wider">Attendance Compliance</h4>
              <p>• Gym Check-In Percentage: 92.0% of scheduled training dates.</p>
              <p>• Longest consecutive gym streak: 12 consecutive active training days.</p>
            </div>
          </div>
        )}

        {/* 9. Calories Summary */}
        {activeTab === "calories" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Consumed</span>
                <span className="text-xl font-black text-amber-400">64,480 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Avg 2,080 / day</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Burned</span>
                <span className="text-xl font-black text-emerald-400">76,800 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Avg 2,477 / day</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Net Deficit</span>
                <span className="text-xl font-black text-sky-400">-12,320 kcal</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Strong fat loss</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Target Calorie Cap</span>
                <span className="text-xl font-black text-slate-200">2,200 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Daily limit</span>
              </div>
            </div>
          </div>
        )}

        {/* 10. Protein Summary */}
        {activeTab === "protein" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Daily Protein</span>
                <span className="text-xl font-black text-sky-400">152 grams</span>
                <span className="text-[10px] text-slate-500 block mt-1">Target: 157g</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Target Met Days</span>
                <span className="text-xl font-black text-emerald-400">28 / 31 Days</span>
                <span className="text-[10px] text-slate-500 block mt-1">90.3% compliance</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Monthly</span>
                <span className="text-xl font-black text-indigo-400">4,712 grams</span>
                <span className="text-[10px] text-slate-500 block mt-1">Pure amino acids</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Gram / Kg Ratio</span>
                <span className="text-xl font-black text-amber-400">1.94 g/kg</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Optimal hypertrophy</span>
              </div>
            </div>
          </div>
        )}

        {/* 11. Water Intake Summary */}
        {activeTab === "water" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Daily Water</span>
                <span className="text-xl font-black text-cyan-400">2.85 Liters</span>
                <span className="text-[10px] text-slate-500 block mt-1">Target: 3.0L</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Monthly</span>
                <span className="text-xl font-black text-cyan-300">88.5 Liters</span>
                <span className="text-[10px] text-slate-500 block mt-1">31 Days cumulative</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Days Target Hit</span>
                <span className="text-xl font-black text-emerald-400">29 / 31 Days</span>
                <span className="text-[10px] text-slate-500 block mt-1">93.5% success</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Low Intake Days</span>
                <span className="text-xl font-black text-rose-400">2 Days</span>
                <span className="text-[10px] text-rose-400 block mt-1">Aug 7 & Aug 19</span>
              </div>
            </div>
          </div>
        )}

        {/* 12. Steps Summary */}
        {activeTab === "steps" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Steps</span>
                <span className="text-xl font-black text-teal-400">274,000</span>
                <span className="text-[10px] text-slate-500 block mt-1">Monthly aggregate</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Daily Cadence</span>
                <span className="text-xl font-black text-emerald-400">8,838 steps</span>
                <span className="text-[10px] text-slate-500 block mt-1">Target: 10,000</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Walking Distance</span>
                <span className="text-xl font-black text-sky-400">213.7 km</span>
                <span className="text-[10px] text-slate-500 block mt-1">GPS & step estimated</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Calories Burned</span>
                <span className="text-xl font-black text-amber-400">10,960 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">NEAT activity burn</span>
              </div>
            </div>
          </div>
        )}

        {/* 13. Running Summary */}
        {activeTab === "running" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Running Dist</span>
                <span className="text-xl font-black text-rose-400">38.5 km</span>
                <span className="text-[10px] text-slate-500 block mt-1">Outdoor & Treadmill</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Duration</span>
                <span className="text-xl font-black text-emerald-400">210 mins</span>
                <span className="text-[10px] text-slate-500 block mt-1">3.5 hours</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Pace</span>
                <span className="text-xl font-black text-sky-400">5'27" /km</span>
                <span className="text-[10px] text-slate-500 block mt-1">Zone 3 aerobic</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Calories Burned</span>
                <span className="text-xl font-black text-amber-400">2,680 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Aerobic expenditure</span>
              </div>
            </div>
          </div>
        )}

        {/* 14. Cycling Summary */}
        {activeTab === "cycling" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Cycling Distance</span>
                <span className="text-xl font-black text-blue-400">92.0 km</span>
                <span className="text-[10px] text-slate-500 block mt-1">Road & Stationary</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Duration Logged</span>
                <span className="text-xl font-black text-emerald-400">180 mins</span>
                <span className="text-[10px] text-slate-500 block mt-1">Low joint impact</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Avg Speed</span>
                <span className="text-xl font-black text-sky-400">24.2 km/h</span>
                <span className="text-[10px] text-slate-500 block mt-1">High endurance</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Calories Burned</span>
                <span className="text-xl font-black text-amber-400">1,940 kcal</span>
                <span className="text-[10px] text-slate-500 block mt-1">Fat oxidation burn</span>
              </div>
            </div>
          </div>
        )}

        {/* 15. Body Measurement Summary */}
        {activeTab === "bodyMeasurements" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Waistline</span>
                <span className="text-xl font-black text-emerald-400">31.2 in</span>
                <span className="text-[10px] text-emerald-400 block mt-1">-1.3 inches lost</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Chest Circumference</span>
                <span className="text-xl font-black text-sky-400">41.8 in</span>
                <span className="text-[10px] text-emerald-400 block mt-1">+0.6 in expansion</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Biceps</span>
                <span className="text-xl font-black text-amber-400">15.4 in</span>
                <span className="text-[10px] text-emerald-400 block mt-1">+0.4 in peak growth</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Thighs</span>
                <span className="text-xl font-black text-teal-400">23.6 in</span>
                <span className="text-[10px] text-slate-400 block mt-1">Firm vascularity</span>
              </div>
            </div>
          </div>
        )}

        {/* 16. Weight Progress Summary */}
        {activeTab === "weightProgress" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Starting Weight</span>
                <span className="text-xl font-black text-slate-100">81.2 kg</span>
                <span className="text-[10px] text-slate-500 block mt-1">Aug 1 Baseline</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Current Weight</span>
                <span className="text-xl font-black text-emerald-400">78.5 kg</span>
                <span className="text-[10px] text-slate-500 block mt-1">Aug 28 Official</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Total Change</span>
                <span className="text-xl font-black text-emerald-400">-2.70 kg</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Steady fat reduction</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Target Goal Weight</span>
                <span className="text-xl font-black text-sky-400">75.0 kg</span>
                <span className="text-[10px] text-slate-500 block mt-1">3.5 kg remaining</span>
              </div>
            </div>
          </div>
        )}

        {/* 17. Membership Summary */}
        {activeTab === "membership" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Gym Plan Tier</span>
                <span className="text-xl font-black text-amber-400">Platinum Elite</span>
                <span className="text-[10px] text-emerald-400 block mt-1">All-Access Facility</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Status</span>
                <span className="text-xl font-black text-emerald-400">Active</span>
                <span className="text-[10px] text-slate-500 block mt-1">Renewal: 2027-01-15</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Visits Used</span>
                <span className="text-xl font-black text-sky-400">178 Visits</span>
                <span className="text-[10px] text-slate-500 block mt-1">Annual total</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block">Trainer Assigned</span>
                <span className="text-xl font-black text-teal-400">Coach Marcus</span>
                <span className="text-[10px] text-slate-500 block mt-1">Strength & Hypertrophy</span>
              </div>
            </div>
          </div>
        )}

        {/* 18. Coach Summary */}
        {activeTab === "coach" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Head AI Strength & Conditioning Coach
                </span>
                <h3 className="text-lg font-black text-slate-100">Coach Analysis & Directive</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Athlete ID: #FP-9042 • Mesocycle 3: Hypertrophy & Fat Loss Phase
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                Rating: 9.8 / 10
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <h5 className="font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Positive Coach Feedback:
                </h5>
                <p>
                  "Your lifting mechanics on bench press and Romanian deadlifts have reached peak stability. Retaining 100% training attendance during work travel proves excellent commitment."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <h5 className="font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Coach Directive for Next Meso:
                </h5>
                <p>
                  "Increase deadlift loading by +2.5kg per set next week. Target 3,200ml water unconditionally to sustain kidney filtration with high-protein intake."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
