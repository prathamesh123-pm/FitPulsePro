import React, { useState, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  Check,
  AlertCircle,
  Flame,
  Droplets,
  Search,
  X,
  Sparkles,
  PieChart as PieIcon,
  Trash2,
  Clock,
  Apple,
  Coffee,
  CheckCircle2,
  Calendar,
  Footprints,
  Moon,
  Target,
  Edit3,
  Award,
  ChevronLeft,
  ChevronRight,
  Wheat,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Star,
  Copy,
  Edit2,
  Utensils,
  Save,
  Filter,
  Download,
} from "lucide-react";
import {
  DailyNutritionLog,
  MealPlanItem,
  FoodItem,
  CheatMealLog,
  HealthCalculations,
  MealType,
  CustomFoodItem,
  SavedDietPlan,
} from "../types";
import { COMMON_FOOD_DATABASE } from "../data/foodDatabase";
import {
  CustomFoodLibraryModal,
  FOOD_UNITS,
  MEAL_TYPES,
} from "./CustomFoodLibraryModal";
import { saveCustomFoodToCloud } from "../services/firebase";
import { exportDietLogsToCSV } from "../utils/csvExport";
import { SavedDietPlansManager } from "./SavedDietPlansManager";
import { DailyDietChecklist } from "./DailyDietChecklist";
import { DailyCalorieNutritionReport } from "./DailyCalorieNutritionReport";
import { AIDietAnalysis } from "./AIDietAnalysis";
import { DEFAULT_SAVED_DIET_PLANS } from "../data/defaultDietPlans";

interface DietViewProps {
  dailyNutrition: Record<string, DailyNutritionLog>;
  healthMetrics: HealthCalculations;
  onUpdateDailyNutrition: (date: string, updated: DailyNutritionLog) => void;
  customFoods?: CustomFoodItem[];
  onUpdateCustomFoods?: (foods: CustomFoodItem[]) => void;
  savedDietPlans?: SavedDietPlan[];
  activeDietPlanId?: string;
  onUpdateSavedDietPlans?: (plans: SavedDietPlan[]) => void;
  onSelectActiveDietPlan?: (planId: string) => void;
  userId?: string;
  isWorkoutCompletedToday?: boolean;
}

const ALL_MEAL_TYPES: MealType[] = [
  "Morning Water",
  "Breakfast",
  "Mid Morning",
  "Lunch",
  "Pre Workout",
  "Post Workout",
  "Evening Snack",
  "Dinner",
  "Before Sleep",
];

