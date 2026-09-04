import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Utensils,
  Sparkles,
  Calculator,
  Flame,
  Droplets,
  Heart,
  Scale,
  Activity,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Apple,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { GeneratedDietPlan, Gender, AppState } from "../types";
import {
  saveDietPlanToCloud,
  fetchDietPlansFromCloud,
  deleteDietPlanFromCloud,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface DietPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const DietPlannerModal: React.FC<DietPlannerModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"calculator" | "plans">("calculator");

  // Calculator inputs
  const [age, setAge] = useState<number>(state.profile.age || 28);
  const [gender, setGender] = useState<Gender>(state.profile.gender || "Male");
  const [weightKg, setWeightKg] = useState<number>(state.profile.currentWeightKg || 78);
  const [heightCm, setHeightCm] = useState<number>(state.profile.heightCm || 178);
  const [bodyFatPct, setBodyFatPct] = useState<number>(18);
  const [goal, setGoal] = useState<"Weight Loss" | "Weight Gain" | "Maintenance">("Weight Loss");
  const [activityLevel, setActivityLevel] = useState<
    "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Extremely Active"
  >("Moderately Active");

  // Generated Plan State
  const [currentPlan, setCurrentPlan] = useState<GeneratedDietPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<GeneratedDietPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGoal, setFilterGoal] = useState<string>("All");
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Delete plan confirmation
  const [deletingPlan, setDeletingPlan] = useState<GeneratedDietPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected plan to view
  const [selectedPlanView, setSelectedPlanView] = useState<GeneratedDietPlan | null>(null);

  // Calculations
  const calculatedMetrics = useMemo(() => {
    // 1. BMI
    const heightInMeters = heightCm / 100;
    const bmi = Number((weightKg / (heightInMeters * heightInMeters)).toFixed(1));

    // 2. BMR (Mifflin-St Jeor)
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === "Male") {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    // Fine-tune if body fat known (Katch-McArdle)
    if (bodyFatPct > 5 && bodyFatPct < 50) {
      const lbm = weightKg * (1 - bodyFatPct / 100);
      const katchBmr = 370 + 21.6 * lbm;
      bmr = Math.round((bmr + katchBmr) / 2);
    } else {
      bmr = Math.round(bmr);
    }

    // 3. TDEE
    const multipliers = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      "Extremely Active": 1.9,
    };
    const tdee = Math.round(bmr * multipliers[activityLevel]);

    // 4. Daily Target Calories based on Goal
    let dailyCalories = tdee;
    if (goal === "Weight Loss") {
      dailyCalories = Math.max(1200, tdee - 500);
    } else if (goal === "Weight Gain") {
      dailyCalories = tdee + 400;
    }

    // 5. Macros
    // Protein: 2.0g per kg of body weight
    const proteinGrams = Math.round(weightKg * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fat: 25% of total calories
    const fatCalories = Math.round(dailyCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    // Carbs: Remaining calories
    const carbsCalories = Math.max(0, dailyCalories - proteinCalories - fatCalories);
    const carbsGrams = Math.round(carbsCalories / 4);

    // 6. Water Intake: 35ml per kg + 500ml for training
    const waterIntakeLiters = Number(((weightKg * 35 + 500) / 1000).toFixed(1));

    return {
      bmi,
      bmr,
      tdee,
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      waterIntakeLiters,
    };
  }, [age, gender, weightKg, heightCm, bodyFatPct, goal, activityLevel]);

  // Load plans from cloud on open
  useEffect(() => {
    if (isOpen) {
      loadSavedPlans();
    }
  }, [isOpen]);

  const loadSavedPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const cloudPlans = await fetchDietPlansFromCloud();
      if (cloudPlans && cloudPlans.length > 0) {
        setSavedPlans(cloudPlans);
      }
    } catch (err) {
      console.warn("Failed to load diet plans:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Generate 7 balanced meals
  const handleGeneratePlan = () => {
    const { dailyCalories, proteinGrams, carbsGrams, fatGrams, waterIntakeLiters, bmi, bmr, tdee } =
      calculatedMetrics;

    const plan: GeneratedDietPlan = {
      id: `plan-${Date.now()}`,
      title: `${goal} Diet Plan (${dailyCalories} kcal)`,
      createdAt: new Date().toISOString(),
      userId: state.currentUserAccount?.uid || "usr-current",
      age,
      gender,
      weightKg,
      heightCm,
      bodyFatPct,
      goal,
      activityLevel,
      bmi,
      bmr,
      tdee,
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      waterIntakeLiters,
      meals: {
        breakfast: {
          title: "High-Protein Oatmeal & Egg Whites",
          items: [
            "60g Rolled Oats cooked with water or almond milk",
            "4 Boiled Egg Whites + 1 Whole Egg",
            "1 scoop Whey Protein Powder (mixed with oats)",
            "15g Almonds or Walnuts",
            "1/2 Banana sliced",
          ],
          calories: Math.round(dailyCalories * 0.25),
          protein: Math.round(proteinGrams * 0.28),
          carbs: Math.round(carbsGrams * 0.3),
          fat: Math.round(fatGrams * 0.22),
        },
        morningSnack: {
          title: "Greek Yogurt & Fresh Berries",
          items: [
            "150g Low-fat Greek Yogurt",
            "50g Fresh Blueberries or Pomegranate",
            "1 tbsp Chia seeds soaked",
          ],
          calories: Math.round(dailyCalories * 0.1),
          protein: Math.round(proteinGrams * 0.12),
          carbs: Math.round(carbsGrams * 0.1),
          fat: Math.round(fatGrams * 0.1),
        },
        lunch: {
          title: "Grilled Chicken Breast & Brown Rice Bowl",
          items: [
            "180g Grilled Chicken Breast / 200g Paneer or Tofu",
            "120g Cooked Brown Rice or Quinoa",
            "1 bowl Steamed Broccoli, Carrots, and Bell Peppers",
            "1 tsp Extra Virgin Olive Oil for dressing",
          ],
          calories: Math.round(dailyCalories * 0.3),
          protein: Math.round(proteinGrams * 0.32),
          carbs: Math.round(carbsGrams * 0.32),
          fat: Math.round(fatGrams * 0.28),
        },
        eveningSnack: {
          title: "Sprouted Moong Salad & Green Tea",
          items: [
            "1 bowl Steamed Sprouted Moong with lemon & cucumber",
            "10 Roasted Almonds",
            "1 cup Antioxidant Green Tea (no sugar)",
          ],
          calories: Math.round(dailyCalories * 0.08),
          protein: Math.round(proteinGrams * 0.08),
          carbs: Math.round(carbsGrams * 0.08),
          fat: Math.round(fatGrams * 0.1),
        },
        dinner: {
          title: "Salmon Fillet / Dal Tadka with Sauteed Greens",
          items: [
            "160g Grilled Fish or 1.5 cup Yellow Moong Dal",
            "2 Multi-grain Rotis or 1 sweet potato baked",
            "Large bowl Cucumber, Tomato and Mint Salad",
          ],
          calories: Math.round(dailyCalories * 0.2),
          protein: Math.round(proteinGrams * 0.22),
          carbs: Math.round(carbsGrams * 0.2),
          fat: Math.round(fatGrams * 0.22),
        },
        preWorkout: {
          title: "Energizing Pre-Workout Fuel",
          items: [
            "1 medium Banana",
            "1 slice Whole Wheat Toast with 1 tsp Peanut Butter",
            "1 cup Black Coffee (30 min prior)",
          ],
          calories: Math.round(dailyCalories * 0.04),
          protein: Math.round(proteinGrams * 0.03),
          carbs: Math.round(carbsGrams * 0.06),
          fat: Math.round(fatGrams * 0.04),
        },
        postWorkout: {
          title: "Rapid Glycogen & Muscle Recovery",
          items: [
            "1 scoop Whey Protein Isolate in cold water",
            "5g Creatine Monohydrate",
            "1 Rice Cake with a drop of organic honey",
          ],
          calories: Math.round(dailyCalories * 0.03),
          protein: Math.round(proteinGrams * 0.05),
          carbs: Math.round(carbsGrams * 0.04),
          fat: Math.round(fatGrams * 0.02),
        },
      },
    };

    setCurrentPlan(plan);
    onNotify("Diet Plan Generated", "Complete 7-meal daily schedule calculated", "success");
  };

  const handleSaveToCloud = async () => {
    if (!currentPlan) return;
    const res = await saveDietPlanToCloud(currentPlan);
    if (res.success) {
      setSavedPlans([currentPlan, ...savedPlans.filter((p) => p.id !== currentPlan.id)]);
      onNotify("Saved to Firebase", "Diet plan saved in cloud collection 'dietPlans'", "success");
    } else {
      onNotify("Offline Saved", "Saved locally in your session", "info");
    }
  };

  const handleDeletePlanConfirm = async () => {
    if (!deletingPlan) return;
    setIsDeleting(true);
    const id = deletingPlan.id;
    const updated = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(updated);

    const res = await deleteDietPlanFromCloud(id);
    setIsDeleting(false);
    setDeletingPlan(null);

    if (res.success) {
      onNotify("Plan Deleted", "Diet plan removed from database", "success");
    }
  };

  const filteredSavedPlans = useMemo(() => {
    return savedPlans.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGoal = filterGoal === "All" || p.goal === filterGoal;
      return matchesSearch && matchesGoal;
    });
  }, [savedPlans, searchQuery, filterGoal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-6 max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Diet Planner & Nutritional Engine
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatic BMI, BMR, TDEE, macros, water intake, and 7-meal daily schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "calculator"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Calculator & Generator
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "plans"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Saved Plans ({savedPlans.length})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "calculator" ? (
            <>
              {/* User Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    step="0.5"
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-emerald-400 font-bold"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Weight Gain">Weight Gain</option>
                  </select>
                </div>
              </div>

              {/* Automatic Calculated Metrics Ribbon */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  Instant Biometric & Energetic Calculations
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">BMI</div>
                    <div className="text-base font-black text-white">{calculatedMetrics.bmi}</div>
                    <div className="text-[9px] text-emerald-400">
                      {calculatedMetrics.bmi < 18.5 ? "Underweight" : calculatedMetrics.bmi <= 24.9 ? "Normal" : "Overweight"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">BMR</div>
                    <div className="text-base font-black text-white">{calculatedMetrics.bmr}</div>
                    <div className="text-[9px] text-slate-500">kcal/day</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">TDEE</div>
                    <div className="text-base font-black text-blue-400">{calculatedMetrics.tdee}</div>
                    <div className="text-[9px] text-slate-500">kcal/day</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-300 font-bold">Daily Target</div>
                    <div className="text-base font-black text-emerald-400">{calculatedMetrics.dailyCalories}</div>
                    <div className="text-[9px] text-emerald-400 font-medium">kcal</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Protein</div>
                    <div className="text-base font-black text-rose-400">{calculatedMetrics.proteinGrams}g</div>
                    <div className="text-[9px] text-slate-500">~{calculatedMetrics.proteinGrams * 4} kcal</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Carbs</div>
                    <div className="text-base font-black text-amber-400">{calculatedMetrics.carbsGrams}g</div>
                    <div className="text-[9px] text-slate-500">~{calculatedMetrics.carbsGrams * 4} kcal</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Fat</div>
                    <div className="text-base font-black text-indigo-400">{calculatedMetrics.fatGrams}g</div>
                    <div className="text-[9px] text-slate-500">~{calculatedMetrics.fatGrams * 9} kcal</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-blue-500/30">
                    <div className="text-[10px] text-blue-300 font-bold">Water Intake</div>
                    <div className="text-base font-black text-blue-400">{calculatedMetrics.waterIntakeLiters} L</div>
                    <div className="text-[9px] text-blue-400 font-medium">hydrated</div>
                  </div>
                </div>
              </div>

              {/* Generate Plan Button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Click to generate the complete 7-meal daily nutrition blueprint tailored for your metabolism:
                </p>
                <button
                  onClick={handleGeneratePlan}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate 7-Meal Plan
                </button>
              </div>

              {/* Generated Plan Meals Display */}
              {currentPlan && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {currentPlan.title}
                        <span className="text-xs font-bold text-emerald-400">
                          ({currentPlan.dailyCalories} kcal • {currentPlan.proteinGrams}g P • {currentPlan.carbsGrams}g C • {currentPlan.fatGrams}g F)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Designed with 7 scheduled meals to optimize muscle protein synthesis & satiety.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveToCloud}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <Check className="w-4 h-4" />
                      Save Plan to Firebase
                    </button>
                  </div>

                  {/* 7 Meals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* 1. Breakfast */}
                    <MealCard
                      icon="🌅"
                      mealTime="Breakfast"
                      meal={currentPlan.meals.breakfast}
                    />

                    {/* 2. Morning Snack */}
                    <MealCard
                      icon="☕"
                      mealTime="Morning Snack"
                      meal={currentPlan.meals.morningSnack}
                    />

                    {/* 3. Lunch */}
                    <MealCard
                      icon="🥗"
                      mealTime="Lunch"
                      meal={currentPlan.meals.lunch}
                    />

                    {/* 4. Evening Snack */}
                    <MealCard
                      icon="🍵"
                      mealTime="Evening Snack"
                      meal={currentPlan.meals.eveningSnack}
                    />

                    {/* 5. Dinner */}
                    <MealCard
                      icon="🍲"
                      mealTime="Dinner"
                      meal={currentPlan.meals.dinner}
                    />

                    {/* 6. Pre Workout */}
                    <MealCard
                      icon="⚡"
                      mealTime="Pre Workout"
                      meal={currentPlan.meals.preWorkout}
                    />

                    {/* 7. Post Workout */}
                    <MealCard
                      icon="💪"
                      mealTime="Post Workout"
                      meal={currentPlan.meals.postWorkout}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Saved Plans View */
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search saved diet plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterGoal}
                    onChange={(e) => setFilterGoal(e.target.value)}
                    className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-slate-900">All Goals</option>
                    <option value="Weight Loss" className="bg-slate-900">Weight Loss</option>
                    <option value="Maintenance" className="bg-slate-900">Maintenance</option>
                    <option value="Weight Gain" className="bg-slate-900">Weight Gain</option>
                  </select>
                </div>
              </div>

              {filteredSavedPlans.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
                  <Apple className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No Saved Diet Plans</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Use the Calculator & Generator tab to calculate your nutritional requirements and save your personalized 7-meal schedule.
                  </p>
                  <button
                    onClick={() => setActiveTab("calculator")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs"
                  >
                    Generate a Diet Plan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredSavedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {plan.goal}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                        <div className="text-xs text-slate-400">
                          {plan.dailyCalories} kcal • {plan.proteinGrams}g Protein • {plan.carbsGrams}g Carbs • {plan.fatGrams}g Fat • {plan.waterIntakeLiters}L Water
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setCurrentPlan(plan);
                            setActiveTab("calculator");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          View / Edit Plan
                        </button>
                        <button
                          onClick={() => setDeletingPlan(plan)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Confirmation before delete */}
      <ConfirmationDialog
        isOpen={Boolean(deletingPlan)}
        title="Delete Diet Plan?"
        message={`Are you sure you want to delete "${deletingPlan?.title}" from Firebase Firestore?`}
        confirmLabel="Yes, Delete"
        cancelLabel="Keep Plan"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeletePlanConfirm}
        onClose={() => setDeletingPlan(null)}
      />
    </div>
  );
};

interface MealCardProps {
  icon: string;
  mealTime: string;
  meal: {
    title: string;
    items: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

function MealCard({ icon, mealTime, meal }: MealCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {mealTime}
            </div>
            <h4 className="text-xs font-bold text-white">{meal.title}</h4>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-black text-emerald-400">{meal.calories} kcal</div>
          <div className="text-[9px] text-slate-400">
            {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
          </div>
        </div>
      </div>

      <ul className="text-xs text-slate-300 space-y-1 pl-1">
        {meal.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5 leading-relaxed text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
