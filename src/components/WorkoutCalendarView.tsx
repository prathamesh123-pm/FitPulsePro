import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Plus,
  Trash2,
  Play,
  Award,
  Sparkles,
  Layers,
  Filter,
  Check,
  CalendarCheck,
  CalendarRange,
  Zap,
} from "lucide-react";
import {
  WorkoutSession,
  WorkoutTemplate,
  CoachWorkoutPlan,
  MuscleGroup,
} from "../types";
import { MUSCLE_GROUPS } from "../data/exercises";

interface WorkoutCalendarViewProps {
  workoutHistory: WorkoutSession[];
  coachPlans?: CoachWorkoutPlan[];
  workoutTemplates?: WorkoutTemplate[];
  activeWorkout: WorkoutSession | null;
  onStartWorkoutFromTemplate: (template: WorkoutTemplate) => void;
  onStartWorkoutFromPlan: (plan: CoachWorkoutPlan) => void;
  onStartEmptyWorkout: (name?: string, primaryMuscle?: MuscleGroup | "Mixed", date?: string) => void;
  onSchedulePlan?: (plan: CoachWorkoutPlan) => void;
  onDeleteScheduledPlan?: (id: string) => void;
}

export function WorkoutCalendarView({
  workoutHistory,
  coachPlans = [],
  workoutTemplates = [],
  activeWorkout,
  onStartWorkoutFromTemplate,
  onStartWorkoutFromPlan,
  onStartEmptyWorkout,
  onSchedulePlan,
  onDeleteScheduledPlan,
}: WorkoutCalendarViewProps) {
  // Current view date (year & month)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filters
  const [filterType, setFilterType] = useState<"all" | "completed" | "planned">("all");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");

  // Plan Workout Modal / inline state for selected date
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    workoutTemplates[0]?.id || ""
  );
  const [customPlanTitle, setCustomPlanTitle] = useState("");
  const [customPlanMuscle, setCustomPlanMuscle] = useState<MuscleGroup | "Mixed">("Chest");
  const [customPlanDifficulty, setCustomPlanDifficulty] = useState<
    "Beginner" | "Intermediate" | "Advanced" | "Pro"
  >("Intermediate");
  const [customPlanDuration, setCustomPlanDuration] = useState(60);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Month metadata
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Map workouts & planned sessions by date YYYY-MM-DD
  const completedByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    workoutHistory.forEach((w) => {
      if (w.completed || w.exercises?.some((e) => e.sets?.some((s) => s.completed))) {
        const list = map.get(w.date) || [];
        list.push(w);
        map.set(w.date, list);
      }
    });
    return map;
  }, [workoutHistory]);

  const plannedByDate = useMemo(() => {
    const map = new Map<string, CoachWorkoutPlan[]>();
    coachPlans.forEach((cp) => {
      const list = map.get(cp.workoutDate) || [];
      list.push(cp);
      map.set(cp.workoutDate, list);
    });
    return map;
  }, [coachPlans]);

  // Days matrix for the current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust so Monday is 0, Sunday is 6
    const startingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dayNumber: number | null;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      completedWorkouts: WorkoutSession[];
      plannedSessions: CoachWorkoutPlan[];
    }> = [];

    // Prepend empty slots
    for (let i = 0; i < startingOffset; i++) {
      days.push({
        dayNumber: null,
        dateStr: `empty-prev-${i}`,
        isCurrentMonth: false,
        isToday: false,
        completedWorkouts: [],
        plannedSessions: [],
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${currentYear}-${mm}-${dd}`;

      let completed = completedByDate.get(dateStr) || [];
      let planned = plannedByDate.get(dateStr) || [];

      // Apply muscle filter if selected
      if (filterMuscle !== "all") {
        completed = completed.filter((c) => c.muscleGroup === filterMuscle);
        planned = planned.filter((p) =>
          p.exercises?.some((e) => e.exerciseName.toLowerCase().includes(filterMuscle.toLowerCase()))
        );
      }

      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        completedWorkouts: completed,
        plannedSessions: planned,
      });
    }

    return days;
  }, [currentYear, currentMonth, completedByDate, plannedByDate, filterMuscle, todayStr]);

  // Monthly Metrics
  const monthlyStats = useMemo(() => {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const prefix = `${currentYear}-${mm}`;

    const monthCompleted = workoutHistory.filter(
      (w) =>
        w.date.startsWith(prefix) &&
        (w.completed || w.exercises?.some((e) => e.sets?.some((s) => s.completed)))
    );

    const monthPlanned = coachPlans.filter((p) => p.workoutDate.startsWith(prefix));

    const totalVolume = monthCompleted.reduce((acc, w) => {
      const vol = (w.exercises || []).reduce((eAcc, ex) => {
        const setVol = (ex.sets || []).reduce(
          (sAcc, s) => sAcc + (s.completed ? (s.weightKg || 0) * (s.reps || 0) : 0),
          0
        );
        return eAcc + setVol;
      }, 0);
      return acc + (w.totalVolumeKg || vol);
    }, 0);

    const totalDurationMins = monthCompleted.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
    const totalCalories = monthCompleted.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

    return {
      completedCount: monthCompleted.length,
      plannedCount: monthPlanned.length,
      totalVolume,
      totalDurationMins,
      totalCalories,
    };
  }, [workoutHistory, coachPlans, currentYear, currentMonth]);

  // Selected Day Data
  const selectedDayCompleted = useMemo(
    () => completedByDate.get(selectedDate) || [],
    [completedByDate, selectedDate]
  );
  const selectedDayPlanned = useMemo(
    () => plannedByDate.get(selectedDate) || [],
    [plannedByDate, selectedDate]
  );

  // Handle creating a new planned session for the selected date
  const handleCreatePlannedSession = () => {
    if (selectedTemplateId) {
      const tpl = workoutTemplates.find((t) => t.id === selectedTemplateId);
      if (tpl && onSchedulePlan) {
        const newCoachPlan: CoachWorkoutPlan = {
          id: `plan-${Date.now()}`,
          coachName: "Self Scheduled",
          planTitle: tpl.name,
          workoutDate: selectedDate,
          difficulty: "Intermediate",
          instructions: tpl.description || "Follow planned sets and target rep ranges strictly.",
          notes: `Scheduled from template: ${tpl.name}`,
          status: "Assigned",
          exercises: tpl.exercises.map((te) => ({
            exerciseId: te.exerciseId,
            exerciseName: te.exerciseName,
            sets: te.plannedSets || 3,
            reps: `${te.plannedReps || 10}`,
            weightKg: te.plannedWeightKg || 50,
            restTimeSec: 60,
            instructions: te.exerciseNotes || "",
            notes: "",
          })),
        };
        onSchedulePlan(newCoachPlan);
        setIsAddingPlan(false);
        return;
      }
    }

    if (customPlanTitle.trim() && onSchedulePlan) {
      const newCoachPlan: CoachWorkoutPlan = {
        id: `plan-${Date.now()}`,
        coachName: "Self Scheduled",
        planTitle: customPlanTitle.trim(),
        workoutDate: selectedDate,
        difficulty: customPlanDifficulty,
        instructions: `Focus on ${customPlanMuscle} stimulation and strict tempo.`,
        notes: `Estimated duration: ${customPlanDuration} mins`,
        status: "Assigned",
        exercises: [
          {
            exerciseId: "custom-ex-1",
            exerciseName: `${customPlanMuscle} Compound Focus`,
            sets: 4,
            reps: "8-12",
            weightKg: 60,
            restTimeSec: 90,
            instructions: "Warm up thoroughly.",
            notes: "",
          },
        ],
      };
      onSchedulePlan(newCoachPlan);
      setCustomPlanTitle("");
      setIsAddingPlan(false);
    }
  };

  const selectedDateFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER & MONTHLY METRICS SUMMARY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-xl font-black text-emerald-400">
              {monthlyStats.completedCount}{" "}
              <span className="text-xs font-semibold text-slate-400">Sessions</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Planned Ahead
            </span>
            <span className="text-xl font-black text-sky-400">
              {monthlyStats.plannedCount}{" "}
              <span className="text-xs font-semibold text-slate-400">Scheduled</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Volume
            </span>
            <span className="text-xl font-black text-amber-400">
              {(monthlyStats.totalVolume / 1000).toFixed(1)}{" "}
              <span className="text-xs font-semibold text-slate-400">Tons</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Time Trained
            </span>
            <span className="text-xl font-black text-purple-400">
              {Math.floor(monthlyStats.totalDurationMins / 60)}h{" "}
              {monthlyStats.totalDurationMins % 60}m
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Calories Burned
            </span>
            <span className="text-xl font-black text-rose-400">
              {monthlyStats.totalCalories.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">kcal</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Flame className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CALENDAR CONTROLS & FILTERS */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 py-1 text-center min-w-[140px]">
                <span className="text-sm font-black text-slate-100 block">
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleJumpToToday}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Days
              </button>
              <button
                onClick={() => setFilterType("completed")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  filterType === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Completed ({monthlyStats.completedCount})
              </button>
              <button
                onClick={() => setFilterType("planned")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  filterType === "planned"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Planned ({monthlyStats.plannedCount})
              </button>
            </div>

            {/* Target Muscle Filter */}
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Muscle Groups</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {mg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>Completed Workout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400"></span>
            <span>Upcoming Planned Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400"></span>
            <span>Coach Assigned Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-400"></span>
            <span>Today's Date</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CALENDAR GRID + DAY DETAILS SPLIT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Grid (Col 1-8) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-amber-400/80">Sat</span>
            <span className="text-rose-400/80">Sun</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={cell.dateStr}
                    className="min-h-[70px] sm:min-h-[90px] rounded-2xl bg-slate-950/30 border border-slate-900/40 opacity-30 pointer-events-none p-1.5"
                  />
                );
              }

              const isSelected = selectedDate === cell.dateStr;
              const hasCompleted = cell.completedWorkouts.length > 0;
              const hasPlanned = cell.plannedSessions.length > 0;

              // If filtering
              if (filterType === "completed" && !hasCompleted) {
                // Dim non-matching cells
              }
              if (filterType === "planned" && !hasPlanned) {
                // Dim non-matching cells
              }

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[75px] sm:min-h-[95px] p-2 rounded-2xl text-left flex flex-col justify-between transition relative group cursor-pointer border ${
                    isSelected
                      ? "bg-slate-800 border-emerald-400 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/40"
                      : cell.isToday
                      ? "bg-slate-950 border-emerald-500/70 hover:bg-slate-800/80"
                      : "bg-slate-950/80 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                  }`}
                >
                  {/* Top Bar inside cell: Day Number & Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                        cell.isToday
                          ? "bg-emerald-500 text-slate-950"
                          : isSelected
                          ? "text-emerald-400"
                          : "text-slate-300 group-hover:text-slate-100"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick Badge indicator */}
                    <div className="flex items-center gap-1">
                      {hasCompleted && (
                        <span
                          className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
                          title={`${cell.completedWorkouts.length} Completed Workout(s)`}
                        />
                      )}
                      {hasPlanned && (
                        <span
                          className="h-2 w-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"
                          title={`${cell.plannedSessions.length} Planned Session(s)`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Badges preview inside cell */}
                  <div className="mt-1 space-y-1 w-full overflow-hidden">
                    {/* Completed Workouts pill */}
                    {cell.completedWorkouts.slice(0, 2).map((w, wIdx) => (
                      <div
                        key={w.id || wIdx}
                        className="px-1.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold text-emerald-300 truncate flex items-center gap-1"
                        title={`${w.workoutName} • ${w.muscleGroup} (${w.durationMinutes}m)`}
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{w.workoutName}</span>
                      </div>
                    ))}

                    {/* Planned Workouts pill */}
                    {cell.plannedSessions.slice(0, 2).map((p, pIdx) => (
                      <div
                        key={p.id || pIdx}
                        className="px-1.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-[9px] sm:text-[10px] font-bold text-sky-300 truncate flex items-center gap-1"
                        title={`Planned: ${p.planTitle} (${p.difficulty})`}
                      >
                        <Clock className="h-2.5 w-2.5 text-sky-400 flex-shrink-0" />
                        <span className="truncate">{p.planTitle}</span>
                      </div>
                    ))}

                    {/* Multi count pill */}
                    {cell.completedWorkouts.length + cell.plannedSessions.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-semibold text-center">
                        +{cell.completedWorkouts.length + cell.plannedSessions.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Inspector (Col 9-12) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            {/* Header for Selected Day */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  Day Schedule & Log
                </span>
                <h3 className="text-base font-black text-slate-100">{selectedDateFormatted}</h3>
              </div>

              <button
                onClick={() => setIsAddingPlan(!isAddingPlan)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isAddingPlan ? "Close Plan" : "+ Plan"}</span>
              </button>
            </div>

            {/* Inline Plan Creator */}
            {isAddingPlan && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn text-xs">
                <span className="font-bold text-slate-200 block text-xs">
                  Schedule Workout for {selectedDate}
                </span>

                {/* Option 1: Pick from Template */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Select Saved Template:
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setCustomPlanTitle("");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Or enter custom session below --</option>
                    {workoutTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.muscleGroup} • {t.exercises.length} exercises)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Option 2: Custom Name */}
                {!selectedTemplateId && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">
                        Workout Title:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Upper Body Blast"
                        value={customPlanTitle}
                        onChange={(e) => setCustomPlanTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Muscle:</label>
                        <select
                          value={customPlanMuscle}
                          onChange={(e) => setCustomPlanMuscle(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none mt-1"
                        >
                          <option value="Mixed">Mixed</option>
                          {MUSCLE_GROUPS.map((mg) => (
                            <option key={mg} value={mg}>
                              {mg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">
                          Est. Duration (min):
                        </label>
                        <input
                          type="number"
                          min={15}
                          max={180}
                          value={customPlanDuration}
                          onChange={(e) => setCustomPlanDuration(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsAddingPlan(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePlannedSession}
                    disabled={!selectedTemplateId && !customPlanTitle.trim()}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    Save to Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action: Start session on this date */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartEmptyWorkout("Custom Session", "Chest", selectedDate)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                <span>Start Workout on this Date</span>
              </button>
            </div>

            {/* Section A: Completed Workouts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Completed Workouts ({selectedDayCompleted.length})</span>
                </span>
              </div>

              {selectedDayCompleted.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1 text-slate-500 text-xs">
                  <Dumbbell className="h-6 w-6 mx-auto opacity-40 mb-1" />
                  <p>No completed workouts logged for this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayCompleted.map((w) => {
                    const totalSets = (w.exercises || []).reduce(
                      (acc, ex) => acc + (ex.sets?.length || 0),
                      0
                    );
                    const totalVolume = (w.exercises || []).reduce((acc, ex) => {
                      return (
                        acc +
                        (ex.sets || []).reduce(
                          (sAcc, s) => sAcc + (s.completed ? (s.weightKg || 0) * (s.reps || 0) : 0),
                          0
                        )
                      );
                    }, 0);

                    return (
                      <div
                        key={w.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-black text-slate-100 block">
                              {w.workoutName}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                {w.muscleGroup}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                • {w.durationMinutes}m • {w.caloriesBurned} kcal
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-emerald-400">
                            {totalVolume.toLocaleString()} kg
                          </span>
                        </div>

                        {/* Exercise Breakdown */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                          {w.exercises?.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="flex items-center justify-between text-[11px] text-slate-300 py-0.5"
                            >
                              <span className="truncate pr-2 font-medium">{ex.exerciseName}</span>
                              <span className="text-slate-500 flex-shrink-0">
                                {ex.sets?.filter((s) => s.completed).length || ex.sets?.length || 0}{" "}
                                sets
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section B: Upcoming Planned Sessions */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-sky-400" />
                  <span>Planned / Coach Plans ({selectedDayPlanned.length})</span>
                </span>
              </div>

              {selectedDayPlanned.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1 text-slate-500 text-xs">
                  <CalendarIcon className="h-6 w-6 mx-auto opacity-40 mb-1" />
                  <p>No planned workouts for this date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayPlanned.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-black text-slate-100 block">
                            {plan.planTitle}
                          </span>
                          <span className="text-[11px] text-sky-400 font-semibold">
                            By {plan.coachName} • {plan.difficulty}
                          </span>
                        </div>

                        {onDeleteScheduledPlan && (
                          <button
                            onClick={() => onDeleteScheduledPlan(plan.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Remove scheduled plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {plan.instructions && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-xl">
                          "{plan.instructions}"
                        </p>
                      )}

                      {/* Exercises in plan */}
                      <div className="space-y-1 text-xs">
                        {plan.exercises?.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="flex items-center justify-between text-[11px] text-slate-300"
                          >
                            <span className="truncate pr-2 font-medium">{ex.exerciseName}</span>
                            <span className="text-sky-400 font-bold flex-shrink-0">
                              {ex.sets} sets × {ex.reps}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action: Launch Plan */}
                      <button
                        onClick={() => onStartWorkoutFromPlan(plan)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-md shadow-sky-500/20 cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 fill-slate-950" />
                        <span>Launch & Start This Session</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
