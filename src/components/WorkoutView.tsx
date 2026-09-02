import { useState, useMemo } from "react";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  History,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Award,
  Layers,
  Sparkles,
  BookOpen,
  X,
  FileText,
  Clock,
  Flame,
  Info,
  Download,
  CalendarDays,
} from "lucide-react";
import {
  WorkoutSession,
  WorkoutExerciseLog,
  WorkoutSet,
  MuscleGroup,
  Exercise,
  WorkoutTemplate,
  CoachWorkoutPlan,
} from "../types";
import { ENRICHED_EXERCISES, MUSCLE_GROUPS } from "../data/exercises";
import { ExerciseLibraryModal } from "./ExerciseLibraryModal";
import { FinishWorkoutModal } from "./FinishWorkoutModal";
import { WorkoutTemplatesTab } from "./WorkoutTemplatesTab";
import { WorkoutCalendarView } from "./WorkoutCalendarView";
import { exportWorkoutsToCSV } from "../utils/csvExport";

interface WorkoutViewProps {
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  coachPlans?: CoachWorkoutPlan[];
  customExercises?: Exercise[];
  workoutTemplates?: WorkoutTemplate[];
  onSaveActiveWorkout: (workout: WorkoutSession | null) => void;
  onFinishWorkout: (completedSession: WorkoutSession) => void;
  onDeleteWorkoutHistory?: (id: string) => void;
  onUpdateCustomExercises?: (exercises: Exercise[]) => void;
  onUpdateWorkoutTemplates?: (templates: WorkoutTemplate[]) => void;
  onUpdateCoachPlans?: (plans: CoachWorkoutPlan[]) => void;
}

