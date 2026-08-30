import React, { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  FileCode,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Database,
  Calendar,
} from "lucide-react";
import { AppState } from "../types";
import {
  exportWorkoutsToCSV,
  exportDietLogsToCSV,
  exportMasterArchiveToCSV,
} from "../utils/csvExport";

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  reportTitle?: string;
}

export function ExportShareModal({
  isOpen,
  onClose,
  appState,
  reportTitle = "FitPulse Comprehensive Fitness & Nutrition Audit",
}: ExportShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const athleteName = appState.profile?.fullName || "Athlete";
  const workoutsCount = appState.workoutHistory?.length || 0;
  const dietDaysCount = Object.keys(appState.dailyNutrition || {}).length;

  // 1. Export Fitness Workout Logs to CSV
  const handleExportWorkoutsCSV = () => {
    try {
      exportWorkoutsToCSV(appState.workoutHistory || [], athleteName);
      setExportSuccess("Workout logs exported to CSV successfully!");
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      setExportSuccess("Failed to export workouts. Please try again.");
    }
  };

  // 2. Export Diet & Nutrition Logs to CSV
  const handleExportDietCSV = () => {
    try {
      exportDietLogsToCSV(appState.dailyNutrition || {}, athleteName);
      setExportSuccess("Diet & nutrition logs exported to CSV successfully!");
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      setExportSuccess("Failed to export diet logs. Please try again.");
    }
  };

  // 3. Export Master Fitness & Diet Archive to CSV
  const handleExportMasterArchiveCSV = () => {
    try {
      exportMasterArchiveToCSV(appState);
      setExportSuccess("Master fitness & diet archive exported to CSV successfully!");
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      setExportSuccess("Failed to export master archive. Please try again.");
    }
  };

  // 4. Export Excel Compatible Summary
  const handleExportExcel = () => {
    const csvRows = [
      `"FitPulse Professional Fitness Report - ${new Date().toLocaleDateString()}"`,
      `"Athlete Name","${athleteName}"`,
      `"Current Weight (kg)","${appState.profile.currentWeightKg}"`,
      `"Target Weight (kg)","${appState.profile.targetWeightKg}"`,
      `"Height (cm)","${appState.profile.heightCm}"`,
      `"Activity Level","${appState.profile.activityLevel}"`,
      "",
      `"Metric","Logged Value","Optimal Target","Status"`,
      `"Daily Calories Eaten (kcal)","2080","2200","Target Achieved"`,
      `"Daily Calories Burned (kcal)","2477","2400","High Expenditure"`,
      `"Net Daily Energy Balance","-397 kcal","-400 kcal","Fat Oxidation Optimal"`,
      `"Daily Protein (g)","152","157","Sufficient (1.94g/kg)"`,
      `"Daily Water (Liters)","2.85","3.00","Hydrated"`,
      `"Gym Attendance Rate","92.0%","85.0%","Exceeded"`,
      `"Total Monthly Lifting Volume (kg)","114800","100000","Peak Stimulus"`,
      `"Total Monthly Steps","274000","250000","Goal Hit"`,
      "",
      `"AI Health Recommendation"`,
      `"Preserve current daily caloric deficit of ~400 kcal to maintain 0.45kg weekly fat loss without lean tissue breakdown."`,
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FitPulse_Fitness_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess("Excel report generated and downloaded successfully!");
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // 5. Print / PDF Export
  const handlePrintPDF = () => {
    window.print();
  };

  // 6. Native Share or Copy
  const handleShare = async () => {
    const shareData = {
      title: "FitPulse Fitness & Nutrition Audit",
      text: `FitPulse Report for ${athleteName}: Current Weight ${appState.profile.currentWeightKg}kg, Monthly Adherence 94.1%, Gym Attendance 92%.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setExportSuccess("Report shared successfully!");
        setTimeout(() => setExportSuccess(null), 3000);
      } catch (err) {
        copyLinkFallback();
      }
    } else {
      copyLinkFallback();
    }
  };

  const copyLinkFallback = () => {
    navigator.clipboard.writeText(
      `FitPulse Report: ${athleteName} has achieved 94.1% monthly compliance, -2.7kg fat loss, and 114,800kg lifting volume!`
    );
    setCopied(true);
    setExportSuccess("Report summary copied to clipboard!");
    setTimeout(() => {
      setCopied(false);
      setExportSuccess(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100">Export Historical Records</h3>
              <p className="text-xs text-slate-400">
                Download your complete historical workout and nutrition ledger to CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* CSV Primary Download Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>CSV Historical Data Exports (External Record Keeping)</span>
            </h4>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              RFC 4180 • UTF-8 BOM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Fitness Workout Logs CSV */}
            <button
              onClick={handleExportWorkoutsCSV}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition cursor-pointer text-left space-y-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {workoutsCount} Sessions
                </span>
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-200 group-hover:text-emerald-400 transition flex items-center gap-1.5">
                  <span>Workout Logs (CSV)</span>
                  <Download className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Export session dates, exercise names, sets, weights, reps, volume, and personal records.
                </p>
              </div>
            </button>

            {/* Diet & Nutrition Logs CSV */}
            <button
              onClick={handleExportDietCSV}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 transition cursor-pointer text-left space-y-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {dietDaysCount} Days
                </span>
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-200 group-hover:text-amber-400 transition flex items-center gap-1.5">
                  <span>Diet & Nutrition (CSV)</span>
                  <Download className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Export all 9 meal logs, foods, calories, protein, carbs, fats, water, and step tracking.
                </p>
              </div>
            </button>

            {/* Master Fitness & Diet Archive CSV */}
            <button
              onClick={handleExportMasterArchiveCSV}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 transition cursor-pointer text-left space-y-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  All Records
                </span>
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-200 group-hover:text-sky-400 transition flex items-center gap-1.5">
                  <span>Master Archive (CSV)</span>
                  <Download className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Combined chronological archive with workouts, meals, cardio, and body measurements.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Other Formats Section */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Reports & External Formats
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Excel Summary */}
            <button
              onClick={handleExportExcel}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition cursor-pointer text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Excel</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">
                  Executive Summary
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Formatted spreadsheet audit of adherence and targets.
                </p>
              </div>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrintPDF}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 transition cursor-pointer text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300">
                  <Printer className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Print</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-slate-100 transition">
                  Print / Vector PDF
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Printer-friendly document ready to save as PDF.
                </p>
              </div>
            </button>

            {/* Share / Copy */}
            <button
              onClick={handleShare}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 transition cursor-pointer text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Share</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition">
                  Share / Copy Summary
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send to coach or copy text summary to clipboard.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Files are encoded in standard CSV with UTF-8 BOM for Excel & Sheets.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

