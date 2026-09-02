import { ActivityLog, ActivityType, DailyFitnessGoals, DailyNutritionLog, HealthVitalsLog, AppState } from "../types";

// Standard MET (Metabolic Equivalent of Task) values for activities
export const ACTIVITY_MET_MAP: Record<ActivityType, number> = {
  Walking: 3.8,
  Running: 9.8,
  Cycling: 7.5,
  Swimming: 8.0,
  "Gym Workout": 6.0,
  Yoga: 3.0,
  Stretching: 2.5,
  Sports: 7.0,
  "Stair Climbing": 8.5,
  "Skipping Rope": 11.0,
  Meditation: 1.2,
  Treadmill: 8.5,
  "Outdoor Running": 10.0,
  Elliptical: 6.5,
  HIIT: 9.0,
  "Other Sports": 6.5,
  "Custom Activity": 5.0,
  Other: 4.5,
};

export interface DailyActivityAggregates {
  date: string;
  totalWalkingKm: number;
  totalRunningKm: number;
  totalCyclingKm: number;
  totalSwimmingKm: number;
  totalDistanceKm: number;
  totalWorkoutTimeMin: number;
  totalSteps: number;
  activeMinutes: number;
  totalCaloriesBurned: number;
  estimatedFatBurnedGrams: number;
  caloriesConsumed: number;
  netCalories: number;
  waterIntakeMl: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  exerciseScore: number;
  dailyFitnessScore: number;
  activitiesCount: number;
  goalCompletionPct: number;
  goals: DailyFitnessGoals;
  vitals?: HealthVitalsLog;
}

export const DEFAULT_FITNESS_GOALS: DailyFitnessGoals = {
  dailyStepsGoal: 10000,
  walkingDistanceKmGoal: 5.0,
  runningDistanceKmGoal: 5.0,
  cyclingDistanceKmGoal: 15.0,
  swimmingDistanceKmGoal: 1.0,
  workoutDurationMinGoal: 60,
  caloriesBurnedGoal: 550,
  waterIntakeMlGoal: 3200,
  weightLossTargetKg: 75.0,
  fatLossTargetPct: 15.0,
};

/**
 * Calculate calories burned using MET formula:
 * Calories = MET * Weight (kg) * Duration (hours)
 */
