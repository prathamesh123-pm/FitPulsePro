import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  UtensilsCrossed,
  Plus,
  Edit3,
  Check,
  AlertCircle,
  Flame,
  Droplets,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Layers,
  Save,
} from "lucide-react";
import { DailyNutritionLog, MealPlanItem, MealType, SavedDietPlan, FoodItem } from "../types";

interface DailyDietChecklistProps {
  log: DailyNutritionLog;
  activePlan?: SavedDietPlan;
  selectedDate: string;
  onUpdateDailyNutrition: (date: string, updated: DailyNutritionLog) => void;
  onOpenFoodLibraryModal?: (mealId: string) => void;
  onOpenSavedPlansModal?: () => void;
}

export function DailyDietChecklist({
  log,
  activePlan,
  selectedDate,
  onUpdateDailyNutrition,
  onOpenFoodLibraryModal,
  onOpenSavedPlansModal,
}: DailyDietChecklistProps) {
  const [editingNoteMealId, setEditingNoteMealId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // Compute checklist stats
  const totalMeals = log.meals.length || 9;
  const completedCount = log.meals.filter((m) => m.completed).length;
  const missedCount = log.meals.filter((m) => m.missed).length;
  const pendingCount = Math.max(0, totalMeals - completedCount - missedCount);
  const completionPercentage = Math.round((completedCount / totalMeals) * 100);

  // Toggle meal completed
  const handleToggleComplete = (mealId: string) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const updatedMeals = log.meals.map((m) => {
      if (m.id === mealId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          missed: false, // mutually exclusive
          actualTime: nextCompleted ? (m.actualTime || nowTime) : "",
        };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...log,
      meals: updatedMeals,
    });
  };

  // Toggle meal missed
  const handleToggleMissed = (mealId: string) => {
    const updatedMeals = log.meals.map((m) => {
      if (m.id === mealId) {
        const nextMissed = !m.missed;
        return {
          ...m,
          missed: nextMissed,
          completed: false, // mutually exclusive
        };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...log,
      meals: updatedMeals,
    });
  };

  // Save meal notes
  const handleSaveNote = (mealId: string) => {
    const updatedMeals = log.meals.map((m) => {
      if (m.id === mealId) {
        return { ...m, notes: noteText.trim() };
      }
      return m;
    });

    onUpdateDailyNutrition(selectedDate, {
      ...log,
      meals: updatedMeals,
    });

    setEditingNoteMealId(null);
  };

  const handleStartEditingNote = (meal: MealPlanItem) => {
    setEditingNoteMealId(meal.id);
    setNoteText(meal.notes || "");
  };

  return (
    <div className="space-y-6" id="daily-diet-checklist-module">
      {/* Active Plan Banner & Checklist Progress */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-100">Daily Diet Checklist</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {completionPercentage}% Adherence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Plan: <strong className="text-slate-200">{activePlan?.planName || "Weight Loss & Lean Shred Diet"}</strong>
              </p>
            </div>
          </div>

          {onOpenSavedPlansModal && (
            <button
              onClick={onOpenSavedPlansModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700 shrink-0 self-start sm:self-auto"
            >
              <BookOpen className="h-4 w-4" />
              <span>Change / Switch Plan</span>
            </button>
          )}
        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Meals</span>
            <span className="text-xl font-black text-slate-100">{totalMeals} Meals</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Completed</span>
            <span className="text-xl font-black text-emerald-400">{completedCount} Meals</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Missed</span>
            <span className="text-xl font-black text-rose-400">{missedCount} Meals</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending</span>
            <span className="text-xl font-black text-amber-400">{pendingCount} Meals</span>
          </div>
        </div>

        {/* Adherence Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>Overall Diet Adherence</span>
            <span className="text-emerald-400">{completionPercentage}% Completed</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* INTERACTIVE CHECKLIST ITEMS */}
      <div className="space-y-3">
        {log.meals.map((meal, index) => {
          const isExpanded = expandedMealId === meal.id;
          const mealCalories = meal.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
          const mealProtein = meal.foods.reduce((acc, f) => acc + (f.protein || 0), 0);

          return (
            <div
              key={meal.id}
              id={`checklist-meal-${meal.id}`}
              className={`rounded-3xl border transition-all p-4 space-y-3 ${
                meal.completed
                  ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                  : meal.missed
                  ? "bg-slate-900/80 border-rose-500/40 shadow-lg shadow-rose-950/20"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Row: Checkbox, Name, Time, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(meal.id)}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition cursor-pointer border shrink-0 ${
                      meal.completed
                        ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30"
                        : "bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                    title={meal.completed ? "Mark Incomplete" : "Mark Completed"}
                  >
                    <Check className="h-5 w-5 stroke-[3]" />
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100">
                        {index + 1}. {meal.mealType}
                      </span>
                      {meal.completed && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="h-2.5 w-2.5" /> Completed
                          {meal.actualTime ? ` (${meal.actualTime})` : ""}
                        </span>
                      )}
                      {meal.missed && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Missed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled: {meal.plannedTime || "08:00"}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {meal.foods.length} item{meal.foods.length === 1 ? "" : "s"} ({Math.round(mealCalories)} kcal, {Math.round(mealProtein)}g P)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Mark Missed Button */}
                  <button
                    onClick={() => handleToggleMissed(meal.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      meal.missed
                        ? "bg-rose-500 text-slate-950 border-rose-400"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-300 hover:border-rose-800"
                    }`}
                  >
                    {meal.missed ? "Unmark Missed" : "Mark Missed"}
                  </button>

                  {/* Note Button */}
                  <button
                    onClick={() => handleStartEditingNote(meal)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="Add or edit note"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  {/* Expand Food Items */}
                  <button
                    onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="View food items"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Note Display or Editor */}
              {editingNoteMealId === meal.id ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>Add Note for {meal.mealType}</span>
                  </div>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Ate at 8:30 AM with 2 glasses of water"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNoteMealId(null)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote(meal.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : meal.notes ? (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                  Note: {meal.notes}
                </div>
              ) : null}

              {/* Expanded Foods Drawer */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Logged Food Items ({meal.foods.length})
                    </span>
                    {onOpenFoodLibraryModal && (
                      <button
                        onClick={() => onOpenFoodLibraryModal(meal.id)}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Food to Meal</span>
                      </button>
                    )}
                  </div>

                  {meal.foods.length > 0 ? (
                    <div className="space-y-1.5">
                      {meal.foods.map((food, fIdx) => (
                        <div
                          key={food.id || fIdx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">{food.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Serving: {food.servingSize || `${food.quantity} ${food.unit}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <span className="font-mono text-amber-400 font-bold text-xs">
                              {food.calories} kcal
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                              <span className="text-sky-400">{food.protein}g P</span>
                              <span>•</span>
                              <span className="text-emerald-400">{food.carbs}g C</span>
                              <span>•</span>
                              <span className="text-rose-400">{food.fat}g F</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">
                      No foods logged yet for this meal. Click "Add Food" to log.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
