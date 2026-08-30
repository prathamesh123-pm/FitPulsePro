import { AppState, DailyNutritionLog, WorkoutSession, CardioSession, BodyMeasurement } from "../types";

/**
 * Escapes a single CSV field to safely conform with RFC 4180:
 * - Wraps in quotes if it contains quotes, commas, newlines, or carriage returns.
 * - Escapes internal quotes by doubling them (" -> "").
 */
export function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Initiates an automatic browser download of a CSV string with a UTF-8 BOM.
 * The BOM (\uFEFF) ensures Microsoft Excel, Apple Numbers, and Google Sheets
 * open the file with correct UTF-8 character encoding.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a detailed CSV of historical workout and training logs,
 * preserving full session, exercise, and set-by-set telemetry.
 */
export function generateWorkoutsCSV(
  workouts: WorkoutSession[],
  athleteName: string = "Athlete"
): string {
  const headers = [
    "Date",
    "Workout Name",
    "Workout Type",
    "Target Muscle Group",
    "Start Time",
    "End Time",
    "Duration (Minutes)",
    "Calories Burned (kcal)",
    "Session Volume (kg)",
    "Mood",
    "Energy Level (1-10)",
    "Exercise Name",
    "Exercise Muscle Group",
    "Equipment / Machine",
    "Set Number",
    "Set Type",
    "Weight (kg)",
    "Planned Weight (kg)",
    "Reps",
    "Planned Reps",
    "Set Volume (kg)",
    "Completed",
    "Failure Reached",
    "PR Achieved",
    "Exercise Notes",
    "Workout Notes",
  ];

  const rows: string[][] = [];

  // Sort workouts chronologically descending (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return (b.date || "").localeCompare(a.date || "");
  });

  if (sortedWorkouts.length === 0) {
    rows.push([
      new Date().toISOString().split("T")[0],
      "No Workouts Logged Yet",
      "",
      "",
      "",
      "",
      "0",
      "0",
      "0",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "0",
      "0",
      "0",
      "0",
      "0",
      "No",
      "No",
      "No",
      "",
      "Start logging workouts to build your historical training ledger.",
    ]);
  }

  for (const w of sortedWorkouts) {
    // Calculate total session volume
    let totalVolume = 0;
    w.exercises?.forEach((ex) => {
      ex.sets?.forEach((st) => {
        if (st.completed) {
          totalVolume += (Number(st.weightKg) || 0) * (Number(st.reps) || 0);
        }
      });
    });

    if (!w.exercises || w.exercises.length === 0) {
      // Session with no exercises yet - preserve session record
      rows.push([
        w.date || "",
        w.workoutName || "Workout Session",
        w.workoutType || "General",
        w.muscleGroup || "Mixed",
        w.startTime || "",
        w.endTime || "",
        String(w.durationMinutes || 0),
        String(w.caloriesBurned || 0),
        String(totalVolume),
        w.workoutMood || "",
        w.energyLevel !== undefined ? String(w.energyLevel) : "",
        "N/A",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "0",
        w.completed ? "Yes" : "No",
        "No",
        w.isPR ? "Yes" : "No",
        "",
        w.notes || "",
      ]);
      continue;
    }

    for (const ex of w.exercises) {
      if (!ex.sets || ex.sets.length === 0) {
        // Exercise with no sets
        rows.push([
          w.date || "",
          w.workoutName || "Workout Session",
          w.workoutType || "General",
          w.muscleGroup || "Mixed",
          w.startTime || "",
          w.endTime || "",
          String(w.durationMinutes || 0),
          String(w.caloriesBurned || 0),
          String(totalVolume),
          w.workoutMood || "",
          w.energyLevel !== undefined ? String(w.energyLevel) : "",
          ex.exerciseName || "Exercise",
          ex.muscleGroup || "",
          ex.equipment || ex.machineName || "",
          "",
          "",
          "",
          String(ex.plannedWeightKg || 0),
          "",
          String(ex.plannedReps || 0),
          "0",
          "No",
          "No",
          w.isPR ? "Yes" : "No",
          ex.exerciseNotes || "",
          w.notes || "",
        ]);
        continue;
      }

      for (const s of ex.sets) {
        const weight = Number(s.weightKg) || 0;
        const reps = Number(s.reps) || 0;
        const setVol = weight * reps;

        rows.push([
          w.date || "",
          w.workoutName || "Workout Session",
          w.workoutType || "General",
          w.muscleGroup || "Mixed",
          w.startTime || "",
          w.endTime || "",
          String(w.durationMinutes || 0),
          String(w.caloriesBurned || 0),
          String(totalVolume),
          w.workoutMood || "",
          w.energyLevel !== undefined ? String(w.energyLevel) : "",
          ex.exerciseName || "Exercise",
          ex.muscleGroup || "",
          ex.equipment || ex.machineName || "",
          String(s.setNumber || 1),
          s.type || "normal",
          String(weight),
          s.plannedWeightKg !== undefined ? String(s.plannedWeightKg) : "",
          String(reps),
          s.plannedReps !== undefined ? String(s.plannedReps) : "",
          String(setVol),
          s.completed ? "Yes" : "No",
          s.failure ? "Yes" : "No",
          w.isPR ? "Yes" : "No",
          ex.exerciseNotes || s.notes || "",
          w.notes || "",
        ]);
      }
    }
  }

  // Metadata comments in CSV header
  const metadataLines = [
    `# FitPulse Historical Workout Ledger`,
    `# Athlete: ${athleteName}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total Workouts Exported: ${sortedWorkouts.length}`,
  ];

  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));

  return [...metadataLines, headerLine, ...dataLines].join("\r\n");
}

