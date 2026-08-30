import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Star,
  Clock,
  Filter,
  Check,
  X,
  Utensils,
  Sparkles,
  Flame,
  Scale,
  Save,
  BookOpen,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { CustomFoodItem, MealType } from "../types";
import { saveCustomFoodToCloud, deleteCustomFoodFromCloud } from "../services/firebase";

interface CustomFoodLibraryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  customFoods: CustomFoodItem[];
  onUpdateCustomFoods: (foods: CustomFoodItem[]) => void;
  onSelectFood?: (food: CustomFoodItem) => void;
  onSelectFoodForMeal?: (food: CustomFoodItem, mealId?: string) => void;
  targetMealId?: string | null;
  targetMealType?: string | null;
  userId?: string;
}

export const FOOD_UNITS = [
  "Gram",
  "Piece",
  "Bowl",
  "Glass",
  "Cup",
  "Tbsp",
  "Tsp",
  "Scoop",
  "Slice",
  "Serving",
  "Plate",
  "Ounce",
  "ml",
];

export const MEAL_TYPES: string[] = [
  "Breakfast",
  "Morning Water",
  "Mid Morning",
  "Lunch",
  "Pre Workout",
  "Post Workout",
  "Evening Snack",
  "Dinner",
  "Before Sleep",
  "Snack",
];