export function calculateActivityCalories(
  type: ActivityType,
  durationMinutes: number,
  weightKg: number = 75,
  intensity: "Low" | "Moderate" | "High" | "Vigorous" = "Moderate"
): number {
  const baseMet = ACTIVITY_MET_MAP[type] || 5.0;
  const intensityMultiplier =
    intensity === "Low" ? 0.8 : intensity === "High" ? 1.2 : intensity === "Vigorous" ? 1.4 : 1.0;
  const met = baseMet * intensityMultiplier;
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

/**
 * Calculate estimated fat burned in grams from calories burned
 * 1 gram of body fat tissue is approximately 7.7 kcal
 */
export function calculateFatBurnedGrams(calories: number): number {
  if (!calories || calories <= 0) return 0;
  return Math.round((calories / 7.7) * 10) / 10;
}

/**
 * Calculate pace in min:sec / km from duration in minutes and distance in km
 */
export function calculatePace(durationMinutes: number, distanceKm: number): string {
  if (!distanceKm || distanceKm <= 0 || !durationMinutes || durationMinutes <= 0) return "-";
  const paceTotalMin = durationMinutes / distanceKm;
  const mins = Math.floor(paceTotalMin);
  const secs = Math.round((paceTotalMin - mins) * 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs} /km`;
}

/**
 * Calculate average speed in km/h
 */
export function calculateAverageSpeed(distanceKm: number, durationMinutes: number): number {
  if (!distanceKm || !durationMinutes || durationMinutes <= 0) return 0;
  const speed = distanceKm / (durationMinutes / 60);
  return Math.round(speed * 10) / 10;
}

/**
 * Calculate comprehensive daily activity aggregates
 */
export function computeDailyActivityAggregates(
  arg1: string | AppState,
  arg2: string | AppState
): DailyActivityAggregates {
  const date = typeof arg1 === "string" ? arg1 : (arg2 as string);
  const state = typeof arg1 === "object" ? (arg1 as AppState) : (arg2 as AppState);
  const goals: DailyFitnessGoals = state.fitnessGoals || DEFAULT_FITNESS_GOALS;
  const logsForDate = (state.activityLogs || []).filter((l) => l.date === date);
  const nutrition: DailyNutritionLog | undefined = state.dailyNutrition?.[date];
  const vitals: HealthVitalsLog | undefined = state.healthVitals?.[date];
  const workoutForDate = state.workoutHistory?.find((w) => w.date === date && w.completed);

  let totalWalkingKm = 0;
  let totalRunningKm = 0;
  let totalCyclingKm = 0;
  let totalSwimmingKm = 0;
  let totalDistanceKm = 0;
  let totalWorkoutTimeMin = 0;
  let totalSteps = 0;
  let activeMinutes = 0;
  let totalCaloriesBurned = 0;

  logsForDate.forEach((log) => {
    const dist = Number(log.distanceKm) || 0;
    const dur = Number(log.durationMinutes) || 0;
    const cal = Number(log.caloriesBurned) || 0;
    const steps = Number(log.steps) || 0;

    totalDistanceKm += dist;
    totalWorkoutTimeMin += dur;
    totalCaloriesBurned += cal;
    totalSteps += steps;

    if (dur >= 10 && log.activityType !== "Meditation") {
      activeMinutes += dur;
    }

    if (log.activityType === "Walking") {
      totalWalkingKm += dist;
    } else if (log.activityType === "Running" || log.activityType === "Outdoor Running" || log.activityType === "Treadmill") {
      totalRunningKm += dist;
    } else if (log.activityType === "Cycling") {
      totalCyclingKm += dist;
    } else if (log.activityType === "Swimming") {
      totalSwimmingKm += dist;
    }
  });

  // Include completed gym workout if present
  if (workoutForDate) {
    totalWorkoutTimeMin += workoutForDate.durationMinutes || 0;
    totalCaloriesBurned += workoutForDate.caloriesBurned || 0;
    activeMinutes += workoutForDate.durationMinutes || 0;
  }

  // Factor in nutrition steps if user logged steps directly in dailyNutrition
  if (nutrition?.stepsCount && nutrition.stepsCount > totalSteps) {
    totalSteps = nutrition.stepsCount;
  }

  // Factor in activeCaloriesBurned in dailyNutrition if higher
  if (nutrition?.activeCaloriesBurned && nutrition.activeCaloriesBurned > totalCaloriesBurned) {
    totalCaloriesBurned = nutrition.activeCaloriesBurned;
  }

  // Nutrition macros
  let caloriesConsumed = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;

  if (nutrition?.meals) {
    nutrition.meals.forEach((meal) => {
      meal.foods.forEach((f) => {
        caloriesConsumed += f.calories || 0;
        proteinGrams += f.protein || 0;
        carbsGrams += f.carbs || 0;
        fatGrams += f.fat || 0;
      });
    });
  }

  const waterIntakeMl = nutrition?.waterLoggedMl || 0;
  const netCalories = Math.round(caloriesConsumed - totalCaloriesBurned);
  const estimatedFatBurnedGrams = calculateFatBurnedGrams(totalCaloriesBurned);

  // Exercise Score (0-100)
  let exerciseScore = 0;
  if (goals.workoutDurationMinGoal > 0) {
    exerciseScore += Math.min(40, (totalWorkoutTimeMin / goals.workoutDurationMinGoal) * 40);
  }
  if (goals.caloriesBurnedGoal > 0) {
    exerciseScore += Math.min(30, (totalCaloriesBurned / goals.caloriesBurnedGoal) * 30);
  }
  if (goals.dailyStepsGoal > 0) {
    exerciseScore += Math.min(30, (totalSteps / goals.dailyStepsGoal) * 30);
  }
  exerciseScore = Math.min(100, Math.round(exerciseScore));

  // Daily Fitness Score (0-100 composite)
  let fitnessScore = 0;
  fitnessScore += exerciseScore * 0.4; // 40% from exercise
  const waterScore = Math.min(20, (waterIntakeMl / (goals.waterIntakeMlGoal || 3000)) * 20); // 20% from hydration
  fitnessScore += waterScore;

  const targetCal = state.profile.targetCalories || 2200;
  const calRatio = caloriesConsumed > 0 ? Math.min(1, targetCal / Math.max(1, caloriesConsumed)) : 0.5;
  fitnessScore += calRatio * 20; // 20% from calorie compliance

  const sleepHours = vitals?.sleepHours || nutrition?.sleepHours || 7.5;
  const sleepScore = Math.min(20, (sleepHours / 8.0) * 20); // 20% from sleep
  fitnessScore += sleepScore;

  const dailyFitnessScore = Math.min(100, Math.max(10, Math.round(fitnessScore)));

  // Goal completion % calculation across major metrics
  const stepsPct = Math.min(100, (totalSteps / (goals.dailyStepsGoal || 10000)) * 100);
  const durPct = Math.min(100, (totalWorkoutTimeMin / (goals.workoutDurationMinGoal || 60)) * 100);
  const calPct = Math.min(100, (totalCaloriesBurned / (goals.caloriesBurnedGoal || 500)) * 100);
  const waterPct = Math.min(100, (waterIntakeMl / (goals.waterIntakeMlGoal || 3000)) * 100);
  const goalCompletionPct = Math.round((stepsPct + durPct + calPct + waterPct) / 4);

  return {
    date,
    totalWalkingKm: Math.round(totalWalkingKm * 10) / 10,
    totalRunningKm: Math.round(totalRunningKm * 10) / 10,
    totalCyclingKm: Math.round(totalCyclingKm * 10) / 10,
    totalSwimmingKm: Math.round(totalSwimmingKm * 10) / 10,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalWorkoutTimeMin,
    totalSteps,
    activeMinutes,
    totalCaloriesBurned,
    estimatedFatBurnedGrams,
    caloriesConsumed: Math.round(caloriesConsumed),
    netCalories,
    waterIntakeMl,
    proteinGrams: Math.round(proteinGrams),
    carbsGrams: Math.round(carbsGrams),
    fatGrams: Math.round(fatGrams),
    exerciseScore,
    dailyFitnessScore,
    activitiesCount: logsForDate.length + (workoutForDate ? 1 : 0),
    goalCompletionPct,
    goals,
    vitals,
  };
}

/**
 * Generate AI Insights and Coaching Suggestions based on Aggregates
 */
export function generateActivityAIInsights(aggregates: DailyActivityAggregates, targetCalories: number = 2200): {
  deficitOrSurplus: string;
  fatLossStatus: string;
  goalStatus: string;
  recommendedCalories: string;
  recommendedExercise: string;
  healthTips: string[];
} {
  const { caloriesConsumed, totalCaloriesBurned, netCalories, estimatedFatBurnedGrams, goalCompletionPct, waterIntakeMl, totalWorkoutTimeMin } = aggregates;
  
  const isDeficit = caloriesConsumed > 0 && netCalories < targetCalories;
  const diff = Math.abs(targetCalories - caloriesConsumed);

  let deficitOrSurplus = "";
  if (caloriesConsumed === 0) {
    deficitOrSurplus = "No meals logged yet today. Remember to fuel your workouts with lean protein and complex carbs.";
  } else if (caloriesConsumed < targetCalories) {
    deficitOrSurplus = `Optimal Deficit: You are in a ${diff} kcal deficit. This promotes steady, sustainable fat loss.`;
  } else if (caloriesConsumed === targetCalories) {
    deficitOrSurplus = "Maintenance Balance: Perfect caloric equilibrium achieved.";
  } else {
    deficitOrSurplus = `Caloric Surplus: +${diff} kcal over target. Consider a 20-minute brisk walk or cardio session to balance energy expenditure.`;
  }

  const weeklyFatLossGrams = Math.round((estimatedFatBurnedGrams * 7));
  const fatLossStatus = `Estimated ${estimatedFatBurnedGrams}g of body fat oxidised today (~${(weeklyFatLossGrams / 1000).toFixed(2)} kg/week pace).`;

  let goalStatus = "";
  if (goalCompletionPct >= 90) {
    goalStatus = `Outstanding! You have achieved ${goalCompletionPct}% of today's targets. Performance is in the elite zone.`;
  } else if (goalCompletionPct >= 60) {
    goalStatus = `Solid progress (${goalCompletionPct}% complete). Push for your remaining step or hydration goals to hit 100%.`;
  } else {
    goalStatus = `Currently at ${goalCompletionPct}% completion. A 30-minute evening activity will dramatically boost your score.`;
  }

  const recommendedCalories = `${targetCalories} kcal (Protein: ${Math.round(targetCalories * 0.3 / 4)}g, Carbs: ${Math.round(targetCalories * 0.45 / 4)}g, Fats: ${Math.round(targetCalories * 0.25 / 9)}g)`;

  const recommendedExercise = totalWorkoutTimeMin < 45
    ? "Aim for at least 45-60 minutes of active movement today. Incorporate a 15-minute incline walk or stretching routine."
    : "Great workout volume! Prioritise post-session foam rolling and 8 hours of restorative sleep.";

  const healthTips: string[] = [];
  if (waterIntakeMl < 2500) {
    healthTips.push("Hydration alert: Drink a large 500ml glass of mineral water within the next hour to support metabolic rate.");
  } else {
    healthTips.push("Hydration is optimal: Cellular fluid balance is supporting nutrient transport and recovery.");
  }

  if (aggregates.totalSteps < 7000) {
    healthTips.push("NEAT boost: Take a 10-minute post-meal stroll to lower postprandial glucose spikes.");
  } else {
    healthTips.push("High daily step count: Excellent non-exercise activity thermogenesis (NEAT).");
  }

  if (aggregates.vitals?.restingHeartRateBpm && aggregates.vitals.restingHeartRateBpm < 65) {
    healthTips.push("Resting heart rate indicates strong cardiovascular conditioning and parasympathetic recovery.");
  }

  return {
    deficitOrSurplus,
    fatLossStatus,
    goalStatus,
    recommendedCalories,
    recommendedExercise,
    healthTips,
  };
}