/**
 * Generates a detailed CSV of historical diet and nutrition logs,
 * detailing every meal, food item, caloric and macro breakdown,
 * water hydration, steps, and compliance status.
 */
export function generateDietLogsCSV(
  dailyNutrition: Record<string, DailyNutritionLog>,
  athleteName: string = "Athlete"
): string {
  const headers = [
    "Date",
    "Diet Status",
    "Daily Water Logged (ml)",
    "Daily Steps",
    "Step Calories Burned (kcal)",
    "Active Calories Burned (kcal)",
    "Daily Sleep (Hours)",
    "Meal Type",
    "Planned Time",
    "Actual Time",
    "Meal Completed",
    "Meal Missed",
    "Food Item Name",
    "Quantity",
    "Unit",
    "Serving Size",
    "Calories (kcal)",
    "Protein (g)",
    "Carbohydrates (g)",
    "Fats (g)",
    "Fiber (g)",
    "Sugar (g)",
    "Food Item Notes",
    "Meal Notes",
    "Cheat Meals Count",
    "Cheat Meal Details",
  ];

  const rows: string[][] = [];

  const dates = Object.keys(dailyNutrition).sort().reverse();

  if (dates.length === 0) {
    rows.push([
      new Date().toISOString().split("T")[0],
      "No Diet Logged Yet",
      "0",
      "0",
      "0",
      "0",
      "0",
      "",
      "",
      "",
      "No",
      "No",
      "",
      "0",
      "",
      "",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "",
      "Start logging meals and daily nutrition to build your diet ledger.",
      "0",
      "",
    ]);
  }

  for (const dateKey of dates) {
    const day = dailyNutrition[dateKey];
    if (!day) continue;

    const dietStatus = day.dietStatus || "Diet Followed";
    const waterMl = String(day.waterLoggedMl || 0);
    const steps = String(day.stepsCount || 0);
    const stepCals = String(Math.round((day.stepsCount || 0) * 0.04));
    const activeCals = String(day.activeCaloriesBurned || 0);
    const sleepHrs = String(day.sleepHours || 0);
    const cheatCount = String(day.cheatMeals?.length || 0);
    const cheatDetails = (day.cheatMeals || [])
      .map((c) => `${c.foodName || c.name || "Cheat Meal"} (${c.calories} kcal - ${c.reason || "N/A"})`)
      .join(" | ");

    const meals = day.meals || [];
    let hasLoggedFoods = false;

    for (const meal of meals) {
      if (meal.foods && meal.foods.length > 0) {
        hasLoggedFoods = true;
        for (const food of meal.foods) {
          rows.push([
            dateKey,
            dietStatus,
            waterMl,
            steps,
            stepCals,
            activeCals,
            sleepHrs,
            meal.mealType || "",
            meal.plannedTime || "",
            meal.actualTime || "",
            meal.completed ? "Yes" : "No",
            meal.missed ? "Yes" : "No",
            food.name || "",
            String(food.quantity || 1),
            food.unit || "Serving",
            food.servingSize || `${food.quantity || 1} ${food.unit || "Serving"}`,
            String(food.calories || 0),
            String(food.protein || 0),
            String(food.carbs || 0),
            String(food.fat || 0),
            String(food.fiber || 0),
            String(food.sugar || 0),
            food.notes || "",
            meal.notes || "",
            cheatCount,
            cheatDetails,
          ]);
        }
      } else if (meal.completed || meal.missed || (meal.notes && meal.notes.trim())) {
        // Empty meal slot that was marked completed/missed or has notes
        hasLoggedFoods = true;
        rows.push([
          dateKey,
          dietStatus,
          waterMl,
          steps,
          stepCals,
          activeCals,
          sleepHrs,
          meal.mealType || "",
          meal.plannedTime || "",
          meal.actualTime || "",
          meal.completed ? "Yes" : "No",
          meal.missed ? "Yes" : "No",
          "(No specific food logged)",
          "",
          "",
          "",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "",
          meal.notes || "",
          cheatCount,
          cheatDetails,
        ]);
      }
    }

    // If day had steps, water, or cheat meals logged but no food item rows:
    if (!hasLoggedFoods) {
      rows.push([
        dateKey,
        dietStatus,
        waterMl,
        steps,
        stepCals,
        activeCals,
        sleepHrs,
        "Daily Summary",
        "",
        "",
        "Yes",
        "No",
        "Water & Steps Logged",
        "1",
        "Day",
        "Daily Overview",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "",
        "Day tracking active",
        cheatCount,
        cheatDetails,
      ]);
    }
  }

  const metadataLines = [
    `# FitPulse Historical Diet & Nutrition Ledger`,
    `# Athlete: ${athleteName}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total Days Recorded: ${dates.length}`,
  ];

  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));

  return [...metadataLines, headerLine, ...dataLines].join("\r\n");
}

