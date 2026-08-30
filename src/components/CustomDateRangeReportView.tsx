import React, { useState, useMemo } from "react";
import {
  Calendar,
  CalendarRange,
  Flame,
  Zap,
  Droplets,
  Dumbbell,
  Building2,
  Apple,
  Footprints,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  ChevronRight,
  Info,
} from "lucide-react";
import { AppState } from "../types";
import {
  generateCustomRangeReport,
  CustomRangeReportData,
} from "../utils/advancedReportCalculators";

interface CustomDateRangeReportViewProps {
  appState: AppState;
  onOpenExportModal?: () => void;
}

export type DatePresetKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "customDate"
  | "customRange";

export function CustomDateRangeReportView({
  appState,
  onOpenExportModal,
}: CustomDateRangeReportViewProps) {
  const [preset, setPreset] = useState<DatePresetKey>("thisWeek");
  const [startDate, setStartDate] = useState<string>("2026-08-22");
  const [endDate, setEndDate] = useState<string>("2026-08-28");
  const [singleCustomDate, setSingleCustomDate] = useState<string>("2026-08-28");

  // Handle Preset Clicks
  const handleSelectPreset = (p: DatePresetKey) => {
    setPreset(p);
    switch (p) {
      case "today":
        setStartDate("2026-08-28");
        setEndDate("2026-08-28");
        break;
      case "yesterday":
        setStartDate("2026-08-27");
        setEndDate("2026-08-27");
        break;
      case "thisWeek":
        setStartDate("2026-08-22");
        setEndDate("2026-08-28");
        break;
      case "lastWeek":
        setStartDate("2026-08-15");
        setEndDate("2026-08-21");
        break;
      case "thisMonth":
        setStartDate("2026-08-01");
        setEndDate("2026-08-31");
        break;
      case "lastMonth":
        setStartDate("2026-07-01");
        setEndDate("2026-07-31");
        break;
      case "customDate":
        setStartDate(singleCustomDate);
        setEndDate(singleCustomDate);
        break;
      case "customRange":
        // Keep current custom start and end dates
        break;
    }
  };

  const handleCustomDateChange = (val: string) => {
    setSingleCustomDate(val);
    setStartDate(val);
    setEndDate(val);
  };

  // Generate Report automatically
  const reportData: CustomRangeReportData = useMemo(() => {
    const presetLabels: Record<DatePresetKey, string> = {
      today: "Today's Diagnostic Report",
      yesterday: "Yesterday's Performance Audit",
      thisWeek: "This Week's Aggregated Fitness Report",
      lastWeek: "Last Week's Comparative Audit",
      thisMonth: "This Month (August 2026) Comprehensive Audit",
      lastMonth: "Last Month (July 2026) Archive Report",
      customDate: `Single Day Report: ${startDate}`,
      customRange: `Custom Range Report: ${startDate} to ${endDate}`,
    };
    return generateCustomRangeReport(appState, startDate, endDate, presetLabels[preset]);
  }, [appState, startDate, endDate, preset]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Selector and Preset Controls */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Dynamic Reporting Engine
              </span>
              <span className="text-xs text-slate-400">Custom Date & Range Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <CalendarRange className="h-6 w-6 text-emerald-400" />
              <span>{reportData.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any timeframe preset, specific calendar date, or custom interval to generate a complete automatic audit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span>Print Report</span>
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

        {/* 8 Required Preset Buttons */}
        <div className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Timeframe Preset:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "thisWeek", label: "This Week" },
              { key: "lastWeek", label: "Last Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
              { key: "customDate", label: "Custom Date" },
              { key: "customRange", label: "Custom Date Range" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelectPreset(item.key as DatePresetKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  preset === item.key
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers (Shown if customDate or customRange selected) */}
        {preset === "customDate" && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-4 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <label className="text-xs font-bold text-slate-300">Choose Specific Date:</label>
            </div>
            <input
              type="date"
              value={singleCustomDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
            />
            <span className="text-xs text-slate-400">
              Report automatically refreshes for {singleCustomDate}
            </span>
          </div>
        )}

        {preset === "customRange" && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-4 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Custom Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-xs text-emerald-400 font-semibold">
              {reportData.daysCount} total days aggregated
            </span>
          </div>
        )}
      </div>

      {/* Aggregate Metric Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Net Calories */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Net Energy Balance
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {reportData.metrics.netCalorieBalance > 0 ? "+" : ""}
              {reportData.metrics.netCalorieBalance.toLocaleString()} kcal
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {reportData.metrics.deficitMaintained ? "✔ Caloric Deficit" : "Surplus"}
          </span>
        </div>

        {/* Avg Daily Calories */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Avg Daily Calories
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-sky-400 font-mono">
              {reportData.metrics.avgDailyCaloriesConsumed.toLocaleString()} kcal
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Burned: {reportData.metrics.avgDailyCaloriesBurned.toLocaleString()} /day
          </span>
        </div>

        {/* Protein Intake */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Avg Protein
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-400 font-mono">
              {reportData.metrics.avgProteinGrams}g
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 block">
            {reportData.metrics.proteinTargetMetDays}/{reportData.daysCount} days target hit
          </span>
        </div>

        {/* Water Intake */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Avg Hydration
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-cyan-400 font-mono">
              {reportData.metrics.avgWaterLiters} L/day
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Total: {reportData.metrics.totalWaterLiters} Liters
          </span>
        </div>

        {/* Workouts & Volume */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Training Volume
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-400 font-mono">
              {Math.round(reportData.metrics.totalVolumeKg).toLocaleString()} kg
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 block">
            {reportData.metrics.totalWorkouts} sessions ({reportData.metrics.totalWorkoutHours}h)
          </span>
        </div>

        {/* Weight & Estimated Fat Loss */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Fat Loss Estimate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-400 font-mono">
              -{reportData.metrics.estimatedFatLossKg} kg
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Net Weight: {reportData.metrics.weightDeltaKg > 0 ? "+" : ""}{reportData.metrics.weightDeltaKg} kg
          </span>
        </div>
      </div>

      {/* Smart AI Comprehensive Analysis Section */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100">
              Smart AI Diagnostic Audit & Recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Automated intelligence analyzing what was done correctly, mistakes made, skipped goals, and next-day suggestions
            </p>
          </div>
        </div>

        {/* 2-Column Diagnostic Grid: Correctly Done vs Mistakes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What was done correctly */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              What Was Done Correctly
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {reportData.aiDiagnostic.whatWasDoneCorrectly.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What mistakes were made */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Mistakes & Non-Compliance Audit
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {reportData.aiDiagnostic.whatMistakesWereMade.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Specific Skipped & Compliance Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Skipped Meals */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Apple className="h-4 w-4 text-sky-400" />
              <span>Skipped Meals:</span>
            </div>
            <p className="text-xs text-slate-400">
              {reportData.aiDiagnostic.skippedMealsList.join(", ")}
            </p>
          </div>

          {/* Skipped Workouts */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              <span>Skipped Workouts:</span>
            </div>
            <p className="text-xs text-slate-400">
              {reportData.aiDiagnostic.skippedWorkoutsList.join(", ")}
            </p>
          </div>

          {/* Missed Gym Days */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span>Missed Gym Days:</span>
            </div>
            <p className="text-xs text-slate-400">
              {reportData.aiDiagnostic.missedGymDaysList.join(", ")}
            </p>
          </div>
        </div>

        {/* Target Status Breakdown (Calories, Protein, Water, Fat Loss) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-300">Calorie Target Status:</span>
              <span className="text-slate-400">{reportData.aiDiagnostic.caloriesExceededStatus}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-300">Protein Target Status:</span>
              <span className="text-slate-400">{reportData.aiDiagnostic.proteinTargetStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Hydration Status:</span>
              <span className="text-slate-400">{reportData.aiDiagnostic.waterTargetStatus}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-300">Weight Loss Progress:</span>
              <span className="text-slate-400">{reportData.aiDiagnostic.weightLossProgressStatement}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-300">Estimated Fat Loss:</span>
              <span className="text-emerald-400 font-bold">{reportData.aiDiagnostic.estimatedFatLossStatement}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Estimated Weight Delta:</span>
              <span className="text-slate-400">{reportData.aiDiagnostic.estimatedWeightChangeStatement}</span>
            </div>
          </div>
        </div>

        {/* AI Action Suggestions for Next Day */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/20 space-y-3">
          <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Next Day Actionable AI Directives
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {reportData.aiDiagnostic.nextDayActionSuggestions.map((sug, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">{sug}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
