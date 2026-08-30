import React, { useState, useMemo } from "react";
import {
  Activity,
  Calculator,
  Ruler,
  Camera,
  Heart,
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
  Check,
} from "lucide-react";
import {
  UserProfile,
  HealthCalculations,
  BodyMeasurement,
  ProgressPhoto,
  FitnessGoal,
} from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface HealthBodyViewProps {
  profile: UserProfile;
  healthMetrics: HealthCalculations;
  measurements: BodyMeasurement[];
  progressPhotos: ProgressPhoto[];
  onUpdateProfileGoal: (goal: FitnessGoal) => void;
  onAddMeasurement: (measurement: BodyMeasurement) => void;
  onAddProgressPhoto: (photo: ProgressPhoto) => void;
}

export function HealthBodyView({
  profile,
  healthMetrics,
  measurements,
  progressPhotos,
  onUpdateProfileGoal,
  onAddMeasurement,
  onAddProgressPhoto,
}: HealthBodyViewProps) {
  const [subTab, setSubTab] = useState<"calculator" | "goals" | "measurements" | "photos">("calculator");
  const [beforeAfterSliderPos, setBeforeAfterSliderPos] = useState(50); // 0 to 100%
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  // New measurement form state
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurement>>({
    date: new Date().toISOString().split("T")[0],
    weightKg: profile.currentWeightKg,
    chestCm: 105,
    waistCm: 85,
    hipCm: 97,
    neckCm: 38.5,
    shouldersCm: 121,
    leftArmCm: 37.5,
    rightArmCm: 37.6,
    leftThighCm: 58.5,
    rightThighCm: 58.7,
    calvesCm: 38,
    bodyFatPct: 16.0,
    notes: "",
  });

  // Photo upload form state
  const [photoCategory, setPhotoCategory] = useState<ProgressPhoto["category"]>("Front");
  const [photoUrlInput, setPhotoUrlInput] = useState("https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80");
  const [photoNotes, setPhotoNotes] = useState("Weekly conditioning update");

  // Sorted measurements
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [measurements]);

  // Latest vs Initial difference
  const measurementDelta = useMemo(() => {
    if (sortedMeasurements.length < 2) return null;
    const initial = sortedMeasurements[0];
    const latest = sortedMeasurements[sortedMeasurements.length - 1];
    return {
      weight: (latest.weightKg - initial.weightKg).toFixed(1),
      waist: (latest.waistCm - initial.waistCm).toFixed(1),
      chest: (latest.chestCm - initial.chestCm).toFixed(1),
      arms: (latest.rightArmCm - initial.rightArmCm).toFixed(1),
      bodyFat: (latest.bodyFatPct - initial.bodyFatPct).toFixed(1),
    };
  }, [sortedMeasurements]);

  const handleSaveNewMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const heightM = profile.heightCm / 100;
    const bmiVal = Math.round(((newMeasurement.weightKg || 75) / (heightM * heightM)) * 10) / 10;

    const entry: BodyMeasurement = {
      id: `m-${Date.now()}`,
      date: newMeasurement.date || new Date().toISOString().split("T")[0],
      weightKg: newMeasurement.weightKg || profile.currentWeightKg,
      chestCm: newMeasurement.chestCm || 100,
      waistCm: newMeasurement.waistCm || 80,
      hipCm: newMeasurement.hipCm || 95,
      neckCm: newMeasurement.neckCm || 38,
      shouldersCm: newMeasurement.shouldersCm || 115,
      leftArmCm: newMeasurement.leftArmCm || 35,
      rightArmCm: newMeasurement.rightArmCm || 35,
      leftThighCm: newMeasurement.leftThighCm || 55,
      rightThighCm: newMeasurement.rightThighCm || 55,
      calvesCm: newMeasurement.calvesCm || 37,
      bodyFatPct: newMeasurement.bodyFatPct || 16,
      bmi: bmiVal,
      notes: newMeasurement.notes || "",
    };

    onAddMeasurement(entry);
    setIsAddingMeasurement(false);
  };

  const handleSaveNewPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: ProgressPhoto = {
      id: `photo-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      category: photoCategory,
      photoUrl: photoUrlInput,
      weightKg: profile.currentWeightKg,
      bodyFatPct: sortedMeasurements[sortedMeasurements.length - 1]?.bodyFatPct || 16,
      notes: photoNotes,
    };
    onAddProgressPhoto(entry);
    setIsAddingPhoto(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Health, Body & Progress</h1>
            <p className="text-xs text-slate-400">Scientific calculators, measurement changes, and before & after photo slider</p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 overflow-x-auto">
          <button
            onClick={() => setSubTab("calculator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              subTab === "calculator" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            Health Calculator
          </button>
          <button
            onClick={() => setSubTab("goals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              subTab === "goals" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Goal Modes
          </button>
          <button
            onClick={() => setSubTab("measurements")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              subTab === "measurements" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            Measurements
          </button>
          <button
            onClick={() => setSubTab("photos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              subTab === "photos" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Photo Vault
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SECTION 5 HEALTH CALCULATOR */}
      {subTab === "calculator" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 5 • Clinical Health Metrics Engine</h3>
                <p className="text-xs text-slate-400">Calculated via Mifflin-St Jeor equation for {profile.fullName} ({profile.gender}, {profile.heightCm}cm, {profile.currentWeightKg}kg)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  BMI Status: {healthMetrics.bmiStatus}
                </span>
              </div>
            </div>

            {/* Metrics Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">BMI</span>
                <p className="text-2xl font-black text-slate-100">{healthMetrics.bmi}</p>
                <span className="text-[11px] text-emerald-400 block font-semibold">{healthMetrics.bmiStatus}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">BMR (Mifflin-St Jeor)</span>
                <p className="text-2xl font-black text-amber-400">{healthMetrics.bmr} <span className="text-xs text-slate-400">kcal</span></p>
                <span className="text-[11px] text-slate-400 block">Basal Metabolic Rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">TDEE (Daily Burn)</span>
                <p className="text-2xl font-black text-sky-400">{healthMetrics.tdee} <span className="text-xs text-slate-400">kcal</span></p>
                <span className="text-[11px] text-slate-400 block">Total Daily Energy Expenditure</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Ideal Body Weight</span>
                <p className="text-2xl font-black text-teal-400">{healthMetrics.idealBodyWeightKg} <span className="text-xs text-slate-400">kg</span></p>
                <span className="text-[11px] text-slate-400 block">Healthy: {healthMetrics.healthyWeightRangeKg.min} - {healthMetrics.healthyWeightRangeKg.max} kg</span>
              </div>
            </div>

            {/* Target Calorie Recommendations for Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300">Weight Loss Target</span>
                  <span className="text-[11px] text-slate-400">-500 kcal deficit</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{healthMetrics.dailyCaloriesWeightLoss} <span className="text-xs text-slate-400">kcal/day</span></p>
                <p className="text-xs text-slate-400">Safe rate: ~0.5 kg to 0.75 kg fat loss weekly while preserving lean muscle.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Maintenance Target</span>
                  <span className="text-[11px] text-slate-400">Energy balance</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{healthMetrics.dailyCaloriesMaintenance} <span className="text-xs text-slate-400">kcal/day</span></p>
                <p className="text-xs text-slate-400">Maintain body composition while maximizing performance and recovery.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-300">Muscle Gain Target</span>
                  <span className="text-[11px] text-slate-400">+300 kcal lean surplus</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{healthMetrics.dailyCaloriesMuscleGain} <span className="text-xs text-slate-400">kcal/day</span></p>
                <p className="text-xs text-slate-400">Hypertrophic surplus to facilitate muscle protein synthesis.</p>
              </div>
            </div>

            {/* Daily Water & Macro Split Table */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Optimal Macro & Hydration Allocation</h4>
                <span className="text-xs text-cyan-400 font-semibold">Recommended Water: {healthMetrics.dailyWaterMl} ml</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Protein (30%)</span>
                  <span className="text-base font-black text-sky-400 mt-0.5 block">{healthMetrics.dailyProteinGrams}g</span>
                  <span className="text-[10px] text-slate-500">{(healthMetrics.dailyProteinGrams * 4)} kcal</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Carbohydrates (45%)</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">{healthMetrics.dailyCarbsGrams}g</span>
                  <span className="text-[10px] text-slate-500">{(healthMetrics.dailyCarbsGrams * 4)} kcal</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Fats (25%)</span>
                  <span className="text-base font-black text-purple-400 mt-0.5 block">{healthMetrics.dailyFatGrams}g</span>
                  <span className="text-[10px] text-slate-500">{(healthMetrics.dailyFatGrams * 9)} kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SECTIONS 2, 3, 4 GOAL MODES (Weight Loss, Muscle Gain, Recomp, etc.) */}
      {subTab === "goals" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 2 • Fitness Goal Mode Switcher</h3>
              <p className="text-xs text-slate-400">Selecting a mode automatically recalculates your calories, cardio, repetition ranges, and rest periods.</p>
            </div>

            {/* 5 Goal Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(["Weight Loss", "Muscle Gain", "Weight Gain", "Body Recomposition", "Maintenance"] as FitnessGoal[]).map((goal) => {
                const isCurrent = profile.fitnessGoal === goal;
                return (
                  <button
                    key={goal}
                    onClick={() => onUpdateProfileGoal(goal)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10"
                        : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${isCurrent ? "text-emerald-400" : "text-slate-200"}`}>{goal}</span>
                        {isCurrent && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {goal === "Weight Loss" && "Caloric deficit, fat oxidation focus, Zone 2 cardio"}
                        {goal === "Muscle Gain" && "Hypertrophic surplus, heavy compounds, 6-12 reps"}
                        {goal === "Weight Gain" && "High caloric surplus, dense nutrition, high volume"}
                        {goal === "Body Recomposition" && "High protein, maintenance calories, lean definition"}
                        {goal === "Maintenance" && "Energy balance, peak athletic stamina, recovery"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SECTION 3: WEIGHT LOSS DEEP DIVE */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Section 3 • Weight Loss Protocol Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Daily Caloric Deficit</span>
                  <span className="text-lg font-black text-rose-400">-500 kcal</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">3,500 kcal/week fat burn</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Safe Rate</span>
                  <span className="text-lg font-black text-slate-100">0.5 - 0.75 kg</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">per week</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Fat Burning HR Zone</span>
                  <span className="text-lg font-black text-amber-400">125 - 145 bpm</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Zone 2 Cardio</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Estimated to Goal</span>
                  <span className="text-lg font-black text-emerald-400">~{healthMetrics.estimatedWeeks} weeks</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">To reach {profile.goalWeightKg} kg</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: MUSCLE GAIN DEEP DIVE */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Section 4 • Muscle Gain Protocol Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Lean Caloric Surplus</span>
                  <span className="text-lg font-black text-sky-400">+300 kcal</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Minimizes fat gain</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Protein Target</span>
                  <span className="text-lg font-black text-slate-100">2.0 - 2.2 g/kg</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">~165g daily for Alex</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Optimal Hypertrophy</span>
                  <span className="text-lg font-black text-emerald-400">6 - 12 reps</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">3 to 4 working sets</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Rest Duration</span>
                  <span className="text-lg font-black text-slate-100">60 - 90 sec</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Compound: up to 120s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SECTION 13 BODY MEASUREMENT TRACKER */}
      {subTab === "measurements" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 13 • Body Measurement Tracker</h3>
                <p className="text-xs text-slate-400">Track circumference changes in Chest, Waist, Arms, Thighs, and Body Fat %</p>
              </div>
              <button
                onClick={() => setIsAddingMeasurement(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Log New Measurement</span>
              </button>
            </div>

            {/* Delta summary cards */}
            {measurementDelta && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Weight</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">{measurementDelta.weight} kg</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Waist</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">{measurementDelta.waist} cm</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Chest</span>
                  <p className="text-base font-black text-sky-400 mt-0.5">{measurementDelta.chest} cm</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Right Arm</span>
                  <p className="text-base font-black text-sky-400 mt-0.5">{measurementDelta.arms} cm</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Body Fat</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">{measurementDelta.bodyFat}%</p>
                </div>
              </div>
            )}

            {/* Graph: Waist & Weight over time */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Waist (cm) & Weight (kg) Trend History</h4>
              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sortedMeasurements}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="waistCm" name="Waist (cm)" stroke="#10b981" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#38bdf8" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Weight</th>
                    <th className="pb-2">Waist</th>
                    <th className="pb-2">Chest</th>
                    <th className="pb-2">Arms (L/R)</th>
                    <th className="pb-2">Thighs (L/R)</th>
                    <th className="pb-2">Body Fat</th>
                    <th className="pb-2">BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedMeasurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-semibold text-slate-300">{m.date}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{m.weightKg} kg</td>
                      <td className="py-2.5 text-slate-300">{m.waistCm} cm</td>
                      <td className="py-2.5 text-slate-300">{m.chestCm} cm</td>
                      <td className="py-2.5 text-slate-300">{m.leftArmCm} / {m.rightArmCm} cm</td>
                      <td className="py-2.5 text-slate-300">{m.leftThighCm} / {m.rightThighCm} cm</td>
                      <td className="py-2.5 text-amber-400 font-semibold">{m.bodyFatPct}%</td>
                      <td className="py-2.5 text-slate-400">{m.bmi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SECTION 14 PROGRESS PHOTO VAULT & BEFORE/AFTER SLIDER */}
      {subTab === "photos" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 14 • Progress Photo Vault</h3>
                <p className="text-xs text-slate-400">Encrypted visual transformation logs with Before & After interactive comparison slider</p>
              </div>
              <button
                onClick={() => setIsAddingPhoto(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>Upload Progress Photo</span>
              </button>
            </div>

            {/* INTERACTIVE BEFORE & AFTER COMPARISON SLIDER */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Interactive Before & After Comparison Slider</span>
                </div>
                <span className="text-slate-400">Drag handle or slider bar to inspect muscular definition</span>
              </div>

              {/* Slider Viewport */}
              <div className="relative w-full max-w-xl mx-auto h-80 sm:h-96 rounded-2xl overflow-hidden select-none border border-slate-700 shadow-2xl">
                {/* AFTER Image (Background) */}
                <img
                  src={progressPhotos[1]?.photoUrl || progressPhotos[0]?.photoUrl}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  AFTER ({progressPhotos[1]?.date || "Week 4"} • {progressPhotos[1]?.weightKg || 78.5}kg)
                </div>

                {/* BEFORE Image (Clipped Overlay) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${beforeAfterSliderPos}%` }}
                >
                  <img
                    src={progressPhotos[0]?.photoUrl}
                    alt="Before"
                    className="absolute inset-0 max-w-none h-full object-cover"
                    style={{ width: "100%", minWidth: "576px" }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 text-slate-300 text-xs font-bold border border-slate-700">
                    BEFORE ({progressPhotos[0]?.date || "Day 1"} • {progressPhotos[0]?.weightKg || 81.2}kg)
                  </div>
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute inset-y-0 w-1 bg-emerald-400 shadow-lg cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${beforeAfterSliderPos}%` }}
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md font-bold text-xs border border-white">
                    ⟷
                  </div>
                </div>
              </div>

              {/* Slider Range Input */}
              <div className="max-w-xl mx-auto space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beforeAfterSliderPos}
                  onChange={(e) => setBeforeAfterSliderPos(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>100% Day 1 Baseline</span>
                  <span className="font-semibold text-emerald-400">Position: {beforeAfterSliderPos}%</span>
                  <span>100% Current Physique</span>
                </div>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">All Tagged Progress Photos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {progressPhotos.map((photo) => (
                  <div key={photo.id} className="rounded-2xl bg-slate-800/60 border border-slate-700 overflow-hidden shadow-sm space-y-2">
                    <div className="h-56 w-full overflow-hidden bg-slate-900">
                      <img
                        src={photo.photoUrl}
                        alt="Progress entry"
                        className="h-full w-full object-cover hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{photo.category} View</span>
                        <span className="text-emerald-400">{photo.weightKg} kg</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{photo.date} • {photo.bodyFatPct}% Body Fat</p>
                      {photo.notes && <p className="text-[11px] text-slate-500 italic">"{photo.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW MEASUREMENT */}
      {isAddingMeasurement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-100">Log New Body Measurement (Section 13)</h3>
            <form onSubmit={handleSaveNewMeasurement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Date</label>
                  <input
                    type="date"
                    value={newMeasurement.date}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, date: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.weightKg}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, weightKg: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.chestCm}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, chestCm: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.waistCm}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, waistCm: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.hipCm}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, hipCm: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Right Arm (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.rightArmCm}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, rightArmCm: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurement.bodyFatPct}
                    onChange={(e) => setNewMeasurement({ ...newMeasurement, bodyFatPct: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Notes</label>
                <textarea
                  rows={2}
                  value={newMeasurement.notes}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  placeholder="Measurement observations..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMeasurement(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD PROGRESS PHOTO */}
      {isAddingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Add Progress Photo (Section 14)</h3>
            <form onSubmit={handleSaveNewPhoto} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Angle / Category</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                >
                  <option value="Front">Front View</option>
                  <option value="Back">Back View</option>
                  <option value="Left">Left Side</option>
                  <option value="Right">Right Side</option>
                  <option value="Weekly">Weekly Check-in</option>
                  <option value="Monthly">Monthly Check-in</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Image URL (or Unsplash sample)</label>
                <input
                  type="text"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Notes</label>
                <input
                  type="text"
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPhoto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
