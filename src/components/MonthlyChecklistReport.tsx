import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coffee,
  Palmtree,
  Dumbbell,
  Apple,
  Zap,
  Flame,
  Droplets,
  Heart,
  Footprints,
  Bike,
  Compass,
  Activity,
  Building2,
  Moon,
  Scale,
  Camera,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
} from "lucide-react";
import { AppState } from "../types";
import {
  generateMonthlyChecklistReport,
  CHECKLIST_ROWS,
  ChecklistRowKey,
  ChecklistCellStatus,
} from "../utils/advancedReportCalculators";

interface MonthlyChecklistReportProps {
  appState: AppState;
  onOpenExportModal?: () => void;
}

export function MonthlyChecklistReport({
  appState,
  onOpenExportModal,
}: MonthlyChecklistReportProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // August
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedCell, setSelectedCell] = useState<{
    rowKey: ChecklistRowKey;
    rowLabel: string;
    dayNumber: number;
    dayName: string;
    date: string;
    status: ChecklistCellStatus;
  } | null>(null);

  // Generate Report Data
  const reportData = useMemo(() => {
    return generateMonthlyChecklistReport(appState, selectedYear, selectedMonth);
  }, [appState, selectedYear, selectedMonth]);

  // Filtered rows
  const visibleRows = useMemo(() => {
    if (categoryFilter === "All") return CHECKLIST_ROWS;
    return CHECKLIST_ROWS.filter((r) => r.category === categoryFilter);
  }, [categoryFilter]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Helper to render cell icon/badge
  const renderCellBadge = (status: ChecklistCellStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-400 font-black text-xs hover:scale-110 transition border border-emerald-500/40"
            title="Completed ✔"
          >
            ✔
          </span>
        );
      case "Missed":
        return (
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-rose-500/20 text-rose-400 font-black text-xs hover:scale-110 transition border border-rose-500/40"
            title="Missed ✘"
          >
            ✘
          </span>
        );
      case "Diet Broken":
        return (
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-500/20 text-amber-300 font-black text-xs hover:scale-110 transition border border-amber-500/40"
            title="Diet Broken ⚠"
          >
            ⚠
          </span>
        );
      case "Holiday":
        return (
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] hover:scale-110 transition border border-indigo-500/40"
            title="Holiday 🏖"
          >
            🏖
          </span>
        );
      case "Rest Day":
        return (
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-slate-800 text-slate-400 font-semibold text-[10px] hover:scale-110 transition border border-slate-700"
            title="Rest Day 🛋"
          >
            REST
          </span>
        );
      default:
        return <span className="text-slate-600">-</span>;
    }
  };

  // Helper for row icon
  const getRowIcon = (rowKey: ChecklistRowKey) => {
    switch (rowKey) {
      case "workout": return <Dumbbell className="h-4 w-4 text-emerald-400" />;
      case "diet": return <Apple className="h-4 w-4 text-sky-400" />;
      case "proteinGoal": return <Zap className="h-4 w-4 text-amber-400" />;
      case "caloriesGoal": return <Flame className="h-4 w-4 text-orange-400" />;
      case "waterGoal": return <Droplets className="h-4 w-4 text-cyan-400" />;
      case "cardio": return <Heart className="h-4 w-4 text-rose-400" />;
      case "running": return <Footprints className="h-4 w-4 text-teal-400" />;
      case "cycling": return <Bike className="h-4 w-4 text-blue-400" />;
      case "walking": return <Compass className="h-4 w-4 text-indigo-400" />;
      case "stepsGoal": return <Activity className="h-4 w-4 text-emerald-300" />;
      case "gymAttendance": return <Building2 className="h-4 w-4 text-purple-400" />;
      case "sleepGoal": return <Moon className="h-4 w-4 text-indigo-300" />;
      case "weightUpdated": return <Scale className="h-4 w-4 text-teal-300" />;
      case "progressPhoto": return <Camera className="h-4 w-4 text-pink-400" />;
    }
  };

  // Export to CSV for Excel
  const handleExportCSV = () => {
    let csv = `Monthly Workout & Diet Checklist - ${reportData.monthName} ${reportData.year}\n`;
    csv += `Day,${reportData.days.map((d) => `${d.dayNumber} (${d.dayName})`).join(",")}\n`;
    visibleRows.forEach((r) => {
      const rowStatuses = reportData.days.map((d) => reportData.matrix[r.key][d.dayNumber]);
      csv += `"${r.label}",${rowStatuses.join(",")}\n`;
    });
    csv += `\nSummary Metrics\n`;
    csv += `Overall Completion %,${reportData.stats.completionPct}%\n`;
    csv += `Workout %,${reportData.stats.workoutPct}%\n`;
    csv += `Diet %,${reportData.stats.dietPct}%\n`;
    csv += `Attendance %,${reportData.stats.attendancePct}%\n`;
    csv += `Monthly Score,${reportData.stats.overallMonthlyScore}/100\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Monthly_Checklist_${reportData.monthName}_${reportData.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Planner Grid • 1-31 Days
              </span>
              <span className="text-xs text-slate-400">Professional Monthly Audit System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-emerald-400" />
              <span>Monthly Workout & Diet Checklist Report</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive 14-row planner tracking workouts, diet discipline, macro targets, hydration, cardio, steps, and gym attendance.
            </p>
          </div>

          {/* Month & Year Navigation + Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 rounded-2xl border border-slate-800 p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-black text-slate-200 min-w-32 text-center">
                {reportData.monthName} {reportData.year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
              title="Download Excel / CSV format"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Excel / CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
              title="Print Monthly Planner Report"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span>Print</span>
            </button>

            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Export PDF / Share</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Required Summary Displays */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Completion % */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Completion %
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">
                {reportData.stats.completionPct}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {reportData.stats.totalCompletedCheckmarks}/{reportData.stats.totalPossibleCheckmarks}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${reportData.stats.completionPct}%` }}
              />
            </div>
          </div>

          {/* Workout % */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Workout %
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-sky-400">
                {reportData.stats.workoutPct}%
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Scheduled Target</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${reportData.stats.workoutPct}%` }}
              />
            </div>
          </div>

          {/* Diet % */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Diet %
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400">
                {reportData.stats.dietPct}%
              </span>
              <span className="text-[10px] text-slate-500">Adherence</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${reportData.stats.dietPct}%` }}
              />
            </div>
          </div>

          {/* Attendance % */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Attendance %
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-400">
                {reportData.stats.attendancePct}%
              </span>
              <span className="text-[10px] text-teal-400 font-semibold">Gym Checked-In</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${reportData.stats.attendancePct}%` }}
              />
            </div>
          </div>

          {/* Overall Monthly Score */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-emerald-300 text-[10px] uppercase font-black tracking-wider block">
              Monthly Score
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">
                {reportData.stats.overallMonthlyScore}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                Grade A+
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${reportData.stats.overallMonthlyScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs">
          {/* Status Markers Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Marker Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/40">
                ✔
              </span>
              <span className="text-slate-300 font-semibold">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs border border-rose-500/40">
                ✘
              </span>
              <span className="text-slate-300 font-semibold">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/40">
                ⚠
              </span>
              <span className="text-slate-300 font-semibold">Diet Broken</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] border border-indigo-500/40">
                🏖
              </span>
              <span className="text-slate-300 font-semibold">Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-slate-800 text-slate-400 font-semibold flex items-center justify-center text-[9px] border border-slate-700">
                REST
              </span>
              <span className="text-slate-300 font-semibold">Rest Day</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {["All", "Training", "Nutrition", "Endurance", "Recovery & Body"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Cell Audit Drawer */}
      {selectedCell && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              {getRowIcon(selectedCell.rowKey)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-100 text-sm">
                  {selectedCell.rowLabel}
                </span>
                <span className="text-slate-400 font-mono">
                  • {selectedCell.date} ({selectedCell.dayName})
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                    selectedCell.status === "Completed"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : selectedCell.status === "Missed"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : selectedCell.status === "Diet Broken"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : selectedCell.status === "Holiday"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Status: {selectedCell.status}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                {selectedCell.status === "Completed"
                  ? `Successfully fulfilled target threshold on Day ${selectedCell.dayNumber}.`
                  : selectedCell.status === "Diet Broken"
                  ? `Off-plan cheat calories or caloric threshold exceeded on Day ${selectedCell.dayNumber}.`
                  : selectedCell.status === "Missed"
                  ? `Session or goal not logged on Day ${selectedCell.dayNumber}.`
                  : selectedCell.status === "Holiday"
                  ? `National / public fitness gym holiday observed on Day ${selectedCell.dayNumber}.`
                  : `Scheduled active recovery rest protocol on Day ${selectedCell.dayNumber}.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedCell(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 31-Day Planner Matrix Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-center border-collapse text-xs select-none">
            <thead>
              {/* Day numbers header row */}
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold">
                <th className="p-3 text-left min-w-44 sticky left-0 z-20 bg-slate-950 border-r border-slate-800">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                    Fitness Metric ({visibleRows.length})
                  </span>
                </th>
                {reportData.days.map((day) => (
                  <th
                    key={day.dayNumber}
                    className={`p-2 min-w-9 border-r border-slate-800/60 transition ${
                      day.isToday
                        ? "bg-emerald-500/20 text-emerald-300 font-black border-emerald-500/40"
                        : day.isWeekend
                        ? "bg-slate-950/60 text-slate-400"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-black">{day.dayNumber}</span>
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase">
                      {day.dayName.slice(0, 2)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIdx) => {
                return (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-800/80 hover:bg-slate-800/30 transition ${
                      rowIdx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900"
                    }`}
                  >
                    {/* Sticky Metric Name Column */}
                    <td className="p-2.5 text-left font-bold sticky left-0 z-10 bg-slate-900 border-r border-slate-800 shadow-md">
                      <div className="flex items-center gap-2">
                        {getRowIcon(row.key)}
                        <span className="text-slate-200 text-xs font-extrabold whitespace-nowrap">
                          {row.label}
                        </span>
                      </div>
                    </td>

                    {/* Day 1 to 31 Cells */}
                    {reportData.days.map((day) => {
                      const status = reportData.matrix[row.key][day.dayNumber];
                      const isSelected =
                        selectedCell?.rowKey === row.key &&
                        selectedCell?.dayNumber === day.dayNumber;

                      return (
                        <td
                          key={day.dayNumber}
                          onClick={() =>
                            setSelectedCell({
                              rowKey: row.key,
                              rowLabel: row.label,
                              dayNumber: day.dayNumber,
                              dayName: day.dayName,
                              date: day.date,
                              status,
                            })
                          }
                          className={`p-1.5 border-r border-slate-800/50 cursor-pointer transition ${
                            isSelected ? "ring-2 ring-emerald-400 z-10" : ""
                          } ${day.isToday ? "bg-emerald-500/5" : ""}`}
                        >
                          {renderCellBadge(status)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
