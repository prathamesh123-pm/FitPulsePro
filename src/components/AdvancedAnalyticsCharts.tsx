import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Flame,
  Zap,
  Wheat,
  Droplet,
  Droplets,
  Dumbbell,
  Building2,
  Footprints,
  Bike,
  Percent,
  Activity,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import { AppState } from "../types";
import {
  generateAnalyticsChartDataset,
  MONTHLY_COMPARISON_DATA,
  YEARLY_COMPARISON_DATA,
} from "../utils/advancedReportCalculators";

interface AdvancedAnalyticsChartsProps {
  appState: AppState;
}

export type ChartMetricKey =
  | "weight"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "water"
  | "workout"
  | "gymAttendance"
  | "steps"
  | "running"
  | "cycling"
  | "bodyFat"
  | "bmi"
  | "workoutConsistency"
  | "dietConsistency"
  | "monthlyComparison"
  | "yearlyComparison";

interface MetricOption {
  key: ChartMetricKey;
  label: string;
  category: "Body Composition" | "Nutrition & Energy" | "Training & Gym" | "Cardio & Endurance" | "Historical Comp";
  color: string;
  iconName: string;
}

const METRICS_LIST: MetricOption[] = [
  { key: "weight", label: "1. Body Weight Trend", category: "Body Composition", color: "#10b981", iconName: "Weight" },
  { key: "calories", label: "2. Calories (Burned vs Consumed)", category: "Nutrition & Energy", color: "#f59e0b", iconName: "Flame" },
  { key: "protein", label: "3. Daily Protein Intake (g)", category: "Nutrition & Energy", color: "#0ea5e9", iconName: "Zap" },
  { key: "carbs", label: "4. Daily Carbohydrates (g)", category: "Nutrition & Energy", color: "#8b5cf6", iconName: "Wheat" },
  { key: "fat", label: "5. Daily Healthy Fats (g)", category: "Nutrition & Energy", color: "#ec4899", iconName: "Droplet" },
  { key: "water", label: "6. Water & Hydration (Liters)", category: "Nutrition & Energy", color: "#06b6d4", iconName: "Droplets" },
  { key: "workout", label: "7. Workout Volume Lifted (kg)", category: "Training & Gym", color: "#10b981", iconName: "Dumbbell" },
  { key: "gymAttendance", label: "8. Gym Attendance Frequency", category: "Training & Gym", color: "#a855f7", iconName: "Building2" },
  { key: "steps", label: "9. Daily Step Count", category: "Cardio & Endurance", color: "#14b8a6", iconName: "Footprints" },
  { key: "running", label: "10. Running Distance (km)", category: "Cardio & Endurance", color: "#f43f5e", iconName: "Footprints" },
  { key: "cycling", label: "11. Cycling Distance (km)", category: "Cardio & Endurance", color: "#3b82f6", iconName: "Bike" },
  { key: "bodyFat", label: "12. Body Fat Percentage (%)", category: "Body Composition", color: "#f97316", iconName: "Percent" },
  { key: "bmi", label: "13. Body Mass Index (BMI)", category: "Body Composition", color: "#6366f1", iconName: "Activity" },
  { key: "workoutConsistency", label: "14. Workout Consistency Index (%)", category: "Training & Gym", color: "#10b981", iconName: "Activity" },
  { key: "dietConsistency", label: "15. Diet Consistency & Adherence (%)", category: "Nutrition & Energy", color: "#eab308", iconName: "Activity" },
  { key: "monthlyComparison", label: "16. Month-over-Month Comparison", category: "Historical Comp", color: "#8b5cf6", iconName: "Calendar" },
  { key: "yearlyComparison", label: "17. Year-over-Year Macro Progression", category: "Historical Comp", color: "#06b6d4", iconName: "Layers" },
];

