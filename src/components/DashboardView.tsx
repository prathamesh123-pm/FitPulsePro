import { useMemo } from "react";
import {
  Flame,
  Dumbbell,
  Droplets,
  Award,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  UserCheck,
  Footprints,
  Moon,
  AlertTriangle,
  Check,
  X,
  Trophy,
  Clock,
  Activity,
  Heart,
  Timer,
  Bike,
  Waves,
  Layers,
  Volume2,
} from "lucide-react";
import { computeDailyActivityAggregates } from "../utils/activityAnalytics";
import {
  AppState,
  UserProfile,
  HealthCalculations,
  GymMembership,
  WorkoutSession,
  DailyNutritionLog,
  CoachWorkoutPlan,
} from "../types";
import { TabId } from "./NavigationTabs";
import { Language, TRANSLATIONS } from "../utils/i18n";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface DashboardViewProps {
  appState: AppState;
  healthMetrics: HealthCalculations;
  onNavigate: (tab: TabId) => void;
  onQuickAddWater: (amountMl: number) => void;
  onStartWorkout: () => void;
  onOpenAchievements?: () => void;
  onOpenPlateCalculator?: () => void;
  onOpenPersonalRecords?: () => void;
  onOpenWaterTracker?: () => void;
  onOpenAudioCoach?: () => void;
  lang?: Language;
}

