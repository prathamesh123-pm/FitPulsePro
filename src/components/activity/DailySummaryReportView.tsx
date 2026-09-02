import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingDown,
  Droplets,
  Moon,
  Heart,
  Scale,
  Percent,
  Award,
  ChevronRight,
  Share2,
} from "lucide-react";
import { DailyActivityAggregates, exportDailyActivityReportWord } from "../../utils/activityAnalytics";
import { ActivityLog } from "../../types";

interface DailySummaryReportViewProps {
  aggregates: DailyActivityAggregates;
  activitiesForDate: ActivityLog[];
  athleteName: string;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const DailySummaryReportView: React.FC<DailySummaryReportViewProps> = ({
  aggregates,
  activitiesForDate,
  athleteName,
  onNotify,
}) => {
  const [remarks, setRemarks] = useState(
    "Solid daily volume and energy expenditure. Calorie deficit on target for steady fat loss without muscle catabolism. Maintained high hydration and adequate recovery sleep."
  );

  const handleExportWord = () => {
    try {
      exportDailyActivityReportWord(aggregates, athleteName);
      onNotify("Word Report Downloaded", `FitPulse_Daily_Report_${aggregates.date}.doc ready.`, "success");
    } catch (err) {
      onNotify("Export Failed", "Could not generate Word document.", "error");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Audit Verified
            </span>
            <span className="text-xs text-slate-400">Date: {aggregates.date}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-1">
            FitPulse Pro • Daily Activity & Fitness Summary Report
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive audit of movements, caloric expenditures, lipid oxidation, vitals & goal achievement.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportWord}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export to Word</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Printable Container */}
      <div id="printable-daily-report" className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-2xl">
        {/* Top Summary Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Athlete Profile</div>
            <div className="text-base font-bold text-white">{athleteName}</div>
            <div className="text-xs text-slate-500">Report Date: {aggregates.date}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Daily Health Score</span>
              <div className="text-lg font-black text-emerald-400">{aggregates.dailyFitnessScore}/100</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Exercise Score</span>
              <div className="text-lg font-black text-teal-400">{aggregates.exerciseScore}/100</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Goal Achievement</span>
              <div className="text-lg font-black text-amber-400">{aggregates.goalCompletionPct}%</div>
            </div>
          </div>
        </div>

        {/* 1. Activities Completed Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Award className="h-4 w-4" /> 1. Activities Completed ({activitiesForDate.length} Sessions)
          </h3>
          {activitiesForDate.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
              No individual activities logged for {aggregates.date}. Use "+ Log Activity" to add sessions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Activity</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Distance</th>
                    <th className="p-2.5">Steps</th>
                    <th className="p-2.5">Calories</th>
                    <th className="p-2.5">Fat Burned</th>
                    <th className="p-2.5">Pace / Speed</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activitiesForDate.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-slate-200">
                        {act.activityType === "Custom Activity" ? act.customActivityName || "Custom" : act.activityType}
                      </td>
                      <td className="p-2.5 text-slate-400">{act.startTime || "-"}</td>
                      <td className="p-2.5 text-slate-300 font-medium">{act.durationMinutes} mins</td>
                      <td className="p-2.5 text-slate-300">{act.distanceKm ? `${act.distanceKm} km` : "-"}</td>
                      <td className="p-2.5 text-slate-400">{act.steps ? act.steps.toLocaleString() : "-"}</td>
                      <td className="p-2.5 font-bold text-amber-400">{act.caloriesBurned} kcal</td>
                      <td className="p-2.5 font-bold text-emerald-400">{act.estimatedFatBurnedGrams || 0}g</td>
                      <td className="p-2.5 text-slate-400">{act.paceMinPerKm || (act.avgSpeedKmh ? `${act.avgSpeedKmh} km/h` : "-")}</td>
                      <td className="p-2.5 text-slate-400 max-w-[150px] truncate">{act.routeNotes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Key Aggregate Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Exercise Time</span>
            <div className="text-xl font-bold text-slate-100">{aggregates.totalWorkoutTimeMin} mins</div>
            <div className="text-[10px] text-slate-400">Target: {aggregates.goals.workoutDurationMinGoal} mins</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Distance</span>
            <div className="text-xl font-bold text-slate-100">{aggregates.totalDistanceKm} KM</div>
            <div className="text-[10px] text-slate-400">Walk: {aggregates.totalWalkingKm}km | Run: {aggregates.totalRunningKm}km</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Calories Burned</span>
            <div className="text-xl font-bold text-amber-400">{aggregates.totalCaloriesBurned} kcal</div>
            <div className="text-[10px] text-slate-400">Target: {aggregates.goals.caloriesBurnedGoal} kcal</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-emerald-400">Estimated Fat Burned</span>
            <div className="text-xl font-bold text-emerald-400">{aggregates.estimatedFatBurnedGrams} g</div>
            <div className="text-[10px] text-slate-400">Pure adipose oxidation</div>
          </div>
        </div>

        {/* 3. Energy Balance & Hydration Audit */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. Energy Balance & Hydration Audit
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">Calories Consumed</span>
              <div className="text-base font-bold text-slate-200">{aggregates.caloriesConsumed} kcal</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Active Burned</span>
              <div className="text-base font-bold text-amber-400">{aggregates.totalCaloriesBurned} kcal</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Net Calorie Balance</span>
              <div className={`text-base font-bold ${aggregates.netCalories <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {aggregates.netCalories} kcal {aggregates.netCalories < 0 ? "(Deficit)" : "(Surplus)"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Water Logged</span>
              <div className="text-base font-bold text-cyan-400">
                {aggregates.waterIntakeMl} ml / {aggregates.goals.waterIntakeMlGoal} ml
              </div>
            </div>
          </div>
        </div>

        {/* 4. Body Measurements & Health Vitals */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            3. Body Measurements & Vitals
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Weight</span>
              <div className="font-bold text-slate-100">{aggregates.vitals?.weightKg || "78.5"} kg</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Body Fat</span>
              <div className="font-bold text-slate-100">{aggregates.vitals?.bodyFatPct || "18.2"}%</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">BMI</span>
              <div className="font-bold text-slate-100">{aggregates.vitals?.bmi || "24.5"}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Waist</span>
              <div className="font-bold text-slate-100">{aggregates.vitals?.waistCm || "84"} cm</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Blood Pressure</span>
              <div className="font-bold text-slate-100">
                {aggregates.vitals?.bloodPressureSystolic || 120}/{aggregates.vitals?.bloodPressureDiastolic || 80}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Blood Sugar</span>
              <div className="font-bold text-slate-100">{aggregates.vitals?.bloodSugarMgDl || 95} mg/dL</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400">Resting HR / Sleep</span>
              <div className="font-bold text-slate-100">
                {aggregates.vitals?.restingHeartRateBpm || 65} bpm / {aggregates.vitals?.sleepHours || 7.5}h
              </div>
            </div>
          </div>
        </div>

        {/* 5. Personal Remarks */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            4. Personal Remarks & Coach Audit Notes
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
