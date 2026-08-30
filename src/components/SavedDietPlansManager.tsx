import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Utensils,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  Droplets,
  Calendar,
  Layers,
  Save,
  Search,
} from "lucide-react";
import { SavedDietPlan, DietPlanMeal, DietPlanFoodItem, DailyNutritionLog, MealPlanItem, MealType } from "../types";

interface SavedDietPlansManagerProps {
  savedPlans: SavedDietPlan[];
  activePlanId?: string;
  selectedDate: string;
  onUpdateSavedPlans: (plans: SavedDietPlan[]) => void;
  onSelectActivePlan: (planId: string) => void;
  onApplyPlanToDate: (plan: SavedDietPlan, targetDate: string) => void;
}

export function SavedDietPlansManager({
  savedPlans,
  activePlanId,
  selectedDate,
  onUpdateSavedPlans,
  onSelectActivePlan,
  onApplyPlanToDate,
}: SavedDietPlansManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(activePlanId || savedPlans[0]?.id || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SavedDietPlan | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form state for creating / editing diet plan
  const [formPlanName, setFormPlanName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<SavedDietPlan["category"]>("Weight Loss");
  const [formMeals, setFormMeals] = useState<DietPlanMeal[]>([]);

  // Filtering saved plans
  const filteredPlans = savedPlans.filter((plan) => {
    const matchSearch =
      plan.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || plan.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Helper to open Create Modal
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormPlanName("");
    setFormDescription("Custom tailored meal plan designed for precise macro targets.");
    setFormCategory("Weight Loss");
    // Standard default 9 meal slots
    const standardMeals: DietPlanMeal[] = [
      { id: `m-${Date.now()}-1`, mealName: "Morning Water", mealTime: "07:00", foods: [{ id: `f-1`, name: "Filtered Water", quantity: 500, unit: "ml", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 500 }], targetCalories: 0, targetProtein: 0, targetCarbs: 0, targetFat: 0, targetFiber: 0, targetWaterMl: 500, notes: "Lukewarm with lemon" },
      { id: `m-${Date.now()}-2`, mealName: "Breakfast", mealTime: "08:15", foods: [{ id: `f-2`, name: "Oatmeal with Egg Whites", quantity: 1, unit: "Bowl", calories: 380, protein: 32, carbs: 45, fat: 8, fiber: 6 }], targetCalories: 380, targetProtein: 32, targetCarbs: 45, targetFat: 8, targetFiber: 6, targetWaterMl: 300 },
      { id: `m-${Date.now()}-3`, mealName: "Mid Morning", mealTime: "10:45", foods: [{ id: `f-3`, name: "Greek Yogurt & Berries", quantity: 1, unit: "Bowl", calories: 160, protein: 20, carbs: 12, fat: 3, fiber: 2 }], targetCalories: 160, targetProtein: 20, targetCarbs: 12, targetFat: 3, targetFiber: 2, targetWaterMl: 250 },
      { id: `m-${Date.now()}-4`, mealName: "Lunch", mealTime: "13:15", foods: [{ id: `f-4`, name: "Grilled Chicken & Rice with Broccoli", quantity: 1, unit: "Plate", calories: 450, protein: 45, carbs: 45, fat: 9, fiber: 7 }], targetCalories: 450, targetProtein: 45, targetCarbs: 45, targetFat: 9, targetFiber: 7, targetWaterMl: 400 },
      { id: `m-${Date.now()}-5`, mealName: "Evening Snack", mealTime: "16:00", foods: [{ id: `f-5`, name: "Fresh Apple & Coffee", quantity: 1, unit: "Serving", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 }], targetCalories: 95, targetProtein: 0.5, targetCarbs: 25, targetFat: 0.3, targetFiber: 4.4, targetWaterMl: 300 },
      { id: `m-${Date.now()}-6`, mealName: "Pre Workout", mealTime: "17:00", foods: [{ id: `f-6`, name: "Banana with Rice Cake", quantity: 1, unit: "Piece", calories: 140, protein: 2, carbs: 32, fat: 0.5, fiber: 3 }], targetCalories: 140, targetProtein: 2, targetCarbs: 32, targetFat: 0.5, targetFiber: 3, targetWaterMl: 350 },
      { id: `m-${Date.now()}-7`, mealName: "Post Workout", mealTime: "18:45", foods: [{ id: `f-7`, name: "Whey Protein Isolate & Creatine", quantity: 1, unit: "Scoop", calories: 120, protein: 27, carbs: 1.5, fat: 0.5, fiber: 0 }], targetCalories: 120, targetProtein: 27, targetCarbs: 1.5, targetFat: 0.5, targetFiber: 0, targetWaterMl: 400 },
      { id: `m-${Date.now()}-8`, mealName: "Dinner", mealTime: "20:30", foods: [{ id: `f-8`, name: "Grilled Salmon with Steamed Asparagus", quantity: 1, unit: "Plate", calories: 380, protein: 38, carbs: 12, fat: 14, fiber: 5 }], targetCalories: 380, targetProtein: 38, targetCarbs: 12, targetFat: 14, targetFiber: 5, targetWaterMl: 300 },
      { id: `m-${Date.now()}-9`, mealName: "Before Sleep", mealTime: "22:00", foods: [{ id: `f-9`, name: "Low-Fat Cottage Cheese / Casein", quantity: 1, unit: "Bowl", calories: 90, protein: 15, carbs: 3, fat: 1, fiber: 0 }], targetCalories: 90, targetProtein: 15, targetCarbs: 3, targetFat: 1, targetFiber: 0, targetWaterMl: 200 },
    ];
    setFormMeals(standardMeals);
    setIsCreateModalOpen(true);
  };

  // Helper to open Edit Modal
  const handleOpenEdit = (plan: SavedDietPlan) => {
    setEditingPlan(plan);
    setFormPlanName(plan.planName);
    setFormDescription(plan.description);
    setFormCategory(plan.category);
    setFormMeals(JSON.parse(JSON.stringify(plan.meals)));
    setIsCreateModalOpen(true);
  };

  // Duplicate plan with "(Copy)"
  const handleDuplicatePlan = (plan: SavedDietPlan) => {
    const newPlan: SavedDietPlan = {
      ...JSON.parse(JSON.stringify(plan)),
      id: `plan-${Date.now()}`,
      planName: `${plan.planName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
    };
    const updated = [newPlan, ...savedPlans];
    onUpdateSavedPlans(updated);
    setExpandedPlanId(newPlan.id);
    showNotification(`Duplicated "${plan.planName}" successfully!`);
  };

  // Delete plan
  const handleDeletePlan = (planId: string, name: string) => {
    if (savedPlans.length <= 1) {
      alert("You must keep at least one saved diet plan.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the diet plan "${name}"?`)) {
      const updated = savedPlans.filter((p) => p.id !== planId);
      onUpdateSavedPlans(updated);
      if (expandedPlanId === planId) {
        setExpandedPlanId(updated[0]?.id || null);
      }
      showNotification(`Deleted plan "${name}".`);
    }
  };

  // Save (Create or Update)
  const handleSavePlanForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlanName.trim()) return;

    // Calculate totals across all meals
    let totalCals = 0;
    let totalProt = 0;
    let totalCarb = 0;
    let totalFat = 0;
    let totalFib = 0;
    let totalWater = 0;

    const recalculatedMeals: DietPlanMeal[] = formMeals.map((m) => {
      let mCals = 0;
      let mProt = 0;
      let mCarb = 0;
      let mFat = 0;
      let mFib = 0;
      let mWater = m.targetWaterMl || 0;

      m.foods.forEach((f) => {
        mCals += f.calories;
        mProt += f.protein;
        mCarb += f.carbs;
        mFat += f.fat;
        mFib += f.fiber || 0;
        if (f.waterMl) mWater += f.waterMl;
      });

      totalCals += mCals;
      totalProt += mProt;
      totalCarb += mCarb;
      totalFat += mFat;
      totalFib += mFib;
      totalWater += mWater;

      return {
        ...m,
        targetCalories: Math.round(mCals),
        targetProtein: Math.round(mProt),
        targetCarbs: Math.round(mCarb),
        targetFat: Math.round(mFat),
        targetFiber: Math.round(mFib),
        targetWaterMl: Math.round(mWater),
      };
    });

    const nowStr = new Date().toISOString();

    if (editingPlan) {
      const updated = savedPlans.map((p) => {
        if (p.id === editingPlan.id) {
          return {
            ...p,
            planName: formPlanName.trim(),
            description: formDescription.trim(),
            category: formCategory,
            totalCalories: Math.round(totalCals),
            totalProtein: Math.round(totalProt),
            totalCarbs: Math.round(totalCarb),
            totalFat: Math.round(totalFat),
            totalFiber: Math.round(totalFib),
            totalWaterMl: Math.round(totalWater),
            meals: recalculatedMeals,
            updatedAt: nowStr,
          };
        }
        return p;
      });
      onUpdateSavedPlans(updated);
      showNotification(`Updated "${formPlanName}" successfully!`);
    } else {
      const newPlan: SavedDietPlan = {
        id: `plan-${Date.now()}`,
        planName: formPlanName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        totalCalories: Math.round(totalCals),
        totalProtein: Math.round(totalProt),
        totalCarbs: Math.round(totalCarb),
        totalFat: Math.round(totalFat),
        totalFiber: Math.round(totalFib),
        totalWaterMl: Math.round(totalWater),
        meals: recalculatedMeals,
        createdAt: nowStr,
        updatedAt: nowStr,
        isActive: false,
      };
      const updated = [newPlan, ...savedPlans];
      onUpdateSavedPlans(updated);
      setExpandedPlanId(newPlan.id);
      showNotification(`Created new diet plan "${formPlanName}"!`);
    }

    setIsCreateModalOpen(false);
  };

  // Add meal to form
  const handleAddMealToForm = () => {
    const newM: DietPlanMeal = {
      id: `m-${Date.now()}`,
      mealName: "New Snack",
      mealTime: "15:00",
      foods: [],
      targetCalories: 150,
      targetProtein: 15,
      targetCarbs: 15,
      targetFat: 3,
      targetFiber: 2,
      targetWaterMl: 250,
    };
    setFormMeals([...formMeals, newM]);
  };

  // Remove meal from form
  const handleRemoveMealFromForm = (index: number) => {
    const next = [...formMeals];
    next.splice(index, 1);
    setFormMeals(next);
  };

  // Add food item to a meal in form
  const handleAddFoodToMeal = (mealIndex: number) => {
    const updatedMeals = [...formMeals];
    const targetMeal = updatedMeals[mealIndex];
    const newFood: DietPlanFoodItem = {
      id: `f-${Date.now()}`,
      name: "Clean Food Item",
      quantity: 100,
      unit: "Gram",
      calories: 120,
      protein: 15,
      carbs: 10,
      fat: 2,
      fiber: 1,
    };
    targetMeal.foods.push(newFood);
    setFormMeals(updatedMeals);
  };

  // Remove food from a meal in form
  const handleRemoveFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    const updatedMeals = [...formMeals];
    updatedMeals[mealIndex].foods.splice(foodIndex, 1);
    setFormMeals(updatedMeals);
  };

  // Update food item within form
  const handleUpdateFoodItem = (
    mealIndex: number,
    foodIndex: number,
    field: keyof DietPlanFoodItem,
    value: any
  ) => {
    const updatedMeals = [...formMeals];
    const f = updatedMeals[mealIndex].foods[foodIndex];
    (f as any)[field] = value;
    setFormMeals(updatedMeals);
  };

  return (
    <div className="space-y-6" id="saved-diet-plans-module">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-100">Saved Diet Plans Library</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {savedPlans.length} Available Plans
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, duplicate, customize, and select plans to populate your daily nutrition timeline.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="create-new-diet-plan-btn"
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-500/20 shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Diet Plan</span>
        </button>
      </div>

      {/* Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved diet plans by name or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["All", "Weight Loss", "Muscle Gain", "Maintenance", "Custom"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => {
          const isExpanded = expandedPlanId === plan.id;
          const isActive = plan.id === activePlanId || plan.isActive;

          return (
            <div
              key={plan.id}
              id={`diet-plan-card-${plan.id}`}
              className={`rounded-3xl border transition-all ${
                isActive
                  ? "bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-950/20"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              } p-5 space-y-4`}
            >
              {/* Top Card Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-100">{plan.planName}</h3>
                    {isActive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active Default Plan
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {plan.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{plan.description}</p>
                </div>

                {/* Macro Target Summary Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Calories</span>
                    <span className="text-xs font-black text-amber-400">{plan.totalCalories} kcal</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Protein</span>
                    <span className="text-xs font-black text-sky-400">{plan.totalProtein}g</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Carbs</span>
                    <span className="text-xs font-black text-emerald-400">{plan.totalCarbs}g</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Fat</span>
                    <span className="text-xs font-black text-rose-400">{plan.totalFat}g</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectActivePlan(plan.id);
                      onApplyPlanToDate(plan, selectedDate);
                      showNotification(`Applied "${plan.planName}" to ${selectedDate}!`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Apply to {selectedDate === "2026-08-28" ? "Today" : selectedDate}</span>
                  </button>

                  <button
                    onClick={() => handleDuplicatePlan(plan)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Duplicate plan"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Edit plan"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.planName)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Delete plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <button
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>{plan.meals?.length || 0} Meals Timeline</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Expanded Meals Breakdown */}
              {isExpanded && (
                <div className="pt-4 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {plan.meals.map((m, mIdx) => (
                      <div
                        key={m.id || mIdx}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-200">{m.mealName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-amber-400 text-[10px] font-bold border border-slate-800 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {m.mealTime}
                          </span>
                        </div>

                        {/* Foods List */}
                        <div className="space-y-1">
                          {m.foods && m.foods.length > 0 ? (
                            m.foods.map((f, fIdx) => (
                              <div key={f.id || fIdx} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-300 truncate max-w-[150px]">
                                  {f.name} ({f.quantity} {f.unit})
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {f.calories} kcal | {f.protein}g P
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">No foods specified</p>
                          )}
                        </div>

                        {m.notes && (
                          <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 italic">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* CREATE / EDIT DIET PLAN MODAL */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-slate-100">
                  {editingPlan ? `Edit Diet Plan: ${editingPlan.planName}` : "Create New Custom Diet Plan"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanForm} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    placeholder="e.g. Muscle Gain Hypertrophy Diet"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Plan Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Optimized high-protein macro split for strength and satiety"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Meals & Foods Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
                    Scheduled Meals ({formMeals.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMealToForm}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Meal Slot</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formMeals.map((meal, mIdx) => (
                    <div
                      key={meal.id || mIdx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={meal.mealName}
                            onChange={(e) => {
                              const updated = [...formMeals];
                              updated[mIdx].mealName = e.target.value;
                              setFormMeals(updated);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-extrabold text-xs"
                          />
                          <input
                            type="time"
                            value={meal.mealTime}
                            onChange={(e) => {
                              const updated = [...formMeals];
                              updated[mIdx].mealTime = e.target.value;
                              setFormMeals(updated);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-mono text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddFoodToMeal(mIdx)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/30"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Food</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMealFromForm(mIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remove meal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Foods within this meal */}
                      <div className="space-y-2">
                        {meal.foods.map((food, fIdx) => (
                          <div
                            key={food.id || fIdx}
                            className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]"
                          >
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={food.name}
                                onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "name", e.target.value)}
                                placeholder="Food item name"
                                className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                              />
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={food.quantity}
                                  onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "quantity", Number(e.target.value))}
                                  className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                                />
                                <span className="text-[10px] text-slate-400">{food.unit}</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={food.calories}
                                onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "calories", Number(e.target.value))}
                                placeholder="Cals"
                                className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-400 font-bold"
                              />
                            </div>
                            <div className="col-span-3 grid grid-cols-3 gap-1 text-[10px]">
                              <input
                                type="number"
                                value={food.protein}
                                onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "protein", Number(e.target.value))}
                                placeholder="P"
                                title="Protein (g)"
                                className="px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-sky-400"
                              />
                              <input
                                type="number"
                                value={food.carbs}
                                onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "carbs", Number(e.target.value))}
                                placeholder="C"
                                title="Carbs (g)"
                                className="px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400"
                              />
                              <input
                                type="number"
                                value={food.fat}
                                onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, "fat", Number(e.target.value))}
                                placeholder="F"
                                title="Fat (g)"
                                className="px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-rose-400"
                              />
                            </div>
                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveFoodFromMeal(mIdx, fIdx)}
                                className="text-slate-500 hover:text-rose-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-emerald-500/20 transition"
                >
                  {editingPlan ? "Save Plan Changes" : "Create & Save Diet Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
