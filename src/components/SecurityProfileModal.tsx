import React, { useState } from "react";
import { X, User, Shield, Cloud, Download, Upload, Check, Smartphone, HeartPulse, Lock, Fingerprint, RefreshCw, Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { UserProfile, SecuritySettings, CloudSyncState, FitnessGoal, ActivityLevel, Gender } from "../types";
import { exportAppStateJSON } from "../services/storageService";
import { AppState } from "../types";

interface SecurityProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  security: SecuritySettings;
  sync: CloudSyncState;
  fullAppState: AppState;
  notificationsEnabled?: boolean;
  onToggleNotificationsEnabled?: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onUpdateSecurity: (updated: SecuritySettings) => void;
  onUpdateSync: (updated: CloudSyncState) => void;
  onRestoreAppState: (state: AppState) => void;
}

export function SecurityProfileModal({
  isOpen,
  onClose,
  profile,
  security,
  sync,
  fullAppState,
  notificationsEnabled = false,
  onToggleNotificationsEnabled,
  onUpdateProfile,
  onUpdateSecurity,
  onUpdateSync,
  onRestoreAppState,
}: SecurityProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "cloud" | "notifications">("profile");
  const [formProfile, setFormProfile] = useState<UserProfile>({ ...profile });
  const [pinCode, setPinCode] = useState(security.pinCode || "1234");
  const [pinEnabled, setPinEnabled] = useState(security.pinEnabled);
  const [biometricEnabled, setBiometricEnabled] = useState(security.biometricEnabled);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveSecurity = () => {
    onUpdateSecurity({
      ...security,
      pinCode,
      pinEnabled,
      biometricEnabled,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onUpdateSync({
        ...sync,
        lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        syncStatus: "synced",
      });
    }, 1200);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile) {
          onRestoreAppState(parsed);
          alert("Database successfully restored from backup!");
          onClose();
        } else {
          alert("Invalid backup format.");
        }
      } catch (err) {
        alert("Failed to parse backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 text-slate-100 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-xl lg:max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-800 shrink-0">
              <img
                src={formProfile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">{formProfile.fullName}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{formProfile.email} • {formProfile.fitnessGoal}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 pt-2 gap-2 sm:gap-4 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Profile & Health
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "security"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Security & PIN
          </button>
          <button
            onClick={() => setActiveTab("cloud")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "cloud"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Cloud Backup
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-rose-400" />
            )}
            Notifications
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                notificationsEnabled
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {notificationsEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Settings updated and saved to encrypted local storage!
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={formProfile.fullName}
                    onChange={(e) => setFormProfile({ ...formProfile, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={formProfile.email}
                    onChange={(e) => setFormProfile({ ...formProfile, email: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Mobile Number</label>
                  <input
                    type="text"
                    value={formProfile.mobileNumber}
                    onChange={(e) => setFormProfile({ ...formProfile, mobileNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    value={formProfile.dateOfBirth}
                    onChange={(e) => setFormProfile({ ...formProfile, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Gender</label>
                  <select
                    value={formProfile.gender}
                    onChange={(e) => setFormProfile({ ...formProfile, gender: e.target.value as Gender })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Blood Group</label>
                  <input
                    type="text"
                    value={formProfile.bloodGroup}
                    onChange={(e) => setFormProfile({ ...formProfile, bloodGroup: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. O+, A+, B+"
                  />
                </div>
              </div>

              {/* Physical Stats & Goals */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Physical Metrics & Goals</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">Height (cm)</label>
                    <input
                      type="number"
                      value={formProfile.heightCm}
                      onChange={(e) => setFormProfile({ ...formProfile, heightCm: parseFloat(e.target.value) || 170 })}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">Current Wt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formProfile.currentWeightKg}
                      onChange={(e) => setFormProfile({ ...formProfile, currentWeightKg: parseFloat(e.target.value) || 70 })}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">Goal Wt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formProfile.goalWeightKg}
                      onChange={(e) => setFormProfile({ ...formProfile, goalWeightKg: parseFloat(e.target.value) || 70, targetWeightKg: parseFloat(e.target.value) || 70 })}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-slate-100 text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">Activity Level</label>
                    <select
                      value={formProfile.activityLevel}
                      onChange={(e) => setFormProfile({ ...formProfile, activityLevel: e.target.value as ActivityLevel })}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100 text-xs focus:border-emerald-500"
                    >
                      <option value="Sedentary">Sedentary (Desk)</option>
                      <option value="Lightly Active">Light (1-2 days)</option>
                      <option value="Moderately Active">Moderate (3-5 days)</option>
                      <option value="Very Active">Very Active (6-7 days)</option>
                      <option value="Extra Active">Extra (Athlete 2x/day)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-medium text-slate-400">Primary Fitness Goal</label>
                  <select
                    value={formProfile.fitnessGoal}
                    onChange={(e) => setFormProfile({ ...formProfile, fitnessGoal: e.target.value as FitnessGoal })}
                    className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 font-semibold"
                  >
                    <option value="Weight Loss">Weight Loss (Caloric Deficit & Fat Burn)</option>
                    <option value="Muscle Gain">Muscle Gain (Hypertrophy & Lean Surplus)</option>
                    <option value="Weight Gain">Weight Gain (Caloric Surplus)</option>
                    <option value="Body Recomposition">Body Recomposition (High Protein Fat Loss + Muscle)</option>
                    <option value="Maintenance">Maintenance (Energy Balance)</option>
                  </select>
                </div>
              </div>

              {/* Medical & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">Medical Conditions / Injuries</label>
                  <input
                    type="text"
                    value={formProfile.medicalConditions}
                    onChange={(e) => setFormProfile({ ...formProfile, medicalConditions: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500"
                    placeholder="e.g. Lower back stiffness, asthma"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Allergies / Dietary Restrictions</label>
                  <input
                    type="text"
                    value={formProfile.allergies}
                    onChange={(e) => setFormProfile({ ...formProfile, allergies: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500"
                    placeholder="e.g. Dairy intolerance, peanuts"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                  Emergency Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Name (e.g. Sarah)"
                    value={formProfile.emergencyContact.name}
                    onChange={(e) =>
                      setFormProfile({
                        ...formProfile,
                        emergencyContact: { ...formProfile.emergencyContact, name: e.target.value },
                      })
                    }
                    className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse)"
                    value={formProfile.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormProfile({
                        ...formProfile,
                        emergencyContact: { ...formProfile.emergencyContact, relationship: e.target.value },
                      })
                    }
                    className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={formProfile.emergencyContact.phone}
                    onChange={(e) =>
                      setFormProfile({
                        ...formProfile,
                        emergencyContact: { ...formProfile.emergencyContact, phone: e.target.value },
                      })
                    }
                    className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-400">Personal Fitness Notes</label>
                <textarea
                  rows={2}
                  value={formProfile.notes}
                  onChange={(e) => setFormProfile({ ...formProfile, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 text-xs focus:border-emerald-500"
                  placeholder="Goals, training philosophy, coach notes..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">4-Digit PIN Protection</h4>
                      <p className="text-[11px] text-slate-400">Prompt for PIN when opening app or after lock.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pinEnabled}
                    onChange={(e) => setPinEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>

                {pinEnabled && (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center gap-3">
                    <label className="text-xs text-slate-300">Set 4-Digit PIN:</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-24 rounded-lg bg-slate-900 border border-slate-600 px-3 py-1.5 text-center text-sm tracking-widest text-slate-100 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100">Biometrics & Face Unlock</h4>
                    <p className="text-[11px] text-slate-400">Fast authentication via TouchID / Face recognition.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={(e) => setBiometricEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">Enterprise Encrypted Storage:</p>
                <p>All your health metrics, workouts, food logs, and progress photos are stored with client-side isolation and offline resilience.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSecurity}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Apply Security Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === "cloud" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="h-5 w-5 text-sky-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">Cloud Sync & Multi-Device State</h4>
                      <p className="text-[11px] text-slate-400">Status: <span className="text-emerald-400 font-medium">{sync.syncStatus === "synced" ? "Online & Synchronized" : "Offline Mode"}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Last synced: {sync.lastSyncDate}</span>
                  <span className="text-slate-300">Auth: Google / Verified Session</span>
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="text-xs font-semibold text-slate-200">Database Backup & Recovery</h4>
                <p className="text-xs text-slate-400">
                  Export your full fitness ecosystem (all workout sets, food logs, measurements, progress photos, coach plans) to an encrypted JSON file, or restore on any new phone, tablet, or laptop.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => exportAppStateJSON(fullAppState)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Export Full Backup (JSON)
                  </button>
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer">
                    <Upload className="h-4 w-4 text-sky-400" />
                    Restore Backup File
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              {/* Notification Master Status Card */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  notificationsEnabled
                    ? "bg-slate-800/60 border-emerald-500/30"
                    : "bg-slate-800/60 border-rose-500/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-xl ${
                        notificationsEnabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {notificationsEnabled ? (
                        <Volume2 className="h-6 w-6" />
                      ) : (
                        <VolumeX className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">
                          {notificationsEnabled
                            ? "Notifications & Alerts: Active"
                            : "Notifications & Alerts: OFF (Muted)"}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            notificationsEnabled
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {notificationsEnabled ? "ACTIVE" : "MUTED"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {notificationsEnabled
                          ? "Real-time toast notifications, workout feedback, hydration prompts, and alert popups are active."
                          : "All floating toast alerts, system notifications, and sound badges are currently silenced and turned OFF."}
                      </p>
                    </div>
                  </div>

                  {onToggleNotificationsEnabled && (
                    <button
                      type="button"
                      onClick={onToggleNotificationsEnabled}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg ${
                        notificationsEnabled
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                      }`}
                    >
                      {notificationsEnabled ? (
                        <>
                          <BellOff className="h-4 w-4 text-rose-400" />
                          <span>Turn Notifications OFF</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 text-slate-950" />
                          <span>Turn Notifications ON</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Status checklist */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2 text-xs">
                <h5 className="font-semibold text-slate-300">Notification Channels:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        notificationsEnabled ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>Real-time floating toasts: {notificationsEnabled ? "Enabled" : "Off"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        notificationsEnabled ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>Audit & System alerts: {notificationsEnabled ? "Enabled" : "Off"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        notificationsEnabled ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>Workout & PR badges: {notificationsEnabled ? "Enabled" : "Off"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        notificationsEnabled ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>Sound alerts: {notificationsEnabled ? "Enabled" : "Off"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
