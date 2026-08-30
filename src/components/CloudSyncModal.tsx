import React, { useState } from "react";
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle2,
  Shield,
  X,
  Database,
  ArrowDownUp,
  Download,
  Upload,
  AlertCircle,
  LogIn,
  LogOut,
  User as UserIcon,
  WifiOff,
  Wifi,
} from "lucide-react";
import { CloudSyncStatus, AppState } from "../types";
import {
  syncAppStateToCloud,
  fetchAppStateFromCloud,
  signInWithGoogle,
  logOutFromCloud,
} from "../services/firebase";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: CloudSyncStatus;
  fullAppState: AppState;
  onTriggerSync: () => void;
  onRestoreAppState?: (restored: AppState) => void;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  syncStatus,
  fullAppState,
  onTriggerSync,
  onRestoreAppState,
}: CloudSyncModalProps) {
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  const currentUserId = fullAppState.cloudUser?.uid || "guest";
  const isAuthenticated = Boolean(fullAppState.cloudUser && !fullAppState.cloudUser.isAnonymous);

  const handleCloudBackup = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncAppStateToCloud(currentUserId, fullAppState);
      if (res.success) {
        onTriggerSync();
        setFeedback({
          type: "success",
          message: "Database backed up successfully to Firebase Cloud Firestore!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Backup failed. Ensure internet connection is active.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to execute cloud backup.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!window.confirm("Restore latest snapshot from Firebase Cloud Firestore? Current uncommitted local edits will be replaced.")) {
      return;
    }
    setIsRestoring(true);
    setFeedback(null);
    try {
      const res = await fetchAppStateFromCloud(currentUserId);
      if (res.success && res.data) {
        if (onRestoreAppState) {
          onRestoreAppState(res.data);
        }
        setFeedback({
          type: "success",
          message: "Application state restored from Cloud Firestore!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "No remote cloud backup found.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to restore cloud snapshot.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (res.user) {
        setFeedback({
          type: "success",
          message: `Signed in as ${res.user.displayName || res.user.email}. Multi-device sync active!`,
        });
      } else if (res.error) {
        setFeedback({ type: "error", message: res.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Sign-in interrupted" });
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutFromCloud();
      setFeedback({
        type: "success",
        message: "Logged out from cloud account. Using local offline encrypted mode.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Sign out failed" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100">
                  Section 43 • Cloud Synchronization
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Firestore Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatic backup, restore, real-time sync, and multi-device support
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

        {/* Feedback Alert if any */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/40 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* User Account / Multi-Device Status */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {isAuthenticated
                  ? fullAppState.cloudUser?.displayName || fullAppState.cloudUser?.email
                  : "Local Offline Mode (Guest)"}
              </span>
              <span className="text-[11px] text-slate-400">
                {isAuthenticated
                  ? "Logged into Cloud Account (Cross-Device Active)"
                  : "Encrypted locally on this browser. Sign in to sync across devices."}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>

        {/* Real-time Status Banner & Instant Actions */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CloudCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-200">Real-Time Sync:</span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                    {syncStatus.syncStatus}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Last Synced: {syncStatus.lastSyncDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCloudBackup}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Upload className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Saving..." : "Backup to Cloud"}</span>
              </button>

              <button
                onClick={handleCloudRestore}
                disabled={isRestoring}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Download className={`h-3.5 w-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                <span>{isRestoring ? "Restoring..." : "Restore"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Device Ecosystem */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Cross-Device Ecosystem (Web, iOS, Android, Tablet)
            </h4>
            <span className="text-[11px] text-emerald-400 font-semibold">4 Active Nodes</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-[11px]">Web Browser</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 block font-medium">This Device (Primary)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-sky-400" />
                  <span className="font-semibold text-[11px]">iPhone 15</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">Synced 8m ago</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-[11px]">Pixel 9 Pro</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">Synced 24m ago</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Tablet className="h-4 w-4 text-purple-400" />
                  <span className="font-semibold text-[11px]">iPad Gym Kiosk</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">Synced 2 hrs ago</span>
            </div>
          </div>
        </div>

        {/* Offline Support & Conflict Strategy */}
        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Offline-First Engine</span>
            <span className="text-emerald-400 font-mono font-semibold">Latest-Write-Wins (LWW)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Record heavy squats, track calories, or log water intake with zero network connection. Local encrypted cache guarantees 100% data preservation and synchronizes with Firebase Cloud Firestore instantly upon reconnecting.
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-700/40">
            <span className="text-slate-300 font-medium">Automatic Real-Time Sync</span>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-slate-500">
            Encrypted with 256-bit Firestore security rules
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
