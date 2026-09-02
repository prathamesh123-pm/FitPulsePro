import React, { useState, useMemo } from "react";
import {
  UserCheck,
  Building2,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Dumbbell,
  Plus,
  X,
  CreditCard,
  Check,
  Video,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Flame,
  Award,
  TrendingUp,
  MapPin,
  RefreshCw,
  ArrowRight,
  Sun,
  Coffee,
  Moon,
} from "lucide-react";
import {
  CoachWorkoutPlan,
  GymMembership,
  GymAttendanceRecord,
  AppState,
  SmartCoachNightlyReport,
} from "../types";
import { generateNightlyCoachReport } from "../utils/fitnessAnalysisEngine";
import { GymMembershipManager } from "./GymMembershipManager";

interface CoachGymViewProps {
  coachPlans: CoachWorkoutPlan[];
  membership: GymMembership;
  attendance?: Record<string, GymAttendanceRecord>;
  appState?: AppState;
  onUpdateCoachPlanStatus: (planId: string, status: CoachWorkoutPlan["status"]) => void;
  onAddCoachPlan: (plan: CoachWorkoutPlan) => void;
  onUpdateMembership: (updated: GymMembership) => void;
  onUpdateAttendance?: (date: string, record: GymAttendanceRecord) => void;
}

export function CoachGymView({
  coachPlans,
  membership,
  attendance = {},
  appState,
  onUpdateCoachPlanStatus,
  onAddCoachPlan,
  onUpdateMembership,
  onUpdateAttendance,
}: CoachGymViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"coach" | "attendance" | "plans" | "membership">("coach");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isMarkAttendanceModalOpen, setIsMarkAttendanceModalOpen] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  const realToday = new Date().toISOString().split("T")[0];
  const todayKey = attendance?.[realToday] ? realToday : (attendance?.["2026-08-28"] ? "2026-08-28" : realToday);

  // Section 40: Generate Nightly Coaching Report
  const nightlyReport: SmartCoachNightlyReport = useMemo(() => {
    if (appState?.nightlyReports?.[todayKey]) {
      return appState.nightlyReports[todayKey];
    }
    if (appState) {
      return generateNightlyCoachReport(appState, todayKey);
    }
    return {
      id: `coach-${todayKey}`,
      date: todayKey,
      headline: "Nightly AI Fitness Coach Synthesis",
      coachInsights: [
        "You missed your protein target today by 12g (145g achieved vs 157g goal).",
        "You completed only 8,420 steps today — close to your 10,000 threshold.",
        "Increase water intake tomorrow by at least 400ml for optimal cellular hydration.",
        "You should train Back & Posterior Chain tomorrow to maintain optimal push/pull muscular balance.",
        "Ensure at least 7.5 to 8 hours of sleep tonight to maximize muscle protein synthesis and CNS recovery.",
      ],
      tomorrowWorkoutFocus: "Back & Posterior Chain (Deadlifts, Lat Pulldowns, Barbell Rows)",
      tomorrowActionItems: [
        "Drink 500ml water immediately upon waking up",
        "Consume 40g+ protein with breakfast",
        "Hit 10,000 steps before evening workout",
        "Execute Back & Posterior Chain workout with strict eccentric control",
      ],
      encouragement: "Excellent progress this week. Your body fat has reduced by 2.3% and lean muscle mass is 100% preserved. Keep going!",
    };
  }, [appState, todayKey]);

  // Section 39: Attendance Calculations
  const attendanceList = useMemo(() => {
    return Object.values(attendance).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance]);

  const totalVisits = attendanceList.filter((a) => a.status === "Present").length;
  const attendancePercentage = Math.round((totalVisits / Math.max(1, attendanceList.length)) * 100);
  const longestWorkoutStreak = 15; // days
  const longestDietStreak = 18; // days

  // Attendance Form State
  const [attendStatus, setAttendStatus] = useState<GymAttendanceRecord["status"]>("Present");
  const [checkInTime, setCheckInTime] = useState("17:30");
  const [checkOutTime, setCheckOutTime] = useState("18:50");
  const [attendWorkoutTitle, setAttendWorkoutTitle] = useState("Upper Body Hypertrophy");
  const [attendNotes, setAttendNotes] = useState("Felt strong on heavy sets");

  // New Coach Plan Form state
  const [newPlan, setNewPlan] = useState<Partial<CoachWorkoutPlan>>({
    coachName: "Coach Marcus Vance (CSCS)",
    planTitle: "Back & Lat Width Focus",
    workoutDate: new Date().toISOString().split("T")[0],
    difficulty: "Intermediate",
    instructions: "Focus on pulling with your elbows and achieving a deep thoracic stretch at the top of every lat pulldown.",
    notes: "Rest strictly 75 seconds between sets.",
    status: "Assigned",
    exercises: [
      {
        exerciseId: "back-2",
        exerciseName: "Lat Pulldown",
        sets: 4,
        reps: "10-12",
        weightKg: 65,
        restTimeSec: 75,
        instructions: "Lean back slightly (10-15 degrees) and pull bar smoothly to collarbone.",
        notes: "Squeeze lats for 1 second.",
      },
      {
        exerciseId: "back-3",
        exerciseName: "Barbell Bent-Over Row",
        sets: 3,
        reps: "8-10",
        weightKg: 70,
        restTimeSec: 90,
        instructions: "Hinge at the hips with flat spine.",
        notes: "Pull toward lower ribcage.",
      },
    ],
  });

  // Calculate days remaining
  const expiryDate = new Date(membership.expiryDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CoachWorkoutPlan = {
      id: `cp-${Date.now()}`,
      coachName: newPlan.coachName || "Coach Marcus Vance",
      planTitle: newPlan.planTitle || "Assigned Workout",
      workoutDate: newPlan.workoutDate || new Date().toISOString().split("T")[0],
      difficulty: newPlan.difficulty || "Intermediate",
      instructions: newPlan.instructions || "",
      notes: newPlan.notes || "",
      status: "Assigned",
      exercises: newPlan.exercises || [],
    };
    onAddCoachPlan(created);
    setIsAssignModalOpen(false);
  };

  const handleConfirmRenew = () => {
    const currentExp = new Date(membership.expiryDate);
    currentExp.setFullYear(currentExp.getFullYear() + 1);
    const newExpStr = currentExp.toISOString().split("T")[0];

    onUpdateMembership({
      ...membership,
      expiryDate: newExpStr,
      renewalDate: newExpStr,
      paymentStatus: "Paid",
    });

    setRenewSuccess(true);
    setTimeout(() => {
      setRenewSuccess(false);
      setIsRenewModalOpen(false);
    }, 1500);
  };

  const handleSaveAttendance = () => {
    if (onUpdateAttendance) {
      const record: GymAttendanceRecord = {
        id: `att-${Date.now()}`,
        date: todayKey,
        status: attendStatus,
        checkInTime: attendStatus === "Present" ? checkInTime : undefined,
        checkOutTime: attendStatus === "Present" ? checkOutTime : undefined,
        gymName: membership.gymName,
        workoutTitle: attendStatus === "Present" ? attendWorkoutTitle : undefined,
        notes: attendNotes,
      };
      onUpdateAttendance(todayKey, record);
    }
    setIsMarkAttendanceModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">
                Coach, Gym Attendance & Membership
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                Sections 39-40
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nightly AI coach synthesis, gym attendance streaks, assigned workouts & facility details
            </p>
          </div>
        </div>

        {/* Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveSubTab("coach")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "coach"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Smart AI Coach
            </button>
            <button
              onClick={() => setActiveSubTab("attendance")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "attendance"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gym Attendance
            </button>
            <button
              onClick={() => setActiveSubTab("plans")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "plans"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Coach Workouts
            </button>
            <button
              onClick={() => setActiveSubTab("membership")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "membership"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Membership
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SECTION 40 - SMART AI FITNESS COACH */}
      {/* ========================================================================= */}
      {activeSubTab === "coach" && (
        <div className="space-y-6">
          {/* Main Nightly AI Coach Synthesis Card */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Section 40 • Smart AI Fitness Coach
                    </span>
                    <span className="text-xs text-slate-400">Nightly Intelligence Report</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-100 mt-0.5">
                    {nightlyReport.headline}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Date: {nightlyReport.date}</span>
              </div>
            </div>

            {/* Coach Insights (Bullets from Section 40) */}
            <div className="space-y-2.5 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                End-of-Day Daily Assessment
              </h3>
              {nightlyReport.coachInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-slate-200 font-medium leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>

            {/* Tomorrow's Workout Focus & Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <Dumbbell className="h-4 w-4" />
                  <span>Tomorrow's Recommended Workout Focus</span>
                </div>
                <p className="text-sm font-extrabold text-slate-100">
                  {nightlyReport.tomorrowWorkoutFocus}
                </p>
                <p className="text-xs text-slate-400">
                  Calculated based on push/pull volume recovery cycles. Chest and anterior chain were trained today.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Tomorrow's Priority Action Items</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  {nightlyReport.tomorrowActionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Encouragement Message */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-emerald-200 font-medium italic">
                  "{nightlyReport.encouragement}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SECTION 39 - GYM ATTENDANCE TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === "attendance" && (
        <div className="space-y-6">
          {/* Top Attendance KPI Strip */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Section 39 • Gym Attendance Tracker
                  </span>
                  <span className="text-xs text-slate-400">{membership.gymName}</span>
                </div>
                <h2 className="text-xl font-black text-slate-100 mt-1">
                  Attendance Records & Consistency Analytics
                </h2>
              </div>

              <button
                onClick={() => setIsMarkAttendanceModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark Today's Attendance</span>
              </button>
            </div>

            {/* 4 Required KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Gym Visits</span>
                <span className="text-2xl font-black text-emerald-400">{totalVisits} Visits</span>
                <span className="text-[10px] text-slate-500 block">This month</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Attendance Rate</span>
                <span className="text-2xl font-black text-sky-400">{attendancePercentage}%</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">+4% vs last month</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Workout Streak</span>
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-400">{longestWorkoutStreak} Days</span>
                <span className="text-[10px] text-slate-500 block">Personal best streak</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Diet Streak</span>
                  <Award className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-400">{longestDietStreak} Days</span>
                <span className="text-[10px] text-slate-500 block">Zero cheat misses</span>
              </div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100">
              Recent Check-In History & Workouts
            </h3>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {attendanceList.map((record) => {
                const statusBadge =
                  record.status === "Present"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : record.status === "Rest Day"
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                    : record.status === "Holiday"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30";

                return (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadge}`}>
                        {record.status}
                      </span>
                      <div>
                        <span className="font-bold text-slate-200 block">
                          {record.workoutTitle || (record.status === "Rest Day" ? "Recovery & Mobility" : "Scheduled Gym Session")}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {record.date} {record.checkInTime && `• ${record.checkInTime} to ${record.checkOutTime}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {record.notes && (
                        <span className="text-[11px] text-slate-400 italic block">{record.notes}</span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">{record.gymName || membership.gymName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SECTION 21 - COACH WORKOUT PLANS */}
      {/* ========================================================================= */}
      {activeSubTab === "plans" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Assigned Coach Workout Routines</h2>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Coach Workout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {coachPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                        {plan.difficulty}
                      </span>
                      <span className="text-xs text-slate-400">Date: {plan.workoutDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1">{plan.planTitle}</h3>
                    <p className="text-xs text-slate-400">Coach: {plan.coachName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        plan.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : plan.status === "In-Progress"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {plan.status}
                    </span>

                    {plan.status !== "Completed" && (
                      <button
                        onClick={() => onUpdateCoachPlanStatus(plan.id, "Completed")}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition cursor-pointer"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">Instructions:</strong> {plan.instructions}
                  </p>
                  {plan.notes && (
                    <p>
                      <strong className="text-slate-400">Coach Notes:</strong> {plan.notes}
                    </p>
                  )}
                </div>

                {/* Exercises list */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Prescribed Exercise List
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {plan.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-200 block">{ex.exerciseName}</span>
                          <span className="text-[10px] text-slate-400">
                            {ex.sets} sets × {ex.reps} reps • Rest: {ex.restTimeSec}s
                          </span>
                        </div>
                        <span className="text-emerald-400 font-bold">{ex.weightKg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SECTION 20 - GYM MEMBERSHIP MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === "membership" && (
        <GymMembershipManager
          membership={membership}
          onUpdateMembership={onUpdateMembership}
        />
      )}

      {/* MARK ATTENDANCE MODAL */}
      {isMarkAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-slate-100">Log Today's Gym Attendance</h3>
              <button
                onClick={() => setIsMarkAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Status</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Present", "Rest Day", "Absent", "Holiday"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAttendStatus(s)}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        attendStatus === s
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {attendStatus === "Present" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Check-In Time</label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Check-Out Time</label>
                      <input
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Workout Focus</label>
                    <input
                      type="text"
                      value={attendWorkoutTitle}
                      onChange={(e) => setAttendWorkoutTitle(e.target.value)}
                      placeholder="e.g. Upper Power & Push"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes / Highlights</label>
                <input
                  type="text"
                  value={attendNotes}
                  onChange={(e) => setAttendNotes(e.target.value)}
                  placeholder="e.g. Hit new PR on flat bench"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsMarkAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Save Attendance Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENEW MEMBERSHIP MODAL */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-slate-100">Renew Gym Membership</h3>
              <button onClick={() => setIsRenewModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {renewSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Membership Renewed for 1 Full Year!</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Renew your annual subscription for <strong className="text-white">{membership.gymName}</strong>.
                </p>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Plan: {membership.planName}</span>
                  <span className="text-slate-400 block">Amount: ${membership.feesUSD} USD</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRenew}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                  >
                    Confirm & Pay Renewal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE COACH WORKOUT MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-slate-100">Create Coach Workout Routine</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Plan Title</label>
                <input
                  type="text"
                  value={newPlan.planTitle}
                  onChange={(e) => setNewPlan({ ...newPlan, planTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Coach Name</label>
                  <input
                    type="text"
                    value={newPlan.coachName}
                    onChange={(e) => setNewPlan({ ...newPlan, coachName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Workout Date</label>
                  <input
                    type="date"
                    value={newPlan.workoutDate}
                    onChange={(e) => setNewPlan({ ...newPlan, workoutDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={newPlan.instructions}
                  onChange={(e) => setNewPlan({ ...newPlan, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Assign Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
