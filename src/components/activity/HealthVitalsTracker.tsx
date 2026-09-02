import React, { useState, useEffect } from "react";
import {
  Heart,
  Activity,
  Droplets,
  Utensils,
  Moon,
  Scale,
  Percent,
  CheckCircle2,
  Sparkles,
  Save,
  Coffee,
  Sun,
  Apple,
} from "lucide-react";
import { AppState, DailyNutritionLog, HealthVitalsLog } from "../../types";

interface HealthVitalsTrackerProps {
  date: string;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const HealthVitalsTracker: React.FC<HealthVitalsTrackerProps> = ({
  date,
  state,
  onUpdateState,
  onNotify,
}) => {
  const existingVitals: HealthVitalsLog = state.healthVitals?.[date] || {
    date,
    weightKg: state.profile.currentWeightKg || 78.5,
    bodyFatPct: state.profile.targetBodyFatPct || 18.2,
    bmi: 24.5,
    waistCm: 84,
    chestCm: 104,
    hipCm: 98,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bloodSugarMgDl: 95,
    restingHeartRateBpm: 65,
    sleepHours: 7.5,
    notes: "",
  };

  const existingNutrition: DailyNutritionLog = state.dailyNutrition?.[date] || {
    date,
    waterLoggedMl: 2600,
    stepsCount: 8420,
    activeCaloriesBurned: 450,
    cheatMeals: [],
    meals: [],
  };

  // State for Health Vitals
  const [weightKg, setWeightKg] = useState<number>(existingVitals.weightKg || state.profile.currentWeightKg || 78.5);
  const [bodyFatPct, setBodyFatPct] = useState<number>(existingVitals.bodyFatPct || 18.2);
  const [waistCm, setWaistCm] = useState<number>(existingVitals.waistCm || 84);
  const [chestCm, setChestCm] = useState<number>(existingVitals.chestCm || 104);
  const [hipCm, setHipCm] = useState<number>(existingVitals.hipCm || 98);
  const [bpSystolic, setBpSystolic] = useState<number>(existingVitals.bloodPressureSystolic || 120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(existingVitals.bloodPressureDiastolic || 80);
  const [bloodSugar, setBloodSugar] = useState<number>(existingVitals.bloodSugarMgDl || 95);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(existingVitals.restingHeartRateBpm || 65);
  const [sleepHours, setSleepHours] = useState<number>(existingVitals.sleepHours || 7.5);
  const [vitalsNotes, setVitalsNotes] = useState<string>(existingVitals.notes || "");

  // Auto-calculated BMI from user profile height in cm
  const userHeightM = (state.profile.heightCm || 178) / 100;
  const bmi = Math.round((weightKg / (userHeightM * userHeightM)) * 10) / 10;

  // Nutrition Quick Log State
  // Calculate existing macros if meals exist
  let initCalories = 0;
  let initProtein = 0;
  let initCarbs = 0;
  let initFat = 0;
  if (existingNutrition.meals) {
    existingNutrition.meals.forEach((m) => {
      m.foods.forEach((f) => {
        initCalories += f.calories || 0;
        initProtein += f.protein || 0;
        initCarbs += f.carbs || 0;
        initFat += f.fat || 0;
      });
    });
  }

  const [breakfastCal, setBreakfastCal] = useState<number>(550);
  const [lunchCal, setLunchCal] = useState<number>(680);
  const [dinnerCal, setDinnerCal] = useState<number>(620);
  const [snacksCal, setSnacksCal] = useState<number>(270);
  const [waterMl, setWaterMl] = useState<number>(existingNutrition.waterLoggedMl || 2800);
  const [proteinGrams, setProteinGrams] = useState<number>(initProtein > 0 ? initProtein : 155);
  const [carbsGrams, setCarbsGrams] = useState<number>(initCarbs > 0 ? initCarbs : 210);
  const [fatGrams, setFatGrams] = useState<number>(initFat > 0 ? initFat : 62);

  const totalCaloriesConsumed = breakfastCal + lunchCal + dinnerCal + snacksCal;

  // Save Health Vitals
  const handleSaveVitals = () => {
    const updatedVitals: HealthVitalsLog = {
      date,
      weightKg,
      bodyFatPct,
      bmi,
      waistCm,
      chestCm,
      hipCm,
      bloodPressureSystolic: bpSystolic,
      bloodPressureDiastolic: bpDiastolic,
      bloodSugarMgDl: bloodSugar,
      restingHeartRateBpm: restingHeartRate,
      sleepHours,
      notes: vitalsNotes,
    };

    onUpdateState((prev) => {
      const existingHealthVitals = prev.healthVitals || {};
      const newHealthVitals = { ...existingHealthVitals, [date]: updatedVitals };

      // Also append measurement entry if date doesn't exist
      const existingMeasurements = prev.measurements || [];
      const hasDateMeasurement = existingMeasurements.some((m) => m.date === date);
      const newMeasurements = hasDateMeasurement
        ? existingMeasurements.map((m) =>
            m.date === date
              ? {
                  ...m,
                  weightKg,
                  bodyFatPercentage: bodyFatPct,
                  waistCm,
                  chestCm,
                  hipCm,
                  restingHeartRate,
                  bloodPressure: `${bpSystolic}/${bpDiastolic}`,
                  bloodSugarFasting: bloodSugar,
                }
              : m
          )
        : [
            ...existingMeasurements,
            {
              id: `meas-${date}`,
              date,
              weightKg,
              bodyFatPercentage: bodyFatPct,
              waistCm,
              chestCm,
              hipCm,
              restingHeartRate,
              bloodPressure: `${bpSystolic}/${bpDiastolic}`,
              bloodSugarFasting: bloodSugar,
              notes: vitalsNotes,
            },
          ];

      return {
        ...prev,
        healthVitals: newHealthVitals,
        measurements: newMeasurements,
        profile: {
          ...prev.profile,
          currentWeightKg: weightKg,
        },
      };
    });

    onNotify("Vitals Updated", `Health measurements and vitals for ${date} saved.`, "success");
  };

  // Save Nutrition Tracking
  const handleSaveNutrition = () => {
    onUpdateState((prev) => {
      const currentDayNutr = prev.dailyNutrition?.[date] || {
        date,
        waterLoggedMl: waterMl,
        stepsCount: 0,
        activeCaloriesBurned: 0,
        cheatMeals: [],
        meals: [],
      };

      const updatedMeals = [
        {
          id: `m-b-${date}`,
          mealType: "Breakfast",
          plannedTime: "08:15",
          actualTime: "08:30",
          completed: true,
          missed: false,
          notes: "Breakfast tracking",
          foods: [
            {
              id: `f-b-${date}`,
              name: "Breakfast Combo",
              servingSize: "1 meal",
              quantity: 1,
              calories: breakfastCal,
              protein: Math.round(proteinGrams * 0.3),
              carbs: Math.round(carbsGrams * 0.35),
              fat: Math.round(fatGrams * 0.25),
              fiber: 6,
            },
          ],
        },
        {
          id: `m-l-${date}`,
          mealType: "Lunch",
          plannedTime: "13:00",
          actualTime: "13:15",
          completed: true,
          missed: false,
          notes: "Lunch tracking",
          foods: [
            {
              id: `f-l-${date}`,
              name: "Lunch Bowl",
              servingSize: "1 meal",
              quantity: 1,
              calories: lunchCal,
              protein: Math.round(proteinGrams * 0.35),
              carbs: Math.round(carbsGrams * 0.4),
              fat: Math.round(fatGrams * 0.4),
              fiber: 8,
            },
          ],
        },
        {
          id: `m-d-${date}`,
          mealType: "Dinner",
          plannedTime: "20:00",
          actualTime: "20:30",
          completed: true,
          missed: false,
          notes: "Dinner tracking",
          foods: [
            {
              id: `f-d-${date}`,
              name: "Dinner Course",
              servingSize: "1 meal",
              quantity: 1,
              calories: dinnerCal,
              protein: Math.round(proteinGrams * 0.25),
              carbs: Math.round(carbsGrams * 0.15),
              fat: Math.round(fatGrams * 0.25),
              fiber: 7,
            },
          ],
        },
        {
          id: `m-s-${date}`,
          mealType: "Evening Snack",
          plannedTime: "17:00",
          actualTime: "17:15",
          completed: true,
          missed: false,
          notes: "Snacks tracking",
          foods: [
            {
              id: `f-s-${date}`,
              name: "Healthy Snack",
              servingSize: "1 serving",
              quantity: 1,
              calories: snacksCal,
              protein: Math.round(proteinGrams * 0.1),
              carbs: Math.round(carbsGrams * 0.1),
              fat: Math.round(fatGrams * 0.1),
              fiber: 2,
            },
          ],
        },
      ];

      return {
        ...prev,
        dailyNutrition: {
          ...prev.dailyNutrition,
          [date]: {
            ...currentDayNutr,
            waterLoggedMl: waterMl,
            sleepHours,
            meals: updatedMeals,
          },
        },
      };
    });

    onNotify("Nutrition Logged", `Logged ${totalCaloriesConsumed} kcal & ${waterMl}ml water for ${date}.`, "success");
  };

  return (
    <div className="space-y-6">
      {/* 1. NUTRITION TRACKING MODULE */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Nutrition & Hydration Tracking</h3>
              <p className="text-xs text-slate-400">Log meals, macronutrients, and water intake for {date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Total Consumed: {totalCaloriesConsumed} kcal
            </span>
          </div>
        </div>

        {/* Meal Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Coffee className="h-3.5 w-3.5 text-amber-400" /> Breakfast</span>
              <span className="font-bold text-slate-200">{breakfastCal} kcal</span>
            </div>
            <input
              type="number"
              min={0}
              value={breakfastCal}
              onChange={(e) => setBreakfastCal(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-yellow-400" /> Lunch</span>
              <span className="font-bold text-slate-200">{lunchCal} kcal</span>
            </div>
            <input
              type="number"
              min={0}
              value={lunchCal}
              onChange={(e) => setLunchCal(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Utensils className="h-3.5 w-3.5 text-emerald-400" /> Dinner</span>
              <span className="font-bold text-slate-200">{dinnerCal} kcal</span>
            </div>
            <input
              type="number"
              min={0}
              value={dinnerCal}
              onChange={(e) => setDinnerCal(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Apple className="h-3.5 w-3.5 text-rose-400" /> Snacks</span>
              <span className="font-bold text-slate-200">{snacksCal} kcal</span>
            </div>
            <input
              type="number"
              min={0}
              value={snacksCal}
              onChange={(e) => setSnacksCal(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>
        </div>

        {/* Water & Macros Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-cyan-400" /> Water Intake (ml)
            </label>
            <input
              type="number"
              step={100}
              min={0}
              value={waterMl}
              onChange={(e) => setWaterMl(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Protein (g)
            </label>
            <input
              type="number"
              min={0}
              value={proteinGrams}
              onChange={(e) => setProteinGrams(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Carbohydrates (g)
            </label>
            <input
              type="number"
              min={0}
              value={carbsGrams}
              onChange={(e) => setCarbsGrams(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Dietary Fat (g)
            </label>
            <input
              type="number"
              min={0}
              value={fatGrams}
              onChange={(e) => setFatGrams(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveNutrition}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Nutrition & Water Log</span>
          </button>
        </div>
      </div>

      {/* 2. HEALTH VITALS & BODY MEASUREMENTS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Health Vitals & Anthropometrics</h3>
              <p className="text-xs text-slate-400">Body measurements, blood pressure, sugar, heart rate & sleep</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Calculated BMI: {bmi}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Weight */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-emerald-400" /> Weight (kg)
            </label>
            <input
              type="number"
              step={0.1}
              min={30}
              max={250}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Body Fat % */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 text-amber-400" /> Body Fat %
            </label>
            <input
              type="number"
              step={0.1}
              min={3}
              max={60}
              value={bodyFatPct}
              onChange={(e) => setBodyFatPct(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Waist (cm) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400">Waist Circumference (cm)</label>
            <input
              type="number"
              step={0.5}
              min={40}
              max={200}
              value={waistCm}
              onChange={(e) => setWaistCm(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Chest (cm) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400">Chest Circumference (cm)</label>
            <input
              type="number"
              step={0.5}
              min={50}
              max={200}
              value={chestCm}
              onChange={(e) => setChestCm(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Hip (cm) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400">Hip Circumference (cm)</label>
            <input
              type="number"
              step={0.5}
              min={50}
              max={200}
              value={hipCm}
              onChange={(e) => setHipCm(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Blood Pressure */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-rose-400" /> Blood Pressure (mmHg)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={70}
                max={220}
                value={bpSystolic}
                onChange={(e) => setBpSystolic(Number(e.target.value))}
                placeholder="Sys"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-slate-500">/</span>
              <input
                type="number"
                min={40}
                max={140}
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(Number(e.target.value))}
                placeholder="Dia"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
              />
            </div>
          </div>

          {/* Blood Sugar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400">Blood Sugar (mg/dL)</label>
            <input
              type="number"
              min={40}
              max={400}
              value={bloodSugar}
              onChange={(e) => setBloodSugar(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          {/* Resting Heart Rate */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-teal-400" /> Resting Heart Rate (BPM)
            </label>
            <input
              type="number"
              min={35}
              max={150}
              value={restingHeartRate}
              onChange={(e) => setRestingHeartRate(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>
        </div>

        {/* Sleep and Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-400" /> Sleep Duration (Hours)
            </label>
            <input
              type="number"
              step={0.5}
              min={1}
              max={16}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
            />
          </div>

          <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400">Clinical / Vitals Notes</label>
            <input
              type="text"
              value={vitalsNotes}
              onChange={(e) => setVitalsNotes(e.target.value)}
              placeholder="e.g. Normal BP, rested well, resting HR lower than last week..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveVitals}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Health Vitals & Measurements</span>
          </button>
        </div>
      </div>
    </div>
  );
};
