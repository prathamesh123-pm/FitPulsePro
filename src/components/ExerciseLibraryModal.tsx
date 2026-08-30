import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  X,
  Dumbbell,
  Check,
  Info,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Exercise, MuscleGroup } from "../types";
import { ENRICHED_EXERCISES, MUSCLE_GROUPS } from "../data/exercises";

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customExercises: Exercise[];
  onUpdateCustomExercises: (exercises: Exercise[]) => void;
  onSelectExercises?: (exercises: Exercise[]) => void;
  initialMuscleGroup?: MuscleGroup | null;
}

const EQUIPMENT_OPTIONS = [
  "All",
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Bodyweight",
  "Kettlebell",
  "Cardio Equipment",
];

const DIFFICULTY_OPTIONS = ["All", "Beginner", "Intermediate", "Advanced"];

export function ExerciseLibraryModal({
  isOpen,
  onClose,
  customExercises,
  onUpdateCustomExercises,
  onSelectExercises,
  initialMuscleGroup = null,
}: ExerciseLibraryModalProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "All">(
    initialMuscleGroup || "All"
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Add / Edit Modal Sub-state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formName, setFormName] = useState("");
  const [formMuscle, setFormMuscle] = useState<MuscleGroup>("Chest");
  const [formMachine, setFormMachine] = useState("");
  const [formEquipment, setFormEquipment] = useState("Dumbbell");
  const [formDifficulty, setFormDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [formNotes, setFormNotes] = useState("");

  // All combined exercises: custom exercises placed first or sorted by orderIndex
  const allExercises = useMemo(() => {
    // Merge built-in exercises with custom exercises, avoiding duplicate IDs
    const customMap = new Map(customExercises.map((e) => [e.id, e]));
    const builtinList = ENRICHED_EXERCISES.filter((e) => !customMap.has(e.id));
    return [...customExercises, ...builtinList];
  }, [customExercises]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchMuscle = selectedMuscle === "All" || ex.muscleGroup === selectedMuscle;
      const matchEquipment =
        selectedEquipment === "All" ||
        ex.equipment.toLowerCase().includes(selectedEquipment.toLowerCase());
      const matchDifficulty =
        selectedDifficulty === "All" || ex.difficulty === selectedDifficulty;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        (ex.machineName && ex.machineName.toLowerCase().includes(q)) ||
        ex.equipment.toLowerCase().includes(q) ||
        (ex.notes && ex.notes.toLowerCase().includes(q));

      return matchMuscle && matchEquipment && matchDifficulty && matchSearch;
    });
  }, [allExercises, selectedMuscle, selectedEquipment, selectedDifficulty, searchQuery]);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingExercise(null);
    setFormName("");
    setFormMuscle(selectedMuscle === "All" ? "Chest" : selectedMuscle);
    setFormMachine("");
    setFormEquipment("Dumbbell");
    setFormDifficulty("Intermediate");
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormName(ex.name);
    setFormMuscle(ex.muscleGroup);
    setFormMachine(ex.machineName || "");
    setFormEquipment(ex.equipment);
    setFormDifficulty(ex.difficulty);
    setFormNotes(ex.notes || "");
    setIsFormOpen(true);
  };

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingExercise) {
      // If editing an existing custom exercise
      const isExistingCustom = customExercises.some((c) => c.id === editingExercise.id);
      if (isExistingCustom) {
        const updated = customExercises.map((c) =>
          c.id === editingExercise.id
            ? {
                ...c,
                name: formName.trim(),
                muscleGroup: formMuscle,
                machineName: formMachine.trim() || undefined,
                equipment: formEquipment,
                difficulty: formDifficulty,
                notes: formNotes.trim() || undefined,
              }
            : c
        );
        onUpdateCustomExercises(updated);
      } else {
        // Was a built-in exercise, convert to an overridden custom exercise
        const newCustom: Exercise = {
          ...editingExercise,
          name: formName.trim(),
          muscleGroup: formMuscle,
          machineName: formMachine.trim() || undefined,
          equipment: formEquipment,
          difficulty: formDifficulty,
          notes: formNotes.trim() || undefined,
          isCustom: true,
        };
        onUpdateCustomExercises([newCustom, ...customExercises]);
      }
    } else {
      // Create new exercise
      const newEx: Exercise = {
        id: `custom-ex-${Date.now()}`,
        name: formName.trim(),
        muscleGroup: formMuscle,
        machineName: formMachine.trim() || undefined,
        equipment: formEquipment,
        difficulty: formDifficulty,
        notes: formNotes.trim() || undefined,
        instructions: `Perform ${formName.trim()} with controlled tempo and strict mind-muscle contraction.`,
        isCustom: true,
        orderIndex: customExercises.length,
      };
      onUpdateCustomExercises([newEx, ...customExercises]);
    }

    setIsFormOpen(false);
    setEditingExercise(null);
  };

  const handleDeleteExercise = (ex: Exercise) => {
    if (!confirm(`Are you sure you want to remove "${ex.name}" from your library?`)) return;
    const updated = customExercises.filter((c) => c.id !== ex.id);
    onUpdateCustomExercises(updated);
    if (previewExercise?.id === ex.id) {
      setPreviewExercise(null);
    }
  };

  const handleDuplicateExercise = (ex: Exercise) => {
    const duplicated: Exercise = {
      ...ex,
      id: `custom-ex-${Date.now()}`,
      name: `${ex.name} (Copy)`,
      isCustom: true,
      orderIndex: customExercises.length,
    };
    onUpdateCustomExercises([duplicated, ...customExercises]);
  };

  const handleMoveExercise = (indexInCustom: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? indexInCustom - 1 : indexInCustom + 1;
    if (targetIdx < 0 || targetIdx >= customExercises.length) return;

    const list = [...customExercises];
    const temp = list[indexInCustom];
    list[indexInCustom] = list[targetIdx];
    list[targetIdx] = temp;
    onUpdateCustomExercises(list);
  };

  const toggleSelect = (id: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSelectedToWorkout = () => {
    if (!onSelectExercises || selectedExerciseIds.length === 0) return;
    const selected = allExercises.filter((e) => selectedExerciseIds.includes(e.id));
    onSelectExercises(selected);
    setSelectedExerciseIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-100">Exercise Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  {allExercises.length} Total Exercises
                </span>
                {customExercises.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                    {customExercises.length} Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                14 Muscle Groups • Fully Customizable • Synced to Cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Exercise</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 space-y-3">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercise name, machine, equipment, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq === "All" ? "All Equipment" : eq}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              >
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === "All" ? "All Difficulties" : diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 14 Muscle Group Chips Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
            <button
              onClick={() => setSelectedMuscle("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedMuscle === "All"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              All Muscles
            </button>
            {MUSCLE_GROUPS.map((muscle) => {
              const count = allExercises.filter((e) => e.muscleGroup === muscle).length;
              const isActive = selectedMuscle === muscle;
              return (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{muscle}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-slate-950/30 text-slate-950" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises List & Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-800/50">
          {filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300">No exercises found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No exercises match your current filter. Add a new custom exercise or adjust your search query.
              </p>
              <button
                onClick={handleOpenAddForm}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Add New Exercise
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredExercises.map((ex) => {
                const isSelected = selectedExerciseIds.includes(ex.id);
                const isCustom = Boolean(ex.isCustom || customExercises.some((c) => c.id === ex.id));
                const customIndex = customExercises.findIndex((c) => c.id === ex.id);

                return (
                  <div
                    key={ex.id}
                    className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      {/* Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {onSelectExercises && (
                            <button
                              type="button"
                              onClick={() => toggleSelect(ex.id)}
                              className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                  : "border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </button>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-100 leading-snug">
                                {ex.name}
                              </h3>
                              {isCustom && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/30">
                                  Custom
                                </span>
                              )}
                            </div>
                            {ex.machineName && (
                              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                                Machine: {ex.machineName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Top quick badges */}
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium">
                            {ex.muscleGroup}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-400">
                            {ex.equipment}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Instructions snippet */}
                      {ex.notes && (
                        <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 mt-2">
                          Note: {ex.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/70 text-xs">
                      <div className="flex items-center gap-1.5">
                        {/* Reorder if custom */}
                        {isCustom && customIndex !== -1 && (
                          <div className="flex items-center gap-0.5 mr-1">
                            <button
                              disabled={customIndex === 0}
                              onClick={() => handleMoveExercise(customIndex, "up")}
                              title="Move Up"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              disabled={customIndex === customExercises.length - 1}
                              onClick={() => handleMoveExercise(customIndex, "down")}
                              title="Move Down"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditForm(ex)}
                          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800/50"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateExercise(ex)}
                          className="flex items-center gap-1 text-slate-400 hover:text-sky-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800/50"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Duplicate</span>
                        </button>

                        {/* Delete if custom */}
                        {isCustom && (
                          <button
                            onClick={() => handleDeleteExercise(ex)}
                            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800/50"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {/* Direct Add to workout */}
                      {onSelectExercises && (
                        <button
                          onClick={() => {
                            onSelectExercises([ex]);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer text-[11px]"
                        >
                          + Add to Workout
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with selection confirmation */}
        {onSelectExercises && selectedExerciseIds.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/90">
            <span className="text-xs text-slate-300 font-bold">
              {selectedExerciseIds.length} exercise{selectedExerciseIds.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedExerciseIds([])}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
              >
                Clear Selection
              </button>
              <button
                onClick={handleAddSelectedToWorkout}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                Add {selectedExerciseIds.length} to Workout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Exercise Sub-modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100">
                  {editingExercise ? "Edit Exercise" : "Add New Exercise"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Smith Machine Press"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Muscle Group *</label>
                  <select
                    value={formMuscle}
                    onChange={(e) => setFormMuscle(e.target.value as MuscleGroup)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Equipment *</label>
                  <select
                    value={formEquipment}
                    onChange={(e) => setFormEquipment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {EQUIPMENT_OPTIONS.filter((eq) => eq !== "All").map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Machine Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hammer Strength Iso-Lateral"
                    value={formMachine}
                    onChange={(e) => setFormMachine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) =>
                      setFormDifficulty(e.target.value as "Beginner" | "Intermediate" | "Advanced")
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Set seat to notch 3, 2-sec pause at bottom stretch, keep elbows at 45 degrees."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition shadow-lg shadow-emerald-500/20"
                >
                  {editingExercise ? "Save Changes" : "Create Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
