import React, { useMemo } from "react";
import {
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Droplets,
  Flame,
  Clock,
  HeartPulse,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DailyNutritionLog, HealthCalculations } from "../types";

interface AIDietAnalysisProps {
  log: DailyNutritionLog;
  healthMetrics: HealthCalculations;
  selectedDate: string;
}

export function AIDietAnalysis({
  log,
  healthMetrics,
  selectedDate,
}: AIDietAnalysisProps) {
  // Aggregate actuals
  const actuals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let completedMeals = 0;
    let missedMeals = 0;

    log.meals.forEach((m) => {
      if (m.completed) completedMeals++;
      if (m.missed) missedMeals++;
      m.foods.forEach((f) => {
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
      waterMl: log.waterLoggedMl || 0,
      completedMeals,
      missedMeals,
      totalMeals: log.meals.length || 9,
    };
  }, [log]);

  const targetCalories = healthMetrics.dailyCaloriesRequired || 2200;
  const targetProtein = healthMetrics.dailyProteinGrams || 150;
  const targetWater = healthMetrics.dailyWaterMl || 3500;
  const targetCarbs = healthMetrics.dailyCarbsGrams || 220;
  const targetFat = healthMetrics.dailyFatGrams || 65;
  const burnedCalories = log.activeCaloriesBurned || 450;
  const netCalories = actuals.calories - burnedCalories;

  // AI Evaluation Logic
  const analysis = useMemo(() => {
    const calorieDiff = actuals.calories - targetCalories;
    const proteinDiff = actuals.protein - targetProtein;
    const waterDiff = actuals.waterMl - targetWater;

    // Diet Adherence Score (0-100)
    let score = 100;
    if (Math.abs(calorieDiff) > 300) score -= 15;
    if (proteinDiff < -20) score -= 20;
    if (waterDiff < -800) score -= 15;
    if (actuals.missedMeals > 0) score -= actuals.missedMeals * 10;
    const finalScore = Math.max(20, Math.min(100, score));

    // Dynamic Actionable Recommendations
    const recommendations: {
      type: "protein" | "calories" | "water" | "cardio" | "timing";
      title: string;
      advice: string;
      severity: "critical" | "warning" | "optimal";
      icon: any;
    }[] = [];

    // 1. Protein Recommendation
    if (proteinDiff < -15) {
      recommendations.push({
        type: "protein",
        title: "Increase Daily Protein Intake",
        advice: `You reached ${actuals.protein}g of your ${targetProtein}g target (deficit of ${Math.abs(proteinDiff)}g). Add 1 scoop of whey isolate or 150g grilled chicken/tempeh to maintain positive nitrogen balance and spare lean muscle.`,
        severity: "warning",
        icon: Award,
      });
    } else {
      recommendations.push({
        type: "protein",
        title: "Protein Target Optimal",
        advice: `Excellent job hitting ${actuals.protein}g of protein (${Math.round((actuals.protein / targetProtein) * 100)}% of goal). Muscle protein synthesis and recovery are well supported.`,
        severity: "optimal",
        icon: ShieldCheck,
      });
    }

    // 2. Calorie Recommendation
    if (calorieDiff > 250) {
      recommendations.push({
        type: "calories",
        title: "Reduce Calorie Intake / Adjust Portions",
        advice: `Total energy consumed was ${actuals.calories} kcal vs target of ${targetCalories} kcal (+${calorieDiff} kcal over). Scale down cooking oils, dressings, and evening carbohydrates by 15-20% tomorrow.`,
        severity: "warning",
        icon: Flame,
      });
    } else if (calorieDiff < -400) {
      recommendations.push({
        type: "calories",
        title: "Avoid Excessive Caloric Undereating",
        advice: `You consumed only ${actuals.calories} kcal (${Math.abs(calorieDiff)} kcal under target). Ensure you are eating enough to sustain thyroid function, metabolic rate, and training intensity.`,
        severity: "warning",
        icon: Flame,
      });
    } else {
      recommendations.push({
        type: "calories",
        title: "Caloric Target On Track",
        advice: `Consuming ${actuals.calories} kcal aligns accurately with your ${targetCalories} kcal goal, keeping you on schedule for lean body composition changes.`,
        severity: "optimal",
        icon: ShieldCheck,
      });
    }

    // 3. Water Hydration Recommendation
    if (waterDiff < -500) {
      recommendations.push({
        type: "water",
        title: "Increase Water Hydration",
        advice: `Logged ${actuals.waterMl}ml out of ${targetWater}ml target (short by ${Math.abs(waterDiff)}ml). Drink 500ml upon waking tomorrow and keep a 1-liter bottle at your desk to prevent mild intracellular dehydration.`,
        severity: "warning",
        icon: Droplets,
      });
    } else {
      recommendations.push({
        type: "water",
        title: "Hydration Status Excellent",
        advice: `Reached ${actuals.waterMl}ml of fluids today. Cellular hydration supports nutrient transport, joint lubrication, and peak muscular contraction.`,
        severity: "optimal",
        icon: Droplets,
      });
    }

    // 4. Cardio & Activity Recommendation
    if (actuals.calories > targetCalories || (log.stepsCount || 0) < 8000) {
      recommendations.push({
        type: "cardio",
        title: "Add 25-30 Min Low-Intensity Cardio",
        advice: `To optimize fat loss and offset caloric surplus, program 25-30 minutes of Zone 2 cardio (incline walking at 3.5 mph / 12% grade, or stationary cycling) tomorrow morning.`,
        severity: "warning",
        icon: Activity,
      });
    } else {
      recommendations.push({
        type: "cardio",
        title: "Energy Expenditure Balanced",
        advice: `Daily expenditure of ${burnedCalories} kcal active burn creates an effective net deficit of ${targetCalories - netCalories} kcal without requiring excessive cardio fatigue.`,
        severity: "optimal",
        icon: Zap,
      });
    }

    // 5. Meal Timing Recommendation
    if (actuals.missedMeals > 0) {
      recommendations.push({
        type: "timing",
        title: "Improve Meal Timing Consistency",
        advice: `You missed ${actuals.missedMeals} scheduled meal(s) today. Skipping scheduled feedings causes cortisol spikes and subsequent late-night cravings. Prep meals in advance to stay consistent.`,
        severity: "critical",
        icon: Clock,
      });
    } else {
      recommendations.push({
        type: "timing",
        title: "Meal Timing Synchronized",
        advice: `Consistent feeding windows spaced every 3-4 hours effectively regulated insulin and sustained an uninterrupted amino acid pool throughout the day.`,
        severity: "optimal",
        icon: Clock,
      });
    }

    return {
      score: finalScore,
      calorieDiff,
      proteinDiff,
      waterDiff,
      recommendations,
    };
  }, [actuals, targetCalories, targetProtein, targetWater, burnedCalories, log.stepsCount]);

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6" id="ai-diet-analysis-module">
      {/* Header with AI Badge and Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-100">AI Diet & Nutrition Analysis</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                End-of-Day Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Comparative nutrient audit and proactive recommendations for {selectedDate}
            </p>
          </div>
        </div>

        {/* Overall Diet Score */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0 self-start sm:self-auto">
          <Award className="h-5 w-5 text-amber-400" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Diet Adherence Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400">{analysis.score}</span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVE AUDIT TABLE (Target vs Actual) */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
          Target vs. Actual Nutrient Comparison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Calories */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Calories</span>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-slate-100">{actuals.calories} kcal</span>
              <span className="text-slate-400 font-medium">Goal: {targetCalories}</span>
            </div>
            <div className="text-[11px] font-semibold">
              {analysis.calorieDiff > 0 ? (
                <span className="text-rose-400">+{analysis.calorieDiff} kcal Over Target</span>
              ) : (
                <span className="text-emerald-400">{analysis.calorieDiff} kcal Deficit Achieved</span>
              )}
            </div>
          </div>

          {/* 2. Protein */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Protein</span>
              <Award className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-sky-400">{actuals.protein}g</span>
              <span className="text-slate-400 font-medium">Goal: {targetProtein}g</span>
            </div>
            <div className="text-[11px] font-semibold">
              {actuals.protein >= targetProtein ? (
                <span className="text-emerald-400">✓ Protein Goal Achieved</span>
              ) : (
                <span className="text-amber-400">{analysis.proteinDiff}g Under Target</span>
              )}
            </div>
          </div>

          {/* 3. Water */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Water Intake</span>
              <Droplets className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-cyan-400">{actuals.waterMl} ml</span>
              <span className="text-slate-400 font-medium">Goal: {targetWater} ml</span>
            </div>
            <div className="text-[11px] font-semibold">
              {actuals.waterMl >= targetWater ? (
                <span className="text-emerald-400">✓ Hydration Target Met</span>
              ) : (
                <span className="text-amber-400">{analysis.waterDiff} ml Needed</span>
              )}
            </div>
          </div>

          {/* 4. Meals Checklist */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Meal Compliance</span>
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-slate-100">
                {actuals.completedMeals} / {actuals.totalMeals} Done
              </span>
              <span className="text-slate-400 font-medium">{actuals.missedMeals} Missed</span>
            </div>
            <div className="text-[11px] font-semibold">
              {actuals.missedMeals === 0 ? (
                <span className="text-emerald-400">✓ 100% Meals Adhered</span>
              ) : (
                <span className="text-rose-400">{actuals.missedMeals} Meal(s) Skipped</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 ACTIONABLE AI RECOMMENDATIONS (Protein, Calories, Water, Cardio, Timing) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Actionable AI Recommendations for Tomorrow</span>
        </h3>

        <div className="space-y-3">
          {analysis.recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-1.5 ${
                  rec.severity === "critical"
                    ? "bg-rose-950/30 border-rose-600/40 text-rose-200"
                    : rec.severity === "warning"
                    ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                    : "bg-slate-950/70 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-slate-100">
                    <div
                      className={`p-1 rounded-lg ${
                        rec.severity === "critical"
                          ? "bg-rose-500/20 text-rose-400"
                          : rec.severity === "warning"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{rec.title}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      rec.severity === "critical"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : rec.severity === "warning"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {rec.severity === "optimal" ? "Optimized" : "Action Required"}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs pl-7">
                  {rec.advice}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