export function CustomFoodLibraryModal({
  isOpen = true,
  onClose,
  customFoods,
  onUpdateCustomFoods,
  onSelectFood,
  onSelectFoodForMeal,
  targetMealId,
  targetMealType,
  userId = "guest",
}: CustomFoodLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>("All");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyRecent, setOnlyRecent] = useState(false);

  // Form State for Adding / Editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formMealType, setFormMealType] = useState<string>(targetMealType || "Lunch");
  const [formQuantity, setFormQuantity] = useState<number>(100);
  const [formUnit, setFormUnit] = useState<string>("Gram");
  const [formCalories, setFormCalories] = useState<number>(150);
  const [formProtein, setFormProtein] = useState<number>(10);
  const [formCarbs, setFormCarbs] = useState<number>(15);
  const [formFat, setFormFat] = useState<number>(4);
  const [formFiber, setFormFiber] = useState<number>(2);
  const [formSugar, setFormSugar] = useState<number>(1);
  const [formNotes, setFormNotes] = useState<string>("");
  const [formIsFavorite, setFormIsFavorite] = useState<boolean>(false);

  // Quick adjust quantity when adding to meal
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<CustomFoodItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(100);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingFoodId(null);
    setFormName("");
    setFormMealType(targetMealType || "Lunch");
    setFormQuantity(100);
    setFormUnit("Gram");
    setFormCalories(150);
    setFormProtein(10);
    setFormCarbs(15);
    setFormFat(4);
    setFormFiber(2);
    setFormSugar(1);
    setFormNotes("");
    setFormIsFavorite(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (food: CustomFoodItem) => {
    setEditingFoodId(food.id);
    setFormName(food.name);
    setFormMealType(food.mealType || "Lunch");
    setFormQuantity(food.quantity || 100);
    setFormUnit(food.unit || "Gram");
    setFormCalories(food.calories || 0);
    setFormProtein(food.protein || 0);
    setFormCarbs(food.carbs || 0);
    setFormFat(food.fat || 0);
    setFormFiber(food.fiber || 0);
    setFormSugar(food.sugar || 0);
    setFormNotes(food.notes || "");
    setFormIsFavorite(Boolean(food.isFavorite));
    setIsFormOpen(true);
  };

  const handleSaveFoodForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const nowIso = new Date().toISOString();
    let updatedList: CustomFoodItem[];

    if (editingFoodId) {
      // Edit existing food
      const updatedFood: CustomFoodItem = {
        id: editingFoodId,
        name: formName.trim(),
        mealType: formMealType,
        quantity: Number(formQuantity) || 1,
        unit: formUnit,
        calories: Number(formCalories) || 0,
        protein: Number(formProtein) || 0,
        carbs: Number(formCarbs) || 0,
        fat: Number(formFat) || 0,
        fiber: Number(formFiber) || 0,
        sugar: Number(formSugar) || 0,
        notes: formNotes.trim(),
        isFavorite: formIsFavorite,
        isCustom: true,
        lastUsed: nowIso,
        createdAt:
          customFoods.find((f) => f.id === editingFoodId)?.createdAt || nowIso,
      };

      updatedList = customFoods.map((f) =>
        f.id === editingFoodId ? updatedFood : f
      );
      saveCustomFoodToCloud(userId, updatedFood).catch(() => {});
    } else {
      // Create new food
      const newFood: CustomFoodItem = {
        id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: formName.trim(),
        mealType: formMealType,
        quantity: Number(formQuantity) || 1,
        unit: formUnit,
        calories: Number(formCalories) || 0,
        protein: Number(formProtein) || 0,
        carbs: Number(formCarbs) || 0,
        fat: Number(formFat) || 0,
        fiber: Number(formFiber) || 0,
        sugar: Number(formSugar) || 0,
        notes: formNotes.trim(),
        isFavorite: formIsFavorite,
        isCustom: true,
        lastUsed: nowIso,
        createdAt: nowIso,
      };

      updatedList = [newFood, ...customFoods];
      saveCustomFoodToCloud(userId, newFood).catch(() => {});

      // If user came from adding a food to an active meal, directly offer to add it!
      if (onSelectFoodForMeal && targetMealId) {
        onSelectFoodForMeal(newFood, targetMealId);
        setIsFormOpen(false);
        onClose();
        return;
      }
    }

    onUpdateCustomFoods(updatedList);
    setIsFormOpen(false);
  };

  const handleDeleteFood = (foodId: string, foodName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${foodName}" from your food library?`)) {
      return;
    }
    const updatedList = customFoods.filter((f) => f.id !== foodId);
    onUpdateCustomFoods(updatedList);
    deleteCustomFoodFromCloud(userId, foodId).catch(() => {});
  };

  const handleToggleFavorite = (food: CustomFoodItem) => {
    const toggled = { ...food, isFavorite: !food.isFavorite };
    const updatedList = customFoods.map((f) => (f.id === food.id ? toggled : f));
    onUpdateCustomFoods(updatedList);
    saveCustomFoodToCloud(userId, toggled).catch(() => {});
  };

  const handleSelectFood = (food: CustomFoodItem) => {
    // Update lastUsed timestamp
    const updatedFood = { ...food, lastUsed: new Date().toISOString() };
    const updatedList = customFoods.map((f) => (f.id === food.id ? updatedFood : f));
    onUpdateCustomFoods(updatedList);
    saveCustomFoodToCloud(userId, updatedFood).catch(() => {});

    if (onSelectFood) {
      onSelectFood(food);
    } else if (onSelectFoodForMeal) {
      onSelectFoodForMeal(food, targetMealId || undefined);
    }
    onClose();
  };

  // Filtered List
  const filteredFoods = useMemo(() => {
    return customFoods.filter((food) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = food.name.toLowerCase().includes(q);
        const matchesMeal = food.mealType?.toLowerCase().includes(q);
        const matchesNotes = food.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesMeal && !matchesNotes) return false;
      }

      // Meal Type Filter
      if (selectedMealFilter !== "All") {
        if (food.mealType !== selectedMealFilter) return false;
      }

      // Favorites
      if (onlyFavorites && !food.isFavorite) {
        return false;
      }

      // Recent
      if (onlyRecent && !food.lastUsed) {
        return false;
      }

      return true;
    });
  }, [customFoods, searchQuery, selectedMealFilter, onlyFavorites, onlyRecent]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-100">Personal Food Library</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {customFoods.length} Foods Saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {targetMealType
                  ? `Select or manually add a food for ${targetMealType}`
                  : "Permanent personal food database synced with Firebase Firestore"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Add New Food</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search food by name, notes, or meal category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setOnlyFavorites(!onlyFavorites);
                  setOnlyRecent(false);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  onlyFavorites
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Favorites</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyRecent(!onlyRecent);
                  setOnlyFavorites(false);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  onlyRecent
                    ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Recent</span>
              </button>

              <select
                value={selectedMealFilter}
                onChange={(e) => setSelectedMealFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Meal Types</option>
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Food List Container */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500 mx-auto">
                <Utensils className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-slate-300">No foods found matching criteria</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing filters or click &quot;Add New Food&quot; to manually enter food with full
                protein, calories, carbs, fat, fiber & sugar breakdown.
              </p>
              <button
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add Food Now</span>
              </button>
            </div>
          ) : (
            filteredFoods.map((food) => (
              <div
                key={food.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Favorite Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(food)}
                    title={food.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    className={`mt-0.5 p-2 rounded-xl transition cursor-pointer shrink-0 ${
                      food.isFavorite
                        ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                        : "text-slate-600 hover:text-amber-400 bg-slate-900"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${food.isFavorite ? "fill-amber-400" : ""}`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-100 truncate">
                        {food.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                        {food.quantity} {food.unit}
                      </span>
                      {food.mealType && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                          {food.mealType}
                        </span>
                      )}
                    </div>

                    {/* Macro Breakdown Bar */}
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="font-black text-amber-400 font-mono">
                        {food.calories} kcal
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-sky-400 font-bold">P: {food.protein}g</span>
                      <span className="text-emerald-400 font-bold">C: {food.carbs}g</span>
                      <span className="text-rose-400 font-bold">F: {food.fat}g</span>
                      {food.fiber > 0 && (
                        <span className="text-teal-400 text-[11px]">Fib: {food.fiber}g</span>
                      )}
                      {food.sugar > 0 && (
                        <span className="text-pink-400 text-[11px]">Sug: {food.sugar}g</span>
                      )}
                    </div>

                    {food.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                        &quot;{food.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                  {onSelectFoodForMeal && (
                    <button
                      type="button"
                      onClick={() => handleSelectFood(food)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <span>Select</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(food)}
                    title="Edit Food Details"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFood(food.id, food.name)}
                    title="Delete Food Permanently"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ADD / EDIT FOOD MODAL OVERLAY */}
        {isFormOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100">
                      {editingFoodId ? "Edit Food in Library" : "Add New Food to Library"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Saved permanently in Firebase Firestore and selectable again anytime
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFoodForm} className="space-y-3.5 text-xs">
                {/* Food Name */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Food Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grilled Chicken Breast, Oatmeal with Whey, Paneer Tikka"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Meal Type, Quantity, Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Meal Type *</label>
                    <select
                      value={formMealType}
                      onChange={(e) => setFormMealType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      {MEAL_TYPES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      min={0.1}
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Unit *</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      {FOOD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Calories, Protein, Carbs, Fat */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-amber-400 font-bold mb-1">Calories (kcal) *</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formCalories}
                      onChange={(e) => setFormCalories(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sky-400 font-bold mb-1">Protein (g) *</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formProtein}
                      onChange={(e) => setFormProtein(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-400 font-bold mb-1">Carbs (g) *</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formCarbs}
                      onChange={(e) => setFormCarbs(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-400 font-bold mb-1">Fat (g) *</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formFat}
                      onChange={(e) => setFormFat(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Fiber, Sugar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-teal-400 font-bold mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formFiber}
                      onChange={(e) => setFormFiber(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-pink-400 font-bold mb-1">Sugar (g)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formSugar}
                      onChange={(e) => setFormSugar(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-pink-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Notes / Preparation</label>
                  <input
                    type="text"
                    placeholder="e.g. Boiled, skinless, olive oil cooked, raw weighed, brand name"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Favorite Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsFavorite}
                      onChange={(e) => setFormIsFavorite(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-amber-400 focus:ring-amber-400"
                    />
                    <span>Mark as Favorite (starred for instant 1-click access)</span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingFoodId ? "Update Food" : "Save Food to Library"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
