import React, { useState } from "react";
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  Droplets,
  Utensils,
  Dumbbell,
  Coffee,
  Check,
  Save,
  FileText,
  Sparkles,
} from "lucide-react";
import { DailyRoutineLog } from "../types";

interface DailyLifestyleTrackerProps {
  dailyRoutines: Record<string, DailyRoutineLog>;
  onUpdateDailyRoutine: (date: string, routine: DailyRoutineLog) => void;
  initialDate?: string;
}

export function DailyLifestyleTracker({
  dailyRoutines,
  onUpdateDailyRoutine,
  initialDate = "2026-08-28",
}: DailyLifestyleTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentRoutine: DailyRoutineLog = dailyRoutines[selectedDate] || {
    date: selectedDate,
    wakeUpTime: "06:30",
    sleepTime: "22:45",
    morningWaterTime: "06:45",
    breakfastTime: "08:15",
    midMorningTime: "10:45",
    lunchTime: "13:15",
    preWorkoutTime: "16:30",
    postWorkoutTime: "18:15",
    eveningSnackTime: "19:30",
    dinnerTime: "21:00",
    beforeSleepTime: "22:15",
    additionalDrinksNotes: "1 Green tea at 11:00 AM, 1 Black espresso at 3:30 PM",
  };

  const [wakeUpTime, setWakeUpTime] = useState(currentRoutine.wakeUpTime || "06:30");
  const [morningWaterTime, setMorningWaterTime] = useState(currentRoutine.morningWaterTime || "06:45");
  const [breakfastTime, setBreakfastTime] = useState(currentRoutine.breakfastTime || "08:15");
  const [midMorningTime, setMidMorningTime] = useState(currentRoutine.midMorningTime || "10:45");
  const [lunchTime, setLunchTime] = useState(currentRoutine.lunchTime || "13:15");
  const [preWorkoutTime, setPreWorkoutTime] = useState(currentRoutine.preWorkoutTime || "16:30");
  const [postWorkoutTime, setPostWorkoutTime] = useState(currentRoutine.postWorkoutTime || "18:15");
  const [eveningSnackTime, setEveningSnackTime] = useState(currentRoutine.eveningSnackTime || "19:30");
  const [dinnerTime, setDinnerTime] = useState(currentRoutine.dinnerTime || "21:00");
  const [beforeSleepTime, setBeforeSleepTime] = useState(currentRoutine.beforeSleepTime || "22:15");
  const [sleepTime, setSleepTime] = useState(currentRoutine.sleepTime || "22:45");
  const [notes, setNotes] = useState(currentRoutine.additionalDrinksNotes || "");

  // Update inputs when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const r = dailyRoutines[newDate] || {
      date: newDate,
      wakeUpTime: "06:30",
      sleepTime: "22:45",
      morningWaterTime: "06:45",
      breakfastTime: "08:15",
      midMorningTime: "10:45",
      lunchTime: "13:15",
      preWorkoutTime: "16:30",
      postWorkoutTime: "18:15",
      eveningSnackTime: "19:30",
      dinnerTime: "21:00",
      beforeSleepTime: "22:15",
      additionalDrinksNotes: "",
    };
    setWakeUpTime(r.wakeUpTime || "");
    setMorningWaterTime(r.morningWaterTime || "");
    setBreakfastTime(r.breakfastTime || "");
    setMidMorningTime(r.midMorningTime || "");
    setLunchTime(r.lunchTime || "");
    setPreWorkoutTime(r.preWorkoutTime || "");
    setPostWorkoutTime(r.postWorkoutTime || "");
    setEveningSnackTime(r.eveningSnackTime || "");
    setDinnerTime(r.dinnerTime || "");
    setBeforeSleepTime(r.beforeSleepTime || "");
    setSleepTime(r.sleepTime || "");
    setNotes(r.additionalDrinksNotes || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DailyRoutineLog = {
      date: selectedDate,
      wakeUpTime,
      morningWaterTime,
      breakfastTime,
      midMorningTime,
      lunchTime,
      preWorkoutTime,
      postWorkoutTime,
      eveningSnackTime,
      dinnerTime,
      beforeSleepTime,
      sleepTime,
      additionalDrinksNotes: notes.trim(),
    };
    onUpdateDailyRoutine(selectedDate, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const routineItems = [
    { label: "Wake-up Time", val: wakeUpTime, setVal: setWakeUpTime, icon: Sun, color: "text-amber-400" },
    { label: "Morning Water Time", val: morningWaterTime, setVal: setMorningWaterTime, icon: Droplets, color: "text-sky-400" },
    { label: "Breakfast Time", val: breakfastTime, setVal: setBreakfastTime, icon: Utensils, color: "text-emerald-400" },
    { label: "Mid-Morning Snack Time", val: midMorningTime, setVal: setMidMorningTime, icon: Coffee, color: "text-amber-300" },
    { label: "Lunch Time", val: lunchTime, setVal: setLunchTime, icon: Utensils, color: "text-emerald-400" },
    { label: "Pre-Workout Meal Time", val: preWorkoutTime, setVal: setPreWorkoutTime, icon: Dumbbell, color: "text-rose-400" },
    { label: "Post-Workout Meal Time", val: postWorkoutTime, setVal: setPostWorkoutTime, icon: Dumbbell, color: "text-violet-400" },
    { label: "Evening Snack Time", val: eveningSnackTime, setVal: setEveningSnackTime, icon: Coffee, color: "text-amber-300" },
    { label: "Dinner Time", val: dinnerTime, setVal: setDinnerTime, icon: Utensils, color: "text-emerald-400" },
    { label: "Before Sleep Time", val: beforeSleepTime, setVal: setBeforeSleepTime, icon: Moon, color: "text-indigo-400" },
    { label: "Sleep Time", val: sleepTime, setVal: setSleepTime, icon: Moon, color: "text-indigo-400" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">Daily Lifestyle Tracker</h2>
            <p className="text-xs text-slate-400">
              Manual time entries for your daily sleep, meals, hydration & workouts. Saved permanently to Firebase.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Routine Grid Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routineItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">{item.label}</label>
                    <span className="text-[10px] text-slate-500">24-hour time</span>
                  </div>
                </div>

                <input
                  type="time"
                  value={item.val}
                  onChange={(e) => item.setVal(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            );
          })}
        </div>

        {/* Notes & Extra drinks */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <label className="text-xs font-bold text-slate-200">
              Any Other Drink / Meal / Snack Notes
            </label>
          </div>
          <textarea
            rows={3}
            placeholder="e.g. 1 Green tea at 11:00 AM, 1 Black espresso at 3:30 PM, chamomile tea with magnesium before bed."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Selected date: <strong className="text-slate-200">{selectedDate}</strong>
          </span>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved to Cloud!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Routine for {selectedDate}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
