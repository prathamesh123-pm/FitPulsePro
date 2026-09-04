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
  Cloud,
  LogOut,
} from "lucide-react";
import { AppState, UserProfile } from "../types";
import { updateUserProfileAndSync } from "../services/firebaseCloudSync";
import { uploadAssetToCloudStorage, compressImageFile } from "../services/firebaseStorage";

interface UserProfileManagerProps {
  state: AppState;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
  onNotify: (title: string, message: string, type?: "success" | "info" | "warning" | "error") => void;
  lang?: "en" | "mr";
}

export function UserProfileManager({
  state,
  onUpdateProfile,
  onClose,
  onLogout,
  onNotify,
  lang = "en",
}: UserProfileManagerProps) {
  const uid = state.currentUserAccount?.uid || state.cloudUser?.uid || "user_local";

  const [fullName, setFullName] = useState(
    state.currentUserAccount?.displayName || state.profile.fullName || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    state.currentUserAccount?.mobileNumber || state.profile.mobileNumber || ""
  );
  const [photoUrl, setPhotoUrl] = useState(
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

  // Handle Photo Selection & Cloud Storage Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      // 1. Compress image to save bandwidth
      const { dataUrl, blob } = await compressImageFile(file, 800, 800, 0.85);

      // 2. Upload to Firebase Storage
      const { url } = await uploadAssetToCloudStorage("profile", blob, `avatar_${Date.now()}.jpg`, uid);
      const effectiveUrl = url || dataUrl;

      setPhotoUrl(effectiveUrl);

      // Update in state and Firebase instantly
      const updated: UserProfile = {
        ...state.profile,
        photoUrl: effectiveUrl,
      };
      onUpdateProfile(updated);

      await updateUserProfileAndSync(uid, { photoUrl: effectiveUrl });
      onNotify("Photo Updated", "Profile picture uploaded and synced to cloud!", "success");
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
          : "Profile updated and instantly synced to Firebase Cloud!"
      );
      setNewPassword("");
      setConfirmPassword("");
      onNotify("Profile Synced", "All profile changes saved to Cloud Firestore.", "success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              {lang === "mr" ? "माझी प्रोफाइल व्यवस्थापन" : "Profile & Account Management"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-800 shadow-lg">
                <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition rounded-2xl cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold mt-1">Upload</span>
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-100">Profile Photo</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload a JPEG/PNG photo. Stored securely in Firebase Storage.
              </p>
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingPhoto ? "Uploading to Cloud..." : "Choose New Photo"}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
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

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email ID (Readonly)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={state.currentUserAccount?.email || state.profile.email || ""}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === "mr" ? "पासवर्ड बदला (Change Password)" : "Change Password"}</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={lang === "mr" ? "नवीन पासवर्ड (ऐच्छिक)" : "New Password (leave blank to keep current)"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {newPassword && (
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "mr" ? "लॉगआउट करा" : "Logout of Account"}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === "mr" ? "प्रोफाइल अपडेट करा" : "Update Profile & Sync"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
