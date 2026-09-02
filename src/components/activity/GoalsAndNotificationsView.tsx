import React, { useState } from "react";
import {
  Target,
  Bell,
  CheckCircle2,
  Save,
  Footprints,
  Activity,
  Bike,
  Waves,
  Timer,
  Flame,
  Droplets,
  Scale,
  Percent,
  Clock,
  Volume2,
} from "lucide-react";
import { AppState, DailyFitnessGoals } from "../../types";

interface GoalsAndNotificationsViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const GoalsAndNotificationsView: React.FC<GoalsAndNotificationsViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const currentGoals: DailyFitnessGoals = state.fitnessGoals || {
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

  const [stepsGoal, setStepsGoal] = useState<number>(currentGoals.dailyStepsGoal);
  const [walkingGoal, setWalkingGoal] = useState<number>(currentGoals.walkingDistanceKmGoal);
  const [runningGoal, setRunningGoal] = useState<number>(currentGoals.runningDistanceKmGoal);
  const [cyclingGoal, setCyclingGoal] = useState<number>(currentGoals.cyclingDistanceKmGoal);
  const [swimmingGoal, setSwimmingGoal] = useState<number>(currentGoals.swimmingDistanceKmGoal);
  const [workoutMinGoal, setWorkoutMinGoal] = useState<number>(currentGoals.workoutDurationMinGoal);
  const [caloriesGoal, setCaloriesGoal] = useState<number>(currentGoals.caloriesBurnedGoal);
  const [waterGoal, setWaterGoal] = useState<number>(currentGoals.waterIntakeMlGoal);
  const [weightTarget, setWeightTarget] = useState<number>(currentGoals.weightLossTargetKg || 75.0);
  const [fatTarget, setFatTarget] = useState<number>(currentGoals.fatLossTargetPct || 15.0);

  // Notification toggles & schedules
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [workoutTime, setWorkoutTime] = useState("07:00");
  const [waterReminder, setWaterReminder] = useState(true);
  const [waterFrequency, setWaterFrequency] = useState("2"); // every 2 hours
  const [mealReminder, setMealReminder] = useState(true);
  const [dailyGoalReminder, setDailyGoalReminder] = useState(true);
  const [dailyGoalTime, setDailyGoalTime] = useState("20:00");
  const [completionReminder, setCompletionReminder] = useState(true);

  const handleSaveGoals = () => {
    const updated: DailyFitnessGoals = {
      dailyStepsGoal: Number(stepsGoal) || 10000,
      walkingDistanceKmGoal: Number(walkingGoal) || 5.0,
      runningDistanceKmGoal: Number(runningGoal) || 5.0,
      cyclingDistanceKmGoal: Number(cyclingGoal) || 15.0,
      swimmingDistanceKmGoal: Number(swimmingGoal) || 1.0,
      workoutDurationMinGoal: Number(workoutMinGoal) || 60,
      caloriesBurnedGoal: Number(caloriesGoal) || 550,
      waterIntakeMlGoal: Number(waterGoal) || 3200,
      weightLossTargetKg: Number(weightTarget) || 75.0,
      fatLossTargetPct: Number(fatTarget) || 15.0,
    };

    onUpdateState((prev) => ({
      ...prev,
      fitnessGoals: updated,
    }));

    onNotify("Goals Configured", "Daily fitness targets and thresholds successfully updated.", "success");
  };

  const handleTestNotification = (title: string, message: string) => {
    onNotify(title, message, "info");
  };

