import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Flame,
  Calendar,
  Activity,
  BarChart3,
  Award,
  Navigation,
  Scale,
  Percent,
} from "lucide-react";
import { AppState } from "../../types";
import { generateActivityTrendsData } from "../../utils/activityAnalytics";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

interface ActivityTrendsViewProps {
  state: AppState;
}

export const ActivityTrendsView: React.FC<ActivityTrendsViewProps> = ({ state }) => {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [activeChart, setActiveChart] = useState<"activity" | "calories" | "distance" | "weight" | "fatLoss" | "consistency">("activity");

  const trendData = useMemo(() => {
    return generateActivityTrendsData(state, timeRange);
  }, [state, timeRange]);

  // Overall calculations for the period
  const totalVolumeKm = trendData.reduce((acc, d) => acc + (d.totalDistanceKm || d.distanceKm || 0), 0);
  const totalTimeMin = trendData.reduce((acc, d) => acc + (d.durationMinutes || 0), 0);
  const totalBurnedCal = trendData.reduce((acc, d) => acc + (d.caloriesBurned || 0), 0);
  const totalFatGrams = trendData.reduce((acc, d) => acc + (d.fatBurnedGrams || 0), 0);

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Longitudinal Analytics
            </span>
            <span className="text-xs text-slate-400 capitalize">{timeRange} Report Window</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-1">
            Activity, Calorie & Body Composition Trends
          </h2>
          <p className="text-xs text-slate-400">
            High-resolution charting across exercise volume, caloric deficit, fat oxidation and body metrics.
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
          {(["weekly", "monthly", "yearly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                timeRange === r
                  ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r === "weekly" ? "7 Days" : r === "monthly" ? "30 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Total Distance</span>
          <div className="text-xl font-extrabold text-slate-100">{Math.round(totalVolumeKm * 10) / 10} KM</div>
          <div className="text-[10px] text-emerald-400 font-medium">Cardio & walking volume</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Total Active Time</span>
          <div className="text-xl font-extrabold text-slate-100">{Math.round(totalTimeMin / 60 * 10) / 10} Hours</div>
          <div className="text-[10px] text-teal-400 font-medium">{totalTimeMin} minutes total</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Energy Expended</span>
          <div className="text-xl font-extrabold text-amber-400">{totalBurnedCal.toLocaleString()} kcal</div>
          <div className="text-[10px] text-amber-400/80 font-medium">Metabolic burn</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-emerald-400">Fat Mass Oxidised</span>
          <div className="text-xl font-extrabold text-emerald-400">
            {timeRange === "yearly" ? `${(totalFatGrams / 1000).toFixed(2)} kg` : `${totalFatGrams} grams`}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-medium">Estimated pure adipose loss</div>
        </div>
      </div>

      {/* Chart Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "activity", label: "Activity Minutes", icon: Activity },
          { id: "calories", label: "Calories Burned vs Consumed", icon: Flame },
          { id: "distance", label: "Distance Trend (KM)", icon: Navigation },
          { id: "weight", label: "Weight Progress", icon: Scale },
          { id: "fatLoss", label: "Fat Loss Progress", icon: Percent },
          { id: "consistency", label: "Workout Consistency", icon: Award },
        ].map((c) => {
          const Icon = c.icon;
          const isActive = activeChart === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveChart(c.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Viewport */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            {activeChart === "activity" && "Daily Workout & Active Duration (Minutes)"}
            {activeChart === "calories" && "Energy Balance: Calories Burned vs Calories Consumed"}
            {activeChart === "distance" && "Distance Traveled: Walking, Running & Cycling Breakdown"}
            {activeChart === "weight" && "Body Weight Trajectory (kg)"}
            {activeChart === "fatLoss" && "Estimated Cumulative Fat Burned & Body Composition"}
            {activeChart === "consistency" && "Daily Fitness Adherence Score (0 - 100)"}
          </h3>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "activity" ? (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="actColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="durationMinutes" name="Workout Minutes" stroke="#10b981" fill="url(#actColor)" strokeWidth={2} />
              </AreaChart>
            ) : activeChart === "calories" ? (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="kcal" />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Legend />
                <Bar dataKey="caloriesBurned" name="Burned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="caloriesConsumed" name="Consumed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeChart === "distance" ? (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="km" />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Legend />
                <Bar dataKey="walkingKm" name="Walking KM" stackId="a" fill="#10b981" />
                <Bar dataKey="runningKm" name="Running KM" stackId="a" fill="#f59e0b" />
                <Bar dataKey="cyclingKm" name="Cycling KM" stackId="a" fill="#38bdf8" />
                <Bar dataKey="swimmingKm" name="Swimming KM" stackId="a" fill="#06b6d4" />
              </BarChart>
            ) : activeChart === "weight" ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#64748b" fontSize={11} unit="kg" />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : activeChart === "fatLoss" ? (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="fatColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="g" />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="fatBurnedGrams" name="Adipose Oxidised (grams)" stroke="#14b8a6" fill="url(#fatColor)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px" }} />
                <Bar dataKey="fitnessScore" name="Fitness Score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
