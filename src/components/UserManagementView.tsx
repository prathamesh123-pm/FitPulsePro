import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Shield,
  Search,
  UserCheck,
  UserX,
  KeyRound,
  History,
  Activity,
  Megaphone,
  Filter,
  RefreshCw,
  Mail,
  Smartphone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ChevronRight,
  Eye,
  FileText,
  BadgeAlert,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import {
  AppState,
  UserAccount,
  UserRole,
  LoginHistoryRecord,
  AuditLogEntry,
  BroadcastAnnouncement,
} from "../types";
import {
  fetchAllUsersFromCloud,
  updateUserStatusInCloud,
  adminResetUserPassword,
  saveBroadcastAnnouncement,
  fetchBroadcastAnnouncements,
  fetchLoginHistoryFromCloud,
  fetchAuditLogsFromCloud,
  saveAuditLogToCloud,
} from "../services/firebase";
import { createAuditEntry, getDeviceInfo, getClientIpAddress } from "../utils/auditLogger";

interface UserManagementViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Disabled" | "Suspended">("All");

  // Selected user for deep dive modal
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [userLoginHistory, setUserLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [userAuditLogs, setUserAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<"profile" | "history" | "audit">("profile");
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Broadcast announcement composer modal
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"All" | UserRole>("All");
  const [announcementPriority, setAnnouncementPriority] = useState<"Normal" | "High" | "Urgent">("Normal");
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState<BroadcastAnnouncement[]>([]);

  const currentAdmin = state.currentUserAccount;
  const isSuperAdmin = currentAdmin?.role === "Admin";

  // Initial load
  useEffect(() => {
    loadAllUsers();
    loadAnnouncements();
  }, []);

  const loadAllUsers = async () => {
    setIsLoading(true);
    try {
      const cloudUsers = await fetchAllUsersFromCloud();
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      } else {
        // Provide baseline directory seeded from current user + standard demo team
        const baseline: UserAccount[] = [
          state.currentUserAccount || {
            uid: "usr-admin-01",
            email: "alex.miller@fitpulse.app",
            displayName: "Alex Miller",
            mobileNumber: "+91 98765 43210",
            companyName: "FitPulse Athletic Pro",
            designation: "Head Master Trainer & Gym Owner",
            address: "Kalyani Nagar, Pune, MH",
            role: "Admin",
            department: "Executive Leadership",
            createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
            lastLoginAt: new Date().toISOString(),
            status: "Active",
            emailVerified: true,
          },
          {
            uid: "usr-coach-02",
            email: "sarah.jenkins@fitpulse.app",
            displayName: "Sarah Jenkins",
            mobileNumber: "+91 98111 22334",
            companyName: "FitPulse Athletic Pro",
            designation: "Senior Strength & Conditioning Coach",
            address: "Koregaon Park, Pune, MH",
            role: "Manager",
            department: "Training Operations",
            createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
            lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
            status: "Active",
            emailVerified: true,
          },
          {
            uid: "usr-trainer-03",
            email: "david.chen@fitpulse.app",
            displayName: "David Chen",
            mobileNumber: "+91 97222 33445",
            companyName: "FitPulse Athletic Pro",
            designation: "Personal Fitness Trainer",
            address: "Viman Nagar, Pune, MH",
            role: "Staff",
            department: "Fitness Coaching",
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
            lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: "Active",
            emailVerified: true,
          },
          {
            uid: "usr-nutrition-04",
            email: "priya.sharma@fitpulse.app",
            displayName: "Priya Sharma",
            mobileNumber: "+91 96333 44556",
            companyName: "FitPulse Athletic Pro",
            designation: "Clinical Sports Nutritionist",
            address: "Baner, Pune, MH",
            role: "Staff",
            department: "Nutrition & Dietetics",
            createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
            lastLoginAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            status: "Active",
            emailVerified: true,
          },
          {
            uid: "usr-athlete-05",
            email: "rohit.deshmukh@fitpulse.app",
            displayName: "Rohit Deshmukh",
            mobileNumber: "+91 95444 55667",
            companyName: "Deshmukh Tech Enterprises",
            designation: "Elite Athlete Member",
            address: "Aundh, Pune, MH",
            role: "Staff",
            department: "Private Client",
            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            lastLoginAt: new Date(Date.now() - 86400000 * 6).toISOString(),
            status: "Active",
            emailVerified: false,
          },
        ];
        setUsers(baseline);
      }
    } catch (err) {
      console.warn("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const items = await fetchBroadcastAnnouncements();
      setAnnouncementsList(items);
    } catch (e) {}
  };

  const handleOpenUserDetail = async (user: UserAccount) => {
    setSelectedUser(user);
    setActiveDetailTab("profile");
    setIsDetailLoading(true);

    try {
      const [history, audit] = await Promise.all([
        fetchLoginHistoryFromCloud(user.uid),
        fetchAuditLogsFromCloud(user.uid),
      ]);
      setUserLoginHistory(history);
      setUserAuditLogs(audit);
    } catch (err) {
      console.warn("Detail fetch error:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    const nextStatus: "Active" | "Disabled" = user.status === "Active" ? "Disabled" : "Active";
    const res = await updateUserStatusInCloud(user.uid, nextStatus);

    if (res.success) {
      const updatedUsers = users.map((u) => (u.uid === user.uid ? { ...u, status: nextStatus } : u));
      setUsers(updatedUsers);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, status: nextStatus });
      }

      // Record audit
      if (currentAdmin) {
        const audit = await createAuditEntry(
          currentAdmin.uid,
          currentAdmin.displayName,
          currentAdmin.role,
          "Edited",
          "User Management",
          `Admin ${currentAdmin.displayName} set account status of ${user.displayName} (${user.email}) to ${nextStatus}`,
          { targetUserId: user.uid, newStatus: nextStatus }
        );
        saveAuditLogToCloud(currentAdmin.uid, audit).catch(console.warn);
      }

      onNotify(
        "Account Status Updated",
        `User ${user.displayName}'s account has been ${nextStatus === "Active" ? "activated" : "deactivated"}.`,
        "success"
      );
    } else {
      onNotify("Update Failed", res.error || "Could not change user status.", "error");
    }
  };

  const handleChangeUserRole = async (user: UserAccount, newRole: UserRole) => {
    const res = await updateUserStatusInCloud(user.uid, user.status, newRole);
    if (res.success) {
      const updatedUsers = users.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u));
      setUsers(updatedUsers);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }

      if (currentAdmin) {
        const audit = await createAuditEntry(
          currentAdmin.uid,
          currentAdmin.displayName,
          currentAdmin.role,
          "Edited",
          "User Management",
          `Admin ${currentAdmin.displayName} upgraded role of ${user.displayName} to ${newRole}`,
          { targetUserId: user.uid, newRole }
        );
        saveAuditLogToCloud(currentAdmin.uid, audit).catch(console.warn);
      }

      onNotify("Role Updated", `${user.displayName} is now assigned as ${newRole}.`, "success");
    } else {
      onNotify("Role Update Failed", res.error || "Failed to update role", "error");
    }
  };

  const handleAdminResetPassword = async (user: UserAccount) => {
    if (!user.email) {
      onNotify("Missing Email", "User does not have a valid email configured.", "warning");
      return;
    }
    const res = await adminResetUserPassword(user.email);
    if (res.success) {
      onNotify(
        "Reset Link Dispatched",
        `Password reset instructions have been emailed to ${user.email}.`,
        "success"
      );
    } else {
      onNotify("Reset Failed", res.error || "Failed to dispatch password reset email.", "error");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      onNotify("Validation Error", "Please provide a title and announcement message.", "warning");
      return;
    }

    setIsSendingAnnouncement(true);
    const newAnnouncement: BroadcastAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: announcementTitle.trim(),
      message: announcementMessage.trim(),
      targetRole: announcementTarget,
      priority: announcementPriority,
      createdBy: currentAdmin?.uid || "admin",
      createdByName: currentAdmin?.displayName || "System Administrator",
      createdAt: new Date().toISOString(),
    };

    try {
      await saveBroadcastAnnouncement(newAnnouncement);
      setAnnouncementsList((prev) => [newAnnouncement, ...prev]);

      // Push into app notifications for instant feedback
      onUpdateState((prev) => ({
        ...prev,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            title: `📢 Announcement: ${newAnnouncement.title}`,
            message: newAnnouncement.message,
            type: newAnnouncement.priority === "Urgent" ? "warning" : "info",
            category: "System",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: false,
          },
          ...prev.notifications,
        ],
      }));

      onNotify(
        "Announcement Broadcasted",
        `Message dispatched to ${announcementTarget === "All" ? "all users" : `${announcementTarget}s`} across all synced devices.`,
        "success"
      );

      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setIsAnnouncementOpen(false);
    } catch (err: any) {
      onNotify("Broadcast Error", err?.message || "Failed to broadcast announcement", "error");
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.mobileNumber && u.mobileNumber.includes(searchQuery)) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === "Active").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const managerCount = users.filter((u) => u.role === "Manager").length;
  const staffCount = users.filter((u) => u.role === "Staff").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <Shield className="w-3 h-3 text-indigo-400" />
              Administrative Governance
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Firebase RBAC Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            User Management & Enterprise Directory
          </h1>
          <p className="text-xs text-slate-400">
            Control access roles, audit device login trails, reset credentials, and broadcast company announcements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAnnouncementOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            Send Announcement
          </button>
          <button
            onClick={loadAllUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{totalUsersCount}</div>
            <div className="text-[11px] font-semibold text-slate-400">Total Registered</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-400">{activeUsersCount}</div>
            <div className="text-[11px] font-semibold text-slate-400">Active Accounts</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">{adminCount + managerCount}</div>
            <div className="text-[11px] font-semibold text-slate-400">Admins & Managers</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-cyan-400">{announcementsList.length}</div>
            <div className="text-[11px] font-semibold text-slate-400">Broadcasts Active</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, company, or designation..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(["All", "Admin", "Manager", "Staff"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  roleFilter === r
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(["All", "Active", "Disabled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === s
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Registered Team Members & Athletes</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredUsers.length} Users
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">No users matching search filters</p>
            <p className="text-xs text-slate-500">Try adjusting your query or reset the role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-5 py-3.5">User / Profile</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Company & Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.map((user) => {
                  const isActive = user.status === "Active";
                  const roleBadgeColor =
                    user.role === "Admin"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : user.role === "Manager"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";

                  return (
                    <tr key={user.uid} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Photo */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-indigo-300">
                                {user.displayName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="truncate">{user.displayName}</span>
                              {user.emailVerified && (
                                <span title="Email Verified">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">UID: {user.uid.substring(0, 12)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.mobileNumber && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{user.mobileNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Company & Role */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleBadgeColor}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {user.designation || user.department || "Fitness Athlete"}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
                          {user.status || "Active"}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-4 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never logged in"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserDetail(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="View Full Profile & Audits"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAdminResetPassword(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Send Password Reset Link"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isActive
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            }`}
                            title={isActive ? "Disable Account" : "Enable Account"}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Announcements Feed */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Active Cloud Broadcasts & Notifications</h3>
          </div>
          <button
            onClick={() => setIsAnnouncementOpen(true)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            + New Announcement
          </button>
        </div>

        {announcementsList.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No system-wide announcements currently posted. Click "Send Announcement" to broadcast to all devices.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcementsList.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-white text-xs">{ann.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ann.priority === "Urgent"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    }`}
                  >
                    {ann.targetRole} • {ann.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{ann.message}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>By: {ann.createdByName}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-indigo-400">{selectedUser.displayName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedUser.displayName}
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {selectedUser.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-4">
              <button
                onClick={() => setActiveDetailTab("profile")}
                className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeDetailTab === "profile"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Account Overview
              </button>
              <button
                onClick={() => setActiveDetailTab("history")}
                className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeDetailTab === "history"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                Device & Login History ({userLoginHistory.length})
              </button>
              <button
                onClick={() => setActiveDetailTab("audit")}
                className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeDetailTab === "audit"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Audit Trail ({userAuditLogs.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeDetailTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">User ID (Firebase UID)</span>
                      <p className="font-mono text-indigo-300 font-bold break-all">{selectedUser.uid}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Account Status</span>
                      <p className="font-bold text-white flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedUser.status === "Active" ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {selectedUser.status}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Company / Organization</span>
                      <p className="font-bold text-white">{selectedUser.companyName || "FitPulse Athletic Pro"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Designation / Role</span>
                      <p className="font-bold text-white">{selectedUser.designation || selectedUser.department || "Fitness Coach"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Mobile Number</span>
                      <p className="font-bold text-white">{selectedUser.mobileNumber || "Not configured"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Created Date</span>
                      <p className="font-bold text-white">
                        {new Date(selectedUser.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Role Modification Control */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                    <span className="text-xs font-bold text-indigo-300">Modify Role & Permissions:</span>
                    <div className="flex items-center gap-2">
                      {(["Admin", "Manager", "Staff"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleChangeUserRole(selectedUser, r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            selectedUser.role === r
                              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "history" && (
                <div className="space-y-3">
                  {userLoginHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No device login sessions recorded yet for this user.
                    </div>
                  ) : (
                    userLoginHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white">{item.device} ({item.os || "OS"})</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.browser} • IP: {item.ipAddress || "Cloud Node"} • {item.method}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <div>{new Date(item.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                          <div>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailTab === "audit" && (
                <div className="space-y-3">
                  {userAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No audited actions logged for this user.
                    </div>
                  ) : (
                    userAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300">
                            [{log.module}] {log.action}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300">{log.description}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => handleAdminResetPassword(selectedUser)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Reset Password Link
              </button>

              <button
                onClick={() => handleToggleUserStatus(selectedUser)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedUser.status === "Active"
                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                    : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                }`}
              >
                {selectedUser.status === "Active" ? "Deactivate Account" : "Activate Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SEND BROADCAST ANNOUNCEMENT MODAL */}
      {isAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Broadcast Cloud Announcement</h3>
              </div>
              <button
                onClick={() => setIsAnnouncementOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Schedule Update or Maintenance Notice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Target Cohort</label>
                  <select
                    value={announcementTarget}
                    onChange={(e) => setAnnouncementTarget(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="All">All Users & Athletes</option>
                    <option value="Admin">Admins Only</option>
                    <option value="Manager">Managers & Coaches</option>
                    <option value="Staff">Staff & Trainers</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Priority Level</label>
                  <select
                    value={announcementPriority}
                    onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent / Alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Message Content</label>
                <textarea
                  required
                  rows={4}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Type the message to be synchronized to all active user screens..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingAnnouncement}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingAnnouncement ? "Broadcasting..." : "Dispatch Announcement"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
