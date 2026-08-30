import React, { useState, useMemo } from "react";
import {
  Activity,
  Plus,
  Trash2,
  Clock,
  Flame,
  Heart,
  Gauge,
  MapPin,
  Calendar,
  Footprints,
  Bike,
  Waves,
  Trophy,
  X,
  Check,
} from "lucide-react";
import { ActivityLog } from "../types";

interface ActivityTrackerViewProps {
  activityLogs: ActivityLog[];
  onUpdateActivityLogs: (logs: ActivityLog[]) => void;
  initialDate?: string;
}

const ACTIVITY_TYPES: { type: ActivityLog["activityType"]; icon: any; color: string }[] = [
  { type: "Walking", icon: Footprints, color: "text-emerald-400" },
  { type: "Running", icon: Activity, color: "text-rose-400" },
  { type: "Cycling", icon: Bike, color: "text-sky-400" },
  { type: "Treadmill", icon: Clock, color: "text-amber-400" },
  { type: "Swimming", icon: Waves, color: "text-cyan-400" },
  { type: "Other Sports", icon: Trophy, color: "text-violet-400" },
];

export function ActivityTrackerView({
  activityLogs,
  onUpdateActivityLogs,
  initialDate = "2026-08-28",
}: ActivityTrackerViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formType, setFormType] = useState<ActivityLog["activityType"]>("Walking");
  const [formStartTime, setFormStartTime] = useState("07:30");
  const [formDuration, setFormDuration] = useState(40);
  const [formDistance, setFormDistance] = useState(3.5);
  const [formCalories, setFormCalories] = useState(190);
  const [formSpeed, setFormSpeed] = useState(5.2);
  const [formHeartRate, setFormHeartRate] = useState(115);
  const [formRouteNotes, setFormRouteNotes] = useState("");

  // Filter logs for selected date
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => log.date === selectedDate);
  }, [activityLogs, selectedDate]);

  // Compute Daily Activity Summary
  const summary = useMemo(() => {
    let totalCalories = 0;
    let totalMinutes = 0;
    let totalDistanceKm = 0;

    filteredLogs.forEach((l) => {
      totalCalories += l.caloriesBurned || 0;
      totalMinutes += l.durationMinutes || 0;
      totalDistanceKm += l.distanceKm || 0;
    });

    return {
      totalCalories,
      totalMinutes,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      activityCount: filteredLogs.length,
    };
  }, [filteredLogs]);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      date: selectedDate,
      activityType: formType,
      startTime: formStartTime,
      durationMinutes: Number(formDuration) || 30,
      distanceKm: Number(formDistance) || 0,
      caloriesBurned: Number(formCalories) || 150,
      avgSpeedKmh: Number(formSpeed) || undefined,
      heartRateBpm: Number(formHeartRate) || undefined,
      routeNotes: formRouteNotes.trim() || undefined,
    };

    onUpdateActivityLogs([newLog, ...activityLogs]);
    setIsAddModalOpen(false);
    setFormRouteNotes("");
  };

  const handleDeleteActivity = (id: string) => {
    if (!confirm("Are you sure you want to delete this activity log?")) return;
    onUpdateActivityLogs(activityLogs.filter((l) => l.id !== id));
  };

  const getActivityIcon = (type: ActivityLog["activityType"]) => {
    const found = ACTIVITY_TYPES.find((a) => a.type === type);
    return found ? found.icon : Activity;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-28 md:pb-12 overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">Activity Tracker</h2>
            <p className="text-xs text-slate-400">
              Track physical activities outside lifting: Walking, Running, Cycling, Swimming & Sports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
            <Flame className="h-4 w-4 text-rose-400" />
            <span>Total Burned</span>
          </div>
          <span className="text-2xl font-black text-slate-100">{summary.totalCalories}</span>
          <span className="text-[10px] text-slate-500 block">kcal</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="h-4 w-4 text-sky-400" />
            <span>Active Time</span>
          </div>
          <span className="text-2xl font-black text-slate-100">{summary.totalMinutes}</span>
          <span className="text-[10px] text-slate-500 block">minutes</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span>Total Distance</span>
          </div>
          <span className="text-2xl font-black text-slate-100">{summary.totalDistanceKm}</span>
          <span className="text-[10px] text-slate-500 block">km</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
            <Activity className="h-4 w-4 text-amber-400" />
            <span>Activities</span>
          </div>
          <span className="text-2xl font-black text-slate-100">{summary.activityCount}</span>
          <span className="text-[10px] text-slate-500 block">sessions logged</span>
        </div>
      </div>

      {/* Activity Logs List */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-extrabold text-sm text-slate-200">
          Activities on {selectedDate}
        </h3>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No activities logged for this date</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Log Activity&quot; above to add walking, running, cycling or sports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const Icon = getActivityIcon(log.activityType);
              return (
                <div
                  key={log.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-rose-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-100">
                          {log.activityType}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          at {log.startTime}
                        </span>
                      </div>
                      {log.routeNotes && (
                        <p className="text-xs text-slate-400 mt-0.5">{log.routeNotes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span>{log.durationMinutes} mins</span>
                        {log.distanceKm ? <span>• {log.distanceKm} km</span> : null}
                        {log.avgSpeedKmh ? (
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-slate-500" />
                            {log.avgSpeedKmh} km/h
                          </span>
                        ) : null}
                        {log.heartRateBpm ? (
                          <span className="flex items-center gap-1 text-rose-400">
                            <Heart className="h-3 w-3" />
                            {log.heartRateBpm} bpm
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="font-black text-rose-400 text-base block">
                        +{log.caloriesBurned} kcal
                      </span>
                      <span className="text-[10px] text-slate-500">Burned</span>
                    </div>

                    <button
                      onClick={() => handleDeleteActivity(log.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100">Log Physical Activity</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Activity Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map((act) => (
                    <button
                      type="button"
                      key={act.type}
                      onClick={() => setFormType(act.type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        formType === act.type
                          ? "bg-rose-500 text-slate-950 border-rose-500 shadow-md shadow-rose-500/20"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{act.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formDistance}
                    onChange={(e) => setFormDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Calories Burned (kcal) *</label>
                  <input
                    type="number"
                    min={10}
                    max={3000}
                    required
                    value={formCalories}
                    onChange={(e) => setFormCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Avg Speed (km/h)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formSpeed}
                    onChange={(e) => setFormSpeed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Avg Heart Rate (bpm)</label>
                  <input
                    type="number"
                    min={40}
                    max={220}
                    value={formHeartRate}
                    onChange={(e) => setFormHeartRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Route / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Riverside park morning run, cool weather, high cadence"
                  value={formRouteNotes}
                  onChange={(e) => setFormRouteNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black transition shadow-lg shadow-rose-500/20"
                >
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
