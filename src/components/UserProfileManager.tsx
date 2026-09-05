import { useState, useRef } from "react";
import {
  X,
  Camera,
  User,
  Phone,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
  LogOut,
  Copy,
  Check,
  Calendar,
  KeyRound,
  Edit3,
  ArrowLeftRight,
  Shield,
} from "lucide-react";
import { AppState, UserProfile } from "../types";
import { updateUserProfileAndSync } from "../services/firebaseCloudSync";
import { uploadAssetToCloudStorage, compressImageFile } from "../services/firebaseStorage";
import { auth } from "../services/firebase";

interface UserProfileManagerProps {
  state: AppState;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
  onSwitchAccount?: () => void;
  onNotify: (title: string, message: string, type?: "success" | "info" | "warning" | "error") => void;
  lang?: "en" | "mr";
}

export function UserProfileManager({
  state,
  onUpdateProfile,
  onClose,
  onLogout,
  onSwitchAccount,
  onNotify,
  lang = "en",
}: UserProfileManagerProps) {
  const account = state.currentUserAccount;
  const firebaseUser = auth?.currentUser;
  const uid = firebaseUser?.uid || account?.uid || state.cloudUser?.uid || "usr-athlete-01";

  // Account creation date calculation (from Firebase metadata or account record)
  const rawCreationDate =
    firebaseUser?.metadata?.creationTime ||
    account?.createdAt ||
    "2026-01-15T08:00:00.000Z";

  let formattedCreationDate = "Recently";
  try {
    const d = new Date(rawCreationDate);
    if (!isNaN(d.getTime())) {
      formattedCreationDate = d.toLocaleDateString(lang === "mr" ? "mr-IN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  } catch {}

  const [isEditing, setIsEditing] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(
    account?.displayName || state.profile.fullName || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    account?.mobileNumber || state.profile.mobileNumber || ""
  );
  const [photoUrl, setPhotoUrl] = useState(
    account?.photoURL ||
      state.profile.photoUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyUid = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  // Handle Photo Selection & Firebase Storage Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      // 1. Compress image to conserve mobile bandwidth
      const { dataUrl, blob } = await compressImageFile(file, 800, 800, 0.85);

      // 2. Upload to Firebase Storage under user profile folder
      const { url } = await uploadAssetToCloudStorage("profile", blob, `avatar_${Date.now()}.jpg`, uid);
      const effectiveUrl = url || dataUrl;

      setPhotoUrl(effectiveUrl);

      // Update in local state and Firestore
      const updated: UserProfile = {
        ...state.profile,
        photoUrl: effectiveUrl,
      };
      onUpdateProfile(updated);

      await updateUserProfileAndSync(uid, { photoUrl: effectiveUrl });
      onNotify("Photo Updated", "Profile picture uploaded and synced to Firebase Cloud!", "success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to upload profile picture.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Profile Update Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Full name cannot be empty.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfileAndSync(uid, {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        photoUrl,
        newPassword: newPassword || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update profile.");
        return;
      }

      const updatedProfile: UserProfile = {
        ...state.profile,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        photoUrl,
      };

      onUpdateProfile(updatedProfile);
      setSuccessMsg(
        lang === "mr"
          ? "प्रोफाइल क्लाउडमध्ये यशस्वीरीत्या अपडेट झाली!"
          : "Profile updated and instantly synced to Cloud Firestore!"
      );
      setNewPassword("");
      setConfirmPassword("");
      setIsEditing(false);
      onNotify("Profile Synced", "All profile changes saved to Cloud Firestore.", "success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {lang === "mr" ? "माझे प्रोफाइल पान (Profile)" : "User Profile & Account"}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "mr" ? "फायरबेस ऑथेंटिकेशन व क्लाउड माहिती" : "Firebase Authentication & Account Details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Identity Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            {/* Profile Photo with Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-800 shadow-lg">
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition rounded-2xl cursor-pointer"
                title="Change Photo / नवीन फोटो अपलोड करा"
              >
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold mt-1">
                  {uploadingPhoto ? "..." : "Upload"}
                </span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Main Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                  {fullName || "FitPulse Athlete"}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  {account?.role || "Active Member"}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 truncate">
                {account?.email || state.profile.email || "athlete@fitpulse.app"}
              </p>

              {/* Edit Profile Toggle Button (Requirement 4) */}
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isEditing
                      ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? (lang === "mr" ? "संपादन रद्द करा" : "Cancel Edit") : (lang === "mr" ? "प्रोफाइल संपादित करा (Edit Profile)" : "Edit Profile")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingPhoto ? "Uploading..." : lang === "mr" ? "फोटो बदला" : "Change Photo"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Requirement 3: Detailed Profile Fields Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === "mr" ? "पूर्ण नाव (Full Name)" : "Full Name"}</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {fullName || "—"}
              </p>
            </div>

            {/* Email Address */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{lang === "mr" ? "ईमेल पत्ता (Email Address)" : "Email Address"}</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {account?.email || state.profile.email || "—"}
              </p>
            </div>

            {/* Mobile Number */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === "mr" ? "मोबाईल नंबर (Mobile Number)" : "Mobile Number"}</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {mobileNumber || state.profile.mobileNumber || "Not specified"}
              </p>
            </div>

            {/* Account Creation Date */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === "mr" ? "खाते निर्मिती तारीख" : "Account Creation Date"}</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {formattedCreationDate}
              </p>
            </div>
          </div>

          {/* Firebase User UID (Requirement 3) */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === "mr" ? "फायरबेस युझर UID (Firebase UID)" : "Firebase User UID"}</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-emerald-400 truncate select-all">
                {uid}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyUid}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer shrink-0"
              title="Copy Firebase UID"
            >
              {copiedUid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Edit Profile Form (Shown when isEditing is true) */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                <span>{lang === "mr" ? "माहिती अपडेट करा" : "Update Profile Information"}</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "पूर्ण नाव (Full Name)" : "Full Name"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "मोबाइल नंबर (Mobile Number)" : "Mobile Number"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Password update (optional) */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "नवीन पासवर्ड (ऐच्छिक)" : "New Password (optional)"}
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword && (
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Actions: Switch Account & Prominent Logout (Requirements 5, 6, 9) */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 shrink-0 space-y-2.5">
          {/* Requirement 9: Switch Account */}
          {onSwitchAccount && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-bold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
              title="Sign out and open the Login screen to switch to another account"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
              <span>{lang === "mr" ? "दुसऱ्या खात्यात लॉगिन करा (Switch Account)" : "Switch Account"}</span>
            </button>
          )}

          {/* Requirement 5 & 6: Prominent Logout Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer active:scale-[0.99]"
            title="Log out of Firebase Authentication and redirect to Login Screen"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>{lang === "mr" ? "लॉगआउट करा (Sign Out / Logout)" : "Logout of Account"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