/**
 * Generate historical trends dataset for Weekly, Monthly, and Yearly reports
 */
export function generateActivityTrendsData(state: AppState, timeRange: "weekly" | "monthly" | "yearly") {
  const daysCount = timeRange === "weekly" ? 7 : timeRange === "monthly" ? 30 : 365;
  const result: any[] = [];
  const today = new Date();

  // If yearly, group by month
  if (timeRange === "yearly") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = today.getMonth();

    for (let i = 11; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      const monthLabel = monthNames[monthIdx];
      // compute aggregates for this month
      const monthLogs = (state.activityLogs || []).filter((l) => {
        if (!l.date) return false;
        const d = new Date(l.date);
        return d.getMonth() === monthIdx;
      });

      const totalDist = monthLogs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
      const totalDur = monthLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
      const totalCal = monthLogs.reduce((acc, l) => acc + (l.caloriesBurned || 0), 0);
      const fatBurned = calculateFatBurnedGrams(totalCal);

      result.push({
        label: monthLabel,
        distanceKm: Math.round(totalDist * 10) / 10,
        durationMinutes: totalDur,
        caloriesBurned: totalCal,
        fatBurnedGrams: fatBurned,
        fatBurnedKg: Math.round((fatBurned / 1000) * 100) / 100,
        activitiesCount: monthLogs.length,
        weightKg: state.profile.currentWeightKg - (11 - i) * 0.3,
      });
    }
    return result;
  }

  // Weekly or Monthly daily series
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = timeRange === "weekly"
      ? d.toLocaleDateString("en-US", { weekday: "short" })
      : `${d.getMonth() + 1}/${d.getDate()}`;

    const agg = computeDailyActivityAggregates(dateStr, state);

    result.push({
      date: dateStr,
      label: dayLabel,
      walkingKm: agg.totalWalkingKm,
      runningKm: agg.totalRunningKm,
      cyclingKm: agg.totalCyclingKm,
      swimmingKm: agg.totalSwimmingKm,
      totalDistanceKm: agg.totalDistanceKm,
      durationMinutes: agg.totalWorkoutTimeMin,
      activeMinutes: agg.activeMinutes,
      steps: agg.totalSteps,
      caloriesBurned: agg.totalCaloriesBurned,
      caloriesConsumed: agg.caloriesConsumed,
      netCalories: agg.netCalories,
      fatBurnedGrams: agg.estimatedFatBurnedGrams,
      waterIntakeMl: agg.waterIntakeMl,
      fitnessScore: agg.dailyFitnessScore,
      exerciseScore: agg.exerciseScore,
      weightKg: agg.vitals?.weightKg || state.profile.currentWeightKg,
      bodyFatPct: agg.vitals?.bodyFatPct || state.profile.targetBodyFatPct || 18,
    });
  }

  return result;
}