export function WorkoutView({
  activeWorkout,
  workoutHistory,
  coachPlans = [],
  customExercises = [],
  workoutTemplates = [],
  onSaveActiveWorkout,
  onFinishWorkout,
  onDeleteWorkoutHistory,
  onUpdateCustomExercises = () => {},
  onUpdateWorkoutTemplates = () => {},
  onUpdateCoachPlans = () => {},
}: WorkoutViewProps) {
  // Navigation sub-tabs: "tracker" | "calendar" | "templates" | "history"
  const [activeSubTab, setActiveSubTab] = useState<"tracker" | "calendar" | "templates" | "history">("tracker");

  // Modals state
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryMuscleGroup, setLibraryMuscleGroup] = useState<MuscleGroup | null>(null);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  // History expansion state
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Combined exercise list (default + custom)
  const allExercises = useMemo(() => {
    const customMap = new Map(customExercises.map((e) => [e.id, e]));
    const combined = [...customExercises];
    ENRICHED_EXERCISES.forEach((e) => {
      if (!customMap.has(e.id)) {
        combined.push(e);
      }
    });
    return combined;
  }, [customExercises]);

  // Start new empty workout
  const handleStartEmptyWorkout = (
    name = "Custom Strength Session",
    primaryMuscle: MuscleGroup | "Mixed" = "Chest",
    targetDate?: string
  ) => {
    const now = new Date();
    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      workoutName: name,
      workoutType: "Hypertrophy",
      muscleGroup: primaryMuscle,
      date: targetDate || now.toISOString().split("T")[0],
      startTime: now.toTimeString().slice(0, 5),
      endTime: "",
      durationMinutes: 60, // manual input
      caloriesBurned: 350, // manual input
      notes: "",
      workoutMood: "Energized",
      energyLevel: 8,
      completed: false,
      exercises: [],
    };
    onSaveActiveWorkout(newSession);
    setActiveSubTab("tracker");
  };

  // Start workout from a Coach Plan
  const handleStartFromCoachPlan = (plan: CoachWorkoutPlan) => {
    const now = new Date();
    const exerciseLogs: WorkoutExerciseLog[] = (plan.exercises || []).map((pe, idx) => {
      const setsCount = pe.sets || 3;
      const repsNum = Number(pe.reps?.split("-")[0]) || 10;
      const sets: WorkoutSet[] = Array.from({ length: setsCount }).map((_, sIdx) => ({
        id: `set-${Date.now()}-${idx}-${sIdx}`,
        setNumber: sIdx + 1,
        weightKg: pe.weightKg || 50,
        plannedWeightKg: pe.weightKg || 50,
        reps: repsNum,
        plannedReps: repsNum,
        completed: false,
        notes: pe.notes || "",
      }));

      return {
        exerciseId: pe.exerciseId || `ex-${idx}`,
        exerciseName: pe.exerciseName,
        muscleGroup: "Chest",
        plannedSets: setsCount,
        plannedReps: repsNum,
        plannedWeightKg: pe.weightKg || 50,
        exerciseNotes: pe.instructions || pe.notes || "",
        sets,
      };
    });

    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      workoutName: plan.planTitle,
      workoutType: "Hypertrophy",
      muscleGroup: "Mixed",
      date: plan.workoutDate || now.toISOString().split("T")[0],
      startTime: now.toTimeString().slice(0, 5),
      endTime: "",
      durationMinutes: 60,
      caloriesBurned: 400,
      notes: `${plan.instructions ? plan.instructions + " • " : ""}Coach: ${plan.coachName}`,
      workoutMood: "Energized",
      energyLevel: 8,
      completed: false,
      exercises: exerciseLogs,
    };

    onSaveActiveWorkout(newSession);
    setActiveSubTab("tracker");
  };

  // Schedule a new plan into coachPlans
  const handleSchedulePlan = (newPlan: CoachWorkoutPlan) => {
    const updated = [newPlan, ...coachPlans];
    onUpdateCoachPlans(updated);
  };

  // Delete a scheduled plan
  const handleDeleteScheduledPlan = (id: string) => {
    const updated = coachPlans.filter((p) => p.id !== id);
    onUpdateCoachPlans(updated);
  };

  // Start workout from a saved Template
  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    const now = new Date();
    const exerciseLogs: WorkoutExerciseLog[] = template.exercises.map((te: any, idx) => {
      const setsCount = te.targetSets?.length || te.plannedSets || 3;
      const sets: WorkoutSet[] =
        te.targetSets && te.targetSets.length > 0
          ? te.targetSets.map((ts: any, sIdx: number) => ({
              id: `set-${Date.now()}-${idx}-${sIdx}`,
              setNumber: ts.setNumber || sIdx + 1,
              weightKg: ts.targetWeightKg || 50,
              plannedWeightKg: ts.targetWeightKg || 50,
              reps: ts.targetReps || 10,
              plannedReps: ts.targetReps || 10,
              completed: false,
              notes: "",
            }))
          : Array.from({ length: setsCount }).map((_, sIdx) => ({
              id: `set-${Date.now()}-${idx}-${sIdx}`,
              setNumber: sIdx + 1,
              weightKg: te.plannedWeightKg || 50,
              plannedWeightKg: te.plannedWeightKg || 50,
              reps: te.plannedReps || 10,
              plannedReps: te.plannedReps || 10,
              completed: false,
              notes: "",
            }));

      return {
        exerciseId: te.exerciseId,
        exerciseName: te.exerciseName,
        muscleGroup: te.muscleGroup,
        plannedSets: setsCount,
        plannedReps: te.plannedReps || te.targetSets?.[0]?.targetReps || 10,
        plannedWeightKg: te.plannedWeightKg || te.targetSets?.[0]?.targetWeightKg || 50,
        exerciseNotes: te.notes || te.exerciseNotes || "",
        sets,
      };
    });

    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      workoutName: template.name,
      workoutType: template.workoutType,
      muscleGroup: template.muscleGroup,
      date: now.toISOString().split("T")[0],
      startTime: now.toTimeString().slice(0, 5),
      endTime: "",
      durationMinutes: template.estimatedDurationMinutes || (template as any).estimatedMinutes || 60,
      caloriesBurned: 380,
      notes: template.description || "",
      workoutMood: "Energized",
      energyLevel: 8,
      completed: false,
      exercises: exerciseLogs,
    };

    onSaveActiveWorkout(newSession);
    setActiveSubTab("tracker");
  };

  // Add exercises chosen from Exercise Library Modal into active workout
  const handleAddExercisesFromLibrary = (selectedList: Exercise[]) => {
    if (selectedList.length === 0) return;

    const newExerciseLogs: WorkoutExerciseLog[] = selectedList.map((ex) => {
      const defaultSets: WorkoutSet[] = [
        {
          id: `s-${Date.now()}-${Math.random()}-1`,
          setNumber: 1,
          weightKg: 50,
          plannedWeightKg: 50,
          reps: 10,
          plannedReps: 10,
          completed: false,
          notes: "",
        },
        {
          id: `s-${Date.now()}-${Math.random()}-2`,
          setNumber: 2,
          weightKg: 55,
          plannedWeightKg: 55,
          reps: 10,
          plannedReps: 10,
          completed: false,
          notes: "",
        },
        {
          id: `s-${Date.now()}-${Math.random()}-3`,
          setNumber: 3,
          weightKg: 60,
          plannedWeightKg: 60,
          reps: 8,
          plannedReps: 8,
          completed: false,
          notes: "",
        },
      ];

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        plannedSets: 3,
        plannedReps: 10,
        plannedWeightKg: 50,
        exerciseNotes: ex.notes || "",
        sets: defaultSets,
      };
    });

    if (activeWorkout) {
      onSaveActiveWorkout({
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, ...newExerciseLogs],
      });
    } else {
      const now = new Date();
      const primaryMuscle = selectedList[0]?.muscleGroup || "Chest";
      const session: WorkoutSession = {
        id: `workout-${Date.now()}`,
        workoutName: `${primaryMuscle} Focused Session`,
        workoutType: "Hypertrophy",
        muscleGroup: primaryMuscle,
        date: now.toISOString().split("T")[0],
        startTime: now.toTimeString().slice(0, 5),
        endTime: "",
        durationMinutes: 60,
        caloriesBurned: 350,
        notes: "",
        workoutMood: "Energized",
        energyLevel: 8,
        completed: false,
        exercises: newExerciseLogs,
      };
      onSaveActiveWorkout(session);
    }

    setIsLibraryOpen(false);
  };

  // Add a new set to an exercise in active workout (UNLIMITED CUSTOM SETS)
  const handleAddSet = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const currentExercises = [...activeWorkout.exercises];
    const targetEx = currentExercises[exerciseIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];

    const nextSetNumber = targetEx.sets.length + 1;
    const newSet: WorkoutSet = {
      id: `s-${Date.now()}-${nextSetNumber}`,
      setNumber: nextSetNumber,
      weightKg: lastSet ? lastSet.weightKg : 50,
      plannedWeightKg: lastSet ? lastSet.plannedWeightKg : 50,
      reps: lastSet ? lastSet.reps : 10,
      plannedReps: lastSet ? lastSet.plannedReps : 10,
      completed: false,
      notes: "",
    };

    targetEx.sets.push(newSet);
    onSaveActiveWorkout({ ...activeWorkout, exercises: currentExercises });
  };

  // Remove set from an exercise
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const currentExercises = [...activeWorkout.exercises];
    currentExercises[exerciseIndex].sets.splice(setIndex, 1);
    // Renumber remaining sets
    currentExercises[exerciseIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    onSaveActiveWorkout({ ...activeWorkout, exercises: currentExercises });
  };

  // Update set details (weight, reps, planned, notes, completed)
  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<WorkoutSet>
  ) => {
    if (!activeWorkout) return;
    const currentExercises = [...activeWorkout.exercises];
    currentExercises[exerciseIndex].sets[setIndex] = {
      ...currentExercises[exerciseIndex].sets[setIndex],
      ...updates,
    };
    onSaveActiveWorkout({ ...activeWorkout, exercises: currentExercises });
  };

  // Remove exercise from active workout
  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const currentExercises = [...activeWorkout.exercises];
    currentExercises.splice(exerciseIndex, 1);
    onSaveActiveWorkout({ ...activeWorkout, exercises: currentExercises });
  };

  // Update workout top-level metadata (name, duration, calories, mood, notes)
  const handleUpdateWorkoutMeta = (updates: Partial<WorkoutSession>) => {
    if (!activeWorkout) return;
    onSaveActiveWorkout({
      ...activeWorkout,
      ...updates,
    });
  };

  // Cancel / Discard active workout
  const handleDiscardWorkout = () => {
    if (confirm("Are you sure you want to discard this workout? Unsaved sets will be lost.")) {
      onSaveActiveWorkout(null);
    }
  };

  // Total volume and completed sets in active workout
  const workoutStats = useMemo(() => {
    if (!activeWorkout) return { totalVolume: 0, completedSets: 0, totalSets: 0 };
    let volume = 0;
    let completedSets = 0;
    let totalSets = 0;

    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalSets++;
        if (s.completed) {
          completedSets++;
          volume += (s.weightKg || 0) * (s.reps || 0);
        }
      });
    });

    return { totalVolume: volume, completedSets, totalSets };
  }, [activeWorkout]);

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fadeIn">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100">Workout Command</h1>
              {activeWorkout && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Active Session
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Manual workout logging, unlimited sets, custom exercise library & templates.
            </p>
          </div>
        </div>

        {/* Sub-tab Pills & Library Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-2xl bg-slate-950 border border-slate-800 p-1">
            <button
              onClick={() => setActiveSubTab("tracker")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "tracker"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Workout Tracker
            </button>
            <button
              onClick={() => setActiveSubTab("calendar")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "calendar"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Calendar ({workoutHistory.length + coachPlans.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab("templates")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "templates"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Templates ({workoutTemplates.length})
            </button>
            <button
              onClick={() => setActiveSubTab("history")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "history"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              History ({workoutHistory.length})
            </button>
          </div>

          <button
            onClick={() => {
              setLibraryMuscleGroup(null);
              setIsLibraryOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Exercise Library</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: WORKOUT TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === "tracker" && (
        <div className="space-y-6">
          {!activeWorkout ? (
            /* No Active Workout: Start Screen */
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto">
                  <Dumbbell className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-100">Ready to Train?</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start an empty session, build a workout from your custom library, or quick-launch
                  from a saved template with complete manual set tracking and zero distractions.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartEmptyWorkout()}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>Start New Workout</span>
                </button>

                <button
                  onClick={() => setActiveSubTab("calendar")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>Workout Calendar & Schedule</span>
                </button>

                <button
                  onClick={() => setActiveSubTab("templates")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-sky-400" />
                  <span>Choose from Templates</span>
                </button>

                <button
                  onClick={() => {
                    setLibraryMuscleGroup(null);
                    setIsLibraryOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <span>Browse Exercise Library</span>
                </button>
              </div>

              {/* Muscle Quick-Starts */}
              <div className="pt-6 border-t border-slate-800 text-left">
                <span className="text-xs font-bold text-slate-400 block mb-3">
                  Quick Start by Target Muscle Group:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {MUSCLE_GROUPS.map((mg) => (
                    <button
                      key={mg}
                      onClick={() => handleStartEmptyWorkout(`${mg} Power Workout`, mg)}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 transition text-center cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block">
                        {mg}
                      </span>
                      <span className="text-[10px] text-slate-500">Start Session</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Workout In Progress */
            <div className="space-y-6">
              {/* Workout Metadata Bar */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={activeWorkout.workoutName}
                        onChange={(e) => handleUpdateWorkoutMeta({ workoutName: e.target.value })}
                        className="text-lg sm:text-xl font-black text-slate-100 bg-transparent border-b border-dashed border-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                      <select
                        value={activeWorkout.muscleGroup}
                        onChange={(e) =>
                          handleUpdateWorkoutMeta({ muscleGroup: e.target.value as any })
                        }
                        className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="Mixed">Mixed Body</option>
                        {MUSCLE_GROUPS.map((mg) => (
                          <option key={mg} value={mg}>
                            {mg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-400">
                      Logged for {activeWorkout.date} • Start Time: {activeWorkout.startTime}
                    </p>
                  </div>

                  {/* Top Stats & Finish Trigger */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs">
                      <Clock className="h-4 w-4 text-sky-400" />
                      <span className="text-slate-400">Duration:</span>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={activeWorkout.durationMinutes || 60}
                        onChange={(e) =>
                          handleUpdateWorkoutMeta({ durationMinutes: Number(e.target.value) })
                        }
                        className="w-14 bg-slate-900 text-slate-100 font-bold px-1.5 py-0.5 rounded border border-slate-700 text-center"
                      />
                      <span className="text-slate-400">min</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs">
                      <Flame className="h-4 w-4 text-rose-400" />
                      <span className="text-slate-400">Burned:</span>
                      <input
                        type="number"
                        min={10}
                        max={2000}
                        value={activeWorkout.caloriesBurned || 350}
                        onChange={(e) =>
                          handleUpdateWorkoutMeta({ caloriesBurned: Number(e.target.value) })
                        }
                        className="w-16 bg-slate-900 text-slate-100 font-bold px-1.5 py-0.5 rounded border border-slate-700 text-center"
                      />
                      <span className="text-slate-400">kcal</span>
                    </div>

                    <button
                      onClick={() => setIsFinishModalOpen(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                      <span>Finish Workout</span>
                    </button>

                    <button
                      onClick={handleDiscardWorkout}
                      className="p-2.5 rounded-2xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition cursor-pointer"
                      title="Discard workout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Workout Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Exercises</span>
                    <span className="font-extrabold text-slate-100 text-sm">
                      {activeWorkout.exercises.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Completed Sets</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      {workoutStats.completedSets} / {workoutStats.totalSets}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Total Volume</span>
                    <span className="font-extrabold text-sky-400 text-sm">
                      {workoutStats.totalVolume.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Mood</span>
                    <select
                      value={activeWorkout.workoutMood || "Energized"}
                      onChange={(e) =>
                        handleUpdateWorkoutMeta({ workoutMood: e.target.value as any })
                      }
                      className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Energized">Energized</option>
                      <option value="Great">Great</option>
                      <option value="Normal">Normal</option>
                      <option value="Tired">Tired</option>
                      <option value="Exhausted">Exhausted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Exercises List & Smart Set Trackers */}
              {activeWorkout.exercises.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                  <Dumbbell className="h-10 w-10 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-200">No Exercises Added Yet</h3>
                    <p className="text-xs text-slate-400">
                      Open your custom exercise library to add movements to this training session.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLibraryMuscleGroup(
                        activeWorkout.muscleGroup === "Mixed" ? null : (activeWorkout.muscleGroup as MuscleGroup)
                      );
                      setIsLibraryOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Add Exercise from Library</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeWorkout.exercises.map((exercise, exIndex) => (
                    <div
                      key={`${exercise.exerciseId}-${exIndex}`}
                      className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden"
                    >
                      {/* Exercise Header */}
                      <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-sm">
                            {exIndex + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-slate-100 text-base">
                                {exercise.exerciseName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                                {exercise.muscleGroup}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="Add exercise notes (tempo, seat settings, cue)..."
                              value={exercise.exerciseNotes || ""}
                              onChange={(e) => {
                                const currentExs = [...activeWorkout.exercises];
                                currentExs[exIndex].exerciseNotes = e.target.value;
                                onSaveActiveWorkout({ ...activeWorkout, exercises: currentExs });
                              }}
                              className="text-xs text-slate-400 bg-transparent placeholder:text-slate-600 focus:text-slate-200 focus:outline-none w-full mt-0.5"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleAddSet(exIndex)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Add Set</span>
                          </button>
                          <button
                            onClick={() => handleRemoveExercise(exIndex)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Remove exercise"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* UNLIMITED SETS TABLE */}
                      <div className="p-4 sm:p-5 overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[620px]">
                          <thead>
                            <tr className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-2">
                              <th className="py-2 px-2 w-12 text-center">Set</th>
                              <th className="py-2 px-2 w-28 text-center">Planned Wt</th>
                              <th className="py-2 px-2 w-28 text-center">Actual Wt (kg)</th>
                              <th className="py-2 px-2 w-24 text-center">Planned Reps</th>
                              <th className="py-2 px-2 w-24 text-center">Actual Reps</th>
                              <th className="py-2 px-3">Set Notes</th>
                              <th className="py-2 px-2 w-16 text-center">Done</th>
                              <th className="py-2 px-1 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {exercise.sets.map((st, sIndex) => (
                              <tr
                                key={st.id || sIndex}
                                className={`transition ${
                                  st.completed ? "bg-emerald-500/5 text-slate-100" : "hover:bg-slate-800/30 text-slate-300"
                                }`}
                              >
                                {/* Set Number */}
                                <td className="py-2.5 px-2 text-center font-black text-slate-400">
                                  {st.setNumber}
                                </td>

                                {/* Planned Weight */}
                                <td className="py-2.5 px-2 text-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={st.plannedWeightKg || st.weightKg || 0}
                                    onChange={(e) =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        plannedWeightKg: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>

                                {/* Actual Weight */}
                                <td className="py-2.5 px-2 text-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={st.weightKg || 0}
                                    onChange={(e) =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        weightKg: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>

                                {/* Planned Reps */}
                                <td className="py-2.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={st.plannedReps || st.reps || 0}
                                    onChange={(e) =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        plannedReps: Number(e.target.value),
                                      })
                                    }
                                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>

                                {/* Actual Reps */}
                                <td className="py-2.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    value={st.reps || 0}
                                    onChange={(e) =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        reps: Number(e.target.value),
                                      })
                                    }
                                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>

                                {/* Notes */}
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    placeholder="Form cues, failure, drop set..."
                                    value={st.notes || ""}
                                    onChange={(e) =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        notes: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>

                                {/* Completed Checkbox */}
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSet(exIndex, sIndex, {
                                        completed: !st.completed,
                                      })
                                    }
                                    className={`p-1.5 rounded-xl border transition cursor-pointer inline-flex items-center justify-center ${
                                      st.completed
                                        ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20"
                                        : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600"
                                    }`}
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </button>
                                </td>

                                {/* Remove Set */}
                                <td className="py-2.5 px-1 text-center">
                                  {exercise.sets.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSet(exIndex, sIndex)}
                                      className="text-slate-600 hover:text-rose-400 transition cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Add Set Footer Bar */}
                        <div className="pt-3 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => handleAddSet(exIndex)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                            <span>Add Another Set</span>
                          </button>
                          <span className="text-[11px] text-slate-500">
                            {exercise.sets.filter((s) => s.completed).length} / {exercise.sets.length} sets completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Movement Button */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setLibraryMuscleGroup(
                          activeWorkout.muscleGroup === "Mixed" ? null : (activeWorkout.muscleGroup as MuscleGroup)
                        );
                        setIsLibraryOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-black text-xs transition cursor-pointer shadow-lg"
                    >
                      <Plus className="h-4 w-4 text-emerald-400 stroke-[3]" />
                      <span>Add Another Exercise to Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: WORKOUT CALENDAR & SCHEDULE */}
      {/* ========================================================================= */}
      {activeSubTab === "calendar" && (
        <WorkoutCalendarView
          workoutHistory={workoutHistory}
          coachPlans={coachPlans}
          workoutTemplates={workoutTemplates}
          activeWorkout={activeWorkout}
          onStartWorkoutFromTemplate={handleStartFromTemplate}
          onStartWorkoutFromPlan={handleStartFromCoachPlan}
          onStartEmptyWorkout={handleStartEmptyWorkout}
          onSchedulePlan={handleSchedulePlan}
          onDeleteScheduledPlan={handleDeleteScheduledPlan}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: WORKOUT TEMPLATES */}
      {/* ========================================================================= */}
      {activeSubTab === "templates" && (
        <WorkoutTemplatesTab
          templates={workoutTemplates}
          onUpdateTemplates={onUpdateWorkoutTemplates}
          onQuickStartTemplate={handleStartFromTemplate}
          onOpenExerciseLibrary={() => {
            setLibraryMuscleGroup(null);
            setIsLibraryOpen(true);
          }}
          allExercises={allExercises}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: WORKOUT HISTORY */}
      {/* ========================================================================= */}
      {activeSubTab === "history" && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-100">Workout History</h2>
              <p className="text-xs text-slate-400">
                Permanent records of all completed sessions saved to Firebase.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                {workoutHistory.length} Sessions Logged
              </span>
              {workoutHistory.length > 0 && (
                <button
                  onClick={() => exportWorkoutsToCSV(workoutHistory, "Athlete")}
                  className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-500/20"
                  title="Export all historical workout sessions to CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </div>

          {workoutHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <History className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No workout history logged yet</p>
              <p className="text-xs text-slate-500">
                Complete your first workout to view historical logs, volume, and personal records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutHistory.map((item) => {
                const isExpanded = expandedHistoryId === item.id;
                let volume = 0;
                let setsCount = 0;
                item.exercises?.forEach((ex) => {
                  ex.sets?.forEach((st) => {
                    setsCount++;
                    volume += (st.weightKg || 0) * (st.reps || 0);
                  });
                });

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden transition"
                  >
                    <div
                      onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-100">
                              {item.workoutName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold">
                              {item.muscleGroup}
                            </span>
                            {item.workoutMood && (
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                • Mood: {item.workoutMood}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.date} • {item.startTime || "08:00"} {item.endTime ? `- ${item.endTime}` : ""} • {item.durationMinutes} mins • {item.caloriesBurned} kcal
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-xs font-bold text-sky-400 block">
                            {volume.toLocaleString()} kg Volume
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.exercises?.length || 0} exercises • {setsCount} sets
                          </span>
                        </div>

                        {onDeleteWorkoutHistory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this workout from history?")) {
                                onDeleteWorkoutHistory(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-400 transition"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded History Details */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-900/70 border-t border-slate-800 space-y-4 animate-fadeIn text-xs">
                        {item.notes && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                            <span className="text-slate-500 font-bold block mb-0.5 text-[10px] uppercase">
                              Workout Notes
                            </span>
                            {item.notes}
                          </div>
                        )}

                        <div className="space-y-3">
                          {item.exercises?.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">
                                  {ex.exerciseName}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {ex.muscleGroup}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                                {ex.sets?.map((s, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between"
                                  >
                                    <span className="text-slate-400">Set {s.setNumber}:</span>
                                    <span className="font-bold text-emerald-400">
                                      {s.weightKg}kg × {s.reps}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CUSTOM EXERCISE LIBRARY MODAL */}
      {/* ========================================================================= */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        customExercises={customExercises}
        onUpdateCustomExercises={onUpdateCustomExercises}
        onSelectExercises={handleAddExercisesFromLibrary}
        initialMuscleGroup={libraryMuscleGroup}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: FINISH WORKOUT MODAL */}
      {/* ========================================================================= */}
      {activeWorkout && (
        <FinishWorkoutModal
          isOpen={isFinishModalOpen}
          onClose={() => setIsFinishModalOpen(false)}
          initialSession={activeWorkout}
          onConfirmFinish={(completedSession) => {
            onFinishWorkout(completedSession);
            setIsFinishModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