export function DashboardView({
  appState,
  healthMetrics,
  onNavigate,
  onQuickAddWater,
  onStartWorkout,
  onOpenAchievements,
  onOpenPlateCalculator,
  onOpenPersonalRecords,
  onOpenWaterTracker,
  onOpenAudioCoach,
  lang = "en",
}: DashboardViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const realToday = new Date().toISOString().split("T")[0];
  const todayKey = appState.dailyNutrition[realToday] ? realToday : (appState.dailyNutrition["2026-08-28"] ? "2026-08-28" : realToday);
  const todayNutrition: DailyNutritionLog = appState.dailyNutrition[todayKey] || {
    date: todayKey,
    meals: [],
    waterLoggedMl: 0,
    stepsCount: 0,
    activeCaloriesBurned: 0,
    cheatMeals: [],
  };

  // Compute consumed calories and macros
  const consumedMacros = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let completedMealsCount = 0;

    todayNutrition.meals.forEach((meal) => {
      if (meal.completed) completedMealsCount++;
      meal.foods.forEach((f) => {
        calories += f.calories;
        protein += f.protein;
        carbs += f.carbs;
        fat += f.fat;
      });
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      completedMealsCount,
      totalMealsCount: todayNutrition.meals.length || 9,
    };
  }, [todayNutrition]);

  // Calories breakdown
  const targetCalories = healthMetrics.dailyCaloriesRequired;
  const burnedCalories = todayNutrition.activeCaloriesBurned || 520;
  const netCalories = consumedMacros.calories - burnedCalories;
  const remainingCalories = Math.max(0, targetCalories - consumedMacros.calories);
  const caloriePct = Math.min(100, Math.round((consumedMacros.calories / targetCalories) * 100));

  // Protein breakdown
  const targetProtein = healthMetrics.dailyProteinGrams;
  const proteinPct = Math.min(100, Math.round((consumedMacros.protein / targetProtein) * 100));

  // Water breakdown
  const targetWater = healthMetrics.dailyWaterMl;
  const waterLogged = todayNutrition.waterLoggedMl || 0;
  const waterPct = Math.min(100, Math.round((waterLogged / targetWater) * 100));

  // Workout progress
  const todayWorkout = appState.workoutHistory.find((w) => w.date === todayKey) || appState.activeWorkout;
  const workoutDone = Boolean(todayWorkout?.completed);

  // Coach assigned workout for today
  const coachPlan = appState.coachPlans.find((p) => p.workoutDate === todayKey);

  // Membership calculation
  const membershipExpiry = new Date(appState.membership.expiryDate);
  const now = new Date();
  const membershipDaysLeft = Math.max(0, Math.ceil((membershipExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Today Gym Attendance record
  const todayAttendance = appState.attendance?.[todayKey] || {
    id: `att-today`,
    date: todayKey,
    status: "Present" as const,
    checkInTime: "17:30",
    checkOutTime: "18:50",
    gymName: appState.membership.gymName,
    workoutTitle: "Push Power & Hypertrophy",
  };

  // Health Score Calculation (0-100 composite)
  const healthScore = useMemo(() => {
    let score = 50;
    if (caloriePct >= 80 && caloriePct <= 110) score += 15;
    if (proteinPct >= 80) score += 15;
    if (waterPct >= 75) score += 10;
    if (workoutDone || appState.activeWorkout) score += 10;
    return Math.min(98, score);
  }, [caloriePct, proteinPct, waterPct, workoutDone, appState.activeWorkout]);

  // Section 32: Daily Fitness Status Logic
  const missedMealsCount = todayNutrition.meals.filter((m) => m.missed).length;
  let dietStatus: "Diet Followed" | "Diet Missed" | "Diet Broken" = "Diet Followed";
  if (missedMealsCount > 0) {
    dietStatus = "Diet Missed";
  } else if (consumedMacros.calories > targetCalories + 50) {
    dietStatus = "Diet Broken";
  } else {
    dietStatus = "Diet Followed";
  }

  const stepsCount = todayNutrition.stepsCount || 8500;
  const stepsDone = stepsCount >= 10000;
  const waterDone = (todayNutrition.waterLoggedMl || 0) >= targetWater;
  const proteinDone = consumedMacros.protein >= targetProtein * 0.85;
  const sleepHours = todayNutrition.sleepHours || 7.5;
  const sleepDone = sleepHours >= 7;
  const caloriesDone = dietStatus !== "Diet Broken";

  // Section 42 & Daily Activity Analytics
  const activityAggregates = useMemo(() => {
    return computeDailyActivityAggregates(appState, todayKey);
  }, [appState, todayKey]);

  const durations = {
    workoutTimeMin: activityAggregates.totalWorkoutTimeMin,
    cardioTimeMin: Math.round(activityAggregates.totalRunningKm * 6),
    cyclingTimeMin: Math.round(activityAggregates.totalCyclingKm * 2.5),
    runningTimeMin: Math.round(activityAggregates.totalRunningKm * 5.5),
    treadmillTimeMin: 15,
  };

  // Weekly Weight Trend Data for Recharts
  const weeklyData = [
    { day: "Aug 22", weight: 79.4, calories: 2150 },
    { day: "Aug 23", weight: 79.2, calories: 2100 },
    { day: "Aug 24", weight: 79.0, calories: 2200 },
    { day: "Aug 25", weight: 78.8, calories: 2050 },
    { day: "Aug 26", weight: 78.7, calories: 2180 },
    { day: "Aug 27", weight: 78.6, calories: 2140 },
    { day: "Aug 28", weight: 78.5, calories: consumedMacros.calories || 2120 },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Welcome & Today's Streaks */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                Mode: {appState.profile.fitnessGoal}
              </span>
              <span className="text-xs text-slate-400">Friday, August 28, 2026</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                Section 42 • Advanced Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Ready to crush your goals, {appState.profile.fullName.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Target deficit active: {healthMetrics.dailyCaloriesWeightLoss} kcal/day. You are on track to reach your goal weight of {appState.profile.goalWeightKg} kg in approx {healthMetrics.estimatedWeeks} weeks.
            </p>
          </div>

          {/* Quick Streaks & Health Score Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Workout Streak */}
            <div
              onClick={onOpenAchievements}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-center min-w-[90px] cursor-pointer hover:border-amber-500/40 transition"
              title="Click to view Achievements & Streaks"
            >
              <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold">
                <Flame className="h-4 w-4 fill-amber-400/20" /> Workout Streak
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-0.5">8 Days</div>
              <div className="text-[10px] text-slate-400">Record: 15d</div>
            </div>

            {/* Diet Streak */}
            <div
              onClick={onOpenAchievements}
              className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-center min-w-[90px] cursor-pointer hover:border-emerald-500/40 transition"
              title="Click to view Achievements & Streaks"
            >
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold">
                <Award className="h-4 w-4" /> Diet Streak
              </div>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">12 Days</div>
              <div className="text-[10px] text-slate-400">Zero cheat misses</div>
            </div>

            {/* Overall Fitness Score */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-teal-400 text-xs font-semibold">
                <Sparkles className="h-4 w-4" /> Fitness Score
              </div>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                {healthScore}<span className="text-xs text-slate-400">/100</span>
              </div>
              <div className="text-[10px] text-slate-400">Optimal Sync</div>
            </div>

            {/* Achievements Trophy Button */}
            {onOpenAchievements && (
              <button
                onClick={onOpenAchievements}
                className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                title="Open Achievements & Milestones"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Badges</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DAILY ACTIVITY TRACKER & FITNESS ANALYTICS INTEGRATION */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Daily Activity & Movement Analytics</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  {activityAggregates.goalCompletionPct}% Goals Met
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous biometric tracking, active calories, and lipid oxidation for {todayKey}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("activity")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <span>Open Activity Hub</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 10 Core Metrics Grid with Progress Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Walking KM */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Footprints className="h-3 w-3 text-emerald-400" /> Walking</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalWalkingKm} km</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalWalkingKm / activityAggregates.goals.walkingDistanceKmGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.walkingDistanceKmGoal}km</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalWalkingKm / activityAggregates.goals.walkingDistanceKmGoal) * 100))}%</span>
            </div>
          </div>

          {/* 2. Running KM */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Activity className="h-3 w-3 text-amber-400" /> Running</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalRunningKm} km</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalRunningKm / activityAggregates.goals.runningDistanceKmGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.runningDistanceKmGoal}km</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalRunningKm / activityAggregates.goals.runningDistanceKmGoal) * 100))}%</span>
            </div>
          </div>

          {/* 3. Cycling KM */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Bike className="h-3 w-3 text-sky-400" /> Cycling</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalCyclingKm} km</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalCyclingKm / activityAggregates.goals.cyclingDistanceKmGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.cyclingDistanceKmGoal}km</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalCyclingKm / activityAggregates.goals.cyclingDistanceKmGoal) * 100))}%</span>
            </div>
          </div>

          {/* 4. Swimming KM */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Waves className="h-3 w-3 text-cyan-400" /> Swimming</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalSwimmingKm} km</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalSwimmingKm / activityAggregates.goals.swimmingDistanceKmGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.swimmingDistanceKmGoal}km</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalSwimmingKm / activityAggregates.goals.swimmingDistanceKmGoal) * 100))}%</span>
            </div>
          </div>

          {/* 5. Workout Time */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Timer className="h-3 w-3 text-purple-400" /> Workout Time</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalWorkoutTimeMin} m</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalWorkoutTimeMin / activityAggregates.goals.workoutDurationMinGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.workoutDurationMinGoal}m</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalWorkoutTimeMin / activityAggregates.goals.workoutDurationMinGoal) * 100))}%</span>
            </div>
          </div>

          {/* 6. Calories Burned */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Flame className="h-3 w-3 text-rose-400" /> Calories Burned</span>
              <span className="font-bold text-amber-400">{activityAggregates.totalCaloriesBurned} kcal</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalCaloriesBurned / activityAggregates.goals.caloriesBurnedGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.caloriesBurnedGoal}</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalCaloriesBurned / activityAggregates.goals.caloriesBurnedGoal) * 100))}%</span>
            </div>
          </div>

          {/* 7. Estimated Fat Burned */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><TrendingDown className="h-3 w-3 text-emerald-400" /> Fat Burned</span>
              <span className="font-bold text-emerald-400">{activityAggregates.estimatedFatBurnedGrams} g</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.estimatedFatBurnedGrams / 60) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Lipid loss</span>
              <span>Active burn</span>
            </div>
          </div>

          {/* 8. Calories Consumed */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Flame className="h-3 w-3 text-sky-400" /> Consumed</span>
              <span className="font-bold text-slate-200">{activityAggregates.caloriesConsumed} kcal</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.caloriesConsumed / (healthMetrics.dailyCaloriesWeightLoss || 2100)) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Target: {healthMetrics.dailyCaloriesWeightLoss || 2100}</span>
              <span>{Math.round((activityAggregates.caloriesConsumed / (healthMetrics.dailyCaloriesWeightLoss || 2100)) * 100)}%</span>
            </div>
          </div>

          {/* 9. Water Intake */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Droplets className="h-3 w-3 text-blue-400" /> Water Intake</span>
              <span className="font-bold text-cyan-400">{activityAggregates.waterIntakeMl} ml</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.waterIntakeMl / activityAggregates.goals.waterIntakeMlGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.waterIntakeMlGoal}ml</span>
              <span>{Math.min(100, Math.round((activityAggregates.waterIntakeMl / activityAggregates.goals.waterIntakeMlGoal) * 100))}%</span>
            </div>
          </div>

          {/* 10. Steps */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase"><Footprints className="h-3 w-3 text-teal-400" /> Total Steps</span>
              <span className="font-bold text-slate-200">{activityAggregates.totalSteps.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((activityAggregates.totalSteps / activityAggregates.goals.dailyStepsGoal) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between">
              <span>Goal: {activityAggregates.goals.dailyStepsGoal.toLocaleString()}</span>
              <span>{Math.min(100, Math.round((activityAggregates.totalSteps / activityAggregates.goals.dailyStepsGoal) * 100))}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK GYM TOOLS & NEW POWER FEATURES */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {lang === "mr" ? "जिम पॉवर टूल्स व झटपट ॲक्सेस" : "Gym OS Power Tools & Quick Access"}
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            {lang === "mr" ? "सक्रिय" : "Live Suite"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Barbell Plate Loader */}
          <button
            onClick={onOpenPlateCalculator}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2">
              {lang === "mr" ? "प्लेट कॅल्क्युलेटर" : "Plate Loader"}
            </span>
            <span className="text-[10px] text-slate-400">
              {lang === "mr" ? "बारबेल प्लेट्स गणना" : "Barbell breakdown"}
            </span>
          </button>

          {/* PRs & Trophy Shelf */}
          <button
            onClick={onOpenPersonalRecords}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2">
              {lang === "mr" ? "पर्सनल रेकॉर्ड्स (PR)" : "PRs & Records"}
            </span>
            <span className="text-[10px] text-slate-400">
              {lang === "mr" ? "1RM व स्ट्रेंथ ट्रॉफी" : "1RM Strength Shelf"}
            </span>
          </button>

          {/* Audio Coach & Timer */}
          <button
            onClick={onOpenAudioCoach}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 transition cursor-pointer text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition">
              <Volume2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2">
              {lang === "mr" ? "ऑडिओ टाइमर व टेम्पो" : "Audio Timer & Tempo"}
            </span>
            <span className="text-[10px] text-slate-400">
              {lang === "mr" ? "ध्वनी संकेत व मेट्रोनोम" : "Rest beeps & voice"}
            </span>
          </button>

          {/* Water Tracker */}
          <button
            onClick={onOpenWaterTracker}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer text-left group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2">
              {lang === "mr" ? "पाणी ट्रॅकर" : "Water Tracker"}
            </span>
            <span className="text-[10px] text-slate-400">
              {lang === "mr" ? "हायड्रेशन बॉटल लॉग" : "Visual bottle log"}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 42: SMART AI SUGGESTIONS WIDGET */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Smart AI Suggestions & Immediate Actions
            </h3>
          </div>
          <button
            onClick={() => onNavigate("coach")}
            className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
          >
            Open Coach View →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
            <span>
              <strong>Protein Deficit:</strong> Consume 12g protein before bed (Casein or Greek yogurt recommended).
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
            <span>
              <strong>Hydration:</strong> Drink 350ml water now to satisfy your 3,200 ml cellular target.
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <span>
              <strong>Tomorrow Focus:</strong> Coach scheduled Back & Lat hypertrophy with heavy rows.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 32: DAILY FITNESS STATUS CARD */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              Daily Fitness Adherence Status
            </span>
            <span className="text-xs text-slate-400">Real-Time Tracker Diagnostics</span>
          </div>

          <div className="flex items-center gap-2">
            {dietStatus === "Diet Followed" && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Diet Followed ✔</span>
              </span>
            )}
            {dietStatus === "Diet Missed" && (
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Diet Missed ✘</span>
              </span>
            )}
            {dietStatus === "Diet Broken" && (
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Diet Broken ⚠</span>
              </span>
            )}

            <button
              onClick={() => onNavigate("diet")}
              className="text-xs text-emerald-400 hover:underline cursor-pointer ml-1"
            >
              Details
            </button>
          </div>
        </div>

        {/* 8 Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          <div className={`p-2.5 rounded-xl border text-center ${workoutDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Workout</span>
            <span>{workoutDone ? "Done ✔" : "Pending ✘"}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${dietStatus === "Diet Followed" ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : dietStatus === "Diet Missed" ? "bg-rose-950/20 border-rose-500/40 text-rose-300 font-bold" : "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Diet</span>
            <span>{dietStatus === "Diet Followed" ? "Followed ✔" : dietStatus === "Diet Missed" ? "Missed ✘" : "Broken ⚠"}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${stepsDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Steps (10k)</span>
            <span>{stepsDone ? "10k+ ✔" : `${Math.round((stepsCount / 10000) * 100)}%`}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${waterDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Water Goal</span>
            <span>{waterDone ? "Met ✔" : `${Math.round((todayNutrition.waterLoggedMl / targetWater) * 100)}%`}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${proteinDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Protein Goal</span>
            <span>{proteinDone ? "Met ✔" : `${consumedMacros.protein}/${targetProtein}g`}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${sleepDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Sleep (7h+)</span>
            <span>{sleepDone ? `${sleepHours}h ✔` : `${sleepHours}h ✘`}</span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${caloriesDone ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold" : "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold"}`}>
            <span className="text-[9px] uppercase font-bold block text-slate-400">Calories</span>
            <span>{caloriesDone ? "In Target ✔" : "Over ⚠"}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 text-center font-bold shadow-sm">
            <span className="text-[9px] uppercase block tracking-wider font-extrabold">Fitness Score</span>
            <span className="text-sm font-black">{healthScore}/100</span>
          </div>
        </div>
      </div>

      {/* Main Rings & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300">Calories</h3>
                <span className="text-[11px] text-slate-500">Target: {targetCalories} kcal</span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">{caloriePct}%</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">{consumedMacros.calories}</span>
              <span className="text-xs text-slate-400 ml-1">consumed</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-300">{remainingCalories}</span>
              <span className="text-[11px] text-slate-500 block">remaining</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${caloriePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Burned: {burnedCalories} kcal</span>
            <span>Net: {netCalories} kcal</span>
          </div>
        </div>

        {/* Protein Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300">Protein Goal</h3>
                <span className="text-[11px] text-slate-500">Target: {targetProtein}g</span>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-400">{proteinPct}%</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">{consumedMacros.protein}g</span>
              <span className="text-xs text-slate-400 ml-1">eaten</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-300">{Math.max(0, targetProtein - consumedMacros.protein)}g</span>
              <span className="text-[11px] text-slate-500 block">left today</span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Carbs: {consumedMacros.carbs}g</span>
            <span>Fat: {consumedMacros.fat}g</span>
          </div>
        </div>

        {/* Water Intake Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300">Water Hydration</h3>
                <span className="text-[11px] text-slate-500">Target: {targetWater} ml</span>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400">{waterPct}%</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">{(waterLogged / 1000).toFixed(1)}L</span>
              <span className="text-xs text-slate-400 ml-1">logged</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuickAddWater(250)}
                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/20 cursor-pointer"
                title="Add 250ml glass"
              >
                +250ml
              </button>
              <button
                onClick={() => onQuickAddWater(500)}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[10px] font-semibold border border-cyan-500/30 cursor-pointer"
                title="Add 500ml bottle"
              >
                +500ml
              </button>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Remaining: {Math.max(0, targetWater - waterLogged)} ml</span>
            <span>Glasses: {Math.round(waterLogged / 250)} / {Math.round(targetWater / 250)}</span>
          </div>
        </div>

        {/* Current Weight, BMI & Body Fat % Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300">Weight, BMI & Body Fat</h3>
                <span className="text-[11px] text-slate-500">Goal: {appState.profile.goalWeightKg} kg</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">15.9% Fat</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-slate-100">{appState.profile.currentWeightKg}</span>
              <span className="text-xs text-slate-400 ml-1">kg</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-400">BMI {healthMetrics.bmi}</span>
              <span className="text-[11px] text-slate-400 block font-medium">Body Fat: 15.9% (Athletic)</span>
            </div>
          </div>

          {/* Progress bar toward goal */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "72%" }} />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>To lose: {healthMetrics.weightToLoseKg} kg</span>
            <span className="text-emerald-400 font-semibold">-2.7 kg since start</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Today's Workout & Coach Session vs Today's Meals & Gym Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Workout & Coach Assignment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Today's Workout Session</h3>
                  <p className="text-xs text-slate-400">Track sets, weights, reps & notes</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {appState.activeWorkout ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> In Progress
                  </span>
                ) : workoutDone ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onStartWorkout();
                      onNavigate("workout");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Start Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* If there's an active or today's workout preview */}
            {todayWorkout ? (
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{todayWorkout.workoutName}</span>
                  <span className="text-slate-400">{todayWorkout.exercises.length} exercises logged</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {todayWorkout.exercises.slice(0, 4).map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="font-medium text-slate-300">{ex.exerciseName}</span>
                      <span className="text-emerald-400 font-semibold">{ex.sets.length} sets</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onNavigate("workout")}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Open Full Workout Tracker</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-800/30 border border-dashed border-slate-800 p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">No workout logged yet today. Choose from 14 muscle groups or execute your coach plan.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => onNavigate("workout")}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                    Browse Exercises
                  </button>
                  {coachPlan && (
                    <button
                      onClick={() => onNavigate("coach")}
                      className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      View Coach Plan
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Coach Workout Alert Card if assigned */}
            {coachPlan && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Coach Assignment</span>
                    <h4 className="text-xs font-semibold text-slate-200">{coachPlan.planTitle} ({coachPlan.coachName})</h4>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("coach")}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          {/* Weekly Weight & Calorie Trend Graph */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-100">7-Day Weight & Calorie Deficit Trend</h3>
                <p className="text-[11px] text-slate-400">Consistent deficit producing steady body fat reduction</p>
              </div>
              <button
                onClick={() => onNavigate("reports")}
                className="text-xs text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Full Reports</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} stroke="#64748b" fontSize={10} tickLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
                    formatter={(value: any) => [`${value} kg`, "Weight"]}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#weightGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Today's Meals & Gym Attendance & Membership */}
        <div className="space-y-4">
          {/* Gym Attendance Status Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200">Gym Attendance Status</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {todayAttendance.status} ✔
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Facility:</span>
                <span className="font-semibold text-slate-200">{todayAttendance.gymName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Check-In:</span>
                <span className="font-mono text-emerald-400">
                  {todayAttendance.checkInTime} - {todayAttendance.checkOutTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Session:</span>
                <span className="text-slate-300">{todayAttendance.workoutTitle}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate("coach")}
              className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Open Attendance Tracker
            </button>
          </div>

          {/* Today's Meals Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100">Today's Meals ({consumedMacros.completedMealsCount}/9)</h3>
              <button
                onClick={() => onNavigate("diet")}
                className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {todayNutrition.meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    meal.completed
                      ? "bg-slate-800/40 border-slate-700/60"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meal.completed ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span className={`font-semibold ${meal.completed ? "text-slate-200" : "text-slate-400"}`}>{meal.mealType}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{meal.plannedTime}</span>
                  </div>
                  {meal.foods.length > 0 ? (
                    <div className="mt-1.5 pl-4 text-[11px] text-slate-400">
                      {meal.foods.map((f) => f.name).join(", ").slice(0, 45)}...
                    </div>
                  ) : (
                    <div className="mt-1 pl-4 text-[10px] text-slate-600 italic">No food logged yet</div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate("diet")}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Log Meal or Food</span>
            </button>
          </div>

          {/* Membership Remaining Days Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200">{appState.membership.gymName}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                membershipDaysLeft <= 7
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {membershipDaysLeft} Days Remaining
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>Plan: <span className="text-slate-200 font-medium">{appState.membership.planName}</span></p>
              <p>Trainer: <span className="text-slate-200 font-medium">{appState.membership.trainerName}</span></p>
              <p>Expiry: <span className="text-slate-300">{appState.membership.expiryDate}</span></p>
            </div>

            <button
              onClick={() => onNavigate("coach")}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Manage Membership & Coach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
