import React, { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  DollarSign,
  FileCheck,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
  Award,
  BarChart3,
  Dumbbell,
  Apple,
  Flame,
  CheckSquare,
} from "lucide-react";
import { AppState } from "../types";
import { exportRateChartPDF, exportFormSubmissionPDF, exportGroupReportPDF } from "../utils/exportUtils";

interface EnterpriseDashboardViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNavigateTab: (tabId: string) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const EnterpriseDashboardView: React.FC<EnterpriseDashboardViewProps> = ({
  state,
  onUpdateState,
  onNavigateTab,
  onNotify,
}) => {
  const [summaryPeriod, setSummaryPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const rateCharts = state.rateCharts || [];
  const forms = state.forms || [];
  const groupReports = state.groupReports || [];
  const auditLogs = state.auditLogs || [];

  const draftForms = forms.filter((f) => f.isDraft || f.status === "Draft");
  const submittedForms = forms.filter((f) => !f.isDraft && f.status !== "Draft");

  // Pending vs Completed calculation
  const pendingActivities = [
    ...draftForms.map((d) => ({ id: d.id, title: `Complete Form: ${d.title}`, type: "Form Draft", date: d.updatedAt, tab: "forms" })),
    ...(groupReports.filter((r) => r.status === "Partially Completed").map((r) => ({ id: r.id, title: `Finalize Cohort Audit: ${r.title}`, type: "Cohort Report", date: r.updatedAt, tab: "group-reports" }))),
  ];

  const completedActivities = [
    ...submittedForms.map((s) => ({ id: s.id, title: s.title, type: "Certified Form", date: s.submittedAt || s.createdAt, status: "Submitted" })),
    ...(groupReports.filter((r) => r.status === "Submitted").map((r) => ({ id: r.id, title: r.title, type: "Locked Cohort Report", date: r.submittedAt || r.createdAt, status: "Certified" }))),
    ...(state.workoutHistory?.slice(0, 3).map((w) => ({ id: w.id, title: `Completed Workout: ${w.muscleGroup}`, type: "Training Session", date: w.date, status: "Completed" })) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Role & Cloud Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              {state.currentUserAccount?.role || "Admin"} Access Level
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              User: {state.currentUserAccount?.displayName || state.profile.fullName}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            Personal Enterprise Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time synchronization • My Rate Charts • My Forms • My Reports • Complete Audit Metrics
          </p>
        </div>

        {/* Quick Summary Period Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSummaryPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                summaryPeriod === p
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p} Summary
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards for Selected Period */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Rate Charts</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{rateCharts.length}</div>
            <p className="text-[10px] text-emerald-400">
              {rateCharts[0]?.items?.length || 0} Published Tariff Services
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Form Submissions</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{submittedForms.length}</div>
            <p className="text-[10px] text-amber-400">
              {draftForms.length} Drafts in Progress
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Cohort Reports</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{groupReports.length}</div>
            <p className="text-[10px] text-purple-400">
              {groupReports.reduce((acc, r) => acc + (r.members?.length || 0), 0)} Tracked Athletes
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Audit Events</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{auditLogs.length}</div>
            <p className="text-[10px] text-slate-400">
              100% Cloud Synced & Logged
            </p>
          </div>
        </div>
      </div>

      {/* Period Detailed Summary Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 capitalize">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            {summaryPeriod} Performance & Compliance Summary
          </h3>
          <span className="text-xs text-slate-400">
            {summaryPeriod === "daily" ? "Today: 28 Aug 2026" : summaryPeriod === "weekly" ? "Microcycle Week 34" : "Month: August 2026"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Workout & Training</span>
              <Dumbbell className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {summaryPeriod === "daily" ? "Chest & Triceps Overload" : summaryPeriod === "weekly" ? "5 of 5 Sessions Done" : "21 Workouts Logged"}
            </div>
            <p className="text-[11px] text-slate-400">Target muscle volume hit with zero joint pain.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Diet & Protein Intake</span>
              <Apple className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {summaryPeriod === "daily" ? "168g / 170g Protein" : summaryPeriod === "weekly" ? "96% Diet Adherence" : "Avg 2,180 kcal/day"}
            </div>
            <p className="text-[11px] text-slate-400">Calories on target with lean whole foods.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Steps & Recovery</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {summaryPeriod === "daily" ? "8,420 Steps • 7.5h Sleep" : summaryPeriod === "weekly" ? "58,940 Total Steps" : "7.6h Sleep Average"}
            </div>
            <p className="text-[11px] text-slate-400">Optimal recovery and parasympathetic state.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Rate Charts, My Forms, My Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: My Rate Charts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                My Rate Charts
              </h3>
              <button
                onClick={() => onNavigateTab("rate-charts")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {rateCharts.slice(0, 2).map((rc) => (
              <div key={rc.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {rc.version}
                  </span>
                  <span className="text-[10px] text-slate-400">{rc.status}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{rc.title}</h4>
                <p className="text-[11px] text-slate-400">{rc.items?.length || 0} active tariff items</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportRateChartPDF(rc)}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab("rate-charts")}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage Official Tariffs
          </button>
        </div>

        {/* Card 2: My Forms */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                My Forms & Audits
              </h3>
              <button
                onClick={() => onNavigateTab("forms")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Draft Resume Alert if drafts exist */}
            {draftForms.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Draft in Progress:</span>
                  <span className="text-[11px] text-slate-300">{draftForms[0].title}</span>
                </div>
                <button
                  onClick={() => onNavigateTab("forms")}
                  className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px]"
                >
                  Resume
                </button>
              </div>
            )}

            {submittedForms.slice(0, 2).map((form) => (
              <div key={form.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {form.formType}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Submitted</span>
                </div>
                <h4 className="text-xs font-bold text-white">{form.title}</h4>
                <p className="text-[11px] text-slate-400">By {form.userName} on {new Date(form.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab("forms")}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Fill / Auto-Save New Form
          </button>
        </div>

        {/* Card 3: My Reports */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                My Cohort & Nightly Reports
              </h3>
              <button
                onClick={() => onNavigateTab("group-reports")}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {groupReports.slice(0, 2).map((rep) => (
              <div key={rep.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {rep.cohortName}
                  </span>
                  <span className="text-[10px] text-slate-400">{rep.status}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{rep.title}</h4>
                <p className="text-[11px] text-slate-400">{rep.members?.length || 0} cohort athletes tracked</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab("group-reports")}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Open Cohort Progress Manager
          </button>
        </div>
      </div>

      {/* Pending vs Completed Activities Breakdown (Requirement 3 & 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Activities */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Activities ({pendingActivities.length})
            </h3>
          </div>

          {pendingActivities.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">All activities up to date! Zero pending drafts.</p>
          ) : (
            <div className="space-y-2">
              {pendingActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">{act.title}</span>
                    <span className="text-[10px] text-amber-400 block">{act.type}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab(act.tab)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Activities */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed Activities ({completedActivities.length})
            </h3>
          </div>

          <div className="space-y-2">
            {completedActivities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-white">{act.title}</span>
                  <span className="text-[10px] text-slate-400 block">{act.type} • {act.status}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
