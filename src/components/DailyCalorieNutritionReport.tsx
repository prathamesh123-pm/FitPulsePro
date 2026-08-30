import React, { useMemo } from "react";
import {
  Flame,
  Droplets,
  Activity,
  Target,
  TrendingDown,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";
import { DailyNutritionLog, HealthCalculations } from "../types";

interface DailyCalorieNutritionReportProps {
  log: DailyNutritionLog;
  healthMetrics: HealthCalculations;
  selectedDate: string;
}

export function DailyCalorieNutritionReport({
  log,
  healthMetrics,
  selectedDate,
}: DailyCalorieNutritionReportProps) {
  // Aggregate consumed macros
  const consumed = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    log.meals.forEach((meal) => {
      meal.foods.forEach((f) => {
        calories += f.calories || 0;
        protein += f.protein || 0;
        carbs += f.carbs || 0;
        fat += f.fat || 0;
        fiber += f.fiber || 0;
      });
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber),
    };
  }, [log]);

  // Target metrics
  const targetCalories = healthMetrics.dailyCaloriesRequired || 2200;
  const burnedCalories = log.activeCaloriesBurned || 450;
  const netCalories = consumed.calories - burnedCalories;

  // Calorie calculations
  const calorieDiff = consumed.calories - targetCalories;
  const isOverTarget = calorieDiff > 0;
  const caloriesOverTarget = Math.max(0, calorieDiff);
  const caloriesUnderTarget = Math.max(0, targetCalories - consumed.calories);
  const caloriesRemaining = caloriesUnderTarget;

  // Deficit / Surplus calculation
  // Total Energy Expenditure = targetCalories (or BMR + active burned)
  // Deficit vs Maintenance/Target:
  const isDeficit = consumed.calories < targetCalories;
  const deficitOrSurplusAmount = Math.abs(calorieDiff);

  // Macro targets
  const targetProtein = healthMetrics.dailyProteinGrams || 150;
  const targetCarbs = healthMetrics.dailyCarbsGrams || 220;
  const targetFat = healthMetrics.dailyFatGrams || 65;
  const targetFiber = 35; // Recommended daily fiber grams
  const targetWater = healthMetrics.dailyWaterMl || 3500;
  const consumedWater = log.waterLoggedMl || 0;

  // Helper macro bar item
  const macroRows = [
    {
      label: "Protein",
      unit: "g",
      consumed: consumed.protein,
      target: targetProtein,
      remaining: Math.max(0, targetProtein - consumed.protein),
      color: "bg-sky-500",
      textColor: "text-sky-400",
      borderColor: "border-sky-500/30",
      bgColor: "bg-sky-500/10",
      icon: Target,
    },
    {
      label: "Carbohydrates",
      unit: "g",
      consumed: consumed.carbs,
      target: targetCarbs,
      remaining: Math.max(0, targetCarbs - consumed.carbs),
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      icon: Activity,
    },
    {
      label: "Dietary Fat",
      unit: "g",
      consumed: consumed.fat,
      target: targetFat,
      remaining: Math.max(0, targetFat - consumed.fat),
      color: "bg-rose-500",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/30",
      bgColor: "bg-rose-500/10",
      icon: Zap,
    },
    {
      label: "Dietary Fiber",
      unit: "g",
      consumed: consumed.fiber,
      target: targetFiber,
      remaining: Math.max(0, targetFiber - consumed.fiber),
      color: "bg-amber-500",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/10",
      icon: Sparkles,
    },
    {
      label: "Water Hydration",
      unit: "ml",
      consumed: consumedWater,
      target: targetWater,
      remaining: Math.max(0, targetWater - consumedWater),
      color: "bg-cyan-500",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      bgColor: "bg-cyan-500/10",
      icon: Droplets,
    },
  ];

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6" id="daily-calorie-nutrition-report">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-100">Daily Calorie & Nutrition Report</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {selectedDate}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated daily energy balance, net calories, and macro progress bars
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-2">
          {isDeficit ? (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <span>Calorie Deficit: -{deficitOrSurplusAmount} kcal</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span>Calorie Surplus: +{deficitOrSurplusAmount} kcal</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 CORE ENERGY CARDS (Target vs Consumed, Burned, Net, Deficit/Surplus) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Target vs Consumed */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Target vs Consumed</span>
            <Target className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-400">{consumed.calories}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {targetCalories} kcal</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            {Math.round((consumed.calories / targetCalories) * 100)}% of daily allowance
          </span>
        </div>

        {/* Card 2: Burned Calories */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Burned Calories</span>
            <Flame className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-400">{burnedCalories}</span>
            <span className="text-xs text-slate-400 font-semibold">kcal active</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Steps + Workout + Basal exertion
          </span>
        </div>

        {/* Card 3: Net Calories */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Net Calories</span>
            <Activity className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-sky-400">{netCalories}</span>
            <span className="text-xs text-slate-400 font-semibold">kcal</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Consumed minus Active Burned
          </span>
        </div>

        {/* Card 4: Deficit / Surplus */}
        <div
          className={`p-4 rounded-2xl border space-y-1 ${
            isDeficit
              ? "bg-emerald-950/20 border-emerald-500/30"
              : "bg-amber-950/20 border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>{isDeficit ? "Calorie Deficit" : "Calorie Surplus"}</span>
            {isDeficit ? (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-black ${
                isDeficit ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {isDeficit ? `-${deficitOrSurplusAmount}` : `+${deficitOrSurplusAmount}`}
            </span>
            <span className="text-xs text-slate-400 font-semibold">kcal</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            {isDeficit ? "Optimal for steady fat oxidation" : "Energy surplus for muscle growth"}
          </span>
        </div>
      </div>

      {/* 3 SPECIFIC DISPLAY TILES (Remaining, Over Target, Under Target) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tile 1: Calories Remaining */}
        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Calories Remaining
          </span>
          <span className="text-lg font-extrabold text-slate-100">
            {caloriesRemaining} kcal
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {caloriesRemaining > 0 ? "Left in today's target budget" : "Budget reached"}
          </span>
        </div>

        {/* Tile 2: Calories Over Target */}
        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Calories Over Target
          </span>
          <span
            className={`text-lg font-extrabold ${
              caloriesOverTarget > 0 ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {caloriesOverTarget} kcal
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {caloriesOverTarget > 0 ? "Exceeded daily ceiling" : "Within safe target limit"}
          </span>
        </div>

        {/* Tile 3: Calories Under Target */}
        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Calories Under Target
          </span>
          <span
            className={`text-lg font-extrabold ${
              caloriesUnderTarget > 0 ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {caloriesUnderTarget} kcal
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {caloriesUnderTarget > 0 ? "Remaining under max ceiling" : "Target exact or met"}
          </span>
        </div>
      </div>

      {/* NUTRITION SUMMARIES USING PROGRESS BARS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
            Nutrition Summaries & Macro Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Progress against daily targets
          </span>
        </div>

        <div className="space-y-3.5">
          {macroRows.map((row) => {
            const pct = Math.min(100, Math.round((row.consumed / Math.max(1, row.target)) * 100));
            const Icon = row.icon;
            const isMet = row.consumed >= row.target;

            return (
              <div
                key={row.label}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${row.bgColor} ${row.textColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-slate-200">{row.label}</span>
                    {isMet && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Target Met
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-slate-400">
                      Target: <strong className="text-slate-200">{row.target}{row.unit}</strong>
                    </span>
                    <span className="text-slate-400">
                      Consumed: <strong className={row.textColor}>{row.consumed}{row.unit}</strong>
                    </span>
                    <span className="text-slate-400">
                      Remaining: <strong className="text-slate-300">{row.remaining}{row.unit}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden relative">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>0{row.unit}</span>
                  <span className="font-bold text-slate-400">{pct}% Completed</span>
                  <span>{row.target}{row.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
