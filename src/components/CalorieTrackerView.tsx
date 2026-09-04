import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
  X,
  Target,
} from "lucide-react";
import { CalorieLogEntry, AppState } from "../types";
import {
  saveCalorieLogToCloud,
  fetchCalorieLogsFromCloud,
  deleteCalorieLogFromCloud,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface CalorieTrackerViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const CalorieTrackerView: React.FC<CalorieTrackerViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [calorieLogs, setCalorieLogs] = useState<CalorieLogEntry[]>(state.calorieLogs || []);
  const [activeGraphTab, setActiveGraphTab] = useState<"weekly" | "monthly">("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalorieLogEntry | null>(null);

  // Delete confirmation
  const [deletingEntry, setDeletingEntry] = useState<CalorieLogEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formDate, setFormDate] = useState(todayStr);
  const [formRequired, setFormRequired] = useState(2400);
  const [formConsumed, setFormConsumed] = useState(2150);
  const [formBurned, setFormBurned] = useState(480);
  const [formNotes, setFormNotes] = useState("");

  // Load from Firebase
  useEffect(() => {
    loadCalorieLogs();
  }, []);

  const loadCalorieLogs = async () => {
    setIsLoading(true);
    try {
      const cloudLogs = await fetchCalorieLogsFromCloud();
      if (cloudLogs && cloudLogs.length > 0) {
        setCalorieLogs(cloudLogs);
        onUpdateState((prev) => ({ ...prev, calorieLogs: cloudLogs }));
      } else if (!state.calorieLogs || state.calorieLogs.length === 0) {
        // Generate initial recent week samples
        const initialSamples: CalorieLogEntry[] = [
          {
            id: `cal-${todayStr}`,
            date: todayStr,
            caloriesRequired: 2400,
            caloriesConsumed: 2180,
            caloriesBurned: 520,
            remainingCalories: 2400 - 2180 + 520,
            notes: "Clean high protein meals + chest workout",
            createdAt: new Date().toISOString(),
          },
        ];
        // Populate past 6 days
        for (let i = 1; i <= 6; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateKey = d.toISOString().split("T")[0];
          const consumed = Math.round(2000 + Math.random() * 400);
          const burned = Math.round(400 + Math.random() * 250);
          initialSamples.push({
            id: `cal-${dateKey}`,
            date: dateKey,
            caloriesRequired: 2400,
            caloriesConsumed: consumed,
            caloriesBurned: burned,
            remainingCalories: 2400 - consumed + burned,
            notes: "Strength session + 20 min cardio",
            createdAt: new Date().toISOString(),
          });
        }
        setCalorieLogs(initialSamples);
        onUpdateState((prev) => ({ ...prev, calorieLogs: initialSamples }));
      }
    } catch (err) {
      console.warn("Failed to load calorie logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Today's numbers
  const todayEntry = useMemo(() => {
    const found = calorieLogs.find((c) => c.date === todayStr);
    if (found) return found;
    return {
      id: `cal-${todayStr}`,
      date: todayStr,
      caloriesRequired: 2400,
      caloriesConsumed: 1950,
      caloriesBurned: 450,
      remainingCalories: 2400 - 1950 + 450,
      notes: "Daily ongoing log",
      createdAt: new Date().toISOString(),
    };
  }, [calorieLogs, todayStr]);

  const caloriesRequired = todayEntry.caloriesRequired;
  const caloriesConsumed = todayEntry.caloriesConsumed;
  const caloriesBurned = todayEntry.caloriesBurned;
  const remainingCalories = caloriesRequired - caloriesConsumed + caloriesBurned;
  const percentConsumed = Math.min(100, Math.round((caloriesConsumed / caloriesRequired) * 100));

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormDate(todayStr);
    setFormRequired(2400);
    setFormConsumed(2000);
    setFormBurned(450);
    setFormNotes("");
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: CalorieLogEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormRequired(entry.caloriesRequired);
    setFormConsumed(entry.caloriesConsumed);
    setFormBurned(entry.caloriesBurned);
    setFormNotes(entry.notes || "");
    setIsFormOpen(true);
  };

  // Save entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const remaining = formRequired - formConsumed + formBurned;
    const newEntry: CalorieLogEntry = {
      id: editingEntry?.id || `cal-${formDate}`,
      date: formDate,
      caloriesRequired: Number(formRequired) || 2400,
      caloriesConsumed: Number(formConsumed) || 0,
      caloriesBurned: Number(formBurned) || 0,
      remainingCalories: remaining,
      notes: formNotes.trim(),
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    const updatedList = editingEntry
      ? calorieLogs.map((l) => (l.id === editingEntry.id ? newEntry : l))
      : [newEntry, ...calorieLogs.filter((l) => l.date !== formDate)];

    setCalorieLogs(updatedList);
    onUpdateState((prev) => ({ ...prev, calorieLogs: updatedList }));
    setIsFormOpen(false);

    const res = await saveCalorieLogToCloud(newEntry);
    if (res.success) {
      onNotify("Calorie Log Saved", `Logged for date: ${formDate}`, "success");
    } else {
      onNotify("Offline Saved", "Saved locally in session", "info");
    }
  };

  // Delete confirm
  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    const targetId = deletingEntry.id;
    const updatedList = calorieLogs.filter((l) => l.id !== targetId);

    setCalorieLogs(updatedList);
    onUpdateState((prev) => ({ ...prev, calorieLogs: updatedList }));

    const res = await deleteCalorieLogFromCloud(targetId);
    setIsDeleting(false);
    setDeletingEntry(null);

    if (res.success) {
      onNotify("Log Deleted", "Calorie record deleted from database", "success");
    }
  };

  // Weekly graph data
  const weeklyGraphData = useMemo(() => {
    const list = [...calorieLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
    return list.map((item) => ({
      date: item.date.slice(5), // MM-DD
      Consumed: item.caloriesConsumed,
      Burned: item.caloriesBurned,
      Required: item.caloriesRequired,
    }));
  }, [calorieLogs]);

  // Monthly graph data
  const monthlyGraphData = useMemo(() => {
    const list = [...calorieLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    return list.map((item) => ({
      date: item.date.slice(5),
      NetCalories: item.caloriesConsumed - item.caloriesBurned,
      Target: item.caloriesRequired,
    }));
  }, [calorieLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return calorieLogs.filter((item) => {
      const matchesSearch =
        item.date.includes(searchQuery) ||
        (item.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [calorieLogs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Metabolic Calorie Tracker
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Firebase Synced
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-amber-400" />
            Energy Balance & Calorie Management
          </h1>
          <p className="text-xs text-slate-400">
            Real-time tracking of calories required, consumed, burned, and remaining energy deficits.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={loadCalorieLogs}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh from Firebase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Calories
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Calories Required */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Calories Required</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{caloriesRequired}</div>
          <div className="text-[10px] text-slate-500">Daily Target Budget</div>
        </div>

        {/* 2. Calories Consumed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Calories Consumed</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{caloriesConsumed}</div>
          <div className="text-[10px] text-slate-500">Diet & Nutrition Intake</div>
        </div>

        {/* 3. Calories Burned */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Calories Burned</span>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{caloriesBurned}</div>
          <div className="text-[10px] text-slate-500">Workout & Cardio Burn</div>
        </div>

        {/* 4. Remaining Calories */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Calories</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {remainingCalories >= 0 ? `${remainingCalories}` : `${remainingCalories} (Over)`}
          </div>
          <div className="text-[10px] text-emerald-300">
            {remainingCalories >= 0 ? "Under Calorie Limit" : "Deficit Exceeded"}
          </div>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300">Daily Budget Utilization</span>
          <span className="text-emerald-400 font-black">{percentConsumed}% Consumed</span>
        </div>
        <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentConsumed}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full transition-all ${
              percentConsumed > 100
                ? "bg-rose-500"
                : percentConsumed > 85
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>0 kcal</span>
          <span>Target: {caloriesRequired} kcal</span>
          <span>Burned: +{caloriesBurned} kcal</span>
        </div>
      </div>

      {/* Weekly & Monthly Graph Visualizers */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Caloric Energy Analytics</h3>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveGraphTab("weekly")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeGraphTab === "weekly"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Weekly Graph (7 Days)
            </button>
            <button
              onClick={() => setActiveGraphTab("monthly")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeGraphTab === "monthly"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Graph (30 Days)
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeGraphTab === "weekly" ? (
              <BarChart data={weeklyGraphData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                />
                <Legend />
                <Bar dataKey="Consumed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Burned" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyGraphData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                />
                <Legend />
                <Area type="monotone" dataKey="NetCalories" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Line type="monotone" dataKey="Target" stroke="#3b82f6" strokeDasharray="3 3" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Log with Search & Actions */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Calorie Logging History ({filteredLogs.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No calorie logs found for this search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Target (Required)</th>
                  <th className="py-2.5 px-3">Consumed</th>
                  <th className="py-2.5 px-3">Burned</th>
                  <th className="py-2.5 px-3">Remaining</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {log.date}
                    </td>
                    <td className="py-3 px-3 text-blue-400 font-bold">{log.caloriesRequired} kcal</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">{log.caloriesConsumed} kcal</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">-{log.caloriesBurned} kcal</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-black ${
                          log.remainingCalories >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {log.remainingCalories} kcal
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {log.notes || "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(log)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingEntry(log)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Calorie Log Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white">
                  {editingEntry ? "Edit Calorie Log" : "Log Daily Calories"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Target Required (kcal)
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="8000"
                      required
                      value={formRequired}
                      onChange={(e) => setFormRequired(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Consumed (kcal)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      required
                      value={formConsumed}
                      onChange={(e) => setFormConsumed(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Burned (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    required
                    value={formBurned}
                    onChange={(e) => setFormBurned(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-rose-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Notes / Activity Summary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leg day + 30 min treadmill"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">Net Remaining Balance:</span>
                  <span className="font-bold text-emerald-400">
                    {formRequired - formConsumed + formBurned} kcal
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation before Delete */}
      <ConfirmationDialog
        isOpen={Boolean(deletingEntry)}
        title="Delete Calorie Entry?"
        message={`Are you sure you want to permanently delete the calorie record for date ${deletingEntry?.date}?`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingEntry(null)}
      />
    </div>
  );
};
