import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Database,
  Shield,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Save,
  Check,
} from "lucide-react";
import { AppSettings, AppState } from "../types";
import {
  saveSettingsToCloud,
  syncOfflineCacheToCloud,
  auth,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface SettingsModuleViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const SettingsModuleView: React.FC<SettingsModuleViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    return {
      darkMode: state.darkMode ?? true,
      theme: state.settings?.theme || (state.darkMode ? "dark" : "light"),
      language: state.settings?.language || "en",
      notificationsEnabled: state.settings?.notificationsEnabled ?? true,
      notifications: {
        workoutReminders: state.settings?.notifications?.workoutReminders ?? true,
        mealAlerts: state.settings?.notifications?.mealAlerts ?? true,
        waterReminders: state.settings?.notifications?.waterReminders ?? true,
        inventoryWarnings: state.settings?.notifications?.inventoryWarnings ?? true,
        weeklySummary: state.settings?.notifications?.weeklySummary ?? true,
      },
      lastSyncTimestamp: state.settings?.lastSyncTimestamp || new Date().toISOString(),
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreDataPayload, setRestoreDataPayload] = useState<any>(null);

  const handleToggleTheme = (theme: "dark" | "light") => {
    const updated: AppSettings = {
      ...settings,
      theme,
      darkMode: theme === "dark",
    };
    setSettings(updated);
    onUpdateState((prev) => ({
      ...prev,
      darkMode: theme === "dark",
      settings: updated,
      appSettings: updated,
    }));
    saveSettingsToCloud(updated);
    onNotify("Theme Updated", `Switched to ${theme} mode`, "info");
  };

  const handleChangeLanguage = (lang: "en" | "hi" | "mr") => {
    const updated: AppSettings = { ...settings, language: lang };
    setSettings(updated);
    onUpdateState((prev) => ({ ...prev, settings: updated, appSettings: updated }));
    saveSettingsToCloud(updated);
    const langNames = { en: "English", hi: "हिंदी (Hindi)", mr: "मराठी (Marathi)" };
    onNotify("Language Changed", `Interface set to ${langNames[lang]}`, "success");
  };

  const handleToggleNotification = (key: "workoutReminders" | "mealAlerts" | "waterReminders" | "inventoryWarnings" | "weeklySummary") => {
    const currentNotifs = settings.notifications || {
      workoutReminders: true,
      mealAlerts: true,
      waterReminders: true,
      inventoryWarnings: true,
      weeklySummary: true,
    };
    const updated: AppSettings = {
      ...settings,
      notifications: {
        ...currentNotifs,
        [key]: !currentNotifs[key],
      },
    };
    setSettings(updated);
    onUpdateState((prev) => ({ ...prev, settings: updated, appSettings: updated }));
    saveSettingsToCloud(updated);
  };

  // Manual Firebase Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineCacheToCloud();
      const updated = { ...settings, lastSyncTimestamp: new Date().toISOString() };
      setSettings(updated);
      onUpdateState((prev) => ({ ...prev, settings: updated, appSettings: updated }));
      saveSettingsToCloud(updated);
      onNotify("Firebase Sync Complete", "All local changes synchronized to cloud Firestore", "success");
    } catch (err: any) {
      onNotify("Sync Alert", err.message || "Failed to trigger sync", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  // Backup data: Download as JSON
  const handleBackupData = () => {
    const backupObj = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      user: auth?.currentUser?.email || state.profile.email,
      state: {
        profile: state.profile,
        products: state.products,
        customExercises: state.customExercises,
        calorieLogs: state.calorieLogs,
        workouts: state.workouts || state.workoutHistory,
        dailyNutrition: state.dailyNutrition,
        settings: settings,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gym_diet_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify("Backup Downloaded", "Complete database state exported to JSON file", "success");
  };

  // Restore data: Parse JSON file
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.state) {
          throw new Error("Invalid backup format");
        }
        setRestoreDataPayload(parsed.state);
        setRestoreConfirmOpen(true);
      } catch (err) {
        onNotify("Restore Error", "Failed to parse backup file. Must be a valid JSON file.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restoreDataPayload) return;
    setIsRestoring(true);

    onUpdateState((prev) => ({
      ...prev,
      ...restoreDataPayload,
    }));

    if (restoreDataPayload.settings) {
      setSettings(restoreDataPayload.settings);
    }

    setIsRestoring(false);
    setRestoreConfirmOpen(false);
    onNotify("Data Restored", "All database items successfully restored from backup", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Settings className="w-3 h-3 text-slate-400" />
              System Preferences
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Offline Persistence Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Settings & Data Control
          </h1>
          <p className="text-xs text-slate-400">
            Appearance, regional languages (English, Hindi, Marathi), notifications, and Firebase cloud synchronization.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing Firestore..." : "Sync Firebase Cloud"}
        </button>
      </div>

      {/* 1. Theme Selection */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Appearance & Theme</h3>
        </div>
        <p className="text-xs text-slate-400">Select your visual interface experience:</p>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            onClick={() => handleToggleTheme("dark")}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              settings.theme === "dark"
                ? "bg-blue-600/10 border-blue-500/50 text-blue-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="w-5 h-5 text-blue-400" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Dark Mode</div>
              <div className="text-[10px] text-slate-400">High contrast slate</div>
            </div>
          </button>

          <button
            onClick={() => handleToggleTheme("light")}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              settings.theme === "light"
                ? "bg-amber-500/10 border-amber-500/50 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Light Mode</div>
              <div className="text-[10px] text-slate-400">Daytime clarity</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Language / भाषा / भाषा निवड</h3>
        </div>
        <p className="text-xs text-slate-400">
          Choose your preferred regional language for instructions, alerts, and navigation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChangeLanguage("en")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              settings.language === "en"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs font-bold text-white flex items-center justify-between">
              English
              {settings.language === "en" && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Default International</div>
          </button>

          <button
            onClick={() => handleChangeLanguage("hi")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              settings.language === "hi"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs font-bold text-white flex items-center justify-between">
              हिंदी (Hindi)
              {settings.language === "hi" && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">व्यायाम व आहार योजना</div>
          </button>

          <button
            onClick={() => handleChangeLanguage("mr")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              settings.language === "mr"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs font-bold text-white flex items-center justify-between">
              मराठी (Marathi)
              {settings.language === "mr" && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">जिम आणि आहार नियोजन</div>
          </button>
        </div>
      </div>

      {/* 3. Notification Settings */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Notification & Alert Preferences</h3>
        </div>
        <p className="text-xs text-slate-400">Configure real-time in-app prompts and reminders:</p>

        <div className="divide-y divide-slate-800/80">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Workout & Rest Reminders</div>
              <div className="text-[10px] text-slate-400">Alerts when sets finish and rest countdowns end</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.workoutReminders ?? true}
              onChange={() => handleToggleNotification("workoutReminders")}
              className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Meal & Hydration Alerts</div>
              <div className="text-[10px] text-slate-400">Prompts for drinking water and scheduled 7 meals</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.mealAlerts ?? true}
              onChange={() => handleToggleNotification("mealAlerts")}
              className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Inventory Low Stock Warnings</div>
              <div className="text-[10px] text-slate-400">Notifications when supplements or gear fall below 10 units</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.inventoryWarnings ?? true}
              onChange={() => handleToggleNotification("inventoryWarnings")}
              className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Weekly PDF & Summary Reports</div>
              <div className="text-[10px] text-slate-400">Automated performance and body measurement summaries</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.weeklySummary ?? true}
              onChange={() => handleToggleNotification("weeklySummary")}
              className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Backup, Restore, and Cloud Sync */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Database Backup & Recovery</h3>
        </div>
        <p className="text-xs text-slate-400">
          Export your entire fitness ecosystem into a standalone JSON backup or restore from a previously saved file:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Backup */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Download className="w-4 h-4 text-blue-400" />
              Backup App Data
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Downloads all users, products, exercises, diet plans, and calorie logs in a portable JSON format.
            </p>
            <button
              onClick={handleBackupData}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON Backup
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Upload className="w-4 h-4 text-amber-400" />
              Restore App Data
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload a previously exported JSON backup to recover lost data or transfer across devices.
            </p>
            <label className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Select Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Restore */}
      <ConfirmationDialog
        isOpen={restoreConfirmOpen}
        title="Restore Database from Backup?"
        message="Restoring from a backup will overwrite your current in-memory collections with the data in the selected JSON file. Are you sure you wish to proceed?"
        confirmLabel="Yes, Restore Now"
        cancelLabel="Cancel"
        isDanger={false}
        isLoading={isRestoring}
        onConfirm={handleConfirmRestore}
        onClose={() => setRestoreConfirmOpen(false)}
      />
    </div>
  );
};