export function DietView({
  dailyNutrition,
  healthMetrics,
  onUpdateDailyNutrition,
  customFoods = [],
  onUpdateCustomFoods,
  savedDietPlans = [],
  activeDietPlanId,
  onUpdateSavedDietPlans,
  onSelectActiveDietPlan,
  userId = "user_local",
  isWorkoutCompletedToday = false,
}: DietViewProps) {
  const realToday = new Date().toISOString().split("T")[0];
  const currentDate = dailyNutrition[realToday] ? realToday : (dailyNutrition["2026-08-28"] ? "2026-08-28" : realToday);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [activeDietSubTab, setActiveDietSubTab] = useState<
    "meals" | "checklist" | "calorieReport" | "aiAnalysis" | "savedPlans"
  >("meals");
  const [localSavedPlans, setLocalSavedPlans] = useState<SavedDietPlan[]>(
    savedDietPlans && savedDietPlans.length > 0
      ? savedDietPlans
      : DEFAULT_SAVED_DIET_PLANS
  );

  // Sync prop changes
  React.useEffect(() => {
    if (savedDietPlans && savedDietPlans.length > 0) {
      setLocalSavedPlans(savedDietPlans);
    }
  }, [savedDietPlans]);

  const currentActivePlanId =
    activeDietPlanId ||
    localSavedPlans.find((p) => p.isActive)?.id ||
    localSavedPlans[0]?.id;
  const currentActivePlan =
    localSavedPlans.find((p) => p.id === currentActivePlanId) ||
    localSavedPlans[0];

  const handleUpdateSavedPlans = (plans: SavedDietPlan[]) => {
    setLocalSavedPlans(plans);
    if (onUpdateSavedDietPlans) {
      onUpdateSavedDietPlans(plans);
    }
  };

  const handleSelectActivePlan = (planId: string) => {
    const updated = localSavedPlans.map((p) => ({
      ...p,
      isActive: p.id === planId,
    }));
    setLocalSavedPlans(updated);
    if (onUpdateSavedDietPlans) {
      onUpdateSavedDietPlans(updated);
    }
    if (onSelectActiveDietPlan) {
      onSelectActiveDietPlan(planId);
    }
  };

  const handleApplyPlanToDate = (plan: SavedDietPlan, targetDate: string) => {
    const targetLog = dailyNutrition[targetDate] || currentDayLog;
    const appliedMeals: MealPlanItem[] = plan.meals.map((m) => ({
      id: `meal-${m.mealName.toLowerCase().replace(/\s+/g, "-")}`,
      mealType: m.mealName as MealType,
      plannedTime: m.mealTime || "08:00",
      actualTime: "",
      completed: false,
      missed: false,
      notes: m.notes || "",
      foods: (m.foods || []).map((f) => ({
        id: `logged-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        servingSize: `${f.quantity} ${f.unit}`,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber || 0,
        sugar: f.sugar || 0,
        waterMl: f.waterMl || 0,
        notes: "",
      })),
    }));

    onUpdateDailyNutrition(targetDate, {
      ...targetLog,
      meals: appliedMeals,
      waterLoggedMl: plan.totalWaterMl || targetLog.waterLoggedMl || 2500,
    });
  };
  const [activeMealForFoodAdd, setActiveMealForFoodAdd] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [isCheatMealModalOpen, setIsCheatMealModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  // Food Library & Manual Entry States
  const [isFoodLibraryModalOpen, setIsFoodLibraryModalOpen] = useState(false);
  const [foodAddTab, setFoodAddTab] = useState<"library" | "manual">("library");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Manual Food Form inside Add Modal
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualFoodMealType, setManualFoodMealType] = useState<string>("Lunch");
  const [manualFoodQuantity, setManualFoodQuantity] = useState<number>(100);
  const [manualFoodUnit, setManualFoodUnit] = useState<string>("Gram");
  const [manualFoodCalories, setManualFoodCalories] = useState<number>(150);
  const [manualFoodProtein, setManualFoodProtein] = useState<number>(10);
  const [manualFoodCarbs, setManualFoodCarbs] = useState<number>(15);
  const [manualFoodFat, setManualFoodFat] = useState<number>(4);
  const [manualFoodFiber, setManualFoodFiber] = useState<number>(2);
  const [manualFoodSugar, setManualFoodSugar] = useState<number>(1);
  const [manualFoodNotes, setManualFoodNotes] = useState<string>("");
  const [manualFoodSaveToLibrary, setManualFoodSaveToLibrary] = useState<boolean>(true);

  // Editing Logged Food within a meal
  const [editingLoggedFood, setEditingLoggedFood] = useState<{
    mealId: string;
    foodIndex: number;
    food: FoodItem;
  } | null>(null);

  const [editFoodName, setEditFoodName] = useState("");
  const [editFoodQuantity, setEditFoodQuantity] = useState(100);
  const [editFoodUnit, setEditFoodUnit] = useState("Gram");
  const [editFoodCalories, setEditFoodCalories] = useState(150);
  const [editFoodProtein, setEditFoodProtein] = useState(10);
  const [editFoodCarbs, setEditFoodCarbs] = useState(15);
  const [editFoodFat, setEditFoodFat] = useState(4);
  const [editFoodFiber, setEditFoodFiber] = useState(2);
  const [editFoodSugar, setEditFoodSugar] = useState(1);
  const [editFoodNotes, setEditFoodNotes] = useState("");

  // Custom Step input state
  const [manualSteps, setManualSteps] = useState(8500);
  const [manualActiveMinutes, setManualActiveMinutes] = useState(45);
  const [manualSleep, setManualSleep] = useState(7.5);

  // Custom Cheat Meal Form State
  const [cheatName, setCheatName] = useState("");
  const [cheatReason, setCheatReason] = useState("");
  const [cheatCalories, setCheatCalories] = useState(550);
  const [cheatBurnPlan, setCheatBurnPlan] = useState("35 min incline walking + 200 kcal reduction tomorrow");

  // Get current day's log or create initial template
  const currentDayLog: DailyNutritionLog = useMemo(() => {
    if (dailyNutrition[selectedDate]) return dailyNutrition[selectedDate];

    // Default template with all 9 meals (Section 29)
    const defaultMeals: MealPlanItem[] = ALL_MEAL_TYPES.map((type, idx) => ({
      id: `meal-${type.toLowerCase().replace(/\s+/g, "-")}`,
      mealType: type,
      plannedTime: ["06:45", "08:15", "10:45", "13:15", "16:30", "18:15", "19:30", "21:00", "22:30"][idx],
      actualTime: "",
      completed: false,
      missed: false,
      notes: "",
      foods: [],
    }));

    return {
      date: selectedDate,
      meals: defaultMeals,
      waterLoggedMl: 1750,
      stepsCount: 8500,
      walkingDistanceKm: 6.4,
      activeMinutes: 45,
      sleepHours: 7.5,
      activeCaloriesBurned: 450,
      cheatMeals: [],
    };
  }, [dailyNutrition, selectedDate]);

  // Compute totals & diet statuses (Sections 29 & 30)
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let completedMealsCount = 0;
    let missedMealsCount = 0;
    const completedMealNames: string[] = [];
    const missedMealNames: string[] = [];

    currentDayLog.meals.forEach((meal) => {
      if (meal.completed) {
        completedMealsCount++;
        completedMealNames.push(meal.mealType);
      }
      if (meal.missed) {
        missedMealsCount++;
        missedMealNames.push(meal.mealType);
      }

      meal.foods.forEach((f) => {
        calories += f.calories;
        protein += f.protein;
        carbs += f.carbs;
        fat += f.fat;
        fiber += f.fiber || 0;
      });
    });

    // Add cheat meal calories if any
    const cheatCaloriesSum = (currentDayLog.cheatMeals || []).reduce((acc, c) => acc + c.calories, 0);
    calories += cheatCaloriesSum;

    const targetCal = healthMetrics.dailyCaloriesRequired;
    const targetProt = healthMetrics.dailyProteinGrams;
    const targetCarbs = healthMetrics.dailyCarbsGrams;
    const targetFat = healthMetrics.dailyFatGrams;
    const targetFiber = 32; // Recommended daily fiber (grams)
    const targetWater = healthMetrics.dailyWaterMl;

    // SECTION 29: Status Logic
    // If any meal is skipped -> "Diet Missed"
    // If calorie target is exceeded -> "Diet Broken"
    // Otherwise -> "Diet Followed"
    let status: "Diet Followed" | "Diet Missed" | "Diet Broken" = "Diet Followed";
    if (missedMealsCount > 0) {
      status = "Diet Missed";
    } else if (calories > targetCal + 50) {
      status = "Diet Broken";
    } else {
      status = "Diet Followed";
    }

    // Meal completion percentage
    const mealCompletionPct = Math.round((completedMealsCount / currentDayLog.meals.length) * 100);

    // Diet Score (0 - 100)
    let score = 50;
    const calDiff = Math.abs(calories - targetCal) / targetCal;
    if (calDiff <= 0.08) score += 25;
    else if (calDiff <= 0.15) score += 15;
    else if (calDiff <= 0.25) score += 5;

    const protRatio = protein / targetProt;
    if (protRatio >= 0.9) score += 20;
    else if (protRatio >= 0.7) score += 10;

    if (missedMealsCount === 0 && completedMealsCount >= 5) score += 5;
    if (status === "Diet Broken") score = Math.max(25, score - 20);
    if (status === "Diet Missed") score = Math.max(30, score - 15);

    // Step tracker derivations (Section 31)
    const steps = currentDayLog.stepsCount || 0;
    const stepTarget = 10000;
    const stepCompletionPct = Math.min(100, Math.round((steps / stepTarget) * 100));
    const distanceKm = currentDayLog.walkingDistanceKm || Number((steps * 0.00075).toFixed(2));
    const stepCaloriesBurned = Math.round(steps * 0.04);
    const activeMins = currentDayLog.activeMinutes || Math.round(steps / 100);
    const sleep = currentDayLog.sleepHours || 7.5;

    // Overall Daily Fitness Score (Section 32)
    let dailyFitnessScore = 50;
    if (isWorkoutCompletedToday) dailyFitnessScore += 15;
    if (status === "Diet Followed") dailyFitnessScore += 15;
    else if (status === "Diet Missed") dailyFitnessScore += 5;
    if (steps >= 10000) dailyFitnessScore += 10;
    if (currentDayLog.waterLoggedMl >= targetWater * 0.8) dailyFitnessScore += 5;
    if (protein >= targetProt * 0.85) dailyFitnessScore += 5;

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber),
      targetFiber,
      completedMealsCount,
      missedMealsCount,
      completedMealNames,
      missedMealNames,
      mealCompletionPct,
      dietScore: Math.min(100, score),
      dietStatus: status,
      remainingCalories: Math.max(0, targetCal - Math.round(calories)),
      netCalories: Math.round(calories) - (currentDayLog.activeCaloriesBurned || 450),
      steps,
      stepTarget,
      stepCompletionPct,
      distanceKm,
      stepCaloriesBurned,
      activeMins,
      sleep,
      dailyFitnessScore: Math.min(100, dailyFitnessScore),
    };
  }, [currentDayLog, healthMetrics, isWorkoutCompletedToday]);

  // Update a meal in state
  const handleUpdateMeal = (mealId: string, updates: Partial<MealPlanItem>) => {
    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === mealId) {
        return { ...m, ...updates };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
      dietStatus: totals.dietStatus,
    });
  };

  // Add food to meal
  const handleAddFoodToMeal = (food: FoodItem) => {
    if (!activeMealForFoodAdd) return;

    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === activeMealForFoodAdd) {
        return {
          ...m,
          completed: true,
          missed: false,
          foods: [...m.foods, { ...food, id: `item-${Date.now()}` }],
        };
      }
      return m;
    });

    const extraWater = food.waterMl || 0;

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      waterLoggedMl: (currentDayLog.waterLoggedMl || 0) + extraWater,
      meals: updatedMeals,
    });

    setActiveMealForFoodAdd(null);
    setFoodSearchQuery("");
  };

  // Open Add Food modal with defaults
  const handleOpenAddFoodModal = (mealId: string, mealType: string) => {
    setActiveMealForFoodAdd(mealId);
    setFoodAddTab("library");
    setFoodSearchQuery("");
    setManualFoodMealType(mealType);
    setManualFoodName("");
    setManualFoodQuantity(100);
    setManualFoodUnit("Gram");
    setManualFoodCalories(150);
    setManualFoodProtein(10);
    setManualFoodCarbs(15);
    setManualFoodFat(4);
    setManualFoodFiber(2);
    setManualFoodSugar(1);
    setManualFoodNotes("");
    setManualFoodSaveToLibrary(true);
  };

  // Add food from library to meal
  const handleSelectLibraryFoodForMeal = (food: CustomFoodItem, targetMealId?: string) => {
    const mealId = targetMealId || activeMealForFoodAdd;
    if (!mealId) return;

    const newFoodItem: FoodItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: food.name,
      quantity: food.quantity || 100,
      unit: food.unit || "Gram",
      servingSize: `${food.quantity || 100} ${food.unit || "Gram"}`,
      mealType: food.mealType,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      notes: food.notes || "",
      isCustom: true,
      isFavorite: food.isFavorite,
    };

    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === mealId) {
        return {
          ...m,
          completed: true,
          missed: false,
          foods: [...m.foods, newFoodItem],
        };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });

    // Update lastUsed timestamp for this custom food
    if (onUpdateCustomFoods) {
      const updatedList = customFoods.map((cf) =>
        cf.id === food.id ? { ...cf, lastUsed: new Date().toISOString() } : cf
      );
      onUpdateCustomFoods(updatedList);
      saveCustomFoodToCloud(userId, { ...food, lastUsed: new Date().toISOString() }).catch(() => {});
    }

    setActiveMealForFoodAdd(null);
  };

  // Manual Food Entry Submission
  const handleSaveManualFoodToMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMealForFoodAdd || !manualFoodName.trim()) return;

    const newFoodItem: FoodItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: manualFoodName.trim(),
      quantity: Number(manualFoodQuantity) || 1,
      unit: manualFoodUnit,
      servingSize: `${manualFoodQuantity} ${manualFoodUnit}`,
      mealType: manualFoodMealType,
      calories: Number(manualFoodCalories) || 0,
      protein: Number(manualFoodProtein) || 0,
      carbs: Number(manualFoodCarbs) || 0,
      fat: Number(manualFoodFat) || 0,
      fiber: Number(manualFoodFiber) || 0,
      sugar: Number(manualFoodSugar) || 0,
      notes: manualFoodNotes.trim(),
      isCustom: true,
    };

    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === activeMealForFoodAdd) {
        return {
          ...m,
          completed: true,
          missed: false,
          foods: [...m.foods, newFoodItem],
        };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });

    // If checkbox checked, save permanently to user's food library in Firebase
    if (manualFoodSaveToLibrary && onUpdateCustomFoods) {
      const nowIso = new Date().toISOString();
      const newCustomFood: CustomFoodItem = {
        id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: manualFoodName.trim(),
        mealType: manualFoodMealType,
        quantity: Number(manualFoodQuantity) || 1,
        unit: manualFoodUnit,
        calories: Number(manualFoodCalories) || 0,
        protein: Number(manualFoodProtein) || 0,
        carbs: Number(manualFoodCarbs) || 0,
        fat: Number(manualFoodFat) || 0,
        fiber: Number(manualFoodFiber) || 0,
        sugar: Number(manualFoodSugar) || 0,
        notes: manualFoodNotes.trim(),
        isFavorite: false,
        isCustom: true,
        lastUsed: nowIso,
        createdAt: nowIso,
      };

      onUpdateCustomFoods([newCustomFood, ...customFoods]);
      saveCustomFoodToCloud(userId, newCustomFood).catch(() => {});
    }

    setActiveMealForFoodAdd(null);
  };

  // Open Edit Logged Food
  const handleOpenEditLoggedFood = (mealId: string, foodIndex: number, food: FoodItem) => {
    setEditingLoggedFood({ mealId, foodIndex, food });
    setEditFoodName(food.name);
    setEditFoodQuantity(food.quantity || 100);
    setEditFoodUnit(food.unit || "Gram");
    setEditFoodCalories(food.calories || 0);
    setEditFoodProtein(food.protein || 0);
    setEditFoodCarbs(food.carbs || 0);
    setEditFoodFat(food.fat || 0);
    setEditFoodFiber(food.fiber || 0);
    setEditFoodSugar(food.sugar || 0);
    setEditFoodNotes(food.notes || "");
  };

  // Save Edited Logged Food
  const handleSaveEditedLoggedFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoggedFood || !editFoodName.trim()) return;

    const { mealId, foodIndex } = editingLoggedFood;
    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === mealId) {
        const nextFoods = [...m.foods];
        nextFoods[foodIndex] = {
          ...nextFoods[foodIndex],
          name: editFoodName.trim(),
          quantity: Number(editFoodQuantity) || 1,
          unit: editFoodUnit,
          servingSize: `${editFoodQuantity} ${editFoodUnit}`,
          calories: Number(editFoodCalories) || 0,
          protein: Number(editFoodProtein) || 0,
          carbs: Number(editFoodCarbs) || 0,
          fat: Number(editFoodFat) || 0,
          fiber: Number(editFoodFiber) || 0,
          sugar: Number(editFoodSugar) || 0,
          notes: editFoodNotes.trim(),
        };
        return { ...m, foods: nextFoods };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });

    setEditingLoggedFood(null);
  };

  // Delete food from meal
  const handleDeleteLoggedFood = (mealId: string, foodIndex: number) => {
    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === mealId) {
        const nextFoods = [...m.foods];
        nextFoods.splice(foodIndex, 1);
        return { ...m, foods: nextFoods };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });

    if (editingLoggedFood && editingLoggedFood.mealId === mealId && editingLoggedFood.foodIndex === foodIndex) {
      setEditingLoggedFood(null);
    }
  };

  // Copy previous meal
  const handleCopyPreviousMeal = (mealType: MealType, targetMealId: string) => {
    const previousDates = Object.keys(dailyNutrition)
      .filter((d) => d < selectedDate)
      .sort()
      .reverse();

    let foundFoods: FoodItem[] = [];
    let sourceDate = "";

    for (const d of previousDates) {
      const dayLog = dailyNutrition[d];
      const matchMeal = dayLog?.meals?.find((m) => m.mealType === mealType);
      if (matchMeal && matchMeal.foods && matchMeal.foods.length > 0) {
        foundFoods = matchMeal.foods;
        sourceDate = d;
        break;
      }
    }

    if (foundFoods.length === 0) {
      const otherDates = Object.keys(dailyNutrition)
        .filter((d) => d !== selectedDate)
        .sort()
        .reverse();
      for (const d of otherDates) {
        const dayLog = dailyNutrition[d];
        const matchMeal = dayLog?.meals?.find((m) => m.mealType === mealType);
        if (matchMeal && matchMeal.foods && matchMeal.foods.length > 0) {
          foundFoods = matchMeal.foods;
          sourceDate = d;
          break;
        }
      }
    }

    if (foundFoods.length === 0) {
      alert(`No previous logged ${mealType} found to copy from. You can add foods manually or from your library.`);
      return;
    }

    const clonedFoods: FoodItem[] = foundFoods.map((f) => ({
      ...f,
      id: `logged-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    }));

    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === targetMealId) {
        return {
          ...m,
          completed: true,
          missed: false,
          foods: [...m.foods, ...clonedFoods],
        };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });

    setCopyFeedback(`Copied ${clonedFoods.length} food(s) from ${sourceDate} ${mealType}!`);
    setTimeout(() => setCopyFeedback(null), 4000);
  };

  // Copy all meals from yesterday
  const handleCopyAllMealsFromYesterday = () => {
    const previousDates = Object.keys(dailyNutrition)
      .filter((d) => d < selectedDate)
      .sort()
      .reverse();

    if (previousDates.length === 0) {
      alert("No previous day records found in log to copy.");
      return;
    }

    const sourceDate = previousDates[0];
    const sourceDay = dailyNutrition[sourceDate];
    if (!sourceDay || !sourceDay.meals || sourceDay.meals.length === 0) {
      alert(`No meals found in log for ${sourceDate}.`);
      return;
    }

    let copiedCount = 0;
    const newMeals = currentDayLog.meals.map((targetMeal) => {
      const sourceMeal = sourceDay.meals.find((sm) => sm.mealType === targetMeal.mealType);
      if (sourceMeal && sourceMeal.foods && sourceMeal.foods.length > 0) {
        copiedCount += sourceMeal.foods.length;
        const clonedFoods = sourceMeal.foods.map((f) => ({
          ...f,
          id: `logged-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        }));
        return {
          ...targetMeal,
          completed: sourceMeal.completed,
          notes: sourceMeal.notes || targetMeal.notes,
          foods: clonedFoods,
        };
      }
      return targetMeal;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: newMeals,
    });

    setCopyFeedback(`Successfully copied ${copiedCount} food(s) from ${sourceDate} into today's meals!`);
    setTimeout(() => setCopyFeedback(null), 4500);
  };

  // Remove food from meal
  const handleRemoveFood = (mealId: string, foodIndex: number) => {
    const updatedMeals = currentDayLog.meals.map((m) => {
      if (m.id === mealId) {
        const nextFoods = [...m.foods];
        nextFoods.splice(foodIndex, 1);
        return { ...m, foods: nextFoods };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      meals: updatedMeals,
    });
  };

  // Water Hydration Tracker
  const handleAddWater = (amountMl: number) => {
    const nextAmount = Math.max(0, (currentDayLog.waterLoggedMl || 0) + amountMl);
    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      waterLoggedMl: nextAmount,
    });
  };

  // Manual Steps Entry (Section 31)
  const handleSaveManualSteps = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      stepsCount: manualSteps,
      walkingDistanceKm: Number((manualSteps * 0.00075).toFixed(2)),
      activeMinutes: manualActiveMinutes,
      activeCaloriesBurned: Math.round(manualSteps * 0.04) + 200,
    });
    setIsStepModalOpen(false);
  };

  // Manual Sleep Entry
  const handleSaveManualSleep = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      sleepHours: manualSleep,
    });
    setIsSleepModalOpen(false);
  };

  // Add Cheat Meal
  const handleSaveCheatMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheatName.trim()) return;

    const newCheat: CheatMealLog = {
      id: `cheat-${Date.now()}`,
      foodName: cheatName,
      reason: cheatReason || "Planned Refeed",
      calories: cheatCalories,
      burnPlan: cheatBurnPlan,
      date: selectedDate,
    };

    onUpdateDailyNutrition(selectedDate, {
      ...currentDayLog,
      cheatMeals: [...(currentDayLog.cheatMeals || []), newCheat],
    });

    setIsCheatMealModalOpen(false);
    setCheatName("");
    setCheatReason("");
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Nutrition & Daily Fitness Engine</h1>
            <p className="text-xs text-slate-400">9-Meal Tracker, Calorie Dashboard, Step Counter & Daily Fitness Status</p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5 mr-2 text-emerald-400" />
            <span className="font-bold">{selectedDate}</span>
          </div>

          <button
            onClick={() => setIsStepModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Footprints className="h-3.5 w-3.5" />
            <span>Manual Steps</span>
          </button>

          <button
            onClick={() => setIsCheatMealModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Apple className="h-3.5 w-3.5" />
            <span>Cheat Meal</span>
          </button>

          <button
            onClick={() => exportDietLogsToCSV(dailyNutrition, "Athlete")}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-500/20"
            title="Export all historical diet & nutrition logs to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Diet (CSV)</span>
          </button>
        </div>
      </div>

      {/* Diet & Nutrition Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <button
          onClick={() => setActiveDietSubTab("meals")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeDietSubTab === "meals"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>9-Meal Tracker</span>
        </button>

        <button
          onClick={() => setActiveDietSubTab("checklist")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeDietSubTab === "checklist"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Daily Diet Checklist</span>
        </button>

        <button
          onClick={() => setActiveDietSubTab("calorieReport")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeDietSubTab === "calorieReport"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>Daily Calorie & Nutrition Report</span>
        </button>

        <button
          onClick={() => setActiveDietSubTab("aiAnalysis")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeDietSubTab === "aiAnalysis"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Diet Analysis</span>
        </button>

        <button
          onClick={() => setActiveDietSubTab("savedPlans")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeDietSubTab === "savedPlans"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Diet Plans ({localSavedPlans.length})</span>
        </button>
      </div>

      {activeDietSubTab === "meals" && (
        <>
          {/* SECTION 32: DAILY FITNESS STATUS BAR */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Section 32 • Daily Fitness Status
              </span>
              <span className="text-xs text-slate-400">Multi-Goal Adherence & Health Matrix</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 pt-0.5">Today's Daily Fitness Score: {totals.dailyFitnessScore}/100</h3>
          </div>

          {/* Master Status Badge */}
          <div className="flex items-center gap-2">
            {totals.dietStatus === "Diet Followed" && (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Diet Followed ✔</span>
              </span>
            )}
            {totals.dietStatus === "Diet Missed" && (
              <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Diet Missed ✘</span>
              </span>
            )}
            {totals.dietStatus === "Diet Broken" && (
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Diet Broken ⚠</span>
              </span>
            )}
          </div>
        </div>

        {/* 8 Metric Status Grid (Workout, Diet, Steps, Water, Protein, Sleep, Calories, Score) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          {/* 1. Workout Completed */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            isWorkoutCompletedToday ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Workout</span>
            <div className="font-bold text-sm">
              {isWorkoutCompletedToday ? "Done ✔" : "Pending ✘"}
            </div>
          </div>

          {/* 2. Diet Followed / Missed / Broken */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            totals.dietStatus === "Diet Followed"
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
              : totals.dietStatus === "Diet Missed"
              ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
              : "bg-amber-950/20 border-amber-500/40 text-amber-300"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Diet Status</span>
            <div className="font-bold text-xs">
              {totals.dietStatus === "Diet Followed" && "Followed ✔"}
              {totals.dietStatus === "Diet Missed" && "Missed ✘"}
              {totals.dietStatus === "Diet Broken" && "Broken ⚠"}
            </div>
          </div>

          {/* 3. Steps Completed */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            totals.steps >= totals.stepTarget ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Steps Goal</span>
            <div className="font-bold text-sm">
              {totals.steps >= totals.stepTarget ? "10k+ ✔" : `${totals.stepCompletionPct}%`}
            </div>
          </div>

          {/* 4. Water Goal */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            currentDayLog.waterLoggedMl >= healthMetrics.dailyWaterMl ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Water Goal</span>
            <div className="font-bold text-sm">
              {currentDayLog.waterLoggedMl >= healthMetrics.dailyWaterMl ? "Met ✔" : `${Math.round((currentDayLog.waterLoggedMl / healthMetrics.dailyWaterMl) * 100)}%`}
            </div>
          </div>

          {/* 5. Protein Goal */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            totals.protein >= healthMetrics.dailyProteinGrams * 0.9 ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Protein Goal</span>
            <div className="font-bold text-sm">
              {totals.protein >= healthMetrics.dailyProteinGrams * 0.9 ? "Met ✔" : `${totals.protein}/${healthMetrics.dailyProteinGrams}g`}
            </div>
          </div>

          {/* 6. Sleep Goal */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            totals.sleep >= 7 ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Sleep Goal</span>
            <div className="font-bold text-sm">
              {totals.sleep >= 7 ? `${totals.sleep}h ✔` : `${totals.sleep}h ✘`}
            </div>
          </div>

          {/* 7. Calories Goal */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            totals.dietStatus !== "Diet Broken" ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" : "bg-amber-950/20 border-amber-500/40 text-amber-300"
          }`}>
            <span className="text-[10px] uppercase font-bold block">Calorie Target</span>
            <div className="font-bold text-xs">
              {totals.dietStatus !== "Diet Broken" ? "In Budget ✔" : "Exceeded ⚠"}
            </div>
          </div>

          {/* 8. Overall Score */}
          <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 text-center space-y-0.5 font-bold shadow-md shadow-emerald-500/20">
            <span className="text-[10px] uppercase block tracking-wider">Fit Score</span>
            <div className="text-base font-black">{totals.dailyFitnessScore}/100</div>
          </div>
        </div>
      </div>

      {/* SECTION 30: DAILY CALORIE DASHBOARD */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              Section 30 • Daily Calorie Dashboard
            </span>
            <h3 className="text-base font-extrabold text-slate-100 pt-1">
              Calorie Budget: {healthMetrics.dailyCaloriesRequired} kcal Target
            </h3>
            <p className="text-xs text-slate-400">
              Live breakdown of Calories, Protein, Carbs, Fat, Fiber, Water & Net Energy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              Diet Adherence Score: {totals.dietScore}/100
            </div>
          </div>
        </div>

        {/* 6 Calorie & Macro Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Calories (Consumed, Burned, Remaining, Net) */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Calories Budget</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round((totals.calories / healthMetrics.dailyCaloriesRequired) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{totals.calories}</span>
              <span className="text-xs text-slate-500">Target: {healthMetrics.dailyCaloriesRequired} kcal</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totals.calories > healthMetrics.dailyCaloriesRequired
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-400"
                }`}
                style={{ width: `${Math.min(100, (totals.calories / healthMetrics.dailyCaloriesRequired) * 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span>Burned</span>
                <strong className="block text-slate-200 font-mono">{currentDayLog.activeCaloriesBurned} kcal</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong className="block text-emerald-400 font-mono">{totals.remainingCalories} kcal</strong>
              </div>
              <div>
                <span>Net</span>
                <strong className="block text-sky-400 font-mono">{totals.netCalories} kcal</strong>
              </div>
            </div>
          </div>

          {/* 2. Protein Target & Consumed */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Protein Synthesis</span>
              <span className="font-mono text-sky-400 font-bold">
                {Math.round((totals.protein / healthMetrics.dailyProteinGrams) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{totals.protein}g</span>
              <span className="text-xs text-slate-500">Target: {healthMetrics.dailyProteinGrams}g</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.protein / healthMetrics.dailyProteinGrams) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Remaining: <strong className="text-slate-200">{Math.max(0, healthMetrics.dailyProteinGrams - totals.protein)}g</strong></span>
              <span className="text-emerald-400 font-medium">Hypertrophic stimulus</span>
            </div>
          </div>

          {/* 3. Carbohydrates */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Carbohydrates (Glycogen)</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round((totals.carbs / healthMetrics.dailyCarbsGrams) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{totals.carbs}g</span>
              <span className="text-xs text-slate-500">Target: {healthMetrics.dailyCarbsGrams}g</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.carbs / healthMetrics.dailyCarbsGrams) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Remaining: <strong className="text-slate-200">{Math.max(0, healthMetrics.dailyCarbsGrams - totals.carbs)}g</strong></span>
              <span className="text-slate-400">Workout energy</span>
            </div>
          </div>

          {/* 4. Fats */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Healthy Fats (Hormones)</span>
              <span className="font-mono text-purple-400 font-bold">
                {Math.round((totals.fat / healthMetrics.dailyFatGrams) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{totals.fat}g</span>
              <span className="text-xs text-slate-500">Target: {healthMetrics.dailyFatGrams}g</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.fat / healthMetrics.dailyFatGrams) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Remaining: <strong className="text-slate-200">{Math.max(0, healthMetrics.dailyFatGrams - totals.fat)}g</strong></span>
              <span className="text-purple-300">Endocrine support</span>
            </div>
          </div>

          {/* 5. Dietary Fiber (Section 29 & 30) */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Wheat className="h-3.5 w-3.5 text-amber-300" />
                <span>Dietary Fiber</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {Math.round((totals.fiber / totals.targetFiber) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{totals.fiber}g</span>
              <span className="text-xs text-slate-500">Target: {totals.targetFiber}g</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totals.fiber / totals.targetFiber) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Gut microbiome</span>
              <span className="text-emerald-400">Digestive health</span>
            </div>
          </div>

          {/* 6. Water Hydration */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                <span>Water Hydration</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {Math.round((currentDayLog.waterLoggedMl / healthMetrics.dailyWaterMl) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">{currentDayLog.waterLoggedMl} ml</span>
              <span className="text-xs text-slate-500">Goal: {healthMetrics.dailyWaterMl} ml</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentDayLog.waterLoggedMl / healthMetrics.dailyWaterMl) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-1 pt-1">
              <button
                onClick={() => handleAddWater(250)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 cursor-pointer"
              >
                +250ml
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[10px] font-bold border border-cyan-500/40 cursor-pointer"
              >
                +500ml
              </button>
              <button
                onClick={() => handleAddWater(-250)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] cursor-pointer"
              >
                -250ml
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 31: STEP TRACKER & ACTIVE CARDIO */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Section 31 • Step Tracker
              </span>
              <span className="text-xs text-slate-400">Pedometer & Non-Exercise Activity Thermogenesis (NEAT)</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-100 pt-1">
              Daily Movement & Step Cadence
            </h3>
          </div>

          <button
            onClick={() => setIsStepModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Manual Step Entry</span>
          </button>
        </div>

        {/* 5 Step Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Daily Steps</span>
            <div className="text-2xl font-black text-slate-100 pt-0.5">{totals.steps.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Goal: 10,000</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Walking Distance</span>
            <div className="text-2xl font-black text-emerald-400 pt-0.5">{totals.distanceKm} km</div>
            <span className="text-[10px] text-slate-500">Pedestrian log</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Calories Burned</span>
            <div className="text-2xl font-black text-amber-400 pt-0.5">{totals.stepCaloriesBurned} kcal</div>
            <span className="text-[10px] text-slate-500">Active NEAT</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Minutes</span>
            <div className="text-2xl font-black text-sky-400 pt-0.5">{totals.activeMins} min</div>
            <span className="text-[10px] text-slate-500">Cardiovascular zone</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Goal Completion</span>
            <div className="text-2xl font-black text-purple-400 pt-0.5">{totals.stepCompletionPct}%</div>
            <span className="text-[10px] text-slate-500">{totals.steps >= 10000 ? "Goal Achieved ✔" : "In Progress"}</span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress to 10,000 steps</span>
            <span className="font-bold text-emerald-400">{totals.steps.toLocaleString()} / 10,000</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{ width: `${totals.stepCompletionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 29: DAILY DIET TRACKER (9 MEALS GRID) */}
      <div className="space-y-4">
        {copyFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{copyFeedback}</span>
            </div>
            <button onClick={() => setCopyFeedback(null)} className="text-emerald-400/80 hover:text-emerald-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Section 29 • Daily Diet Tracker
              </span>
              <span className="text-xs text-slate-400">9-Meal Structured Daily Timeline</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 pt-1">Scheduled Meals & Macronutrient Breakdown</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Food Library Management Button */}
            <button
              onClick={() => setIsFoodLibraryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Open Personal Food Library to search, add, edit, or delete saved foods"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Food Library</span>
              {customFoods.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px]">
                  {customFoods.length}
                </span>
              )}
            </button>

            {/* Copy All from Yesterday Button */}
            <button
              onClick={handleCopyAllMealsFromYesterday}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Duplicate all foods from previous logged day into today's timeline"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy All from Yesterday</span>
            </button>

            {/* Meal completion summary */}
            <div className="flex items-center gap-3 text-xs bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">
                Done: <strong className="text-emerald-400">{totals.completedMealsCount}</strong>/9
              </span>
              <span className="text-slate-400">
                Missed: <strong className="text-rose-400">{totals.missedMealsCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 9 Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentDayLog.meals.map((meal) => {
            const mealCalories = meal.foods.reduce((acc, f) => acc + f.calories, 0);
            const mealProtein = meal.foods.reduce((acc, f) => acc + f.protein, 0);
            const mealCarbs = meal.foods.reduce((acc, f) => acc + f.carbs, 0);
            const mealFat = meal.foods.reduce((acc, f) => acc + f.fat, 0);
            const mealFiber = meal.foods.reduce((acc, f) => acc + (f.fiber || 0), 0);

            return (
              <div
                key={meal.id}
                className={`rounded-2xl border p-4 space-y-3 transition flex flex-col justify-between ${
                  meal.completed
                    ? "bg-slate-900/90 border-slate-700/80 shadow-sm"
                    : meal.missed
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Completed Toggle Button */}
                      <button
                        onClick={() =>
                          handleUpdateMeal(meal.id, { completed: !meal.completed, missed: false })
                        }
                        className={`h-6 w-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          meal.completed
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-slate-800 border border-slate-700 text-slate-500 hover:text-emerald-400"
                        }`}
                        title="Mark Completed ✔"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>

                      {/* Missed Toggle Button */}
                      <button
                        onClick={() =>
                          handleUpdateMeal(meal.id, { missed: !meal.missed, completed: false })
                        }
                        className={`h-6 w-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          meal.missed
                            ? "bg-rose-500 text-white font-bold"
                            : "bg-slate-800 border border-slate-700 text-slate-500 hover:text-rose-400"
                        }`}
                        title="Mark Missed ✘"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <h4 className={`text-xs font-bold ${meal.completed ? "text-slate-100" : meal.missed ? "text-rose-300" : "text-slate-300"}`}>
                        {meal.mealType}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{meal.plannedTime}</span>
                    </div>
                  </div>

                  {/* Meal Macro & Calorie Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300">
                    <span className="font-mono font-bold text-amber-400">{mealCalories} kcal</span>
                    <span className="text-sky-400 font-semibold">{mealProtein}g P</span>
                    <span className="text-emerald-400 font-semibold">{mealCarbs}g C</span>
                    <span className="text-purple-400 font-semibold">{mealFat}g F</span>
                    {mealFiber > 0 && <span className="text-amber-300 font-semibold">{mealFiber}g Fib</span>}
                  </div>

                  {/* Foods list */}
                  <div className="space-y-1.5 min-h-[50px]">
                    {meal.foods.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic py-1.5">No foods logged yet</p>
                    ) : (
                      meal.foods.map((food, fIdx) => (
                        <div
                          key={food.id || fIdx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-300 group hover:border-slate-700 transition"
                        >
                          <div className="truncate max-w-[150px]">
                            <span className="font-medium text-slate-200">{food.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1">({food.servingSize})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-400">{food.calories}kcal</span>
                            <button
                              onClick={() => handleOpenEditLoggedFood(meal.id, fIdx, food)}
                              className="text-slate-500 hover:text-sky-400 p-0.5 cursor-pointer transition"
                              title="Edit this food entry"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLoggedFood(meal.id, fIdx)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition"
                              title="Delete food from meal"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Meal Notes */}
                  {meal.notes && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-950 p-1.5 rounded-lg">
                      "{meal.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom meal actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenAddFoodModal(meal.id, meal.mealType)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border border-slate-700 transition"
                  >
                    <Plus className="h-3 w-3 text-emerald-400" />
                    <span>Add Food</span>
                  </button>

                  <button
                    onClick={() => handleCopyPreviousMeal(meal.mealType, meal.id)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 text-xs border border-slate-700 cursor-pointer flex items-center gap-1 transition"
                    title={`Copy previous ${meal.mealType} foods`}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="text-[10px] hidden sm:inline">Copy Prev</span>
                  </button>

                  <button
                    onClick={() => {
                      const notePrompt = prompt("Enter meal notes:", meal.notes || "");
                      if (notePrompt !== null) {
                        handleUpdateMeal(meal.id, { notes: notePrompt });
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs border border-slate-700 cursor-pointer transition"
                    title="Add notes"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHEAT MEAL LOGS */}
      {(currentDayLog.cheatMeals || []).length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Logged Cheat Meals & Compensation Protocol
            </h3>
            <span className="text-xs text-slate-400">Included in daily gross calorie intake</span>
          </div>

          <div className="space-y-2">
            {currentDayLog.cheatMeals?.map((cheat) => (
              <div
                key={cheat.id}
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{cheat.foodName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold">
                      +{cheat.calories} kcal
                    </span>
                  </div>
                  <p className="text-slate-400">Reason: {cheat.reason}</p>
                  <p className="text-emerald-400 font-medium">Burn Plan: {cheat.burnPlan}</p>
                </div>
                <span className="text-[10px] text-slate-500">{cheat.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* SUBTAB 2: DAILY DIET CHECKLIST */}
      {activeDietSubTab === "checklist" && (
        <DailyDietChecklist
          log={currentDayLog}
          activePlan={currentActivePlan}
          selectedDate={selectedDate}
          onUpdateDailyNutrition={onUpdateDailyNutrition}
          onOpenFoodLibraryModal={(mealId) => {
            setActiveMealForFoodAdd(mealId);
            setIsFoodLibraryModalOpen(true);
          }}
          onOpenSavedPlansModal={() => setActiveDietSubTab("savedPlans")}
        />
      )}

      {/* SUBTAB 3: DAILY CALORIE & NUTRITION REPORT */}
      {activeDietSubTab === "calorieReport" && (
        <DailyCalorieNutritionReport
          log={currentDayLog}
          healthMetrics={healthMetrics}
          selectedDate={selectedDate}
        />
      )}

      {/* SUBTAB 4: AI DIET ANALYSIS */}
      {activeDietSubTab === "aiAnalysis" && (
        <AIDietAnalysis
          log={currentDayLog}
          healthMetrics={healthMetrics}
          selectedDate={selectedDate}
        />
      )}

      {/* SUBTAB 5: SAVED DIET PLANS (FULL CRUD & APPLY) */}
      {activeDietSubTab === "savedPlans" && (
        <SavedDietPlansManager
          savedPlans={localSavedPlans}
          activePlanId={currentActivePlanId}
          selectedDate={selectedDate}
          onUpdateSavedPlans={handleUpdateSavedPlans}
          onSelectActivePlan={handleSelectActivePlan}
          onApplyPlanToDate={handleApplyPlanToDate}
        />
      )}

      {/* ENHANCED FOOD ADD MODAL (Library Search & Complete Manual Entry) */}
      {activeMealForFoodAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-400" />
                  <span>
                    Add Food to {currentDayLog.meals.find((m) => m.id === activeMealForFoodAdd)?.mealType || "Meal"}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select from your saved food library or enter complete manual nutritional details
                </p>
              </div>
              <button
                onClick={() => setActiveMealForFoodAdd(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFoodAddTab("library")}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  foodAddTab === "library"
                    ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Saved Foods & Library ({customFoods.length + COMMON_FOOD_DATABASE.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFoodAddTab("manual")}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  foodAddTab === "manual"
                    ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Manual Food Entry</span>
              </button>
            </div>

            {/* TAB 1: SAVED FOODS & LIBRARY */}
            {foodAddTab === "library" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Search Bar & Quick Filters */}
                <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search saved foods (e.g. Chicken, Rice, Oats, Protein Shake)..."
                      value={foodSearchQuery}
                      onChange={(e) => setFoodSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">Favorites & Library:</span>
                      <button
                        onClick={() => setIsFoodLibraryModalOpen(true)}
                        className="text-sky-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Manage Full Library</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setFoodAddTab("manual")}
                      className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>+ Manual Entry</span>
                    </button>
                  </div>
                </div>

                {/* Food List */}
                <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
                  {/* Custom Foods First */}
                  {customFoods
                    .filter((f) =>
                      f.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                      f.mealType?.toLowerCase().includes(foodSearchQuery.toLowerCase())
                    )
                    .map((food) => (
                      <div
                        key={food.id}
                        onClick={() => handleSelectLibraryFoodForMeal(food)}
                        className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/20 hover:border-emerald-500/60 hover:bg-slate-800 transition cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-100">{food.name}</h4>
                            {food.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                              Saved
                            </span>
                            {food.mealType && (
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-300 text-[10px]">
                                {food.mealType}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Serving: {food.quantity} {food.unit} • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                            {food.fiber ? ` • Fib: ${food.fiber}g` : ""}
                            {food.sugar ? ` • Sug: ${food.sugar}g` : ""}
                          </p>
                          {food.notes && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">"{food.notes}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 text-sm">{food.calories} kcal</span>
                          <span className="block text-[11px] text-emerald-400 font-bold mt-0.5 group-hover:underline">
                            + Add to Meal
                          </span>
                        </div>
                      </div>
                    ))}

                  {/* Common Foods Next */}
                  {COMMON_FOOD_DATABASE.filter((f) =>
                    f.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
                  ).map((food) => (
                    <div
                      key={food.id}
                      onClick={() => handleAddFoodToMeal(food)}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 transition cursor-pointer flex items-center justify-between text-xs group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-100">{food.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Serving: {food.servingSize} • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g • Fib: {food.fiber}g
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">{food.calories} kcal</span>
                        <span className="block text-[11px] text-slate-400 group-hover:text-emerald-400 font-semibold mt-0.5">
                          + Add
                        </span>
                      </div>
                    </div>
                  ))}

                  {customFoods.length === 0 && COMMON_FOOD_DATABASE.filter((f) =>
                    f.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="py-8 text-center text-slate-500 space-y-2">
                      <p className="text-xs">No foods found matching "{foodSearchQuery}".</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFoodAddTab("manual");
                          setManualFoodName(foodSearchQuery);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Create "{foodSearchQuery}" as Manual Food
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMPLETE MANUAL FOOD ENTRY */}
            {foodAddTab === "manual" && (
              <form onSubmit={handleSaveManualFoodToMeal} className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Food Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grilled Chicken Breast, Overnight Oats"
                      value={manualFoodName}
                      onChange={(e) => setManualFoodName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Meal Type</label>
                    <select
                      value={manualFoodMealType}
                      onChange={(e) => setManualFoodMealType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {MEAL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={manualFoodQuantity}
                      onChange={(e) => setManualFoodQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Unit</label>
                    <select
                      value={manualFoodUnit}
                      onChange={(e) => setManualFoodUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {FOOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Macronutrients Grid */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nutritional Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">
                        Calories (kcal) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={manualFoodCalories}
                        onChange={(e) => setManualFoodCalories(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">
                        Protein (g) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={manualFoodProtein}
                        onChange={(e) => setManualFoodProtein(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sky-400 font-mono font-bold focus:border-sky-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">
                        Carbohydrates (g) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={manualFoodCarbs}
                        onChange={(e) => setManualFoodCarbs(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">
                        Fat (g) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={manualFoodFat}
                        onChange={(e) => setManualFoodFat(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-purple-400 font-mono font-bold focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Fiber (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={manualFoodFiber}
                        onChange={(e) => setManualFoodFiber(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Sugar (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={manualFoodSugar}
                        onChange={(e) => setManualFoodSugar(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Notes / Preparation Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Skinless, grilled with black pepper and pink salt"
                    value={manualFoodNotes}
                    onChange={(e) => setManualFoodNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Permanent Library Storage Checkbox */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="saveToLibraryCheck"
                    checked={manualFoodSaveToLibrary}
                    onChange={(e) => setManualFoodSaveToLibrary(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="saveToLibraryCheck" className="text-[11px] text-slate-300 cursor-pointer">
                    <strong className="text-slate-100">Save permanently to My Food Library in Firebase</strong>
                    <p className="text-slate-400 text-[10px]">
                      This food item will be synced across all your devices and ready to log again anytime with one click.
                    </p>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFoodAddTab("library")}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer"
                  >
                    Back to Library
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Meal & Save</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT LOGGED FOOD MODAL */}
      {editingLoggedFood && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">Edit Logged Food</h3>
                  <p className="text-[11px] text-slate-400">Update quantity, unit, or nutritional macros</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLoggedFood(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLoggedFood} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Food Name</label>
                <input
                  type="text"
                  value={editFoodName}
                  onChange={(e) => setEditFoodName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={editFoodQuantity}
                    onChange={(e) => setEditFoodQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Unit</label>
                  <select
                    value={editFoodUnit}
                    onChange={(e) => setEditFoodUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500 cursor-pointer"
                  >
                    {FOOD_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={editFoodCalories}
                    onChange={(e) => setEditFoodCalories(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editFoodProtein}
                    onChange={(e) => setEditFoodProtein(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sky-400 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editFoodCarbs}
                    onChange={(e) => setEditFoodCarbs(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editFoodFat}
                    onChange={(e) => setEditFoodFat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-purple-400 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Fiber (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editFoodFiber}
                    onChange={(e) => setEditFoodFiber(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-0.5">Sugar (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editFoodSugar}
                    onChange={(e) => setEditFoodSugar(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notes</label>
                <input
                  type="text"
                  value={editFoodNotes}
                  onChange={(e) => setEditFoodNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteLoggedFood(editingLoggedFood.mealId, editingLoggedFood.foodIndex)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLoggedFood(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PERSONAL FOOD LIBRARY MODAL */}
      {isFoodLibraryModalOpen && (
        <CustomFoodLibraryModal
          customFoods={customFoods}
          onUpdateCustomFoods={onUpdateCustomFoods || (() => {})}
          userId={userId}
          onClose={() => setIsFoodLibraryModalOpen(false)}
          onSelectFood={(food) => {
            if (activeMealForFoodAdd) {
              handleSelectLibraryFoodForMeal(food, activeMealForFoodAdd);
            } else {
              // Add to first incomplete meal or breakfast
              const targetMeal = currentDayLog.meals.find((m) => !m.completed) || currentDayLog.meals[0];
              handleSelectLibraryFoodForMeal(food, targetMeal.id);
            }
            setIsFoodLibraryModalOpen(false);
          }}
        />
      )}

      {/* MANUAL STEP ENTRY MODAL (Section 31) */}
      {isStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Footprints className="h-5 w-5" />
                <span>Manual Step & Activity Entry</span>
              </div>
              <button
                onClick={() => setIsStepModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualSteps} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold">Total Steps</label>
                <input
                  type="number"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-emerald-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Active Minutes (Walking / Running)</label>
                <input
                  type="number"
                  value={manualActiveMinutes}
                  onChange={(e) => setManualActiveMinutes(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 text-[11px] text-slate-400 space-y-1 border border-slate-800">
                <div className="flex justify-between">
                  <span>Estimated Distance:</span>
                  <strong className="text-emerald-400">{(manualSteps * 0.00075).toFixed(2)} km</strong>
                </div>
                <div className="flex justify-between">
                  <span>Active NEAT Calories:</span>
                  <strong className="text-amber-400">{Math.round(manualSteps * 0.04)} kcal</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStepModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Save Steps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHEAT MEAL MODAL */}
      {isCheatMealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Apple className="h-4 w-4" />
                <span>Log Cheat Meal & Plan</span>
              </div>
              <button
                onClick={() => setIsCheatMealModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCheatMeal} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Double cheeseburger & fries"
                  value={cheatName}
                  onChange={(e) => setCheatName(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Estimated Calories (kcal)</label>
                <input
                  type="number"
                  value={cheatCalories}
                  onChange={(e) => setCheatCalories(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Social gathering, scheduled refeed"
                  value={cheatReason}
                  onChange={(e) => setCheatReason(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400">Burn Plan</label>
                <input
                  type="text"
                  value={cheatBurnPlan}
                  onChange={(e) => setCheatBurnPlan(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheatMealModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Save Cheat Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