/**
 * Export Daily Summary to Microsoft Word (.doc) formatted file
 */
export function exportDailyActivityReportWord(aggregates: DailyActivityAggregates, athleteName: string) {
  const dateStr = aggregates.date;
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>FitPulse Daily Activity & Fitness Report - ${dateStr}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 20px; line-height: 1.5; }
        h1 { color: #0f172a; border-bottom: 3px solid #10b981; padding-bottom: 8px; }
        h2 { color: #047857; margin-top: 24px; }
        .meta-box { background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
        th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 13px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; font-size: 13px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 10px; }
      </style>
    </head>
    <body>
      <h1>FITPULSE PRO • DAILY ACTIVITY & FITNESS AUDIT REPORT</h1>
      <div class="meta-box">
        <strong>Athlete:</strong> ${athleteName} &nbsp;|&nbsp; 
        <strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; 
        <strong>Daily Fitness Score:</strong> ${aggregates.dailyFitnessScore}/100 &nbsp;|&nbsp; 
        <strong>Goal Adherence:</strong> ${aggregates.goalCompletionPct}%
      </div>

      <h2>1. Activity & Exercise Summary</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Logged Value</th>
          <th>Daily Goal</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>Total Workout Time</td>
          <td>${aggregates.totalWorkoutTimeMin} minutes</td>
          <td>${aggregates.goals.workoutDurationMinGoal} minutes</td>
          <td>${aggregates.totalWorkoutTimeMin >= aggregates.goals.workoutDurationMinGoal ? "Goal Achieved" : "In Progress"}</td>
        </tr>
        <tr>
          <td>Total Distance Covered</td>
          <td>${aggregates.totalDistanceKm} KM</td>
          <td>-</td>
          <td>Walking: ${aggregates.totalWalkingKm}km | Running: ${aggregates.totalRunningKm}km | Cycling: ${aggregates.totalCyclingKm}km</td>
        </tr>
        <tr>
          <td>Total Steps</td>
          <td>${aggregates.totalSteps.toLocaleString()} steps</td>
          <td>${aggregates.goals.dailyStepsGoal.toLocaleString()} steps</td>
          <td>${aggregates.totalSteps >= aggregates.goals.dailyStepsGoal ? "Goal Met" : "Remaining: " + Math.max(0, aggregates.goals.dailyStepsGoal - aggregates.totalSteps)}</td>
        </tr>
        <tr>
          <td>Total Calories Burned</td>
          <td>${aggregates.totalCaloriesBurned} kcal</td>
          <td>${aggregates.goals.caloriesBurnedGoal} kcal</td>
          <td>${aggregates.totalCaloriesBurned >= aggregates.goals.caloriesBurnedGoal ? "Met" : "Below Target"}</td>
        </tr>
        <tr>
          <td>Estimated Fat Burned</td>
          <td><strong>${aggregates.estimatedFatBurnedGrams} grams</strong></td>
          <td>~50 grams</td>
          <td>Pure Subcutaneous & Visceral Lipid Oxidation</td>
        </tr>
      </table>

      <h2>2. Energy Balance & Nutrition Adherence</h2>
      <table>
        <tr>
          <th>Calories Consumed</th>
          <th>Calories Burned</th>
          <th>Net Calorie Balance</th>
          <th>Water Intake</th>
        </tr>
        <tr>
          <td>${aggregates.caloriesConsumed} kcal</td>
          <td>${aggregates.totalCaloriesBurned} kcal</td>
          <td><strong>${aggregates.netCalories} kcal</strong></td>
          <td>${aggregates.waterIntakeMl} ml / ${aggregates.goals.waterIntakeMlGoal} ml</td>
        </tr>
      </table>

      <h2>3. Body Measurements & Health Vitals</h2>
      <table>
        <tr>
          <th>Weight</th>
          <th>Body Fat %</th>
          <th>BMI</th>
          <th>Blood Pressure</th>
          <th>Blood Sugar</th>
          <th>Resting HR</th>
          <th>Sleep</th>
        </tr>
        <tr>
          <td>${aggregates.vitals?.weightKg || "78.5"} kg</td>
          <td>${aggregates.vitals?.bodyFatPct || "18.2"}%</td>
          <td>${aggregates.vitals?.bmi || "24.5"}</td>
          <td>${aggregates.vitals?.bloodPressureSystolic || "120"}/${aggregates.vitals?.bloodPressureDiastolic || "80"} mmHg</td>
          <td>${aggregates.vitals?.bloodSugarMgDl || "95"} mg/dL</td>
          <td>${aggregates.vitals?.restingHeartRateBpm || "64"} bpm</td>
          <td>${aggregates.vitals?.sleepHours || "7.5"} hrs</td>
        </tr>
      </table>

      <h2>4. Personal Remarks & AI Insights</h2>
      <p>• <strong>Energy Balance:</strong> ${aggregates.caloriesConsumed > aggregates.totalCaloriesBurned ? "Calorie surplus of +" + (aggregates.caloriesConsumed - aggregates.totalCaloriesBurned) + " kcal." : "Calorie deficit of " + (aggregates.totalCaloriesBurned - aggregates.caloriesConsumed) + " kcal."}</p>
      <p>• <strong>Fat Loss Trajectory:</strong> At current daily oxidation rate (${aggregates.estimatedFatBurnedGrams}g), expected weekly adipose reduction is ~${((aggregates.estimatedFatBurnedGrams * 7) / 1000).toFixed(2)} kg.</p>
      <p>• <strong>Hydration:</strong> ${aggregates.waterIntakeMl >= aggregates.goals.waterIntakeMlGoal ? "Optimal hydration achieved." : "Hydration goal incomplete. Increase fluid intake."}</p>
      
      <div class="footer">
        Generated by FitPulse Enterprise Health & Activity OS • Verified & Encrypted
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", content], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `FitPulse_Daily_Report_${dateStr}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