  return (
    <div className="space-y-6">
      {/* 1. DAILY FITNESS GOALS SETUP */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Daily Fitness Target Benchmarks</h3>
              <p className="text-xs text-slate-400">Configure daily distance, movement, and body composition targets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveGoals}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save All Goals</span>
          </button>
        </div>

        {/* 10 Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Steps */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Footprints className="h-4 w-4 text-emerald-400" /> Daily Steps Goal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={500}
                min={1000}
                max={50000}
                value={stepsGoal}
                onChange={(e) => setStepsGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">steps</span>
            </div>
          </div>

          {/* Walking Distance */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Footprints className="h-4 w-4 text-teal-400" /> Walking Distance Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={50}
                value={walkingGoal}
                onChange={(e) => setWalkingGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">KM</span>
            </div>
          </div>

          {/* Running Distance */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-400" /> Running Distance Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={0}
                max={50}
                value={runningGoal}
                onChange={(e) => setRunningGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">KM</span>
            </div>
          </div>

          {/* Cycling Distance */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Bike className="h-4 w-4 text-sky-400" /> Cycling Distance Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={1}
                min={0}
                max={150}
                value={cyclingGoal}
                onChange={(e) => setCyclingGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">KM</span>
            </div>
          </div>

          {/* Swimming Distance */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-cyan-400" /> Swimming Distance Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.1}
                min={0}
                max={20}
                value={swimmingGoal}
                onChange={(e) => setSwimmingGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">KM</span>
            </div>
          </div>

          {/* Workout Duration */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Timer className="h-4 w-4 text-purple-400" /> Workout Time Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={5}
                min={10}
                max={300}
                value={workoutMinGoal}
                onChange={(e) => setWorkoutMinGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">mins</span>
            </div>
          </div>

          {/* Calories Burned */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-400" /> Calories Burned Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={50}
                min={100}
                max={3000}
                value={caloriesGoal}
                onChange={(e) => setCaloriesGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">kcal</span>
            </div>
          </div>

          {/* Water Intake */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-blue-400" /> Water Intake Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={200}
                min={1000}
                max={8000}
                value={waterGoal}
                onChange={(e) => setWaterGoal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">ml</span>
            </div>
          </div>

          {/* Weight Loss Target */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-indigo-400" /> Target Body Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={40}
                max={200}
                value={weightTarget}
                onChange={(e) => setWeightTarget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">kg</span>
            </div>
          </div>

          {/* Fat Loss Target */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-emerald-400" /> Target Body Fat %
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={5}
                max={40}
                value={fatTarget}
                onChange={(e) => setFatTarget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-slate-400 font-medium">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NOTIFICATIONS & REMINDERS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Smart Activity Notifications & Reminders</h3>
            <p className="text-xs text-slate-400">Automated cadence alerts for training, hydration, and goal checks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Workout Reminder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" /> Daily Workout Reminder
              </div>
              <p className="text-[11px] text-slate-400">Scheduled prompt to start daily training session</p>
              <div className="pt-1">
                <input
                  type="time"
                  value={workoutTime}
                  onChange={(e) => setWorkoutTime(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input
                type="checkbox"
                checked={workoutReminder}
                onChange={(e) => setWorkoutReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleTestNotification("Workout Reminder", `Time for your daily workout! Let's hit the target today.`)}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* Water Reminder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-cyan-400" /> Hydration Interval Reminder
              </div>
              <p className="text-[11px] text-slate-400">Periodic alert to drink 250ml water</p>
              <div className="pt-1 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Every</span>
                <select
                  value={waterFrequency}
                  onChange={(e) => setWaterFrequency(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="3">3 Hours</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input
                type="checkbox"
                checked={waterReminder}
                onChange={(e) => setWaterReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleTestNotification("Hydration Check", "Time to hydrate! Drink a glass of water to maintain metabolic rate.")}
                className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* Meal Reminder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Meal & Macro Logging Reminder
              </div>
              <p className="text-[11px] text-slate-400">Timely prompts after Breakfast, Lunch, and Dinner</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input
                type="checkbox"
                checked={mealReminder}
                onChange={(e) => setMealReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleTestNotification("Meal Log Reminder", "Don't forget to log your lunch and track your protein intake.")}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* Daily Goal Reminder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-rose-400" /> Evening Daily Goal Check
              </div>
              <p className="text-[11px] text-slate-400">Review remaining steps and calories before bedtime</p>
              <div className="pt-1">
                <input
                  type="time"
                  value={dailyGoalTime}
                  onChange={(e) => setDailyGoalTime(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input
                type="checkbox"
                checked={dailyGoalReminder}
                onChange={(e) => setDailyGoalReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleTestNotification("Daily Goal Status", "You are at 84% of your daily steps! A 15-min evening stroll will complete it.")}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            </div>
          </div>

          {/* Activity Completion Reminder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between sm:col-span-2">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Activity Completion Celebration
              </div>
              <p className="text-[11px] text-slate-400">Instant congratulatory pop-up upon hitting 10,000 steps or completing workouts</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={completionReminder}
                onChange={(e) => setCompletionReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleTestNotification("Target Achieved! 🏆", "Congratulations! You completed your 10,000 steps goal for the day.")}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
