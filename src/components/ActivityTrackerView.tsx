import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Smartphone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";
import { AppState, AuditLogEntry, UserRole } from "../types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  const [selectedRole, setSelectedRole] = useState<string>("All");

  const modules = ["All", "Rate Charts", "Forms", "Group Reports", "Workouts", "Nutrition", "Membership", "Authentication", "Security"];
  const actions = ["All", "Created", "Edited", "Deleted", "Submitted", "Approved", "Rejected", "Login", "Logout", "Exported"];
  const roles = ["All", "Admin", "Manager", "Staff"];

  const logs = state.auditLogs || [];

  const filteredLogs = logs.filter((log) => {
    const matchesModule = selectedModule === "All" || log.module === selectedModule;
    const matchesAction = selectedAction === "All" || log.action === selectedAction;
    const matchesRole = selectedRole === "All" || log.userRole === selectedRole;
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesAction && matchesRole && matchesSearch;
  });

  const handleApproveAction = (logId: string) => {
    onNotify("Approved", "Submission approved by management.", "success");
    onUpdateState((prev) => ({
      ...prev,
      auditLogs: (prev.auditLogs || []).map((l) =>
        l.id === logId ? { ...l, action: "Approved" as any, description: `${l.description} [APPROVED]` } : l
      ),
    }));
  };

  const handleRejectAction = (logId: string) => {
    onNotify("Rejected", "Action marked as rejected.", "warning");
    onUpdateState((prev) => ({
      ...prev,
      auditLogs: (prev.auditLogs || []).map((l) =>
        l.id === logId ? { ...l, action: "Rejected" as any, description: `${l.description} [REJECTED]` } : l
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Real-Time Audit Trail
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {logs.length} Total Logged Events
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            Enterprise Activity Tracking & Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Immutable log • Date & Time • User & Role • GPS Coordinates • Device & IP • Actions (Created, Edited, Deleted, Submitted, Approved, Rejected)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, notes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {modules.map((m) => (
                <option key={m} value={m}>Module: {m}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {actions.map((a) => (
                <option key={a} value={a}>Action: {a}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>Role: {r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No activity logs matching the selected filter criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-lg"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      log.action === "Created" || log.action === "Approved" || log.action === "Submitted"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : log.action === "Deleted" || log.action === "Rejected"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : log.action === "Edited"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {log.module}
                  </span>
                  <span className="text-xs font-bold text-white">{log.userName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {log.userRole}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{log.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-slate-400" />
                    {log.device}
                  </span>
                  {log.gpsLocation && (
                    <span className="flex items-center gap-1 text-emerald-400/80">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>
                        {typeof log.gpsLocation === "object"
                          ? (log.gpsLocation.address || `${log.gpsLocation.latitude.toFixed(4)}° N, ${log.gpsLocation.longitude.toFixed(4)}° E`)
                          : String(log.gpsLocation)}
                      </span>
                    </span>
                  )}
                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                </div>
              </div>

              {/* Action Buttons for Managers / Admins */}
              {(state.currentUserAccount?.role === "Admin" || state.currentUserAccount?.role === "Manager") &&
                log.action === "Submitted" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveAction(log.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectAction(log.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
