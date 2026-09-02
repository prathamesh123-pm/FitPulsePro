import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  Layers,
  VolumeX,
  Volume2,
} from "lucide-react";
import { AppNotification } from "../types";

interface ToastNotificationProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  notificationsEnabled?: boolean;
}

export const ToastNotificationContainer: React.FC<ToastNotificationProps> = ({
  notifications,
  onDismiss,
  notificationsEnabled = true,
}) => {
  // If notifications are turned off by user, do not render floating toast popups
  if (!notificationsEnabled) return null;

  // Show last 3 unread toast notifications floating at top-right
  const activeToasts = notifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {activeToasts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${
              item.type === "success"
                ? "bg-slate-900/95 border-emerald-500/50 text-emerald-300"
                : item.type === "error"
                ? "bg-slate-900/95 border-rose-500/50 text-rose-300"
                : item.type === "warning"
                ? "bg-slate-900/95 border-amber-500/50 text-amber-300"
                : "bg-slate-900/95 border-blue-500/50 text-blue-300"
            }`}
          >
            <div className="pt-0.5">
              {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {item.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {item.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {item.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-bold text-white tracking-wide">{item.title}</h4>
              <p className="text-[11px] text-slate-300 leading-snug">{item.message}</p>
              <span className="text-[9px] text-slate-500 block pt-0.5">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <button
              onClick={() => onDismiss(item.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onDismiss: (id: string) => void;
  notificationsEnabled?: boolean;
  onToggleNotificationsEnabled?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onDismiss,
  notificationsEnabled = false,
  onToggleNotificationsEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-emerald-400" />
            ) : (
              <BellOff className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Enterprise Activity Alerts
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    notificationsEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {notificationsEnabled ? "ON" : "OFF"}
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-rose-400 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master ON/OFF Banner */}
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                notificationsEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {notificationsEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                {notificationsEnabled ? "Notifications are Active" : "Notifications are OFF"}
              </p>
              <p className="text-[11px] text-slate-400">
                {notificationsEnabled
                  ? "Real-time toast alerts and popups enabled"
                  : "Toast popups & alert banners are silenced"}
              </p>
            </div>
          </div>

          {onToggleNotificationsEnabled && (
            <button
              type="button"
              onClick={onToggleNotificationsEnabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                notificationsEnabled
                  ? "bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {notificationsEnabled ? (
                <>
                  <BellOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Turn OFF</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5 text-slate-950" />
                  <span>Turn ON</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-1">
              <BellOff className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No active notifications</p>
              <p className="text-[11px] text-slate-600">
                {!notificationsEnabled
                  ? "Notifications are muted. You won't receive popup interruptions."
                  : "Activity alerts and reminders will appear here when logged."}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 hover:border-slate-600 transition-all"
              >
                <div className="pt-0.5">
                  {n.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {n.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  {n.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {n.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{n.title}</h5>
                    <span className="text-[9px] text-slate-500">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{n.message}</p>
                </div>
                <button
                  onClick={() => onDismiss(n.id)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
