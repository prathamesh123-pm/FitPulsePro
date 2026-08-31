import React, { useState, useMemo } from "react";
import {
  Flame,
  Activity,
  Target,
  Dumbbell,
  Droplets,
  Footprints,
  Clock,
  ShieldCheck,
  TrendingDown,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  Check,
  X,
  Zap,
  Info,
  Loader2,
  FileSpreadsheet,
  Printer,
  Scale,
  Moon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { AppState, DailyNutritionLog, SubmittedDailyReport, WorkoutSession } from "../types";
import { DailyReportComputed } from "../utils/fitnessAnalysisEngine";

interface DailyReportDashboardProps {
  appState: AppState;
  dailyReport: DailyReportComputed;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSubmitDailyReport?: (date: string, submission: SubmittedDailyReport) => Promise<boolean>;
  onUnlockDailyReport?: (date: string) => void;
  onDeleteFoodItem?: (date: string, mealId: string, foodIndexOrId: number | string) => void;
  onQuickAdjustDailyNutrition?: (date: string, updates: Partial<DailyNutritionLog>) => void;
  onDeleteWorkoutHistory?: (id: string) => void;
  onOpenExportModal?: () => void;
}

export function DailyReportDashboard({
  appState,
  dailyReport,
  selectedDate,
  onSelectDate,
  onSubmitDailyReport,
  onUnlockDailyReport,
  onDeleteFoodItem,
  onQuickAdjustDailyNutrition,
  onDeleteWorkoutHistory,
  onOpenExportModal,
}: DailyReportDashboardProps) {
  // Modal states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [waterEditInput, setWaterEditInput] = useState<number>(dailyReport.waterIntakeMl || 2850);
  const [stepsEditInput, setStepsEditInput] = useState<number>(dailyReport.totalSteps || 8400);

  // Check if today's report is submitted and locked
  const submittedReport = appState.submittedReports?.[selectedDate];
  const isLocked = Boolean(submittedReport?.locked);

  // Auto-save live status
  const lastSyncTime = appState.sync.lastSyncDate || "Just now";

  // Quick Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split("T")[0]);
  };

  // Validation Checks for Submission
  const validationChecks = useMemo(() => {
    const nutrition = appState.dailyNutrition[selectedDate];
    const checklist = appState.checklists[selectedDate];
    const workouts = appState.workoutHistory.filter((w) => w.date === selectedDate);
    const hasWorkout = workouts.length > 0 || Boolean(checklist?.workout);
    const hasMeals = (nutrition?.meals && nutrition.meals.length > 0) || dailyReport.caloriesConsumed > 500;
    const hasWater = dailyReport.waterIntakeMl >= 1000;
    const hasSteps = dailyReport.totalSteps >= 1000;

    return {
      workoutChecked: Boolean(hasWorkout),
      dietChecked: Boolean(hasMeals),
      waterChecked: Boolean(hasWater),
      stepsChecked: Boolean(hasSteps),
      allPassed: Boolean(hasWorkout && hasMeals && hasWater && hasSteps),
    };
  }, [appState, selectedDate, dailyReport]);

  // Submission handler
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submission: SubmittedDailyReport = {
        date: selectedDate,
        submittedAt: new Date().toISOString(),
        locked: true,
        notes: submissionNotes.trim() || "All daily workouts, nutrition and hydration verified.",
        metrics: {
          caloriesConsumed: dailyReport.caloriesConsumed,
          caloriesBurned: dailyReport.caloriesBurned,
          remainingCalories: Math.max(0, dailyReport.caloriesTarget - dailyReport.caloriesConsumed),
          proteinGrams: dailyReport.proteinConsumed,
          waterLiters: Number((dailyReport.waterIntakeMl / 1000).toFixed(1)),
          steps: dailyReport.totalSteps,
          workoutTimeMins: dailyReport.workoutDurationMin,
          gymAttendanceStatus: appState.attendance?.[selectedDate]?.status || (dailyReport.workoutSummary.hasWorkout ? "Present" : "Rest Day"),
          weightKg: appState.profile.currentWeightKg,
          overallScore: dailyReport.scores.overallHealthScore,
        },
        validationChecks: {
          workoutChecked: validationChecks.workoutChecked,
          dietChecked: validationChecks.dietChecked,
          waterChecked: validationChecks.waterChecked,
          stepsChecked: validationChecks.stepsChecked,
        },
      };

      if (onSubmitDailyReport) {
        await onSubmitDailyReport(selectedDate, submission);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsSubmitModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick adjust water & steps
  const handleSaveQuickAdjustments = () => {
    if (onQuickAdjustDailyNutrition) {
      onQuickAdjustDailyNutrition(selectedDate, {
        waterLoggedMl: waterEditInput,
        stepsCount: stepsEditInput,
      });
    }
    setIsQuickEditModalOpen(false);
  };

  // 1. Chart Data: Calories In vs Calories Out
  const calorieBarData = useMemo(() => {
    return [
      { name: "Consumed", value: dailyReport.caloriesConsumed, fill: "#10b981" },
      { name: "Burned", value: dailyReport.caloriesBurned, fill: "#f43f5e" },
      { name: "Deficit", value: Math.max(0, dailyReport.caloriesBurned - dailyReport.caloriesConsumed), fill: "#38bdf8" },
    ];
  }, [dailyReport]);

  // 2. Chart Data: Macronutrient Donut
  const macroPieData = useMemo(() => {
    const pCal = (dailyReport.proteinConsumed || 140) * 4;
    const cCal = (dailyReport.carbsConsumed || 180) * 4;
    const fCal = (dailyReport.fatConsumed || 55) * 9;
    const total = pCal + cCal + fCal || 1;
    return [
      { name: "Protein", grams: dailyReport.proteinConsumed, value: Math.round((pCal / total) * 100), fill: "#38bdf8" },
      { name: "Carbs", grams: dailyReport.carbsConsumed, value: Math.round((cCal / total) * 100), fill: "#fbbf24" },
      { name: "Fat", grams: dailyReport.fatConsumed, value: Math.round((fCal / total) * 100), fill: "#a855f7" },
    ];
  }, [dailyReport]);

  // SVG Circular Progress calculation
  const overallScore = dailyReport.scores.overallHealthScore || 94;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: DATE SELECTOR, LIVE AUTO-SAVE & SUBMIT / LOCK BANNER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Premium Daily Fitness Dashboard
              </span>
              {/* Live Auto-Save Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-Saved • Cloud Synced ({lastSyncTime})</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              <span>Daily AI Diagnostic & Health Score</span>
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated from Workout, Diet, Calories, Steps, Water, Sleep, Cardio & Gym Attendance.
            </p>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 rounded-2xl border border-slate-800 p-1">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 px-2.5 py-1 focus:outline-none cursor-pointer"
              />
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Edit / Delete Logs Button */}
            <button
              onClick={() => {
                setWaterEditInput(dailyReport.waterIntakeMl);
                setStepsEditInput(dailyReport.totalSteps);
                setIsQuickEditModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
              title="Edit or delete logged food, workouts, water, or steps"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
              <span>Edit / Delete Logs</span>
            </button>

            {/* Export Trigger */}
            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
                title="Export or Share Today's Report"
              >
                <Download className="h-3.5 w-3.5 text-sky-400" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* SUBMISSION STATUS & LOCK/UNLOCK BANNER */}
        {isLocked ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    Report Submitted & Locked
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    Certified on {new Date(submittedReport?.submittedAt || Date.now()).toLocaleDateString()} at{" "}
                    {new Date(submittedReport?.submittedAt || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Note: "{submittedReport?.notes || "All daily workout, diet, hydration and step targets verified."}"
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onUnlockDailyReport) {
                  onUnlockDailyReport(selectedDate);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm shrink-0"
              title="Unlock this report to make corrections and re-submit"
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock to Edit</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/80 via-slate-900 to-emerald-950/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                    Draft Daily Diagnostic
                  </span>
                  <span className="text-xs text-slate-300">
                    {validationChecks.allPassed
                      ? "All 4 required targets satisfied — ready to submit!"
                      : "Review your workout, meals, water and step counts before locking."}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Submitting locks today's metrics and permanently synchronizes your fitness record to Firebase Firestore.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
              title="Validate and submit today's complete fitness report"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Today's Report</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. REQUIREMENT 1: 9 COLORFUL DASHBOARD SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Executive KPI Summary Cards
            </h3>
          </div>
          <span className="text-xs text-slate-400">Automatic Real-Time Recalculations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* CARD 1: 🟢 Calories Consumed */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Calories Consumed</span>
                  <span className="text-[11px] text-slate-400">Target: {dailyReport.caloriesTarget} kcal</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.caloriesConsumed <= dailyReport.caloriesTarget &&
                  dailyReport.caloriesConsumed >= dailyReport.caloriesTarget * 0.8
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.caloriesConsumed > dailyReport.caloriesTarget
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                }`}
              >
                {dailyReport.caloriesConsumed <= dailyReport.caloriesTarget &&
                dailyReport.caloriesConsumed >= dailyReport.caloriesTarget * 0.8
                  ? "🟢 Goal Completed"
                  : dailyReport.caloriesConsumed > dailyReport.caloriesTarget
                  ? "🔴 Goal Missed"
                  : "🟡 Almost Completed"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {dailyReport.caloriesConsumed} <span className="text-sm font-bold text-slate-400">kcal</span>
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {Math.round((dailyReport.caloriesConsumed / (dailyReport.caloriesTarget || 2200)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((dailyReport.caloriesConsumed / (dailyReport.caloriesTarget || 2200)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Total 9-Meal Log</span>
                <span>Max Budget: {dailyReport.caloriesTarget} kcal</span>
              </div>
            </div>
          </div>

          {/* CARD 2: 🔴 Calories Burned */}
          <div className="rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Calories Burned</span>
                  <span className="text-[11px] text-slate-400">Workout + Active Burn</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.caloriesBurned >= 500
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.caloriesBurned >= 350
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {dailyReport.caloriesBurned >= 500
                  ? "🟢 Goal Completed"
                  : dailyReport.caloriesBurned >= 350
                  ? "🟡 Almost Completed"
                  : "🟠 Needs Improvement"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {dailyReport.caloriesBurned} <span className="text-sm font-bold text-slate-400">kcal</span>
                </span>
                <span className="text-sm font-bold text-rose-400">
                  {Math.round((dailyReport.caloriesBurned / 500) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((dailyReport.caloriesBurned / 500) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Burn Goal: 500 kcal</span>
                <span>Active Fat Oxidation</span>
              </div>
            </div>
          </div>

          {/* CARD 3: 🟠 Remaining Calories */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Remaining Calories</span>
                  <span className="text-[11px] text-slate-400">Deficit Allowance</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.caloriesConsumed <= dailyReport.caloriesTarget
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {dailyReport.caloriesConsumed <= dailyReport.caloriesTarget ? "🟢 Goal Completed" : "🔴 Goal Missed"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {Math.max(0, dailyReport.caloriesTarget - dailyReport.caloriesConsumed)}{" "}
                  <span className="text-sm font-bold text-slate-400">kcal</span>
                </span>
                <span className="text-sm font-bold text-amber-400">
                  {Math.max(
                    0,
                    100 - Math.round((dailyReport.caloriesConsumed / (dailyReport.caloriesTarget || 2200)) * 100)
                  )}
                  %
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      100 - Math.round((dailyReport.caloriesConsumed / (dailyReport.caloriesTarget || 2200)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Budget Available</span>
                <span>
                  {dailyReport.deficitMaintained
                    ? `${Math.abs(dailyReport.dailyNetCalorieBalance)} kcal Deficit`
                    : "Surplus State"}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: 🔵 Protein */}
          <div className="rounded-3xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Protein Intake</span>
                  <span className="text-[11px] text-slate-400">Target: {dailyReport.proteinTarget}g</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.proteinConsumed >= dailyReport.proteinTarget
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.proteinConsumed >= dailyReport.proteinTarget * 0.8
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {dailyReport.proteinConsumed >= dailyReport.proteinTarget
                  ? "🟢 Goal Completed"
                  : dailyReport.proteinConsumed >= dailyReport.proteinTarget * 0.8
                  ? "🟡 Almost Completed"
                  : "🟠 Needs Improvement"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {dailyReport.proteinConsumed} <span className="text-sm font-bold text-slate-400">g</span>
                </span>
                <span className="text-sm font-bold text-sky-400">
                  {Math.round((dailyReport.proteinConsumed / (dailyReport.proteinTarget || 157)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((dailyReport.proteinConsumed / (dailyReport.proteinTarget || 157)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Remaining: {dailyReport.remainingProtein}g</span>
                <span>Muscle Synthesis Floor</span>
              </div>
            </div>
          </div>

          {/* CARD 5: 🟣 Water Intake */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Water Intake</span>
                  <span className="text-[11px] text-slate-400">Target: {(dailyReport.waterTargetMl / 1000).toFixed(1)} L</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.waterIntakeMl >= dailyReport.waterTargetMl
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.waterIntakeMl >= dailyReport.waterTargetMl * 0.75
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {dailyReport.waterIntakeMl >= dailyReport.waterTargetMl
                  ? "🟢 Goal Completed"
                  : dailyReport.waterIntakeMl >= dailyReport.waterTargetMl * 0.75
                  ? "🟡 Almost Completed"
                  : "🔴 Goal Missed"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {(dailyReport.waterIntakeMl / 1000).toFixed(1)}{" "}
                  <span className="text-sm font-bold text-slate-400">L ({dailyReport.waterIntakeMl} ml)</span>
                </span>
                <span className="text-sm font-bold text-indigo-400">
                  {Math.round((dailyReport.waterIntakeMl / (dailyReport.waterTargetMl || 3000)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((dailyReport.waterIntakeMl / (dailyReport.waterTargetMl || 3000)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Cellular Hydration</span>
                <span>Min: 3.0 Liters</span>
              </div>
            </div>
          </div>

          {/* CARD 6: 🟡 Steps */}
          <div className="rounded-3xl bg-gradient-to-br from-yellow-950/40 via-slate-900 to-slate-950 border border-yellow-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-yellow-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400">
                  <Footprints className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Daily Steps</span>
                  <span className="text-[11px] text-slate-400">Target: 10,000 steps</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.totalSteps >= 10000
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.totalSteps >= 7000
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {dailyReport.totalSteps >= 10000
                  ? "🟢 Goal Completed"
                  : dailyReport.totalSteps >= 7000
                  ? "🟡 Almost Completed"
                  : "🟠 Needs Improvement"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {dailyReport.totalSteps.toLocaleString()}{" "}
                  <span className="text-sm font-bold text-slate-400">steps</span>
                </span>
                <span className="text-sm font-bold text-yellow-400">
                  {Math.round((dailyReport.totalSteps / 10000) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((dailyReport.totalSteps / 10000) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Est. Dist: {dailyReport.walkingDistanceKm} km</span>
                <span>Active Mins: {dailyReport.activeMinutes}m</span>
              </div>
            </div>
          </div>

          {/* CARD 7: 🟢 Workout Time */}
          <div className="rounded-3xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Workout Time</span>
                  <span className="text-[11px] text-slate-400">Goal: 45-60 mins</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  dailyReport.workoutDurationMin >= 45
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : dailyReport.workoutDurationMin > 0
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {dailyReport.workoutDurationMin >= 45
                  ? "🟢 Goal Completed"
                  : dailyReport.workoutDurationMin > 0
                  ? "🟡 Almost Completed"
                  : "🔵 Information"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {dailyReport.workoutDurationMin} <span className="text-sm font-bold text-slate-400">mins</span>
                </span>
                <span className="text-sm font-bold text-teal-400">
                  {Math.min(100, Math.round((dailyReport.workoutDurationMin / 60) * 100))}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((dailyReport.workoutDurationMin / 60) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Cardio: {dailyReport.cardioDurationMin}m</span>
                <span>{dailyReport.workoutSummary.workoutTitle || "Push Hypertrophy"}</span>
              </div>
            </div>
          </div>

          {/* CARD 8: 🔵 Gym Attendance */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Gym Attendance</span>
                  <span className="text-[11px] text-slate-400">{appState.membership.gymName || "Gold's Gym Elite"}</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  appState.attendance?.[selectedDate]?.status === "Present" || dailyReport.workoutSummary.hasWorkout
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : appState.attendance?.[selectedDate]?.status === "Rest Day"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {appState.attendance?.[selectedDate]?.status === "Present" || dailyReport.workoutSummary.hasWorkout
                  ? "🟢 Goal Completed"
                  : appState.attendance?.[selectedDate]?.status === "Rest Day"
                  ? "🔵 Information"
                  : "🔴 Goal Missed"}
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-100">
                  {appState.attendance?.[selectedDate]?.status ||
                    (dailyReport.workoutSummary.hasWorkout ? "Present" : "Rest Day")}
                </span>
                <span className="text-sm font-bold text-blue-400">
                  {appState.attendance?.[selectedDate]?.status === "Present" || dailyReport.workoutSummary.hasWorkout
                    ? "100%"
                    : "50%"}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width:
                      appState.attendance?.[selectedDate]?.status === "Present" || dailyReport.workoutSummary.hasWorkout
                        ? "100%"
                        : "50%",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Check-in: {appState.attendance?.[selectedDate]?.checkInTime || "17:45"}</span>
                <span>Verified Facility Log</span>
              </div>
            </div>
          </div>

          {/* CARD 9: 🟣 Weight */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-200 block">Body Weight</span>
                  <span className="text-[11px] text-slate-400">Target: {appState.profile.targetWeightKg} kg</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-purple-500/20 text-purple-300 border-purple-500/30">
                🟣 Progress
              </span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-100">
                  {appState.profile.currentWeightKg} <span className="text-sm font-bold text-slate-400">kg</span>
                </span>
                <span className="text-sm font-bold text-purple-400">
                  -{(appState.profile.currentWeightKg - appState.profile.targetWeightKg).toFixed(1)} kg left
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: "88%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Start: 81.2 kg (-2.7 kg)</span>
                <span>Fat Loss Phase</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CIRCULAR FITNESS SCORE INDICATOR & ACHIEVEMENT BADGES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CIRCULAR PROGRESS GAUGE (1 Col) */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Composite Health Score</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              AI Rated
            </span>
          </div>

          {/* SVG Circular Progress Bar */}
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="url(#emeraldGradient)"
                fill="transparent"
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-100">{overallScore}</span>
              <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Out of 100</span>
            </div>
          </div>

          <div className="space-y-1.5 w-full">
            <span className="text-xs font-bold text-slate-200 block">Grade A+ • Optimal Recomposition</span>
            <p className="text-[11px] text-slate-400">
              High workout volume and maintained caloric deficit safely preserve lean muscle mass.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-slate-800 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Workout</span>
              <span className="font-bold text-emerald-400">{dailyReport.scores.workoutScore}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Diet</span>
              <span className="font-bold text-sky-400">{dailyReport.scores.dietScore}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Recovery</span>
              <span className="font-bold text-purple-400">{dailyReport.scores.recoveryScore}%</span>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENT BADGES SECTION (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                Today's Achievement Badges Unlocked
              </h3>
            </div>
            <span className="text-xs text-amber-300 font-semibold font-mono">5/5 Goals Satisfied</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {/* Badge 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-start gap-3 shadow-md hover:border-amber-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-lg">
                🏆
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">Deficit Hero</span>
                <span className="text-[11px] text-amber-300 font-medium">Maintained Caloric Deficit</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-sky-500/30 flex items-start gap-3 shadow-md hover:border-sky-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 font-bold text-lg">
                🥩
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">Protein Titan</span>
                <span className="text-[11px] text-sky-300 font-medium">145g+ Protein Hit</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex items-start gap-3 shadow-md hover:border-cyan-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-lg">
                💧
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">Hydration Titan</span>
                <span className="text-[11px] text-cyan-300 font-medium">3,000ml Pure Water</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>

            {/* Badge 4 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-yellow-500/30 flex items-start gap-3 shadow-md hover:border-yellow-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400 font-bold text-lg">
                ⚡
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">10k Step Walker</span>
                <span className="text-[11px] text-yellow-300 font-medium">Daily Step Volume</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>

            {/* Badge 5 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-start gap-3 shadow-md hover:border-emerald-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-lg">
                🏋️
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">Iron Discipline</span>
                <span className="text-[11px] text-emerald-300 font-medium">Heavy Workout Completed</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>

            {/* Badge 6 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-start gap-3 shadow-md hover:border-purple-500/60 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold text-lg">
                🌙
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100 block">Recovery Guru</span>
                <span className="text-[11px] text-purple-300 font-medium">7.5h Restful Sleep</span>
                <span className="text-[10px] text-slate-500 block">Status: 🟢 Unlocked</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Milestones Earned This Month:</span>
            <span className="text-emerald-400 font-extrabold">24 Badges Awarded</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE CHARTS: CALORIE BALANCE & MACRO SPLIT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BAR CHART: CALORIES IN VS OUT */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                Energy Balance: Consumed vs Burned
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {dailyReport.deficitMaintained ? "Deficit Maintained ✔" : "Surplus"}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calorieBarData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {calorieBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Consumed: {dailyReport.caloriesConsumed} kcal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" /> Burned: {dailyReport.caloriesBurned} kcal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-sky-400" /> Net: {dailyReport.netCalories} kcal
            </span>
          </div>
        </div>

        {/* DONUT / PIE CHART: MACRONUTRIENT DISTRIBUTION */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-sky-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                Macronutrient Distribution (Calories & Grams)
              </h3>
            </div>
            <span className="text-xs text-sky-400 font-mono font-bold">Optimal Macros</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around h-56 w-full">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {macroPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 text-xs w-full sm:w-48">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-sky-500/30">
                <span className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Protein
                </span>
                <span className="font-bold text-slate-200">
                  {dailyReport.proteinConsumed}g ({macroPieData[0].value}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-yellow-500/30">
                <span className="flex items-center gap-1.5 text-yellow-300 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Carbs
                </span>
                <span className="font-bold text-slate-200">
                  {dailyReport.carbsConsumed}g ({macroPieData[1].value}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-purple-500/30">
                <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> Fat
                </span>
                <span className="font-bold text-slate-200">
                  {dailyReport.fatConsumed}g ({macroPieData[2].value}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Fiber: {dailyReport.fiberConsumed}g</span>
            <span className="text-emerald-400 font-semibold">High Satiety & Muscle Retention</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. WORKOUT & DIET SUMMARIES WITH EDIT / DELETE CONTROLS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WORKOUT SUMMARY CARD */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">Workout Summary</h3>
                <p className="text-[11px] text-slate-400">{dailyReport.workoutSummary.workoutTitle}</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Completed ✔
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Muscle Groups Trained</span>
              <div className="flex flex-wrap gap-1.5">
                {dailyReport.workoutSummary.muscleGroups.map((mg, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold text-[11px]"
                  >
                    {mg}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Exercises</span>
                <span className="text-base font-black text-slate-100">
                  {dailyReport.workoutSummary.exercisesCompleted}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Sets</span>
                <span className="text-base font-black text-slate-100">
                  {dailyReport.workoutSummary.setsCompleted}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Repetitions</span>
                <span className="text-base font-black text-slate-100">
                  {dailyReport.workoutSummary.repsCompleted}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Total Volume</span>
                <span className="text-base font-black text-emerald-400">
                  {dailyReport.workoutSummary.workoutVolumeKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            {/* Personal Records */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Award className="h-4 w-4" />
                <span>Personal Records Hit</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                {dailyReport.workoutSummary.personalRecords.map((pr, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>{pr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DIET SUMMARY CARD */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">Diet Summary</h3>
                <p className="text-[11px] text-slate-400">9-Meal Structure Adherence</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                dailyReport.dietSummary.dietFollowed
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
              }`}
            >
              {dailyReport.dietSummary.dietFollowed ? "Diet Followed ✔" : "Diet Broken ✘"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Meals Planned</span>
                <span className="text-base font-black text-slate-100">
                  {dailyReport.dietSummary.mealsPlanned}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                <span className="text-base font-black text-emerald-400">
                  {dailyReport.dietSummary.mealsCompleted}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Missed Meals</span>
                <span className="text-base font-black text-rose-400">
                  {dailyReport.dietSummary.mealsMissed}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Cheat Meals Logged</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {dailyReport.dietSummary.cheatMealsCount} cheat meal(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                <span>Caloric Discipline</span>
                <span className="text-emerald-400 font-semibold">97% Target Adherence</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Macro Distribution</span>
                <span className="text-slate-300">High Protein • Moderate Carb • Low Fat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. AI ANALYSIS & WEIGHT LOSS DIAGNOSTIC (REQUIREMENT 10) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Gemini Fitness Core • AI Diagnostic
                </span>
                <span className="text-xs text-slate-400">Hypertrophy & Fat Loss Synthesis</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 mt-0.5">
                AI Weight Loss & Body Recomposition Diagnostic
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            Evaluated for August 28, 2026
          </span>
        </div>

        {/* 7 AI Analytical Feedback Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Calorie Deficit Performance */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Flame className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">1. Calorie Deficit Performance</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.calorieDeficitPerformance}
            </p>
          </div>

          {/* 2. Workout Intensity Feedback */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Dumbbell className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">2. Workout Intensity Feedback</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.workoutIntensityFeedback}
            </p>
          </div>

          {/* 3. Diet Consistency Review */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">3. Diet Consistency Review</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.dietConsistencyReview}
            </p>
          </div>

          {/* 4. Water & Hydration Review */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Droplets className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">4. Water & Hydration Review</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.waterHydrationReview}
            </p>
          </div>

          {/* 5. Sleep & Recovery Review */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Moon className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">5. Sleep & Recovery Review</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.sleepRecoveryReview}
            </p>
          </div>

          {/* 6. Weight Loss Prediction */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <TrendingDown className="h-4 w-4" />
              <span className="uppercase tracking-wider text-[11px]">6. Weight Loss Prediction</span>
            </div>
            <p className="text-emerald-100 font-medium leading-relaxed">
              {dailyReport.aiWeightLossAnalysis?.weightLossPrediction}
            </p>
          </div>
        </div>

        {/* 7. Actionable Recommendations for Tomorrow */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            <span>7. Actionable AI Recommendations for Tomorrow</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {dailyReport.aiWeightLossAnalysis?.actionableRecommendations.map((rec: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-start gap-2.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMIT TODAY'S REPORT CHECKLIST & CONFIRMATION */}
      {/* ========================================================================= */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Submit Daily Fitness Report</h3>
                  <p className="text-xs text-slate-400">Date: {selectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Validation Checklist */}
            <div className="space-y-2.5 text-xs">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Verification & Audit Checks:
              </span>

              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  validationChecks.workoutChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <span className="font-semibold">Workout or Rest Day Logged</span>
                <span className="font-black text-xs">
                  {validationChecks.workoutChecked ? "Verified ✔" : "Optional / Rest Day"}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  validationChecks.dietChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <span className="font-semibold">Daily Nutrition & Meals Checked</span>
                <span className="font-black text-xs">
                  {validationChecks.dietChecked ? `${dailyReport.caloriesConsumed} kcal ✔` : "Incomplete ✘"}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  validationChecks.waterChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <span className="font-semibold">Water Hydration Recorded (&gt;1,000ml)</span>
                <span className="font-black text-xs">
                  {validationChecks.waterChecked ? `${dailyReport.waterIntakeMl} ml ✔` : "Low Intake"}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  validationChecks.stepsChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <span className="font-semibold">Activity & Steps Recorded</span>
                <span className="font-black text-xs">
                  {validationChecks.stepsChecked
                    ? `${dailyReport.totalSteps.toLocaleString()} steps ✔`
                    : "Under 1,000 steps"}
                </span>
              </div>
            </div>

            {/* Athlete Reflection Note */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Athlete Daily Reflection / Notes (Optional):</label>
              <textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="E.g., Hit 82.5kg bench press PR, energy high throughout the afternoon, hit protein goal comfortably."
                rows={2}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              🔒 Submitting will lock today's report, compute permanent statistics, and synchronize to Firebase Cloud.
              You can unlock and edit at any time if needed.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synchronizing to Cloud...</span>
                  </>
                ) : submitSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Submitted & Locked!</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Confirm & Lock Submission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK EDIT / DELETE TODAY'S LOGS */}
      {/* ========================================================================= */}
      {isQuickEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Quick Edit & Delete Today's Logs</h3>
                  <p className="text-xs text-slate-400">
                    Modifications instantly recalculate all reports, calories, and deficit balances.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Adjust: Water & Steps */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                Adjust Daily Hydration & Steps:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Water Intake (ml):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="100"
                      value={waterEditInput}
                      onChange={(e) => setWaterEditInput(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setWaterEditInput((w) => w + 250)}
                      className="px-2 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold hover:bg-indigo-500/30 text-[11px]"
                    >
                      +250ml
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Daily Steps Count:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="500"
                      value={stepsEditInput}
                      onChange={(e) => setStepsEditInput(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setStepsEditInput((s) => s + 1000)}
                      className="px-2 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 font-bold hover:bg-yellow-500/30 text-[11px]"
                    >
                      +1k
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Logged Meals & Individual Food Delete */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                Logged Meals on {selectedDate}:
              </span>

              {appState.dailyNutrition[selectedDate]?.meals &&
              appState.dailyNutrition[selectedDate].meals.length > 0 ? (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {appState.dailyNutrition[selectedDate].meals.map((meal) => (
                    <div key={meal.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-200">
                          {meal.mealType} ({meal.actualTime || meal.plannedTime})
                        </span>
                        <span className="text-[11px] text-slate-400">{meal.foods.length} food item(s)</span>
                      </div>

                      <div className="space-y-1.5">
                        {meal.foods.map((food, fIdx) => (
                          <div
                            key={food.id || fIdx}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-300">{food.name}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {food.quantity} {food.unit || "g"} • {food.calories} kcal • {food.protein}g protein
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (onDeleteFoodItem) {
                                  onDeleteFoodItem(selectedDate, meal.id, food.id || fIdx);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition"
                              title="Delete this food item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                  No meal items logged yet for {selectedDate}.
                </div>
              )}
            </div>

            {/* Workouts on this date & Delete Workout */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                Workouts Logged on {selectedDate}:
              </span>
              {appState.workoutHistory.filter((w) => w.date === selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {appState.workoutHistory
                    .filter((w) => w.date === selectedDate)
                    .map((w) => (
                      <div
                        key={w.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{w.workoutName || w.title || "Gym Workout"}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {w.durationMinutes} mins • {w.exercises?.length || 0} exercises • {w.caloriesBurned || 0} kcal burned
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (onDeleteWorkoutHistory) {
                              onDeleteWorkoutHistory(w.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold hover:bg-rose-500/20 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete Workout</span>
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                  No workout session logged for this date.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsQuickEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Close
              </button>
              <button
                onClick={handleSaveQuickAdjustments}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Check className="h-4 w-4" />
                <span>Save Adjustments</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
