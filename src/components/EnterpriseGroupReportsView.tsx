import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  Lock,
  Edit,
  Save,
  Clock,
  Sparkles,
  Shield,
  Award,
  Trash2,
  Share2,
  Printer,
  ChevronRight,
} from "lucide-react";
import { AppState, EnterpriseGroupReport, GroupReportMemberProgress } from "../types";
import { exportGroupReportDocx, exportGroupReportPDF } from "../utils/exportUtils";
import { createAuditEntry } from "../utils/auditLogger";

interface EnterpriseGroupReportsViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const EnterpriseGroupReportsView: React.FC<EnterpriseGroupReportsViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    state.groupReports?.[0]?.id || null
  );
  const [isCreatingReport, setIsCreatingReport] = useState(false);

  // Form State for new/editing report
  const activeReport = (state.groupReports || []).find((r) => r.id === selectedReportId) || state.groupReports?.[0];

  const [title, setTitle] = useState(activeReport?.title || "August 2026 Elite Physique Cohort Progress Audit");
  const [cohortName, setCohortName] = useState(activeReport?.cohortName || "Summer Lean Transformation Cohort");
  const [reportPeriod, setReportPeriod] = useState(activeReport?.reportPeriod || "August 2026");
  const [coachName, setCoachName] = useState(activeReport?.coachName || "Coach Marcus Vance (CSCS)");
  const [summaryNotes, setSummaryNotes] = useState(activeReport?.summaryNotes || "");
  const [recommendations, setRecommendations] = useState(activeReport?.recommendations || "");
  const [members, setMembers] = useState<GroupReportMemberProgress[]>(activeReport?.members || []);

  const handleMemberChange = (index: number, key: keyof GroupReportMemberProgress, value: any) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleAddMember = () => {
    const newMember: GroupReportMemberProgress = {
      memberId: `mem-${Date.now()}`,
      memberName: `Athlete ${members.length + 1}`,
      startingWeightKg: 80,
      currentWeightKg: 78,
      attendancePct: 90,
      dietScore: 90,
      workoutsCompleted: 18,
      notes: "Steady progression across all compound lifts.",
      certified: true,
    };
    setMembers([...members, newMember]);
  };

  const handleSavePartiallyCompleted = () => {
    if (!activeReport) return;
    const updated: EnterpriseGroupReport = {
      ...activeReport,
      title,
      cohortName,
      reportPeriod,
      coachName,
      summaryNotes,
      recommendations,
      members,
      status: "Partially Completed",
      updatedAt: new Date().toISOString(),
      autoSavedAt: new Date().toISOString(),
    };

    onUpdateState((prev) => ({
      ...prev,
      groupReports: prev.groupReports.map((r) => (r.id === updated.id ? updated : r)),
    }));

    onNotify("Progress Saved", "Cohort report partially saved. You can resume anytime.", "info");
  };

  const handleFinalSubmit = async () => {
    if (!activeReport) return;
    const updated: EnterpriseGroupReport = {
      ...activeReport,
      title,
      cohortName,
      reportPeriod,
      coachName,
      summaryNotes,
      recommendations,
      members,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: state.currentUserAccount?.displayName || "Alex Miller (Admin)",
    };

    const audit = await createAuditEntry(
      state.currentUserAccount?.uid || "usr-admin-01",
      state.currentUserAccount?.displayName || "Alex Miller",
      state.currentUserAccount?.role || "Admin",
      "Submitted",
      "Group Reports",
      `Final submission & certified lock for Group Cohort Report: "${updated.title}"`
    );

    onUpdateState((prev) => ({
      ...prev,
      groupReports: prev.groupReports.map((r) => (r.id === updated.id ? updated : r)),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    onNotify("Report Submitted", "Group report submitted & locked for official records.", "success");
  };

  const handleExportWord = async () => {
    if (!activeReport) return;
    await exportGroupReportDocx(activeReport);
    onNotify("Word Export Complete", "Cohort progress report exported to Word (.docx).", "success");
  };

  const handleExportPDF = () => {
    if (!activeReport) return;
    exportGroupReportPDF(activeReport);
    onNotify("PDF Export Complete", "Cohort progress report exported to PDF.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-400" />
              Batch Cohort Progress Audit
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Multi-Athlete Tracking
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-400" />
            Group & Cohort Progress Reports
          </h1>
          <p className="text-xs text-slate-400">
            Batch athlete management • Partial saves • Final certified submit • Word (.docx) & PDF generation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Export Word (.docx)
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-rose-400" />
            Export PDF
          </button>
        </div>
      </div>

      {activeReport && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-5">
            <div>
              <label className="text-xs font-semibold text-slate-400">Report Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Cohort / Group Name</label>
              <input
                type="text"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Head Coach</label>
              <input
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white mt-1"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cohort Athlete Metrics & Compliance Table ({members.length})
              </h3>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1 hover:bg-purple-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Athlete
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Athlete Name</th>
                    <th className="p-3">Start Wt (kg)</th>
                    <th className="p-3">Current Wt (kg)</th>
                    <th className="p-3">Attendance %</th>
                    <th className="p-3">Diet Adherence</th>
                    <th className="p-3">Coach Feedback</th>
                    <th className="p-3 text-center">Certified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {members.map((m, idx) => (
                    <tr key={m.memberId || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <input
                          type="text"
                          value={m.memberName}
                          onChange={(e) => handleMemberChange(idx, "memberName", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-white focus:outline-none w-full"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={m.startingWeightKg}
                          onChange={(e) => handleMemberChange(idx, "startingWeightKg", Number(e.target.value))}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-white focus:outline-none w-16"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={m.currentWeightKg}
                          onChange={(e) => handleMemberChange(idx, "currentWeightKg", Number(e.target.value))}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-white focus:outline-none w-16"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={m.attendancePct}
                          onChange={(e) => handleMemberChange(idx, "attendancePct", Number(e.target.value))}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-white focus:outline-none w-16"
                        />
                        %
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={m.dietScore}
                          onChange={(e) => handleMemberChange(idx, "dietScore", Number(e.target.value))}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-white focus:outline-none w-16"
                        />
                        /100
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={m.notes}
                          onChange={(e) => handleMemberChange(idx, "notes", e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-400 text-xs text-slate-300 focus:outline-none w-full"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={m.certified}
                          onChange={(e) => handleMemberChange(idx, "certified", e.target.checked)}
                          className="w-4 h-4 rounded text-purple-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observations & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Cohort Summary & Overall Observations</label>
              <textarea
                rows={3}
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Strategic Recommendations & Next Phase</label>
              <textarea
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Status:</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {activeReport.status}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSavePartiallyCompleted}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                Save Partially Completed
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Final Submit & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
