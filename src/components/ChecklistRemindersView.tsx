import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  Bell,
  BellOff,
  Clock,
  Plus,
  Flame,
  Moon,
  Footprints,
  Droplets,
  Zap,
  Camera,
  Scale,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  Volume2,
} from "lucide-react";
import { DailyChecklist, SmartReminder } from "../types";

interface ChecklistRemindersViewProps {
  checklists: Record<string, DailyChecklist>;
  reminders: SmartReminder[];
  onUpdateChecklist: (date: string, updated: DailyChecklist) => void;
  onUpdateReminders: (updated: SmartReminder[]) => void;
}

export function ChecklistRemindersView({
  checklists,
  reminders,
  onUpdateChecklist,
  onUpdateReminders,
}: ChecklistRemindersViewProps) {
  const realToday = new Date().toISOString().split("T")[0];
  const currentDate = checklists[realToday] ? realToday : (checklists["2026-08-28"] ? "2026-08-28" : realToday);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);

  // New reminder form state
  const [newRemTitle, setNewRemTitle] = useState("");
  const [newRemType, setNewRemType] = useState<SmartReminder["type"]>("Water");
  const [newRemTime, setNewRemTime] = useState("14:00");
  const [newRemDays, setNewRemDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  // Current checklist
  const todayChecklist: DailyChecklist = useMemo(() => {
    return (
      checklists[selectedDate] || {
        date: selectedDate,
        workout: false,
        cardio: false,
        warmUp: false,
        stretching: false,
        coolDown: false,
        allMeals: false,
        proteinGoal: false,
        caloriesGoal: false,
        waterGoal: false,
        supplements: false,
        sleepGoal: false,
        sleepHours: 7.5,
        stepsGoal: false,
        stepsCount: 8420,
        weightUpdated: false,
        progressPhoto: false,
      }
    );
  }, [checklists, selectedDate]);

  // Compute checklist completion %
  const checklistStats = useMemo(() => {
    const booleanKeys: (keyof DailyChecklist)[] = [
      "workout",
      "cardio",
      "warmUp",
      "stretching",
      "coolDown",
      "allMeals",
      "proteinGoal",
      "caloriesGoal",
      "waterGoal",
      "supplements",
      "sleepGoal",
      "stepsGoal",
      "weightUpdated",
      "progressPhoto",
    ];

    const completedCount = booleanKeys.filter((k) => Boolean(todayChecklist[k])).length;
    const totalCount = booleanKeys.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    return { completedCount, totalCount, percentage };
  }, [todayChecklist]);

  const toggleChecklistItem = (key: keyof DailyChecklist) => {
    onUpdateChecklist(selectedDate, {
      ...todayChecklist,
      [key]: !todayChecklist[key],
    });
  };

  const handleToggleReminder = (reminderId: string) => {
    const updated = reminders.map((r) => (r.id === reminderId ? { ...r, enabled: !r.enabled } : r));
    onUpdateReminders(updated);
  };

  const handleDeleteReminder = (reminderId: string) => {
    onUpdateReminders(reminders.filter((r) => r.id !== reminderId));
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemTitle.trim()) return;

    const created: SmartReminder = {
      id: `rem-${Date.now()}`,
      title: newRemTitle,
      type: newRemType,
      time: newRemTime,
      enabled: true,
      days: newRemDays,
    };

    onUpdateReminders([...reminders, created]);
    setIsAddReminderOpen(false);
    setNewRemTitle("");
  };

  const toggleDaySelection = (day: string) => {
    if (newRemDays.includes(day)) {
      setNewRemDays(newRemDays.filter((d) => d !== day));
    } else {
      setNewRemDays([...newRemDays, day]);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Daily Checklist & Smart Reminders</h1>
            <p className="text-xs text-slate-400">14-point habit completion loop and proactive scheduling alerts</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddReminderOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Smart Reminder</span>
        </button>
      </div>

      {/* SECTION 17: DAILY FITNESS CHECKLIST */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 17 • 14-Point Daily Fitness Checklist</h3>
            <p className="text-xs text-slate-400">Maintain daily discipline across training, nutrition, recovery, and biometrics</p>
          </div>

          {/* Progress Circle / Bar & Streak */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
              <Flame className="h-4 w-4 fill-amber-400/20" />
              <span>8 Day Streak</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border-4 border-slate-800 border-t-emerald-400 flex items-center justify-center font-black text-xs text-slate-100">
                {checklistStats.percentage}%
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200">{checklistStats.completedCount}/{checklistStats.totalCount}</span>
                <span className="block text-[10px] text-slate-500">Tasks Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 14 Checklist items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: "workout", label: "Workout Done", icon: Zap, sub: "Resistance training session" },
            { key: "cardio", label: "Cardio Completed", icon: Flame, sub: "Zone 2 or HIIT cardio" },
            { key: "warmUp", label: "Warm Up Completed", icon: Clock, sub: "Mobility & activation sets" },
            { key: "stretching", label: "Stretching Completed", icon: Sparkles, sub: "Hamstrings, hips & chest" },
            { key: "coolDown", label: "Cool Down Completed", icon: Moon, sub: "Heart rate down to resting" },
            { key: "allMeals", label: "All 9 Meals Completed", icon: CheckCircle2, sub: "On scheduled meal cadence" },
            { key: "proteinGoal", label: "Protein Target Met", icon: Zap, sub: "165g+ daily intake reached" },
            { key: "caloriesGoal", label: "Calorie Budget Followed", icon: Flame, sub: "Within ±100 kcal target" },
            { key: "waterGoal", label: "Water Hydration Target Met", icon: Droplets, sub: "3.5L+ logged today" },
            { key: "supplements", label: "Supplements Taken", icon: Sparkles, sub: "Creatine & Multivitamin" },
            { key: "sleepGoal", label: "Sleep Goal Completed", icon: Moon, sub: `${todayChecklist.sleepHours} hrs logged` },
            { key: "stepsGoal", label: "Steps Goal Completed", icon: Footprints, sub: `${todayChecklist.stepsCount.toLocaleString()} steps` },
            { key: "weightUpdated", label: "Morning Weight Recorded", icon: Scale, sub: "Consistent fasted weigh-in" },
            { key: "progressPhoto", label: "Progress Photo Taken", icon: Camera, sub: "Weekly conditioning check" },
          ].map((item) => {
            const isDone = Boolean(todayChecklist[item.key as keyof DailyChecklist]);
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                onClick={() => toggleChecklistItem(item.key as keyof DailyChecklist)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                  isDone
                    ? "bg-emerald-950/30 border-emerald-500/50 text-slate-200"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDone ? "text-slate-100 line-through text-slate-300" : "text-slate-200"}`}>
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-slate-500">{item.sub}</p>
                  </div>
                </div>

                <div
                  className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                    isDone ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-600"
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 18: SMART REMINDERS & NOTIFICATIONS */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Section 18 • Smart Reminders & Scheduling Alerts</h3>
            <p className="text-xs text-slate-400">Workout, Meal, Water, Supplement, Membership, Weight, Photo, and Sleep alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const anyActive = reminders.some((r) => r.enabled);
                const updated = reminders.map((r) => ({ ...r, enabled: !anyActive }));
                onUpdateReminders(updated);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                reminders.some((r) => r.enabled)
                  ? "bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/30"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400"
              }`}
            >
              {reminders.some((r) => r.enabled) ? (
                <>
                  <BellOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Turn Off All Reminders</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-slate-950" />
                  <span>Turn On All Reminders</span>
                </>
              )}
            </button>
            <span className="text-xs text-slate-400 font-medium">
              {reminders.filter((r) => r.enabled).length} Active
            </span>
          </div>
        </div>

        {/* Reminders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between text-xs ${
                rem.enabled
                  ? "bg-slate-800/50 border-slate-700/80"
                  : "bg-slate-950/40 border-slate-800 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-100 text-sm">{rem.title}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                      {rem.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                    <span className="font-mono font-bold text-emerald-400">{rem.time}</span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400">{rem.days.join(", ")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rem.enabled}
                  onChange={() => handleToggleReminder(rem.id)}
                  className="h-4 w-4 rounded accent-indigo-500 cursor-pointer"
                  title="Enable/disable reminder"
                />
                <button
                  onClick={() => handleDeleteReminder(rem.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE SMART REMINDER MODAL */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Smart Reminder (Section 18)</h3>
              <button onClick={() => setIsAddReminderOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Reminder Title</label>
                <input
                  type="text"
                  placeholder="e.g. Drink 500ml water before lunch"
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Category / Type</label>
                  <select
                    value={newRemType}
                    onChange={(e) => setNewRemType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  >
                    <option value="Workout">Workout</option>
                    <option value="Meal">Meal</option>
                    <option value="Water">Water</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Membership">Membership</option>
                    <option value="Weight">Weight</option>
                    <option value="Progress Photo">Progress Photo</option>
                    <option value="Sleep">Sleep</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Alert Time</label>
                  <input
                    type="time"
                    value={newRemTime}
                    onChange={(e) => setNewRemTime(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5">Repeat Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
                    const isSelected = newRemDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDaySelection(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
