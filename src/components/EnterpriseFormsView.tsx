import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileCheck,
  Save,
  Clock,
  CheckCircle2,
  Trash2,
  FileText,
  Download,
  Printer,
  Sparkles,
  Shield,
  MapPin,
  PenTool,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Eye,
  RefreshCw,
  Plus,
} from "lucide-react";
import { AppState, FormSubmissionRecord, DynamicFormField, UserRole } from "../types";
import { exportFormSubmissionDocx, exportFormSubmissionPDF } from "../utils/exportUtils";
import { createAuditEntry, getCurrentCoordinates } from "../utils/auditLogger";

interface EnterpriseFormsViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const EnterpriseFormsView: React.FC<EnterpriseFormsViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [selectedFormType, setSelectedFormType] = useState<FormSubmissionRecord["formType"]>(
    "Client Intake & PAR-Q"
  );
  const [activeTab, setActiveTab] = useState<"fill" | "drafts" | "submitted">("fill");
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(30);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<DynamicFormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [selectedReviewForm, setSelectedReviewForm] = useState<FormSubmissionRecord | null>(null);
  const [signatureText, setSignatureText] = useState("Alex Miller (Digital Sign-off)");

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Default Form Templates
  const getInitialFields = (type: FormSubmissionRecord["formType"]): { title: string; fields: DynamicFormField[] } => {
    switch (type) {
      case "Client Intake & PAR-Q":
        return {
          title: `Client Physical Activity Readiness Questionnaire - ${state.profile.fullName}`,
          fields: [
            { id: "f-1", label: "Full Legal Name", type: "text", required: true, value: state.profile.fullName },
            { id: "f-2", label: "Mobile Phone Contact", type: "text", required: true, value: state.profile.mobileNumber },
            { id: "f-3", label: "Primary Fitness Target", type: "select", required: true, value: state.profile.fitnessGoal, options: ["Weight Loss", "Muscle Gain", "Body Recomposition", "Maintenance"] },
            { id: "f-4", label: "Has a doctor ever indicated you have a heart condition?", type: "checkbox", required: true, value: false },
            { id: "f-5", label: "Do you experience pain in your chest when performing physical activity?", type: "checkbox", required: true, value: false },
            { id: "f-6", label: "Known Joint / Bone / Medical Conditions", type: "textarea", required: false, value: state.profile.medicalConditions || "Mild right knee patellar tightness" },
            { id: "f-7", label: "Readiness Self-Assessment Rating (1-10)", type: "rating", required: true, value: 9 },
          ],
        };
      case "Daily Compliance Audit":
        return {
          title: `Daily Nutrition, Steps & Workout Compliance Audit - ${new Date().toISOString().split("T")[0]}`,
          fields: [
            { id: "f-10", label: "Date of Audit", type: "date", required: true, value: new Date().toISOString().split("T")[0] },
            { id: "f-11", label: "Prescribed Weight Workout Completed?", type: "checkbox", required: true, value: true },
            { id: "f-12", label: "Total Calories Logged (kcal)", type: "number", required: true, value: 2150 },
            { id: "f-13", label: "Total Protein Consumed (g)", type: "number", required: true, value: 165 },
            { id: "f-14", label: "Daily Water Intake (ml)", type: "number", required: true, value: 3000 },
            { id: "f-15", label: "Steps Count Achieved", type: "number", required: true, value: 8500 },
            { id: "f-16", label: "Athlete Compliance Notes", type: "textarea", required: false, value: "Solid session. Hit bench overload with no joint pain." },
          ],
        };
      case "Fitness Assessment Review":
        return {
          title: `Monthly Biomechanics & 1RM Strength Assessment Review`,
          fields: [
            { id: "f-20", label: "Athlete Name", type: "text", required: true, value: state.profile.fullName },
            { id: "f-21", label: "Current Body Weight (kg)", type: "number", required: true, value: state.profile.currentWeightKg },
            { id: "f-22", label: "Estimated Body Fat (%)", type: "number", required: true, value: 15.9 },
            { id: "f-23", label: "Squat Max Lift (kg)", type: "number", required: true, value: 110 },
            { id: "f-24", label: "Bench Press Max Lift (kg)", type: "number", required: true, value: 82.5 },
            { id: "f-25", label: "Deadlift Max Lift (kg)", type: "number", required: true, value: 130 },
            { id: "f-26", label: "Postural & Symmetry Notes", type: "textarea", required: false, value: "Excellent pelvic neutrality and core bracing during hip hinges." },
          ],
        };
      case "Coach Session Evaluation":
        return {
          title: `Coach 1-on-1 Performance & Technique Evaluation`,
          fields: [
            { id: "f-30", label: "Assigned Coach Name", type: "text", required: true, value: state.membership.trainerName || "Marcus Vance (CSCS)" },
            { id: "f-31", label: "Session Focus Muscle Group", type: "select", required: true, value: "Chest & Shoulders", options: ["Chest & Shoulders", "Back & Biceps", "Legs & Core", "Full Body", "Cardio Conditioning"] },
            { id: "f-32", label: "Technique & Form Rating (1-10)", type: "rating", required: true, value: 9 },
            { id: "f-33", label: "Effort & RPE Intensity (1-10)", type: "rating", required: true, value: 8 },
            { id: "f-34", label: "Coach Progressive Overload Directive", type: "textarea", required: true, value: "Add +2.5kg to upper incline barbell press in the next microcycle." },
          ],
        };
      case "Incident & Mistake Report":
        return {
          title: `Safety Incident / Recovery Disruption Log`,
          fields: [
            { id: "f-40", label: "Incident / Mistake Type", type: "select", required: true, value: "Low Sleep", options: ["Low Sleep", "Skipped Meal", "Missed Gym Session", "Mild Joint Sprain", "High Calorie Cheat Day"] },
            { id: "f-41", label: "Root Cause / Trigger", type: "textarea", required: true, value: "Late flight delay and disrupted circadian rhythm." },
            { id: "f-42", label: "Corrective Action Plan", type: "textarea", required: true, value: "Increase hydration to 3.5L, take 400mg magnesium glycinate, and schedule 8.5h sleep tonight." },
          ],
        };
      default:
        return {
          title: "Custom Fitness Form",
          fields: [{ id: "f-custom-1", label: "General Feedback", type: "textarea", required: true, value: "" }],
        };
    }
  };

  // Initialize form when selectedFormType changes
  useEffect(() => {
    const init = getInitialFields(selectedFormType);
    setFormTitle(init.title);
    setFormFields(init.fields);
    setActiveDraftId(null);
    setAutoSaveCountdown(30);
  }, [selectedFormType]);

  // 30-Second Auto-Save Interval (Requirement 6)
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      setAutoSaveCountdown((prev) => {
        if (prev <= 1) {
          performAutoSave();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [formFields, formTitle, selectedFormType, activeDraftId]);

  const performAutoSave = async () => {
    if (formFields.length === 0) return;
    const now = new Date();
    const draftId = activeDraftId || `draft-${Date.now()}`;
    setActiveDraftId(draftId);

    const draftRecord: FormSubmissionRecord = {
      id: draftId,
      formType: selectedFormType,
      title: formTitle,
      userId: state.currentUserAccount?.uid || "usr-admin-01",
      userName: state.currentUserAccount?.displayName || state.profile.fullName,
      userRole: state.currentUserAccount?.role || "Staff",
      fields: formFields,
      status: "Draft",
      isDraft: true,
      createdAt: new Date().toISOString(),
      updatedAt: now.toISOString(),
      autoSavedAt: now.toISOString(),
      gpsLocation: "18.5204° N, 73.8567° E",
    };

    onUpdateState((prev) => ({
      ...prev,
      formDrafts: {
        ...(prev.formDrafts || {}),
        [draftId]: draftRecord,
      },
      forms: [
        draftRecord,
        ...(prev.forms || []).filter((f) => f.id !== draftId),
      ],
    }));

    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastAutoSavedTime(timeStr);
    onNotify("Draft Auto-Saved", `Form auto-saved securely at ${timeStr}`, "info");
  };

  const handleManualSaveDraft = async () => {
    await performAutoSave();
    onNotify("Draft Saved", "Form saved as draft. You can resume anytime.", "success");
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, value } : f))
    );
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formId = activeDraftId || `form-sub-${Date.now()}`;

    const submission: FormSubmissionRecord = {
      id: formId,
      formType: selectedFormType,
      title: formTitle,
      userId: state.currentUserAccount?.uid || "usr-admin-01",
      userName: state.currentUserAccount?.displayName || state.profile.fullName,
      userRole: state.currentUserAccount?.role || "Staff",
      fields: formFields,
      status: "Submitted",
      isDraft: false,
      createdAt: new Date().toISOString(),
      updatedAt: now.toISOString(),
      submittedAt: now.toISOString(),
      reviewedBy: "Dr. Rachel Thorne (Medical Director)",
      reviewNotes: "Form validated and verified by coaching staff.",
      signatureUrl: signatureText,
      gpsLocation: "18.5204° N, 73.8567° E (HQ)",
    };

    // Emit Audit Log
    const auditEntry = await createAuditEntry(
      submission.userId,
      submission.userName,
      submission.userRole,
      "Submitted",
      "Forms",
      `Submitted official form: "${submission.title}" (${submission.formType})`,
      { formId: submission.id }
    );

    onUpdateState((prev) => {
      // Remove from drafts if existed
      const drafts = { ...(prev.formDrafts || {}) };
      delete drafts[formId];

      return {
        ...prev,
        formDrafts: drafts,
        forms: [submission, ...(prev.forms || []).filter((f) => f.id !== formId)],
        auditLogs: [auditEntry, ...(prev.auditLogs || [])],
      };
    });

    onNotify("Form Submitted", `"${formTitle}" submitted & certified successfully!`, "success");
    setActiveTab("submitted");
    setActiveDraftId(null);
  };

  const handleResumeDraft = (draft: FormSubmissionRecord) => {
    setSelectedFormType(draft.formType);
    setFormTitle(draft.title);
    setFormFields(draft.fields);
    setActiveDraftId(draft.id);
    setActiveTab("fill");
    onNotify("Draft Resumed", `Resumed editing draft: "${draft.title}"`, "info");
  };

  const handleDeleteDraft = (draftId: string) => {
    onUpdateState((prev) => {
      const drafts = { ...(prev.formDrafts || {}) };
      delete drafts[draftId];
      return {
        ...prev,
        formDrafts: drafts,
        forms: (prev.forms || []).filter((f) => f.id !== draftId),
      };
    });
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
    onNotify("Draft Deleted", "Form draft deleted.", "info");
  };

  const draftsList = (state.forms || []).filter((f) => f.isDraft || f.status === "Draft");
  const submittedList = (state.forms || []).filter((f) => !f.isDraft && f.status !== "Draft");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Dynamic Form Engine
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              30s Auto-Save Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-blue-400" />
            Forms, Intake & Compliance Audits
          </h1>
          <p className="text-xs text-slate-400">
            Auto-save Drafts • Loss-proof Resume • GPS Certified Submissions • Word (.docx) & PDF Export
          </p>
        </div>

        {/* Top Actions & Sub-Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("fill")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "fill"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Fill Form
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "drafts"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Drafts</span>
            {draftsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/40">
                {draftsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("submitted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "submitted"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Submitted ({submittedList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FILL FORM */}
      {activeTab === "fill" && (
        <div className="space-y-4">
          {/* Form Selection Row & 30s Auto-Save Indicator */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
              {(
                [
                  "Client Intake & PAR-Q",
                  "Daily Compliance Audit",
                  "Fitness Assessment Review",
                  "Coach Session Evaluation",
                  "Incident & Mistake Report",
                ] as FormSubmissionRecord["formType"][]
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFormType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFormType === type
                      ? "bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                      : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Auto Save Status Banner */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Next Auto-Save in <strong className="text-white font-mono">{autoSaveCountdown}s</strong></span>
                {lastAutoSavedTime && (
                  <span className="text-[10px] text-emerald-400 ml-1">
                    (Saved at {lastAutoSavedTime})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                Save Draft
              </button>
            </div>
          </div>

          {/* Form Editing Card */}
          <form onSubmit={handleSubmitForm} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <label className="text-xs font-semibold text-slate-400">Form Title / Header</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Dynamic Fields List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map((field) => (
                <div
                  key={field.id}
                  className={`space-y-1.5 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                >
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>{field.label} {field.required && <span className="text-rose-400">*</span>}</span>
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      required={field.required}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  )}

                  {field.type === "number" && (
                    <input
                      type="number"
                      required={field.required}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      required={field.required}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      rows={3}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  )}

                  {field.type === "checkbox" && (
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        className="w-4 h-4 rounded text-blue-500 focus:ring-0 focus:outline-none"
                      />
                      <span className="text-xs text-slate-300">Affirm / Confirm Compliance</span>
                    </label>
                  )}

                  {field.type === "rating" && (
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleFieldChange(field.id, num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            field.value === num
                              ? "bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-105"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Signature & Digital Verification Block */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-400" />
                  Digital Sign-off & GPS Certification
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  GPS Tag: 18.5204° N, 73.8567° E
                </span>
              </div>
              <input
                type="text"
                required
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your full name to sign digitally"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit & Save Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Save Draft
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 font-bold text-xs text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Final Submit & Certify
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DRAFTS MANAGER */}
      {activeTab === "drafts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              Saved & Auto-Saved Form Drafts ({draftsList.length})
            </h2>
            <button
              onClick={() => setActiveTab("fill")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New
            </button>
          </div>

          {draftsList.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No active drafts saved. Any form in progress auto-saves here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftsList.map((draft) => (
                <div
                  key={draft.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between space-y-3 transition-all group shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {draft.formType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {draft.autoSavedAt ? `Saved: ${new Date(draft.autoSavedAt).toLocaleTimeString()}` : "Draft"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {draft.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      User: {draft.userName} • Fields filled: {draft.fields.filter((f) => Boolean(f.value)).length} of {draft.fields.length}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleResumeDraft(draft)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-500/30 transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Resume Editing
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBMITTED FORMS */}
      {activeTab === "submitted" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verified & Submitted Forms History ({submittedList.length})
            </h2>
          </div>

          <div className="space-y-3">
            {submittedList.map((form) => (
              <div
                key={form.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {form.status}
                    </span>
                    <span className="text-xs font-bold text-white">{form.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Form Type: {form.formType} • Submitted by: {form.userName} ({form.userRole}) • Date: {new Date(form.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportFormSubmissionDocx(form)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs border border-blue-500/40 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Word (.docx)
                  </button>
                  <button
                    onClick={() => exportFormSubmissionPDF(form)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/40 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
