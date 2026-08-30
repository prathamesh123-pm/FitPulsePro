import { useState, useMemo } from "react";
import {
  Calculator,
  Scale,
  Flame,
  Activity,
  Droplets,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  Save,
  Check,
  ChevronRight,
  Sliders,
  Target,
  Percent,
} from "lucide-react";
import { UserProfile, HealthCalculations, Gender, ActivityLevel, FitnessGoal } from "../types";

interface FitnessCalculatorsViewProps {
  profile: UserProfile;
  healthMetrics: HealthCalculations;
  onUpdateProfile: (p: UserProfile) => void;
}

type CalculatorToolId =
  | "overview"
  | "bmi"
  | "bmr"
  | "tdee"
  | "ibw"
  | "lbm"
  | "bodyfat"
  | "ffmi"
  | "oneRepMax"
  | "dailyCalories"
  | "deficit"
  | "surplus"
  | "water"
  | "macro"
  | "targetWeight"
  | "goalDate";

export function FitnessCalculatorsView({
  profile,
  healthMetrics,
  onUpdateProfile,
}: FitnessCalculatorsViewProps) {
  // Master Inputs State (Pre-filled from user profile)
  const [age, setAge] = useState<number>(profile.age || 26);
  const [gender, setGender] = useState<Gender>(profile.gender || "Male");
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 178);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(profile.currentWeightKg || 78.5);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.goalWeightKg || 72.0);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || "Moderately Active");
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState<number>(profile.workoutDaysPerWeek || 4);

  // Deep-dive specific calculator inputs
  const [selectedTool, setSelectedTool] = useState<CalculatorToolId>("overview");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 1RM Inputs
  const [ormWeight, setOrmWeight] = useState<number>(85);
  const [ormReps, setOrmReps] = useState<number>(6);

  // Body Fat (Navy Method) Inputs
  const [neckCm, setNeckCm] = useState<number>(38);
  const [waistCm, setWaistCm] = useState<number>(84);
  const [hipCm, setHipCm] = useState<number>(98); // for females

  // Deficit / Surplus Slider
  const [customDeficit, setCustomDeficit] = useState<number>(500);
  const [customSurplus, setCustomSurplus] = useState<number>(350);

  // Macro Preset
  const [macroPreset, setMacroPreset] = useState<"cutting" | "balanced" | "bulking" | "keto" | "custom">("cutting");
  const [customProteinPct, setCustomProteinPct] = useState<number>(35);
  const [customCarbsPct, setCustomCarbsPct] = useState<number>(40);
  const [customFatPct, setCustomFatPct] = useState<number>(25);

  // Water inputs
  const [workoutMinutesPerDay, setWorkoutMinutesPerDay] = useState<number>(60);
  const [isHotClimate, setIsHotClimate] = useState<boolean>(true);

  // Target Body Fat for Target Weight Calculator
  const [currentBfEstimate, setCurrentBfEstimate] = useState<number>(18);
  const [targetBfEstimate, setTargetBfEstimate] = useState<number>(12);

  // Universal Calculations based on current input values
  const calculations = useMemo(() => {
    const heightM = heightCm / 100;
    const bmi = currentWeightKg / (heightM * heightM);

    let bmiStatus: "Underweight" | "Normal" | "Overweight" | "Obese Class I" | "Obese Class II" | "Obese Class III" = "Normal";
    if (bmi < 18.5) bmiStatus = "Underweight";
    else if (bmi < 25) bmiStatus = "Normal";
    else if (bmi < 30) bmiStatus = "Overweight";
    else if (bmi < 35) bmiStatus = "Obese Class I";
    else if (bmi < 40) bmiStatus = "Obese Class II";
    else bmiStatus = "Obese Class III";

    // Ideal Weight Range based on healthy BMI 18.5 - 24.9
    const healthyWeightMin = 18.5 * (heightM * heightM);
    const healthyWeightMax = 24.9 * (heightM * heightM);

    // BMR (Mifflin-St Jeor)
    const isMale = gender === "Male";
    const bmrMifflin = isMale
      ? 10 * currentWeightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * currentWeightKg + 6.25 * heightCm - 5 * age - 161;

    // BMR (Harris-Benedict revised)
    const bmrHarris = isMale
      ? 88.362 + 13.397 * currentWeightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * currentWeightKg + 3.098 * heightCm - 4.33 * age;

    // Activity Multiplier
    let activityMultiplier = 1.2;
    if (activityLevel === "Lightly Active") activityMultiplier = 1.375;
    else if (activityLevel === "Moderately Active") activityMultiplier = 1.55;
    else if (activityLevel === "Very Active") activityMultiplier = 1.725;
    else if (activityLevel === "Extra Active") activityMultiplier = 1.9;

    // Fine-tune with workout days if specified
    const dayBonus = Math.max(0, (workoutDaysPerWeek - 3) * 0.025);
    const effectiveMultiplier = Math.min(2.0, activityMultiplier + dayBonus);
    const tdee = Math.round(bmrMifflin * effectiveMultiplier);

    // Daily Calories Targets
    const calMaintenance = tdee;
    const calLossMild = tdee - 250;
    const calLoss = tdee - 500;
    const calLossAggressive = tdee - 750;
    const calGainLean = tdee + 250;
    const calGain = tdee + 500;

    // Ideal Body Weight Formulas (in inches: heightInches = heightCm / 2.54)
    const heightInches = heightCm / 2.54;
    const inchesOver60 = Math.max(0, heightInches - 60);

    const devineIBW = isMale ? 50.0 + 2.3 * inchesOver60 : 45.5 + 2.3 * inchesOver60;
    const robinsonIBW = isMale ? 52.0 + 1.9 * inchesOver60 : 49.0 + 1.7 * inchesOver60;
    const millerIBW = isMale ? 56.2 + 1.41 * inchesOver60 : 53.1 + 1.36 * inchesOver60;
    const hamwiIBW = isMale ? 48.0 + 2.7 * inchesOver60 : 45.5 + 2.2 * inchesOver60;
    const consensusIBW = (devineIBW + robinsonIBW + millerIBW + hamwiIBW) / 4;

    // Lean Body Mass (Boer, James, Hume)
    const lbmBoer = isMale
      ? 0.407 * currentWeightKg + 0.267 * heightCm - 19.2
      : 0.252 * currentWeightKg + 0.473 * heightCm - 48.3;
    const lbmJames = isMale
      ? 1.1 * currentWeightKg - 128 * Math.pow(currentWeightKg / heightCm, 2)
      : 1.07 * currentWeightKg - 148 * Math.pow(currentWeightKg / heightCm, 2);
    const lbmHume = isMale
      ? 0.3281 * currentWeightKg + 0.33929 * heightCm - 29.5336
      : 0.29569 * currentWeightKg + 0.41813 * heightCm - 43.2933;
    const avgLbm = (lbmBoer + lbmJames + lbmHume) / 3;

    // Body Fat Percentage (U.S. Navy Method)
    let bodyFatNavy = 0;
    try {
      if (isMale) {
        bodyFatNavy = 495 / (1.0324 - 0.19077 * Math.log10(Math.max(1, waistCm - neckCm)) + 0.15456 * Math.log10(heightCm)) - 450;
      } else {
        bodyFatNavy = 495 / (1.29579 - 0.35004 * Math.log10(Math.max(1, waistCm + hipCm - neckCm)) + 0.221 * Math.log10(heightCm)) - 450;
      }
    } catch {
      bodyFatNavy = 18;
    }
    bodyFatNavy = Math.max(4, Math.min(55, Math.round(bodyFatNavy * 10) / 10));

    // FFMI (Fat-Free Mass Index)
    const fatFreeMassKg = currentWeightKg * (1 - bodyFatNavy / 100);
    const ffmi = fatFreeMassKg / (heightM * heightM);
    const normalizedFfmi = ffmi + 6.1 * (1.8 - heightM);

    // One Rep Max (Epley, Brzycki, Lander)
    const ormEpley = ormWeight * (1 + 0.0333 * ormReps);
    const ormBrzycki = ormWeight * (36 / Math.max(1, 37 - ormReps));
    const ormLander = (100 * ormWeight) / (101.3 - 2.67123 * ormReps);
    const avgOrm = Math.round((ormEpley + ormBrzycki + ormLander) / 3);

    // Water Requirement
    let waterMl = currentWeightKg * 35; // base
    waterMl += (workoutMinutesPerDay / 60) * 750; // training
    if (isHotClimate) waterMl += 500; // heat
    const waterGlasses = Math.round(waterMl / 250);

    // Target Weight & Goal Date Estimator
    const weightDiff = Math.abs(currentWeightKg - targetWeightKg);
    const isWeightLoss = currentWeightKg >= targetWeightKg;
    const dailyDeficitOrSurplus = isWeightLoss ? customDeficit : customSurplus;
    const weeklyRateKg = (dailyDeficitOrSurplus * 7) / 7700; // 1kg fat ~ 7700 kcal
    const totalWeeksNeeded = weeklyRateKg > 0 ? weightDiff / weeklyRateKg : 0;
    const totalDaysNeeded = Math.round(totalWeeksNeeded * 7);

    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + totalDaysNeeded);

    // Macros Calculation (Protein, Carbs, Fat)
    let pPct = 30;
    let cPct = 45;
    let fPct = 25;

    if (macroPreset === "cutting") {
      pPct = 40;
      cPct = 35;
      fPct = 25;
    } else if (macroPreset === "bulking") {
      pPct = 25;
      cPct = 55;
      fPct = 20;
    } else if (macroPreset === "keto") {
      pPct = 30;
      cPct = 5;
      fPct = 65;
    } else if (macroPreset === "custom") {
      pPct = customProteinPct;
      cPct = customCarbsPct;
      fPct = customFatPct;
    }

    const budgetCals = isWeightLoss ? calLoss : calGainLean;
    const proteinGrams = Math.round((budgetCals * (pPct / 100)) / 4);
    const carbsGrams = Math.round((budgetCals * (cPct / 100)) / 4);
    const fatGrams = Math.round((budgetCals * (fPct / 100)) / 9);

    // Target Weight from Body Fat target
    // Target Weight = Current Lean Mass / (1 - Target BF%)
    const currentLeanMass = currentWeightKg * (1 - currentBfEstimate / 100);
    const targetWeightByBf = currentLeanMass / (1 - targetBfEstimate / 100);
    const fatToLoseKg = Math.max(0, currentWeightKg - targetWeightByBf);

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmiStatus,
      healthyWeightRange: {
        min: Math.round(healthyWeightMin * 10) / 10,
        max: Math.round(healthyWeightMax * 10) / 10,
      },
      bmrMifflin: Math.round(bmrMifflin),
      bmrHarris: Math.round(bmrHarris),
      tdee,
      calMaintenance,
      calLossMild,
      calLoss,
      calLossAggressive,
      calGainLean,
      calGain,
      devineIBW: Math.round(devineIBW * 10) / 10,
      robinsonIBW: Math.round(robinsonIBW * 10) / 10,
      millerIBW: Math.round(millerIBW * 10) / 10,
      hamwiIBW: Math.round(hamwiIBW * 10) / 10,
      consensusIBW: Math.round(consensusIBW * 10) / 10,
      lbmBoer: Math.round(lbmBoer * 10) / 10,
      lbmJames: Math.round(lbmJames * 10) / 10,
      lbmHume: Math.round(lbmHume * 10) / 10,
      avgLbm: Math.round(avgLbm * 10) / 10,
      bodyFatNavy,
      ffmi: Math.round(ffmi * 10) / 10,
      normalizedFfmi: Math.round(normalizedFfmi * 10) / 10,
      orm: avgOrm,
      waterMl: Math.round(waterMl),
      waterGlasses,
      weeklyRateKg: Math.round(weeklyRateKg * 100) / 100,
      totalWeeksNeeded: Math.round(totalWeeksNeeded * 10) / 10,
      goalDateFormatted: goalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      proteinGrams,
      carbsGrams,
      fatGrams,
      targetWeightByBf: Math.round(targetWeightByBf * 10) / 10,
      fatToLoseKg: Math.round(fatToLoseKg * 10) / 10,
    };
  }, [
    age,
    gender,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activityLevel,
    workoutDaysPerWeek,
    neckCm,
    waistCm,
    hipCm,
    ormWeight,
    ormReps,
    customDeficit,
    customSurplus,
    macroPreset,
    customProteinPct,
    customCarbsPct,
    customFatPct,
    workoutMinutesPerDay,
    isHotClimate,
    currentBfEstimate,
    targetBfEstimate,
  ]);

  // Sync to Profile
  const handleSaveToProfile = () => {
    const updated: UserProfile = {
      ...profile,
      age,
      gender,
      heightCm,
      currentWeightKg,
      goalWeightKg: targetWeightKg,
      targetWeightKg,
      activityLevel,
      workoutDaysPerWeek,
    };
    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5" /> Section 24 • Advanced Fitness Calculators
              </span>
              <span className="text-xs text-slate-400">15 Clinical & Performance Engines</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Clinical & Body Composition Calculators
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Scientifically grounded formulas calculating your exact caloric requirements, body fat percentage, 1RM, macronutrient balance, and time-to-goal trajectory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToProfile}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Synced to Profile!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save to My Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* USER INPUT PANEL */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Universal Body & Training Inputs</h3>
              <p className="text-xs text-slate-400">Adjust these values to update all 15 calculators instantly</p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Auto-Computing Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-1">
          {/* Age */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Age</label>
            <div className="relative">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={12}
                max={100}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">yrs</span>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Height</label>
            <div className="relative">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                min={120}
                max={240}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">cm</span>
            </div>
          </div>

          {/* Current Weight */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Current Weight</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                min={30}
                max={250}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg</span>
            </div>
          </div>

          {/* Target Weight */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Target Weight</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                min={30}
                max={250}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg</span>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-xs font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Sedentary">Sedentary (Desk Job)</option>
              <option value="Lightly Active">Lightly Active (1-2 days)</option>
              <option value="Moderately Active">Moderately Active (3-5 days)</option>
              <option value="Very Active">Very Active (6-7 days)</option>
              <option value="Extra Active">Extra Active (Athlete)</option>
            </select>
          </div>

          {/* Workout Days */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Workout Days / Wk</label>
            <select
              value={workoutDaysPerWeek}
              onChange={(e) => setWorkoutDaysPerWeek(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 px-3 py-2 text-sm font-bold text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} Days / Week
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 24: AUTOMATICALLY DISPLAYED MASTER DASHBOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Automatically Calculated Master Dashboard
          </h2>
          <span className="text-xs text-slate-400">Calculated instantly from your physiological metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Ideal Weight Range */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Ideal Weight Range</span>
              <Scale className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {calculations.healthyWeightRange.min} - {calculations.healthyWeightRange.max} <span className="text-xs text-slate-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400">Devine IBW: <span className="text-emerald-300 font-bold">{calculations.consensusIBW} kg</span></p>
          </div>

          {/* BMI Status */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>BMI & Status</span>
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100">{calculations.bmi}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  calculations.bmiStatus === "Normal"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : calculations.bmiStatus === "Overweight"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {calculations.bmiStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">WHO Standard Benchmark</p>
          </div>

          {/* BMR */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>BMR (Basal Rate)</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {calculations.bmrMifflin} <span className="text-xs text-slate-400">kcal/day</span>
            </div>
            <p className="text-[11px] text-slate-400">Resting metabolism (Mifflin-St Jeor)</p>
          </div>

          {/* TDEE */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>TDEE (Total Daily Burn)</span>
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {calculations.tdee} <span className="text-xs text-slate-400">kcal/day</span>
            </div>
            <p className="text-[11px] text-slate-400">Daily energy expenditure with {workoutDaysPerWeek}x workouts</p>
          </div>

          {/* Daily Maintenance */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Daily Maintenance</span>
              <TrendingUp className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {calculations.calMaintenance} <span className="text-xs text-slate-400">kcal</span>
            </div>
            <p className="text-[11px] text-slate-400">Neutral energy balance target</p>
          </div>

          {/* Calories for Weight Loss */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Calories for Weight Loss</span>
              <TrendingDown className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">
              {calculations.calLoss} <span className="text-xs text-slate-400">kcal (-500)</span>
            </div>
            <p className="text-[11px] text-slate-400">Mild: {calculations.calLossMild} | Aggressive: {calculations.calLossAggressive}</p>
          </div>

          {/* Calories for Weight Gain */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Calories for Weight Gain</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">
              {calculations.calGainLean} <span className="text-xs text-slate-400">kcal (+250)</span>
            </div>
            <p className="text-[11px] text-slate-400">Hypertrophy surplus (+0.25-0.5kg/wk)</p>
          </div>

          {/* Water Intake */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Water Intake</span>
              <Droplets className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">
              {(calculations.waterMl / 1000).toFixed(1)} <span className="text-xs text-slate-400">Liters</span>
            </div>
            <p className="text-[11px] text-slate-400">{calculations.waterGlasses} glasses (250ml each)</p>
          </div>

          {/* Protein Requirement */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Protein Requirement</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {calculations.proteinGrams} <span className="text-xs text-slate-400">g/day</span>
            </div>
            <p className="text-[11px] text-slate-400">~{(calculations.proteinGrams / currentWeightKg).toFixed(1)}g per kg body weight</p>
          </div>

          {/* Carbohydrate Requirement */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Carbohydrate Requirement</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {calculations.carbsGrams} <span className="text-xs text-slate-400">g/day</span>
            </div>
            <p className="text-[11px] text-slate-400">Glycogen & training fuel</p>
          </div>

          {/* Fat Requirement */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Fat Requirement</span>
              <Target className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">
              {calculations.fatGrams} <span className="text-xs text-slate-400">g/day</span>
            </div>
            <p className="text-[11px] text-slate-400">Endocrine & hormonal balance</p>
          </div>

          {/* Estimated Time to Goal */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Estimated Time to Goal</span>
              <Calendar className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-400">
              {calculations.totalWeeksNeeded} <span className="text-xs text-slate-400">weeks</span>
            </div>
            <p className="text-[11px] text-slate-400">Target Date: <span className="text-slate-200 font-bold">{calculations.goalDateFormatted}</span></p>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL DEEP-DIVE CALCULATORS SELECTOR */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Deep-Dive Specialized Calculators</h3>
            <p className="text-xs text-slate-400">Select any clinical or performance calculator below to inspect detailed formula breakdowns</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">15 Dedicated Tools</span>
        </div>

        {/* Calculator Tabs Pill Grid */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Overview Summary" },
            { id: "bmi", label: "BMI" },
            { id: "bmr", label: "BMR" },
            { id: "tdee", label: "TDEE" },
            { id: "ibw", label: "Ideal Body Weight" },
            { id: "lbm", label: "Lean Body Mass" },
            { id: "bodyfat", label: "Body Fat % (Navy)" },
            { id: "ffmi", label: "FFMI" },
            { id: "oneRepMax", label: "One Rep Max (1RM)" },
            { id: "dailyCalories", label: "Daily Calories" },
            { id: "deficit", label: "Calorie Deficit" },
            { id: "surplus", label: "Calorie Surplus" },
            { id: "water", label: "Water Intake" },
            { id: "macro", label: "Macro Split (P/C/F)" },
            { id: "targetWeight", label: "Target Weight" },
            { id: "goalDate", label: "Goal Date Estimator" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTool(item.id as CalculatorToolId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedTool === item.id
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* TOOL CONTENT RENDERING */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
          {/* 1. BMI TOOL */}
          {selectedTool === "bmi" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Body Mass Index (BMI) Analysis</h4>
                <span className="text-xs text-slate-400 font-mono">Formula: kg / m²</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Your Current BMI</span>
                  <div className="text-3xl font-extrabold text-emerald-400">{calculations.bmi}</div>
                  <p className="text-xs text-slate-300 font-semibold">Classification: {calculations.bmiStatus}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Healthy Weight Boundary for {heightCm} cm</span>
                  <div className="text-xl font-bold text-slate-100">
                    {calculations.healthyWeightRange.min} kg – {calculations.healthyWeightRange.max} kg
                  </div>
                  <p className="text-xs text-slate-400">Represents BMI range 18.5 – 24.9</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Distance to Normal Weight</span>
                  <div className="text-xl font-bold text-slate-100">
                    {currentWeightKg > calculations.healthyWeightRange.max
                      ? `+${(currentWeightKg - calculations.healthyWeightRange.max).toFixed(1)} kg over upper normal`
                      : currentWeightKg < calculations.healthyWeightRange.min
                      ? `-${(calculations.healthyWeightRange.min - currentWeightKg).toFixed(1)} kg under lower normal`
                      : "Within optimal healthy range"}
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">Optimal health risk profile</p>
                </div>
              </div>
              {/* BMI Scale Bars */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Underweight (&lt;18.5)</span>
                  <span>Normal (18.5–24.9)</span>
                  <span>Overweight (25–29.9)</span>
                  <span>Obese (≥30)</span>
                </div>
                <div className="h-3 w-full rounded-full flex overflow-hidden">
                  <div className="h-full bg-blue-500 w-[18.5%]" />
                  <div className="h-full bg-emerald-500 w-[30%]" />
                  <div className="h-full bg-amber-500 w-[25%]" />
                  <div className="h-full bg-rose-500 w-[26.5%]" />
                </div>
              </div>
            </div>
          )}

          {/* 2. BMR TOOL */}
          {selectedTool === "bmr" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Basal Metabolic Rate (BMR) Comparison</h4>
                <span className="text-xs text-slate-400 font-mono">Resting Metabolic Calories</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Mifflin-St Jeor Formula (Clinical Gold Standard)</span>
                  <div className="text-3xl font-black text-amber-400">{calculations.bmrMifflin} <span className="text-sm font-normal text-slate-400">kcal/day</span></div>
                  <p className="text-xs text-slate-400">Accounts for fat-free mass variance in modern populations with ±5% error.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Harris-Benedict Revised Formula</span>
                  <div className="text-3xl font-black text-slate-100">{calculations.bmrHarris} <span className="text-sm font-normal text-slate-400">kcal/day</span></div>
                  <p className="text-xs text-slate-400">Historical physiological standard updated with modern Roza & Shizgal coefficients.</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                Hourly Resting Burn: <span className="font-bold text-amber-400">{(calculations.bmrMifflin / 24).toFixed(1)} kcal/hour</span> purely sustaining organ function and cellular respiration.
              </div>
            </div>
          )}

          {/* 3. TDEE TOOL */}
          {selectedTool === "tdee" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Total Daily Energy Expenditure (TDEE) Breakdown</h4>
                <span className="text-xs text-slate-400 font-mono">BMR × Physical Activity Factor</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Sedentary", mult: "1.2", cals: Math.round(calculations.bmrMifflin * 1.2), desc: "Desk job, little exercise" },
                  { label: "Light", mult: "1.375", cals: Math.round(calculations.bmrMifflin * 1.375), desc: "1-2 days/week training" },
                  { label: "Moderate", mult: "1.55", cals: Math.round(calculations.bmrMifflin * 1.55), desc: "3-5 days/week training", active: true },
                  { label: "Very Active", mult: "1.725", cals: Math.round(calculations.bmrMifflin * 1.725), desc: "6-7 days/week training" },
                  { label: "Extra Active", mult: "1.9", cals: Math.round(calculations.bmrMifflin * 1.9), desc: "Physical job + 2x training" },
                ].map((tier) => (
                  <div
                    key={tier.label}
                    className={`p-3.5 rounded-xl border ${
                      tier.active ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900 border-slate-800"
                    } space-y-1`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>{tier.label}</span>
                      <span className="text-slate-400 font-mono">{tier.mult}x</span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-100">{tier.cals} <span className="text-xs font-normal text-slate-400">kcal</span></div>
                    <p className="text-[10px] text-slate-400">{tier.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. IDEAL BODY WEIGHT (IBW) */}
          {selectedTool === "ibw" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Ideal Body Weight (IBW) Formulas</h4>
                <span className="text-xs text-slate-400 font-mono">Consensus: {calculations.consensusIBW} kg</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Devine Formula</span>
                  <div className="text-2xl font-black text-emerald-400">{calculations.devineIBW} kg</div>
                  <p className="text-[11px] text-slate-400">Standard for clinical pharmacokinetics</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Robinson Formula</span>
                  <div className="text-2xl font-black text-slate-100">{calculations.robinsonIBW} kg</div>
                  <p className="text-[11px] text-slate-400">Empirical adjustment for muscular build</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Miller Formula</span>
                  <div className="text-2xl font-black text-slate-100">{calculations.millerIBW} kg</div>
                  <p className="text-[11px] text-slate-400">Accounts for lean skeletal dimensions</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Hamwi Formula</span>
                  <div className="text-2xl font-black text-slate-100">{calculations.hamwiIBW} kg</div>
                  <p className="text-[11px] text-slate-400">Traditional diabetic & nutrition formula</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. LEAN BODY MASS (LBM) */}
          {selectedTool === "lbm" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Lean Body Mass (LBM) Estimation</h4>
                <span className="text-xs text-slate-400 font-mono">Average LBM: {calculations.avgLbm} kg</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Boer Formula</span>
                  <div className="text-2xl font-black text-emerald-400">{calculations.lbmBoer} kg</div>
                  <p className="text-[11px] text-slate-400">MRI calibrated method</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">James Formula</span>
                  <div className="text-2xl font-black text-slate-100">{calculations.lbmJames} kg</div>
                  <p className="text-[11px] text-slate-400">Height-to-weight quadratic model</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Hume Formula</span>
                  <div className="text-2xl font-black text-slate-100">{calculations.lbmHume} kg</div>
                  <p className="text-[11px] text-slate-400">Dual-energy X-ray aligned model</p>
                </div>
              </div>
              {/* Visual Lean vs Fat Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">Lean Muscle & Bone ({calculations.avgLbm} kg)</span>
                  <span className="text-amber-400 font-semibold">Adipose Fat ({(currentWeightKg - calculations.avgLbm).toFixed(1)} kg)</span>
                </div>
                <div className="h-3 w-full rounded-full flex overflow-hidden bg-slate-800">
                  <div className="bg-emerald-500" style={{ width: `${(calculations.avgLbm / currentWeightKg) * 100}%` }} />
                  <div className="bg-amber-500" style={{ width: `${((currentWeightKg - calculations.avgLbm) / currentWeightKg) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* 6. BODY FAT % (U.S. NAVY METHOD) */}
          {selectedTool === "bodyfat" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">U.S. Navy Circumference Body Fat Calculator</h4>
                <span className="text-xs text-emerald-400 font-bold">{calculations.bodyFatNavy}% Estimated Body Fat</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Neck Circumference (cm)</label>
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Waist at Navel (cm)</label>
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
                {gender === "Female" && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Hips at Widest Point (cm)</label>
                    <input
                      type="number"
                      value={hipCm}
                      onChange={(e) => setHipCm(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                    />
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-emerald-400">{calculations.bodyFatNavy}%</div>
                  <p className="text-xs text-slate-400">Total Fat Mass: {((currentWeightKg * calculations.bodyFatNavy) / 100).toFixed(1)} kg</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-100">
                    {((currentWeightKg * (100 - calculations.bodyFatNavy)) / 100).toFixed(1)} kg
                  </div>
                  <p className="text-xs text-slate-400">Total Fat-Free Lean Mass</p>
                </div>
              </div>
            </div>
          )}

          {/* 7. FFMI CALCULATOR */}
          {selectedTool === "ffmi" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Fat-Free Mass Index (FFMI)</h4>
                <span className="text-xs text-slate-400 font-mono">Muscularity Potential Index</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Raw FFMI</span>
                  <div className="text-3xl font-black text-emerald-400">{calculations.ffmi}</div>
                  <p className="text-xs text-slate-400">Fat-free mass divided by height squared.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Normalized FFMI (Height Standardized)</span>
                  <div className="text-3xl font-black text-slate-100">{calculations.normalizedFfmi}</div>
                  <p className="text-xs text-slate-400">Standardized to 1.80m for cross-height comparison.</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-emerald-400">Natural Standards:</span> 18-19 (Average), 20-21 (Athletic), 22-23 (Advanced Lifter), 24-25 (Near Natural Genetic Ceiling), &gt;25.5 (Exceptional).
              </div>
            </div>
          )}

          {/* 8. ONE REP MAX (1RM) CALCULATOR */}
          {selectedTool === "oneRepMax" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">One Rep Max (1RM) Calculator</h4>
                <span className="text-xs text-emerald-400 font-bold">Estimated 1RM: {calculations.orm} kg</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Lifted Weight (kg)</label>
                  <input
                    type="number"
                    value={ormWeight}
                    onChange={(e) => setOrmWeight(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Repetitions Performed (1–12)</label>
                  <input
                    type="number"
                    value={ormReps}
                    onChange={(e) => setOrmReps(Number(e.target.value))}
                    min={1}
                    max={15}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
              </div>
              {/* Rep Max Percentages Table */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Training Load Percentages (% 1RM)</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { pct: 100, reps: "1 Rep (1RM)", val: calculations.orm },
                    { pct: 95, reps: "2 Reps", val: Math.round(calculations.orm * 0.95) },
                    { pct: 90, reps: "3-4 Reps", val: Math.round(calculations.orm * 0.9) },
                    { pct: 85, reps: "5-6 Reps", val: Math.round(calculations.orm * 0.85) },
                    { pct: 80, reps: "7-8 Reps", val: Math.round(calculations.orm * 0.8) },
                    { pct: 70, reps: "10-12 Reps", val: Math.round(calculations.orm * 0.7) },
                  ].map((tier) => (
                    <div key={tier.pct} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-xs font-bold text-emerald-400">{tier.pct}%</div>
                      <div className="text-sm font-black text-slate-100">{tier.val} kg</div>
                      <div className="text-[10px] text-slate-400">{tier.reps}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. DAILY CALORIES & 10. DEFICIT & 11. SURPLUS */}
          {(selectedTool === "dailyCalories" || selectedTool === "deficit" || selectedTool === "surplus") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">
                  {selectedTool === "deficit" ? "Calories Deficit Simulator" : selectedTool === "surplus" ? "Calories Surplus Simulator" : "Daily Caloric Targets"}
                </h4>
                <span className="text-xs text-slate-400 font-mono">TDEE: {calculations.tdee} kcal</span>
              </div>

              {selectedTool === "deficit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">Daily Calorie Deficit: <span className="font-bold text-rose-400">-{customDeficit} kcal/day</span></label>
                    <span className="text-xs text-slate-400">Expected Fat Loss: ~{((customDeficit * 7) / 7700).toFixed(2)} kg/week</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={1000}
                    step={50}
                    value={customDeficit}
                    onChange={(e) => setCustomDeficit(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Target Intake</div>
                      <div className="text-xl font-bold text-rose-400">{calculations.tdee - customDeficit} kcal</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Weekly Fat Burn</div>
                      <div className="text-xl font-bold text-slate-100">{((customDeficit * 7) / 7700).toFixed(2)} kg</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Monthly Projected Loss</div>
                      <div className="text-xl font-bold text-slate-100">{(((customDeficit * 7) / 7700) * 4).toFixed(1)} kg</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTool === "surplus" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">Daily Calorie Surplus: <span className="font-bold text-purple-400">+{customSurplus} kcal/day</span></label>
                    <span className="text-xs text-slate-400">Expected Weight Gain: ~{((customSurplus * 7) / 7700).toFixed(2)} kg/week</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={700}
                    step={25}
                    value={customSurplus}
                    onChange={(e) => setCustomSurplus(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Target Intake</div>
                      <div className="text-xl font-bold text-purple-400">{calculations.tdee + customSurplus} kcal</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Monthly Muscle Mass</div>
                      <div className="text-xl font-bold text-slate-100">~{(((customSurplus * 7) / 7700) * 4 * 0.65).toFixed(1)} kg lean</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xs text-slate-400">Fat Accumulation Risk</div>
                      <div className="text-xl font-bold text-emerald-400">{customSurplus <= 350 ? "Minimal (Controlled)" : "Moderate"}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTool === "dailyCalories" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Maintenance (TDEE)</span>
                    <div className="text-2xl font-black text-slate-100">{calculations.calMaintenance} kcal</div>
                    <p className="text-[11px] text-slate-400">0 kg/week delta</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Fat Loss (Standard -500)</span>
                    <div className="text-2xl font-black text-rose-400">{calculations.calLoss} kcal</div>
                    <p className="text-[11px] text-slate-400">-0.5 kg/week</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Aggressive Cut (-750)</span>
                    <div className="text-2xl font-black text-rose-500">{calculations.calLossAggressive} kcal</div>
                    <p className="text-[11px] text-slate-400">-0.75 kg/week</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Lean Bulk (+250)</span>
                    <div className="text-2xl font-black text-purple-400">{calculations.calGainLean} kcal</div>
                    <p className="text-[11px] text-slate-400">+0.25 kg/week</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 12. WATER INTAKE */}
          {selectedTool === "water" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Dynamic Water Intake Calculator</h4>
                <span className="text-xs text-sky-400 font-bold">{(calculations.waterMl / 1000).toFixed(2)} Liters Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Workout Duration (Minutes/Day)</label>
                  <input
                    type="number"
                    value={workoutMinutesPerDay}
                    onChange={(e) => setWorkoutMinutesPerDay(Number(e.target.value))}
                    min={0}
                    max={240}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700">
                  <span className="text-xs text-slate-300 font-medium">Hot Climate / Heavy Sweating (+500ml)</span>
                  <input
                    type="checkbox"
                    checked={isHotClimate}
                    onChange={(e) => setIsHotClimate(e.target.checked)}
                    className="h-5 w-5 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-sky-400">{calculations.waterGlasses} Glasses</div>
                  <p className="text-xs text-slate-400">Based on 250ml standard glasses</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-100">{Math.round(calculations.waterMl / 14)} ml / hr</div>
                  <p className="text-xs text-slate-400">Recommended hourly drinking rate (14 waking hours)</p>
                </div>
              </div>
            </div>
          )}

          {/* 13. MACRO CALCULATOR */}
          {selectedTool === "macro" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Macronutrient Distribution Calculator</h4>
                <div className="flex items-center gap-1.5">
                  {(["cutting", "balanced", "bulking", "keto"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setMacroPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                        macroPreset === preset
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Protein</span>
                    <span className="text-emerald-400 font-bold">4 kcal/g</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">{calculations.proteinGrams} g</div>
                  <p className="text-xs text-slate-400">{calculations.proteinGrams * 4} kcal (~{(calculations.proteinGrams / currentWeightKg).toFixed(1)}g/kg)</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Carbohydrates</span>
                    <span className="text-amber-400 font-bold">4 kcal/g</span>
                  </div>
                  <div className="text-3xl font-black text-amber-400">{calculations.carbsGrams} g</div>
                  <p className="text-xs text-slate-400">{calculations.carbsGrams * 4} kcal</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Healthy Fats</span>
                    <span className="text-rose-400 font-bold">9 kcal/g</span>
                  </div>
                  <div className="text-3xl font-black text-rose-400">{calculations.fatGrams} g</div>
                  <p className="text-xs text-slate-400">{calculations.fatGrams * 9} kcal</p>
                </div>
              </div>
            </div>
          )}

          {/* 14. TARGET WEIGHT CALCULATOR */}
          {selectedTool === "targetWeight" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Lean Mass Preserving Target Weight</h4>
                <span className="text-xs text-slate-400 font-mono">Calculated for 100% Lean Mass Retention</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Estimated Current Body Fat %</label>
                  <input
                    type="number"
                    value={currentBfEstimate}
                    onChange={(e) => setCurrentBfEstimate(Number(e.target.value))}
                    min={4}
                    max={50}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Desired Target Body Fat %</label>
                  <input
                    type="number"
                    value={targetBfEstimate}
                    onChange={(e) => setTargetBfEstimate(Number(e.target.value))}
                    min={4}
                    max={40}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Target Scale Weight</span>
                  <div className="text-3xl font-black text-emerald-400">{calculations.targetWeightByBf} kg</div>
                  <p className="text-xs text-slate-400">Retains all {(currentWeightKg * (1 - currentBfEstimate / 100)).toFixed(1)} kg lean muscle</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Net Pure Fat to Burn</span>
                  <div className="text-3xl font-black text-rose-400">{calculations.fatToLoseKg} kg</div>
                  <p className="text-xs text-slate-400">Requires ~{(calculations.fatToLoseKg * 7700).toLocaleString()} total caloric deficit</p>
                </div>
              </div>
            </div>
          )}

          {/* 15. GOAL DATE ESTIMATOR */}
          {selectedTool === "goalDate" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-100">Milestone & Arrival Date Estimator</h4>
                <span className="text-xs text-emerald-400 font-bold">{calculations.totalWeeksNeeded} Weeks to Target</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Expected Arrival Date</span>
                  <div className="text-2xl font-black text-teal-400">{calculations.goalDateFormatted}</div>
                  <p className="text-xs text-slate-400">At {calculations.weeklyRateKg} kg / week safe rate</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">4-Week Checkpoint Weight</span>
                  <div className="text-2xl font-black text-slate-100">
                    {(currentWeightKg - calculations.weeklyRateKg * 4).toFixed(1)} kg
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold">1st month milestone target</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">8-Week Checkpoint Weight</span>
                  <div className="text-2xl font-black text-slate-100">
                    {(currentWeightKg - calculations.weeklyRateKg * 8).toFixed(1)} kg
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold">Mid-point physique consolidation</p>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW SUMMARY */}
          {selectedTool === "overview" && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-100">Complete Biometric & Metabolic Summary</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All 15 fitness calculators are synchronizing in real time with your physiological parameters. Your calculated TDEE is{" "}
                <span className="text-emerald-400 font-bold">{calculations.tdee} kcal/day</span> with a basal metabolic burn of{" "}
                <span className="text-amber-400 font-bold">{calculations.bmrMifflin} kcal</span>. To reach your target of{" "}
                <span className="text-slate-200 font-bold">{targetWeightKg} kg</span>, sustain a daily budget of{" "}
                <span className="text-rose-400 font-bold">{calculations.calLoss} kcal/day</span> with{" "}
                <span className="text-emerald-400 font-bold">{calculations.proteinGrams}g</span> of daily protein and{" "}
                <span className="text-sky-400 font-bold">{(calculations.waterMl / 1000).toFixed(1)}L</span> of hydration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