export function AdvancedAnalyticsCharts({ appState }: AdvancedAnalyticsChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>("weight");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const chartDataset = useMemo(() => {
    return generateAnalyticsChartDataset(appState, selectedMetric);
  }, [appState, selectedMetric]);

  const visibleMetrics = useMemo(() => {
    if (selectedCategory === "All") return METRICS_LIST;
    return METRICS_LIST.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  const activeMetricMeta = METRICS_LIST.find((m) => m.key === selectedMetric) || METRICS_LIST[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header card with category filters & metric selector */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Visual Analytics Hub
              </span>
              <span className="text-xs text-slate-400">17 Comprehensive Health & Fitness Charts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
              {activeMetricMeta.label}
            </h2>
            <p className="text-xs text-slate-400">
              Interactive high-resolution charting suite with custom tooltips, targets, and trendline analytics.
            </p>
          </div>

          {/* Metric Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Select Chart:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ChartMetricKey)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {METRICS_LIST.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
          {["All", "Body Composition", "Nutrition & Energy", "Training & Gym", "Cardio & Endurance", "Historical Comp"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Metric Buttons Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {visibleMetrics.slice(0, 12).map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                selectedMetric === m.key
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium"
              }`}
            >
              <span className="text-[11px] truncate">{m.label.replace(/^\d+\.\s*/, "")}</span>
              <span
                className="h-2 w-2 rounded-full shrink-0 ml-1.5"
                style={{ backgroundColor: m.color }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Render Box */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        {/* Chart Header details */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
              {activeMetricMeta.label}
            </h3>
            <span className="text-xs text-slate-400">
              {selectedMetric === "monthlyComparison"
                ? "January to August 2026 Monthly Auditing"
                : selectedMetric === "yearlyComparison"
                ? "2023 to 2026 Longitudinal Progress"
                : "Daily Records for August 2026 (31 Days)"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300">
              Category: {activeMetricMeta.category}
            </span>
          </div>
        </div>

        {/* 1. Body Weight Trend Chart */}
        {selectedMetric === "weight" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis domain={["auto", "auto"]} stroke="#64748b" fontSize={10} tickLine={false} unit="kg" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} name="Actual Body Mass (kg)" />
                <Line type="monotone" dataKey="targetWeight" stroke="#64748b" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Target Fat Loss Trajectory" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. Calories Consumed vs Burned */}
        {selectedMetric === "calories" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="kcal" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="caloriesConsumed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Calories Consumed" />
                <Bar dataKey="caloriesBurned" fill="#10b981" radius={[4, 4, 0, 0]} name="Calories Burned (Total)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3. Protein Intake */}
        {selectedMetric === "protein" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="g" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <ReferenceLine y={157} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "157g Target", fill: "#ef4444", fontSize: 10 }} />
                <Area type="monotone" dataKey="protein" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} strokeWidth={2} name="Protein Intake (g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. Carbohydrates */}
        {selectedMetric === "carbs" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="g" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="carbs" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Carbs Consumed (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 5. Healthy Fats */}
        {selectedMetric === "fat" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="g" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Area type="monotone" dataKey="fat" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={2} name="Fat Intake (g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 6. Water & Hydration */}
        {selectedMetric === "water" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="L" domain={[0, 4.5]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <ReferenceLine y={3.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: "3.0L Target", fill: "#10b981", fontSize: 10 }} />
                <Legend />
                <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water Consumed (Liters)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 7. Workout Volume Lifted */}
        {selectedMetric === "workout" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="kg" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="workoutVolume" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Lifted Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 8. Gym Attendance */}
        {selectedMetric === "gymAttendance" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "Present" : "Rest/Miss")} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="gymAttendance" fill="#a855f7" radius={[4, 4, 0, 0]} name="Gym Attendance (1 = Present)">
                  {chartDataset.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gymAttendance === 1 ? "#a855f7" : "#334155"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 9. Steps Count */}
        {selectedMetric === "steps" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="steps" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <ReferenceLine y={10000} stroke="#14b8a6" strokeDasharray="3 3" label={{ value: "10,000 steps goal", fill: "#14b8a6", fontSize: 10 }} />
                <Legend />
                <Bar dataKey="steps" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Steps Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 10. Running Distance */}
        {selectedMetric === "running" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="km" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="runningKm" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Running Distance (km)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 11. Cycling Distance */}
        {selectedMetric === "cycling" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="km" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="cyclingKm" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cycling Distance (km)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 12. Body Fat % */}
        {selectedMetric === "bodyFat" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[14, 20]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Line type="monotone" dataKey="bodyFat" stroke="#f97316" strokeWidth={3} dot={{ r: 2 }} name="Body Fat %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 13. BMI */}
        {selectedMetric === "bmi" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[23, 26]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <ReferenceLine y={24.9} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Healthy Upper Bound (24.9)", fill: "#10b981", fontSize: 10 }} />
                <Line type="monotone" dataKey="bmi" stroke="#6366f1" strokeWidth={3} dot={{ r: 2 }} name="Body Mass Index (BMI)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 14. Workout Consistency */}
        {selectedMetric === "workoutConsistency" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[70, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Area type="monotone" dataKey="workoutConsistencyPct" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} name="Workout Adherence Index (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 15. Diet Consistency */}
        {selectedMetric === "dietConsistency" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="dietConsistencyPct" fill="#eab308" radius={[4, 4, 0, 0]} name="Diet Adherence (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 16. Month-over-Month Comparison */}
        {selectedMetric === "monthlyComparison" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_COMPARISON_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="workouts" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Monthly Workouts" />
                <Bar dataKey="weightAvg" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Weight (kg)" />
                <Bar dataKey="bodyFat" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Body Fat %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 17. Year-over-Year Progression */}
        {selectedMetric === "yearlyComparison" && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={YEARLY_COMPARISON_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="workoutsTotal" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Total Annual Workouts" />
                <Bar dataKey="volumeTonnes" fill="#10b981" radius={[6, 6, 0, 0]} name="Tonnage Lifted (Tonnes)" />
                <Bar dataKey="fatLostKg" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Total Fat Oxidized (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
