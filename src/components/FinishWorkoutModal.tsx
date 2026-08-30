import React, { useState } from "react";
import {
  CheckCircle,
  X,
  Clock,
  Flame,
  Dumbbell,
  Smile,
  Zap,
  Award,
  Calendar,
  Layers,
  Repeat,
  Scale,
} from "lucide-react";
import { WorkoutSession, WorkoutExerciseLog, WorkoutMood, MuscleGroup } from "../types";
import { MUSCLE_GROUPS } from "../data/exercises";

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSession: Partial<WorkoutSession>;
  onConfirmFinish: (finalSession: WorkoutSession) => void;
}

const MOODS: WorkoutMood[] = ["Energized", "Great", "Normal", "Tired", "Exhausted"];

export function FinishWorkoutModal({
  isOpen,
  onClose,
  initialSession,
  onConfirmFinish,
}: FinishWorkoutModalProps) {
  // Current time strings
  const now = new Date();
  const todayStr = initialSession.date || now.toISOString().split("T")[0];
  const defaultEndTime = initialSession.endTime || now.toTimeString().slice(0, 5);
  const defaultStartTime =
    initialSession.startTime ||
    new Date(Date.now() - (initialSession.durationMinutes || 60) * 60000).toTimeString().slice(0, 5);

  const [workoutName, setWorkoutName] = useState(initialSession.workoutName || "Chest & Arms Focus");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "Mixed">(
    initialSession.muscleGroup || "Chest"
  );
  const [workoutType, setWorkoutType] = useState<WorkoutSession["workoutType"]>(
    initialSession.workoutType || "Hypertrophy"
  );
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [durationMinutes, setDurationMinutes] = useState(
    initialSession.durationMinutes && initialSession.durationMinutes > 0
      ? initialSession.durationMinutes
      : 60
  );
  const [caloriesBurned, setCaloriesBurned] = useState(
    initialSession.caloriesBurned && initialSession.caloriesBurned > 0
      ? initialSession.caloriesBurned
      : 420
  );
  const [workoutMood, setWorkoutMood] = useState<WorkoutMood>(initialSession.workoutMood || "Great");
  const [energyLevel, setEnergyLevel] = useState<number>(initialSession.energyLevel || 8);
  const [notes, setNotes] = useState(initialSession.notes || "");
  const [prNote, setPrNote] = useState("");
  const [personalRecords, setPersonalRecords] = useState<string[]>(
    initialSession.personalRecords || []
  );

  if (!isOpen) return null;

  // Compute stats from exercises
  const exercises = initialSession.exercises || [];
  const totalExercises = exercises.length;
  let totalSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;

  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalSets += 1;
      const reps = Number(s.reps) || Number(s.plannedReps) || 0;
      const weight = Number(s.weightKg) || Number(s.plannedWeightKg) || 0;
      totalReps += reps;
      totalVolumeKg += reps * weight;
    });
  });

  const handleAddPR = () => {
    if (!prNote.trim()) return;
    setPersonalRecords([...personalRecords, prNote.trim()]);
    setPrNote("");
  };

  const handleRemovePR = (index: number) => {
    setPersonalRecords(personalRecords.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSession: WorkoutSession = {
      id: initialSession.id || `w-hist-${Date.now()}`,
      workoutName: workoutName.trim(),
      workoutType,
      muscleGroup,
      date,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes) || 45,
      caloriesBurned: Number(caloriesBurned) || 300,
      totalExercises,
      totalSets,
      totalReps,
      totalVolumeKg,
      personalRecords,
      workoutMood,
      energyLevel,
      notes: notes.trim(),
      exercises,
      completed: true,
      isPR: personalRecords.length > 0,
    };

    onConfirmFinish(finalSession);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100">Log & Finish Workout</h2>
              <p className="text-xs text-slate-400">
                Review your session statistics and save permanently to your history & cloud.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Session Computed Metrics Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
              <Dumbbell className="h-3 w-3 text-emerald-400" />
              <span>Exercises</span>
            </div>
            <span className="text-base font-black text-slate-100">{totalExercises}</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
              <Layers className="h-3 w-3 text-sky-400" />
              <span>Total Sets</span>
            </div>
            <span className="text-base font-black text-slate-100">{totalSets}</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
              <Repeat className="h-3 w-3 text-amber-400" />
              <span>Total Reps</span>
            </div>
            <span className="text-base font-black text-slate-100">{totalReps}</span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
              <Scale className="h-3 w-3 text-violet-400" />
              <span>Volume (kg)</span>
            </div>
            <span className="text-base font-black text-emerald-400">
              {totalVolumeKg.toLocaleString()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Workout Name & Muscle Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Workout Name *</label>
              <input
                type="text"
                required
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Chest & Triceps Push Power"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Muscle Group *</label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Mixed">Mixed / Full Body</option>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Start Time, End Time, Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Duration (Min) *</label>
              <input
                type="number"
                min={5}
                max={300}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Workout Type, Calories Burned, Energy Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Workout Type</label>
              <select
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value as any)}
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
              <label className="block text-slate-300 font-bold mb-1">Calories Burned (kcal)</label>
              <input
                type="number"
                min={20}
                max={2500}
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Energy Level (1 - 10): {energyLevel}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full mt-2 accent-emerald-500"
              />
            </div>
          </div>

          {/* Workout Mood */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Workout Mood</label>
            <div className="flex items-center gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setWorkoutMood(m)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    workoutMood === m
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Records (PR) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Personal Records (PR) / Highlights
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Bench press 85kg for 8 reps (New PR!)"
                value={prNote}
                onChange={(e) => setPrNote(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddPR}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>Add PR</span>
              </button>
            </div>
            {personalRecords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {personalRecords.map((pr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    <span>{pr}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePR(idx)}
                      className="text-amber-400/60 hover:text-amber-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Workout Notes & Reflections</label>
            <textarea
              rows={2}
              placeholder="e.g. Felt incredible activation on upper chest. Recovery was great between sets."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Save & Complete Workout</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
