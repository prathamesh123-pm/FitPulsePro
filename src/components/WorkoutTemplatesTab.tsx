import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Play,
  Edit3,
  Trash2,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  X,
  Target,
} from "lucide-react";
import { WorkoutTemplate, WorkoutSession, MuscleGroup, Exercise } from "../types";
import { MUSCLE_GROUPS } from "../data/exercises";

interface WorkoutTemplatesTabProps {
  templates: WorkoutTemplate[];
  onUpdateTemplates: (templates: WorkoutTemplate[]) => void;
  onQuickStartTemplate: (template: WorkoutTemplate) => void;
  onOpenExerciseLibrary: () => void;
  allExercises: Exercise[];
}

export function WorkoutTemplatesTab({
  templates,
  onUpdateTemplates,
  onQuickStartTemplate,
  allExercises,
}: WorkoutTemplatesTabProps) {
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMuscleGroup, setFormMuscleGroup] = useState<MuscleGroup | "Mixed">("Chest");
  const [formType, setFormType] = useState<WorkoutTemplate["workoutType"]>("Hypertrophy");
  const [formMinutes, setFormMinutes] = useState(60);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormMuscleGroup("Chest");
    setFormType("Hypertrophy");
    setFormMinutes(60);
    setSelectedExerciseIds([]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (tpl: WorkoutTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormDescription(tpl.description || "");
    setFormMuscleGroup(tpl.muscleGroup);
    setFormType(tpl.workoutType);
    setFormMinutes(tpl.estimatedMinutes || 60);
    setSelectedExerciseIds(tpl.exercises.map((e) => e.exerciseId));
    setIsCreateModalOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm("Are you sure you want to delete this workout template?")) return;
    onUpdateTemplates(templates.filter((t) => t.id !== id));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const chosenExercises = allExercises.filter((ex) => selectedExerciseIds.includes(ex.id));

    // Construct exercises payload
    const templateExercises = chosenExercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      plannedSets: 4,
      plannedReps: 10,
      plannedWeightKg: 50,
      exerciseNotes: ex.notes || "Maintain controlled cadence",
    }));

    if (editingTemplate) {
      const updated = templates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: formName.trim(),
              description: formDescription.trim(),
              muscleGroup: formMuscleGroup,
              workoutType: formType,
              estimatedMinutes: formMinutes,
              exercises: templateExercises.length > 0 ? templateExercises : t.exercises,
            }
          : t
      );
      onUpdateTemplates(updated);
    } else {
      const newTpl: WorkoutTemplate = {
        id: `tpl-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim() || "Custom workout plan blueprint.",
        muscleGroup: formMuscleGroup,
        workoutType: formType,
        estimatedMinutes: formMinutes,
        createdAt: new Date().toISOString().split("T")[0],
        exercises: templateExercises,
      };
      onUpdateTemplates([newTpl, ...templates]);
    }

    setIsCreateModalOpen(false);
    setEditingTemplate(null);
  };

  const toggleSelectExerciseInForm = (id: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-100">Workout Templates</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {templates.length} Saved
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quick-load complete exercise splits, customize sets & reps, and save your favourite routines.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl) => {
          const isExpanded = expandedTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-100">{tpl.name}</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {tpl.muscleGroup}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px]">
                        {tpl.workoutType}
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{tpl.estimatedMinutes || 60}m</span>
                  </div>
                </div>

                {/* Exercises Preview Summary */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                      {tpl.exercises.length} Exercises Included
                    </span>
                    <button
                      onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide Details" : "View Exercises"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded or Collapsed list */}
                  {isExpanded ? (
                    <div className="space-y-2 mt-3 animate-fadeIn">
                      {tpl.exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200 block">{ex.exerciseName}</span>
                            <span className="text-[10px] text-slate-400">
                              {ex.muscleGroup} • {ex.equipment || "Free Weight"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-400 block">
                              {ex.plannedSets || 4} sets × {ex.plannedReps || 10} reps
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Target: {ex.plannedWeightKg || 50} kg
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.exercises.slice(0, 4).map((ex, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] border border-slate-800"
                        >
                          {ex.exerciseName}
                        </span>
                      ))}
                      {tpl.exercises.length > 4 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[11px]">
                          +{tpl.exercises.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => onQuickStartTemplate(tpl)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Quick Start Workout</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100">
                  {editingTemplate ? "Edit Workout Template" : "Create Workout Template"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest & Shoulders Hypertrophy"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the focus or progression of this template..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Muscle</label>
                  <select
                    value={formMuscleGroup}
                    onChange={(e) => setFormMuscleGroup(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Mixed">Mixed / Full Body</option>
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Workout Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Hypertrophy">Hypertrophy</option>
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="HIIT">HIIT</option>
                    <option value="Calisthenics">Calisthenics</option>
                    <option value="Endurance">Endurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={formMinutes}
                    onChange={(e) => setFormMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Select Exercises to include */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-bold">
                    Select Exercises ({selectedExerciseIds.length} chosen)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Check exercises to include in template
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-900">
                  {allExercises.map((ex) => {
                    const isSelected = selectedExerciseIds.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => toggleSelectExerciseInForm(ex.id)}
                        className={`p-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                          isSelected ? "bg-emerald-500/10 text-emerald-300" : "hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                : "border-slate-700 bg-slate-900 text-transparent"
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                          <span className="font-bold text-slate-200">{ex.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{ex.muscleGroup}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition shadow-lg shadow-emerald-500/20"
                >
                  {editingTemplate ? "Save Changes" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
