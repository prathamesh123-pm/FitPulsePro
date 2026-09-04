import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserCheck,
  UserX,
  Package,
  Utensils,
  Dumbbell,
  Flame,
  FileText,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
  Mail,
  Calendar,
} from "lucide-react";
import { UserAccount, AppState, TabId } from "../types";
import {
  saveUserAccountToCloud,
  deleteUserAccount,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface AdminDashboardViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenDietPlanner: () => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  state,
  onUpdateState,
  onNavigateTab,
  onOpenDietPlanner,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // User management modal & action
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Manager" | "Staff">("Staff");

  // Delete user confirmation
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Accounts list
  const usersList: UserAccount[] = state.accounts || [];

  // Metrics calculations
  const totalUsers = usersList.length;
  const activeUsers = usersList.filter((u) => u.status === "Active").length;
  const inactiveUsers = usersList.filter((u) => u.status !== "Active").length;
  const totalProducts = state.products?.length || 0;
  const totalExercises = state.customExercises?.length || 7;
  const totalDietPlans = (state.dietPlans?.length || 0) + (state.savedDietPlans?.length || 0) + (state.generatedDietPlans?.length || 0);
  const totalCalorieLogs = state.calorieLogs?.length || 0;
  const totalReports = (state.workoutHistory?.length || 0) + (state.auditLogs?.length || 0);

  // Toggle user status (Enable / Disable)
  const handleToggleUserStatus = async (user: UserAccount) => {
    const updatedStatus: "Active" | "Disabled" = user.status === "Active" ? "Disabled" : "Active";
    const updatedUser: UserAccount = {
      ...user,
      status: updatedStatus,
    };

    onUpdateState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((u) => (u.uid === user.uid ? updatedUser : u)),
    }));

    const ok = await saveUserAccountToCloud(user.uid, updatedUser);
    if (ok) {
      onNotify(
        updatedStatus === "Active" ? "User Enabled" : "User Disabled",
        `${user.displayName} is now marked as ${updatedStatus}`,
        "info"
      );
    }
  };

  // Add new user account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      onNotify("Validation Error", "Name and Email are required", "error");
      return;
    }

    const uid = `usr-${Date.now()}`;
    const newUser: UserAccount = {
      uid,
      displayName: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      department: "Fitness",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: "Active",
    };

    onUpdateState((prev) => ({
      ...prev,
      accounts: [newUser, ...prev.accounts],
    }));

    setIsAddUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");

    const ok = await saveUserAccountToCloud(uid, newUser);
    if (ok) {
      onNotify("User Created", `${newUser.displayName} added to database`, "success");
    }
  };

  // Delete user confirmed
  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const targetUid = deletingUser.uid;

    onUpdateState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((u) => u.uid !== targetUid),
    }));

    const res = await deleteUserAccount(targetUid);
    setIsDeleting(false);
    setDeletingUser(null);

    if (res.success) {
      onNotify("User Deleted", "Account deleted from Firebase Firestore", "success");
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || u.status === statusFilter;
      const matchesRole =
        roleFilter === "All" || u.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [usersList, searchQuery, statusFilter, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400" />
              Executive Control Panel
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Firebase Firestore RBAC
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Admin Master Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            System overview, user provisioning, real-time metrics, quick shortcuts, and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* 8 Metric Cards Grid (Section 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Users */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Users</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white mt-1">{totalUsers}</div>
          <div className="text-[9px] text-slate-500">Registered</div>
        </div>

        {/* Active Users */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Active</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">{activeUsers}</div>
          <div className="text-[9px] text-emerald-500">Verified</div>
        </div>

        {/* Inactive Users */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Inactive</span>
            <UserX className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-1">{inactiveUsers}</div>
          <div className="text-[9px] text-rose-500">Disabled</div>
        </div>

        {/* Total Products */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Products</span>
            <Package className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{totalProducts}</div>
          <div className="text-[9px] text-slate-500">In Store</div>
        </div>

        {/* Total Diet Plans */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Diet Plans</span>
            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">{totalDietPlans}</div>
          <div className="text-[9px] text-slate-500">Generated</div>
        </div>

        {/* Total Exercises */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Exercises</span>
            <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 mt-1">{totalExercises}</div>
          <div className="text-[9px] text-slate-500">Database</div>
        </div>

        {/* Total Calories Logs */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Calories</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-1">{totalCalorieLogs}</div>
          <div className="text-[9px] text-slate-500">Logged Days</div>
        </div>

        {/* Total Reports */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Reports</span>
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 mt-1">{totalReports}</div>
          <div className="text-[9px] text-slate-500">Generated</div>
        </div>
      </div>

      {/* Quick Shortcuts (Section 7) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Action Shortcuts
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Add User</div>
            <div className="text-[10px] text-slate-400">Provision account</div>
          </button>

          <button
            onClick={() => onNavigateTab("products")}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Add Product</div>
            <div className="text-[10px] text-slate-400">Store inventory</div>
          </button>

          <button
            onClick={() => onNavigateTab("exercises")}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Add Exercise</div>
            <div className="text-[10px] text-slate-400">Sets, reps & videos</div>
          </button>

          <button
            onClick={onOpenDietPlanner}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Create Diet Plan</div>
            <div className="text-[10px] text-slate-400">7-meal schedule</div>
          </button>

          <button
            onClick={() => onNavigateTab("reports")}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">View Reports</div>
            <div className="text-[10px] text-slate-400">PDF, Excel & Print</div>
          </button>
        </div>
      </div>

      {/* User Management Panel (Section 1) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              User Management Panel ({filteredUsers.length} Users)
            </h3>
            <p className="text-[11px] text-slate-400">
              View, filter, enable/disable status, and manage role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="All" className="bg-slate-900">All Status</option>
                <option value="Active" className="bg-slate-900">Active</option>
                <option value="Inactive" className="bg-slate-900">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="py-2.5 px-3">User Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{user.email}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Just now"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {user.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                          user.status === "Active"
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                        }`}
                        title={user.status === "Active" ? "Disable User" : "Enable User"}
                      >
                        {user.status === "Active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Log (Section 7) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Activity Log
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Real-time Stream</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
          {state.auditLogs && state.auditLogs.length > 0 ? (
            state.auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white font-semibold">{log.action}</span>
                  <span className="text-slate-400 text-[11px]">— {log.description || (typeof log.details === "string" ? log.details : "System record updated")}</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-slate-500">
              No recent administrative actions recorded.
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white">Provision New User Account</h3>
                <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Staff">Staff / Member</option>
                    <option value="Manager">Trainer / Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation before Delete User */}
      <ConfirmationDialog
        isOpen={Boolean(deletingUser)}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete user "${deletingUser?.displayName}" (${deletingUser?.email}) from the system?`}
        confirmLabel="Yes, Delete Account"
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteUserConfirm}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
};