/**
 * Generates a unified, master historical fitness & diet archive CSV
 * that integrates workouts, meals, cardio, body measurements, and daily summaries
 * chronologically for comprehensive external record keeping.
 */
export function generateMasterFitnessAndDietArchiveCSV(appState: AppState): string {
  const athleteName = appState.profile?.fullName || "Athlete";
  const headers = [
    "Date",
    "Record Category",
    "Activity / Meal / Measure",
    "Sub-Item / Exercise / Food",
    "Detail / Set / Serving",
    "Metric 1",
    "Metric 2",
    "Metric 3",
    "Metric 4",
    "Status / Compliance",
    "Notes & Remarks",
  ];

  const rows: string[][] = [];

  // 1. Workouts
  for (const w of appState.workoutHistory || []) {
    if (!w.exercises || w.exercises.length === 0) {
      rows.push([
        w.date || "",
        "Workout Session",
        w.workoutName || "Workout",
        w.workoutType || "General",
        w.muscleGroup || "Mixed",
        `${w.durationMinutes || 0} mins`,
        `${w.caloriesBurned || 0} kcal`,
        w.workoutMood || "",
        "",
        w.completed ? "Completed" : "Incomplete",
        w.notes || "",
      ]);
      continue;
    }

    for (const ex of w.exercises) {
      if (!ex.sets || ex.sets.length === 0) {
        rows.push([
          w.date || "",
          "Workout Exercise",
          w.workoutName || "Workout",
          ex.exerciseName || "Exercise",
          ex.muscleGroup || "",
          `${ex.plannedSets || 0} sets`,
          `${ex.plannedReps || 0} reps`,
          `${ex.plannedWeightKg || 0} kg`,
          "",
          w.completed ? "Completed" : "Incomplete",
          ex.exerciseNotes || w.notes || "",
        ]);
        continue;
      }

      for (const s of ex.sets) {
        const weight = Number(s.weightKg) || 0;
        const reps = Number(s.reps) || 0;
        const vol = weight * reps;

        rows.push([
          w.date || "",
          "Workout Set",
          w.workoutName || "Workout",
          ex.exerciseName || "Exercise",
          `Set ${s.setNumber || 1} (${s.type || "normal"})`,
          `${weight} kg`,
          `${reps} reps`,
          `${vol} kg volume`,
          s.failure ? "Failure" : "Clean",
          s.completed ? "Completed" : "Missed",
          s.notes || ex.exerciseNotes || w.notes || "",
        ]);
      }
    }
  }

  // 2. Diet & Nutrition
  const dates = Object.keys(appState.dailyNutrition || {}).sort().reverse();
  for (const d of dates) {
    const day = appState.dailyNutrition[d];
    if (!day) continue;

    // Daily Macro and Hydration summary row
    rows.push([
      d,
      "Daily Health & Steps",
      "Daily Overview",
      "Hydration & Steps",
      `Diet: ${day.dietStatus || "Followed"}`,
      `${day.waterLoggedMl || 0} ml water`,
      `${day.stepsCount || 0} steps`,
      `${day.activeCaloriesBurned || 0} active kcal`,
      `${day.sleepHours || 0} hrs sleep`,
      day.dietStatus || "Followed",
      `Cheat meals logged: ${day.cheatMeals?.length || 0}`,
    ]);

    for (const meal of day.meals || []) {
      for (const food of meal.foods || []) {
        rows.push([
          d,
          "Diet Meal Food",
          meal.mealType || "Meal",
          food.name || "Food Item",
          `${food.quantity || 1} ${food.unit || "Serving"} (${food.servingSize || ""})`,
          `${food.calories || 0} kcal`,
          `${food.protein || 0}g Protein`,
          `${food.carbs || 0}g Carbs`,
          `${food.fat || 0}g Fat`,
          meal.completed ? "Meal Followed" : meal.missed ? "Meal Missed" : "Pending",
          food.notes || meal.notes || "",
        ]);
      }
    }

    for (const cheat of day.cheatMeals || []) {
      rows.push([
        d,
        "Diet Cheat Meal",
        "Cheat Meal",
        cheat.foodName || cheat.name || "Cheat Item",
        cheat.reason || "Indulgence",
        `${cheat.calories || 0} kcal`,
        "",
        "",
        "",
        "Cheat Logged",
        `Burn plan: ${cheat.burnPlan || "N/A"}. Notes: ${cheat.notes || ""}`,
      ]);
    }
  }

  // 3. Cardio & Activity Logs
  for (const c of appState.cardioSessions || []) {
    rows.push([
      c.date || "",
      "Cardio Session",
      c.type || "Cardio",
      `${c.distanceKm || 0} km`,
      `${c.durationMinutes || 0} minutes`,
      `${c.caloriesBurned || 0} kcal`,
      "",
      "",
      "",
      "Completed",
      c.notes || "",
    ]);
  }

  for (const a of appState.activityLogs || []) {
    rows.push([
      a.date || "",
      "Activity Tracker",
      a.activityType || "Activity",
      `${a.distanceKm || 0} km`,
      `${a.durationMinutes || 0} minutes`,
      `${a.caloriesBurned || 0} kcal`,
      a.avgSpeedKmh ? `${a.avgSpeedKmh} km/h` : "",
      a.heartRateBpm ? `${a.heartRateBpm} bpm` : "",
      "",
      "Logged",
      a.routeNotes || "",
    ]);
  }

  // 4. Body Measurements
  for (const m of appState.measurements || []) {
    rows.push([
      m.date || "",
      "Body Measurement",
      "Anthropometry",
      `Weight: ${m.weightKg} kg`,
      `BMI: ${m.bmi || "N/A"}`,
      `Body Fat: ${m.bodyFatPct || 0}%`,
      `Chest: ${m.chestCm || 0}cm`,
      `Waist: ${m.waistCm || 0}cm`,
      `Arms: ${m.leftArmCm || 0}cm`,
      "Recorded",
      m.notes || "",
    ]);
  }

  // Sort all combined rows by Date descending
  rows.sort((a, b) => (b[0] || "").localeCompare(a[0] || ""));

  const metadataLines = [
    `# FitPulse Master Historical Fitness & Diet Archive`,
    `# Athlete: ${athleteName}`,
    `# Current Weight: ${appState.profile?.currentWeightKg || 0} kg | Target: ${appState.profile?.targetWeightKg || 0} kg`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total Historical Records: ${rows.length}`,
  ];

  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));

  return [...metadataLines, headerLine, ...dataLines].join("\r\n");
}

/**
 * High-level export functions that generate CSVs and prompt the user's browser
 * to download the respective files for external record keeping.
 */

export function exportWorkoutsToCSV(
  workouts: WorkoutSession[],
  athleteName?: string
): void {
  const csvString = generateWorkoutsCSV(workouts, athleteName);
  const today = new Date().toISOString().split("T")[0];
  downloadCSV(`FitPulse_Workout_Logs_${today}.csv`, csvString);
}

export function exportDietLogsToCSV(
  dailyNutrition: Record<string, DailyNutritionLog>,
  athleteName?: string
): void {
  const csvString = generateDietLogsCSV(dailyNutrition, athleteName);
  const today = new Date().toISOString().split("T")[0];
  downloadCSV(`FitPulse_Diet_Nutrition_Logs_${today}.csv`, csvString);
}

export function exportMasterArchiveToCSV(appState: AppState): void {
  const csvString = generateMasterFitnessAndDietArchiveCSV(appState);
  const today = new Date().toISOString().split("T")[0];
  downloadCSV(`FitPulse_Master_Fitness_and_Diet_Archive_${today}.csv`, csvString);
}
