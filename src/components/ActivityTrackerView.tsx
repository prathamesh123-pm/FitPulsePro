import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Footprints,
  Flame,
  Timer,
  Navigation,
  Heart,
  Droplets,
  Calendar,
  Sparkles,
  BarChart3,
  Target,
  Bell,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  TrendingDown,
  CloudCheck,
  Cloud,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { AppState, ActivityLog, AuditLogEntry } from "../types";
import {
  computeDailyActivityAggregates,
  generateActivityAIInsights,
} from "../utils/activityAnalytics";
import { ActivityLogForm } from "./activity/ActivityLogForm";
import { HealthVitalsTracker } from "./activity/HealthVitalsTracker";
import { DailySummaryReportView } from "./activity/DailySummaryReportView";
import { ActivityTrendsView } from "./activity/ActivityTrendsView";
import { GoalsAndNotificationsView } from "./activity/GoalsAndNotificationsView";

interface ActivityTrackerViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const ActivityTrackerView: React.FC<ActivityTrackerViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  // Active Date selector (default to today or latest logged date)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<
    "tracker" | "vitals" | "summary" | "trends" | "goals" | "audit"
  >("tracker");

  // Show Log Activity Drawer / Modal
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [activityDraft, setActivityDraft] = useState<Partial<ActivityLog> | null>(null);

  // Audit search & filter state for the Audit subtab
  const [auditSearch, setAuditSearch] = useState("");
  const [auditModule, setAuditModule] = useState("All");

  // Compute daily aggregates and AI insights for the active date
  const aggregates = useMemo(() => {
    return computeDailyActivityAggregates(state, selectedDate);
  }, [state, selectedDate]);

  const aiInsights = useMemo(() => {
    return generateActivityAIInsights(aggregates, state.profile);
  }, [aggregates, state.profile]);

  // Activities filtered for active date
  const activitiesForDate = useMemo(() => {
    const logs = state.activityLogs || [];
    return logs.filter((log) => log.date === selectedDate);
  }, [state.activityLogs, selectedDate]);

  // Add / Save Activity
  const handleSaveActivity = (newActivity: ActivityLog) => {
    onUpdateState((prev) => {
      const existingLogs = prev.activityLogs || [];
      const updatedLogs = [newActivity, ...existingLogs];

      // Add enterprise audit entry
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        userId: prev.currentUserAccount?.id || "user-1",
        userName: prev.profile.fullName || "User",
        userRole: prev.currentUserAccount?.role || "Athlete",
        action: "Created",
        module: "Activity Tracker",
        description: `Logged ${newActivity.activityType} (${newActivity.durationMinutes}m, ${newActivity.caloriesBurned} kcal)`,
        device: navigator.userAgent.includes("Mobile") ? "Mobile App" : "Desktop Browser",
        status: "Completed",
      };

      // Check if user hit daily steps or workout duration goal
      const todayLogs = updatedLogs.filter((a) => a.date === selectedDate);
      const totalSteps = todayLogs.reduce((acc, a) => acc + (a.steps || 0), 0);
      const targetSteps = prev.fitnessGoals?.dailyStepsGoal || 10000;
      if (totalSteps >= targetSteps && prev.fitnessGoals) {
        // Goal achieved
      }

      return {
        ...prev,
        activityLogs: updatedLogs,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])],
      };
    });

    setIsLoggingActivity(false);
  };

  // Delete Activity
  const handleDeleteActivity = (activityId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      activityLogs: (prev.activityLogs || []).filter((a) => a.id !== activityId),
    }));
    onNotify("Activity Removed", "The activity record has been deleted.", "info");
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRIC SUMMARY STRIP */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Daily Activity Tracker
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <Sparkles className="h-3 w-3" /> Pro Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous biometric movement tracking, MET caloric expenditure & fat oxidation analytics
              </p>
            </div>
          </div>

          {/* Date Picker & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedDate === todayStr
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsLoggingActivity(!isLoggingActivity)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isLoggingActivity ? "Close Log" : "Log Activity"}</span>
            </button>
          </div>
        </div>

        {/* 8 Primary Calculated Biometric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {/* Walking Distance */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Walking</span>
              <Footprints className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-base font-extrabold text-white">{aggregates.totalWalkingKm} <span className="text-[10px] font-normal text-slate-400">KM</span></div>
            <div className="text-[9px] text-slate-500 truncate">Goal: {aggregates.goals.walkingDistanceKmGoal}km</div>
          </div>

          {/* Running Distance */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Running</span>
              <Activity className="h-3 w-3 text-amber-400" />
            </div>
            <div className="text-base font-extrabold text-white">{aggregates.totalRunningKm} <span className="text-[10px] font-normal text-slate-400">KM</span></div>
            <div className="text-[9px] text-slate-500 truncate">Goal: {aggregates.goals.runningDistanceKmGoal}km</div>
          </div>

          {/* Workout Time */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Workout</span>
              <Timer className="h-3 w-3 text-purple-400" />
            </div>
            <div className="text-base font-extrabold text-white">{aggregates.totalWorkoutTimeMin} <span className="text-[10px] font-normal text-slate-400">min</span></div>
            <div className="text-[9px] text-slate-500 truncate">Goal: {aggregates.goals.workoutDurationMinGoal}m</div>
          </div>

          {/* Calories Burned */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Burned</span>
              <Flame className="h-3 w-3 text-rose-400" />
            </div>
            <div className="text-base font-extrabold text-amber-400">{aggregates.totalCaloriesBurned} <span className="text-[10px] font-normal text-slate-400">kcal</span></div>
            <div className="text-[9px] text-slate-500 truncate">Target: {aggregates.goals.caloriesBurnedGoal}</div>
          </div>

          {/* Estimated Fat Burned */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Fat Burned</span>
              <TrendingDown className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-base font-extrabold text-emerald-400">{aggregates.estimatedFatBurnedGrams} <span className="text-[10px] font-normal text-slate-400">g</span></div>
            <div className="text-[9px] text-emerald-500/80">Adipose loss</div>
          </div>

          {/* Net Calories */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Net Balance</span>
              <Flame className="h-3 w-3 text-amber-400" />
            </div>
            <div className={`text-base font-extrabold ${aggregates.netCalories <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {aggregates.netCalories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {aggregates.netCalories <= 0 ? "Calorie Deficit" : "Surplus"}
            </div>
          </div>

          {/* Daily Steps */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Steps</span>
              <Footprints className="h-3 w-3 text-teal-400" />
            </div>
            <div className="text-base font-extrabold text-white">{aggregates.totalSteps.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500 truncate">Goal: {aggregates.goals.dailyStepsGoal.toLocaleString()}</div>
          </div>

          {/* Daily Fitness Score */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Score</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-base font-black text-emerald-400">{aggregates.dailyFitnessScore}<span className="text-xs text-slate-400">/100</span></div>
            <div className="text-[9px] text-emerald-400 font-bold">{aggregates.goalCompletionPct}% Met</div>
          </div>
        </div>
      </div>

      {/* 2. ACTIVITY LOGGING FORM (EXPANDABLE) */}
      <AnimatePresence>
        {isLoggingActivity && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ActivityLogForm
              date={selectedDate}
              userWeightKg={state.profile.currentWeightKg || 75}
              onSaveActivity={handleSaveActivity}
              onSaveDraft={(draft) => setActivityDraft(draft)}
              draftData={activityDraft}
              onNotify={onNotify}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
        {[
          { id: "tracker", label: "Today's Activities & Timeline", icon: Activity },
          { id: "vitals", label: "Nutrition & Health Vitals", icon: Heart },
          { id: "summary", label: "Daily Summary Report", icon: FileText },
          { id: "trends", label: "Weekly, Monthly & Yearly Trends", icon: BarChart3 },
          { id: "goals", label: "Goals & Smart Reminders", icon: Target },
          { id: "audit", label: "Enterprise Audit Log", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition cursor-pointer border-b-2 ${
                isActive
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === "tracker" && activitiesForDate.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                  {activitiesForDate.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. ACTIVE SUB-TAB CONTENT */}
      <div>
        {activeTab === "tracker" && (
          <div className="space-y-6">
            {/* AI Insights & Coaching Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" /> AI Biometric Insights & Adaptive Coaching
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {aggregates.date} Analysis
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {aiInsights.summary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Deficit Trajectory</span>
                  <div className="font-bold text-emerald-400 mt-0.5">{aiInsights.calorieDeficitFeedback}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Hydration Analysis</span>
                  <div className="font-bold text-cyan-400 mt-0.5">{aiInsights.waterHydrationTip}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Recommended Intake</span>
                  <div className="font-bold text-amber-400 mt-0.5">{aiInsights.recommendedCalorieIntake} kcal / day</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Optimal Exercise Target</span>
                  <div className="font-bold text-purple-400 mt-0.5">{aiInsights.recommendedExerciseMin} mins today</div>
                </div>
              </div>
            </div>

            {/* List of Logged Activities for Selected Date */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Activities for {selectedDate}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activitiesForDate.length} recorded sessions • Total {aggregates.totalWorkoutTimeMin} mins & {aggregates.totalCaloriesBurned} kcal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoggingActivity(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Add Activity</span>
                </button>
              </div>

              {activitiesForDate.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-3">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-slate-900 text-slate-500 border border-slate-800">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-300">No activities logged yet for this date</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Log your morning walk, gym workout, run, cycling, swim, or yoga to start calculating energy balance and fat oxidation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLoggingActivity(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log First Activity</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activitiesForDate.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Footprints className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>
                                {act.activityType === "Custom Activity" ? act.customActivityName || "Custom" : act.activityType}
                              </span>
                              {act.intensity && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                  {act.intensity}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {act.startTime || "-"} {act.endTime ? `→ ${act.endTime}` : ""} • {act.durationMinutes} mins
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-900">
                        {act.distanceKm ? (
                          <div>
                            <span className="text-[10px] text-slate-500">Distance</span>
                            <div className="font-bold text-slate-200">{act.distanceKm} km</div>
                          </div>
                        ) : null}

                        {act.steps ? (
                          <div>
                            <span className="text-[10px] text-slate-500">Steps</span>
                            <div className="font-bold text-slate-200">{act.steps.toLocaleString()}</div>
                          </div>
                        ) : null}

                        <div>
                          <span className="text-[10px] text-slate-500">Burned</span>
                          <div className="font-bold text-amber-400">{act.caloriesBurned} kcal</div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500">Fat Burned</span>
                          <div className="font-bold text-emerald-400">{act.estimatedFatBurnedGrams || 0} g</div>
                        </div>

                        {act.paceMinPerKm && (
                          <div>
                            <span className="text-[10px] text-slate-500">Pace</span>
                            <div className="font-bold text-slate-300">{act.paceMinPerKm}</div>
                          </div>
                        )}

                        {act.avgSpeedKmh && !act.paceMinPerKm && (
                          <div>
                            <span className="text-[10px] text-slate-500">Avg Speed</span>
                            <div className="font-bold text-slate-300">{act.avgSpeedKmh} km/h</div>
                          </div>
                        )}

                        {act.swimmingLaps && (
                          <div>
                            <span className="text-[10px] text-slate-500">Laps</span>
                            <div className="font-bold text-cyan-400">{act.swimmingLaps}</div>
                          </div>
                        )}

                        {act.heartRateBpm && (
                          <div>
                            <span className="text-[10px] text-slate-500">Heart Rate</span>
                            <div className="font-bold text-rose-400">{act.heartRateBpm} bpm</div>
                          </div>
                        )}
                      </div>

                      {/* Notes & Attached Photo */}
                      {(act.routeNotes || act.photoUrl) && (
                        <div className="pt-2 border-t border-slate-900 flex items-start gap-3">
                          {act.photoUrl && (
                            <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                              <img src={act.photoUrl} alt="Activity" className="h-full w-full object-cover" />
                            </div>
                          )}
                          {act.routeNotes && (
                            <p className="text-xs text-slate-400 italic leading-relaxed">
                              "{act.routeNotes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "vitals" && (
          <HealthVitalsTracker
            date={selectedDate}
            state={state}
            onUpdateState={onUpdateState}
            onNotify={onNotify}
          />
        )}

        {activeTab === "summary" && (
          <DailySummaryReportView
            aggregates={aggregates}
            activitiesForDate={activitiesForDate}
            athleteName={state.profile.fullName || "Elite Athlete"}
            onNotify={onNotify}
          />
        )}

        {activeTab === "trends" && (
          <ActivityTrendsView state={state} />
        )}

        {activeTab === "goals" && (
          <GoalsAndNotificationsView
            state={state}
            onUpdateState={onUpdateState}
            onNotify={onNotify}
          />
        )}

        {activeTab === "audit" && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" /> Enterprise Activity & Data Audit Trail
                </h3>
                <p className="text-xs text-slate-400">Timestamped operational events, role approvals, and system logs</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter audit logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Module</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(state.auditLogs || [])
                    .filter((log) => {
                      const matchSearch =
                        !auditSearch ||
                        log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        log.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        log.userName.toLowerCase().includes(auditSearch.toLowerCase());
                      return matchSearch;
                    })
                    .slice(0, 30)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-2.5 font-bold text-slate-200">{log.userName}</td>
                        <td className="p-2.5 text-slate-400">{log.userRole}</td>
                        <td className="p-2.5 text-slate-300 font-medium">{log.module}</td>
                        <td className="p-2.5 text-slate-300">{log.action}</td>
                        <td className="p-2.5 text-slate-400">{log.description}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
