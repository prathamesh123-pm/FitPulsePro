import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Shield,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  LogIn,
  LogOut,
  History,
  KeyRound,
  Sparkles,
  Layers,
  Award,
  RefreshCw,
  Server,
  Cloud,
  Check,
  Building2,
  Briefcase,
  MapPin,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
  Laptop,
} from "lucide-react";
import { AppState, UserAccount, UserRole, LoginHistoryRecord } from "../types";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logOutFromCloud,
  saveLoginHistoryToCloud,
  saveAuditLogToCloud,
  fetchAppStateFromCloud,
  sendPasswordResetLink,
  changeUserPassword,
  changeUserEmail,
  sendUserEmailVerification,
  deleteUserAccountAndCloudData,
  saveUserAccountToCloud,
} from "../services/firebase";
import { getDeviceInfo, getClientIpAddress, createAuditEntry } from "../utils/auditLogger";
import { createInitialUserState, loadAppState } from "../services/storageService";

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onNotify,
}) => {
  const currentUser = state.currentUserAccount;
  const isLoggedIn = !!currentUser;

  // Active Tab
  const [authTab, setAuthTab] = useState<
    "login" | "signup" | "forgot" | "profile" | "security" | "history" | "otp"
  >(isLoggedIn ? "profile" : "login");

  // Form Fields - Login / SignUp
  const [email, setEmail] = useState(currentUser?.email || "alex.miller@fitpulse.app");
  const [password, setPassword] = useState("Password@123");
  const [confirmPassword, setConfirmPassword] = useState("Password@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Profile Specific Fields
  const [fullName, setFullName] = useState(currentUser?.displayName || "Alex Miller");
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || "+91 98765 43210");
  const [companyName, setCompanyName] = useState(currentUser?.companyName || "FitPulse Athletic Pro");
  const [designation, setDesignation] = useState(currentUser?.designation || "Head Master Trainer");
  const [address, setAddress] = useState(currentUser?.address || "Kalyani Nagar, Pune, Maharashtra");
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || "Admin");
  const [department, setDepartment] = useState(currentUser?.department || "Executive Performance");
  const [photoURL, setPhotoURL] = useState<string>(currentUser?.photoURL || AVATAR_PRESETS[0]);

  // Forgot Password / Security Updates
  const [forgotEmail, setForgotEmail] = useState(currentUser?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // OTP Login Simulation
  const [otpPhone, setOtpPhone] = useState("+91 98765 43210");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Delete Account Confirmation
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Async States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { device, browser, os, appVersion } = getDeviceInfo();

  if (!isOpen) return null;

  const recordSuccessfulAuth = async (
    account: UserAccount,
    method: "Email/Password" | "Mobile OTP" | "Google Sign-In" | "Biometric/PIN",
    isNewAccount = false
  ) => {
    const ipAddress = await getClientIpAddress();
    const historyEntry: LoginHistoryRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: account.uid,
      userName: account.displayName,
      userRole: account.role,
      timestamp: new Date().toISOString(),
      device,
      os,
      browser,
      appVersion,
      ipAddress,
      location: "Pune, MH, IN (Encrypted Cloud Node)",
      method,
      status: "Success",
    };

    // Save login history to Firestore
    saveLoginHistoryToCloud(account.uid, historyEntry).catch(console.warn);

    // Save audit log
    const auditEntry = await createAuditEntry(
      account.uid,
      account.displayName,
      account.role,
      "Login",
      "Authentication",
      `User ${account.displayName} (${account.email}) authenticated via ${method} on ${device} (${os})`,
      { method, ipAddress, appVersion }
    );
    saveAuditLogToCloud(account.uid, auditEntry).catch(console.warn);

    // Restore user cloud state
    let restoredState: AppState | null = null;
    if (!isNewAccount) {
      try {
        const cloudResult = await fetchAppStateFromCloud(account.uid);
        if (cloudResult.success && cloudResult.data) {
          restoredState = cloudResult.data;
        }
      } catch (err) {
        console.warn("Cloud restore check error:", err);
      }
    }

    onUpdateState((prev) => {
      const baseState = restoredState || (isNewAccount ? createInitialUserState(account) : loadAppState(account.uid));
      return {
        ...baseState,
        currentUserAccount: account,
        cloudUser: {
          uid: account.uid,
          email: account.email,
          displayName: account.displayName,
          role: account.role,
        },
        loginHistory: [historyEntry, ...(baseState.loginHistory || prev.loginHistory || [])],
        sync: {
          ...baseState.sync,
          isOnline: true,
          lastSyncDate: "Just now",
          syncStatus: "synced",
          accountType: "Cloud Authenticated",
          authProvider: method === "Google Sign-In" ? "Google" : method === "Mobile OTP" ? "Mobile OTP" : "Email",
        },
      };
    });

    onNotify(
      "Authentication Verified",
      `Welcome ${account.displayName}! Connected as ${account.role} with instant Cloud Sync.`,
      "success"
    );
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await signInWithEmail(email, password, rememberMe);
      if (res.success && res.account) {
        setSuccessMessage("Authentication verified! Loading encrypted cloud records...");
        await recordSuccessfulAuth(res.account, "Email/Password", false);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || "Invalid credentials. Please verify your email and password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to sign in. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await signUpWithEmail(email, password, fullName, selectedRole, {
        mobileNumber,
        companyName,
        designation,
        address,
        department,
        photoURL,
        rememberMe,
      });

      if (res.success && res.account) {
        setSuccessMessage("Account created successfully! Provisioning cloud storage...");
        await recordSuccessfulAuth(res.account, "Email/Password", true);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || "Could not complete account creation.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Account creation encountered an error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await sendPasswordResetLink(forgotEmail);
      if (res.success) {
        setSuccessMessage(res.message || "Password reset link has been dispatched to your email!");
      } else {
        setErrorMessage(res.error || "Failed to dispatch password reset email.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error processing password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const updatedAccount: UserAccount = {
      ...currentUser,
      displayName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      companyName: companyName.trim(),
      designation: designation.trim(),
      address: address.trim(),
      department: department.trim(),
      photoURL,
      role: selectedRole,
    };

    try {
      await saveUserAccountToCloud(currentUser.uid, updatedAccount);
      onUpdateState((prev) => ({
        ...prev,
        currentUserAccount: updatedAccount,
      }));
      setSuccessMessage("Profile details securely synchronized to Firebase Cloud!");
      onNotify("Profile Updated", "Your profile details have been saved.", "success");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await changeUserPassword(newPassword);
      if (res.success) {
        setSuccessMessage("Password updated successfully!");
        setNewPassword("");
        setConfirmNewPassword("");
        onNotify("Security Updated", "Your account password has been changed.", "success");
      } else {
        setErrorMessage(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error updating password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setErrorMessage("Please enter a new email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await changeUserEmail(newEmail);
      if (res.success) {
        setSuccessMessage("Email updated successfully!");
        if (currentUser) {
          onUpdateState((prev) => ({
            ...prev,
            currentUserAccount: prev.currentUserAccount
              ? { ...prev.currentUserAccount, email: newEmail.trim() }
              : undefined,
          }));
        }
        setNewEmail("");
        onNotify("Email Updated", `Your account email is now ${newEmail.trim()}`, "success");
      } else {
        setErrorMessage(res.error || "Failed to update email.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error updating email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const res = await sendUserEmailVerification();
      if (res.success) {
        onNotify(
          "Verification Dispatched",
          "A verification link has been sent to your registered email address.",
          "success"
        );
      } else {
        onNotify("Error", res.error || "Failed to send verification email.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      setErrorMessage("Please type DELETE in capital letters to confirm.");
      return;
    }
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const res = await deleteUserAccountAndCloudData(currentUser.uid);
      if (res.success) {
        onUpdateState((prev) => ({
          ...prev,
          currentUserAccount: undefined,
          cloudUser: null,
          sync: {
            ...prev.sync,
            accountType: "Local Encrypted",
            authProvider: "Guest",
          },
        }));
        onNotify("Account Deleted", "Your account and cloud data have been completely removed.", "info");
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to delete account. You may need to re-login first.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!otpPhone || otpPhone.replace(/[^0-9]/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(simulatedOtp);
    setOtpSent(true);
    setErrorMessage("");
    onNotify(
      "SMS OTP Code Dispatched",
      `Verification code sent to ${otpPhone}. Test OTP: [ ${simulatedOtp} ]`,
      "info"
    );
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== "123456" && otpCode !== "849201") {
      setErrorMessage("Invalid OTP code. Please enter the generated 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = otpPhone.replace(/[^0-9]/g, "");
      const userAcc: UserAccount = {
        uid: `phone-${cleanPhone}`,
        email: `${cleanPhone}@fitpulse.cloud`,
        mobileNumber: otpPhone,
        displayName: `Athlete (${otpPhone.slice(-4)})`,
        companyName: "FitPulse Athletic Pro",
        designation: "Mobile Verified Athlete",
        role: "Staff",
        department: "Mobile Direct Verified",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: "Active",
        emailVerified: true,
      };
      await recordSuccessfulAuth(userAcc, "Mobile OTP", false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signInWithGoogle();
      if (res.success && res.account) {
        await recordSuccessfulAuth(res.account, "Google Sign-In", false);
        onClose();
      } else {
        setErrorMessage(res.error || "Google Sign-In was cancelled or failed.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google authentication encountered an issue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logOutFromCloud();
    onUpdateState((prev) => ({
      ...prev,
      currentUserAccount: undefined,
      cloudUser: null,
      sync: {
        ...prev.sync,
        accountType: "Local Encrypted",
        authProvider: "Guest",
      },
    }));
    onNotify("Signed Out", "You have securely signed out of your account.", "info");
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoURL(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage("");
    const demoEmail =
      role === "Admin"
        ? "alex.miller@fitpulse.app"
        : role === "Manager"
        ? "sarah.jenkins@fitpulse.app"
        : "david.chen@fitpulse.app";

    const demoName =
      role === "Admin" ? "Alex Miller" : role === "Manager" ? "Sarah Jenkins" : "David Chen";

    const demoAccount: UserAccount = {
      uid: `demo-${role.toLowerCase()}-01`,
      email: demoEmail,
      displayName: demoName,
      mobileNumber: "+91 98765 43210",
      companyName: "FitPulse Athletic Pro",
      designation:
        role === "Admin" ? "Head Master Trainer" : role === "Manager" ? "Senior Fitness Coach" : "Personal Fitness Trainer",
      address: "Kalyani Nagar, Pune, MH",
      role,
      department:
        role === "Admin" ? "Executive Leadership" : role === "Manager" ? "Training Operations" : "Fitness Coaching",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: "Active",
      emailVerified: true,
    };

    await recordSuccessfulAuth(demoAccount, "Email/Password", false);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {isLoggedIn ? "User Account & Security" : "FitPulse Cloud Identity"}
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Firebase Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isLoggedIn
                  ? `Signed in as ${currentUser.displayName} (${currentUser.role})`
                  : "Multi-device real-time cloud sync & role governance"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setAuthTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "login"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Email Login
              </button>
              <button
                onClick={() => {
                  setAuthTab("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "signup"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Create Account
              </button>
              <button
                onClick={() => {
                  setAuthTab("otp");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "otp"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile OTP
              </button>
              <button
                onClick={() => {
                  setAuthTab("forgot");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "forgot"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Reset Password
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthTab("profile");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "profile"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setAuthTab("security");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "security"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Security & Passwords
              </button>
              <button
                onClick={() => {
                  setAuthTab("history");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  authTab === "history"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Login History ({state.loginHistory?.length || 0})
              </button>
            </>
          )}
        </div>

        {/* Feedback Alerts */}
        <div className="px-6 pt-3">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB: LOGIN */}
          {authTab === "login" && !isLoggedIn && (
            <div className="space-y-5">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.miller@fitpulse.app"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthTab("forgot")}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoading ? "Verifying Credentials..." : "Sign In to Cloud Account"}
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-semibold uppercase">
                  Or Connect With
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-rose-400" />
                  Google Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("otp")}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Mobile OTP
                </button>
              </div>

              {/* 1-Click Fast Switch Demo Logins */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Demo Switchers
                  </span>
                  <span className="text-[10px] text-slate-500">1-Click Fast Login</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("Admin")}
                    className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer"
                  >
                    👑 Head Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("Manager")}
                    className="py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition cursor-pointer"
                  >
                    🎯 Coach Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("Staff")}
                    className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition cursor-pointer"
                  >
                    ⚡ Fitness Staff
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SIGN UP */}
          {authTab === "signup" && !isLoggedIn && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Miller"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@fitpulse.app"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Password (min. 6 chars)</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Role & Access</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Manager">Manager / Head Coach</option>
                    <option value="Staff">Staff / Personal Trainer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Company / Gym Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="FitPulse Athletic Pro"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Designation / Title</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Master Fitness Coach"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Choose Profile Avatar</label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoURL(p)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                        photoURL === p ? "border-emerald-400 scale-110 shadow-lg" : "border-slate-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={p} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Upload Custom Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? "Creating Cloud Account..." : "Register & Enable Multi-Device Sync"}
              </button>
            </form>
          )}

          {/* TAB: FORGOT PASSWORD */}
          {authTab === "forgot" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Firebase Password Recovery
                </span>
                <p className="text-slate-300 text-[11px]">
                  Enter your registered account email. We'll send an official Firebase secure reset link to update your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="alex.miller@fitpulse.app"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "Dispatching Reset Email..." : "Send Password Reset Link"}
                </button>
              </form>
            </div>
          )}

          {/* TAB: MOBILE OTP */}
          {authTab === "otp" && !isLoggedIn && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Mobile Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition whitespace-nowrap cursor-pointer"
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                    {generatedOtp && (
                      <p className="text-[11px] text-emerald-400 font-mono text-center">
                        Demo Sandbox Code: [ <span className="font-bold">{generatedOtp}</span> ]
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB: PROFILE (FOR LOGGED IN USER) */}
          {authTab === "profile" && isLoggedIn && currentUser && (
            <div className="space-y-5">
              {/* Profile Card Header */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0">
                  <img src={currentUser.photoURL || photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">{currentUser.displayName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    UID: {currentUser.uid}
                  </div>
                </div>

                {/* Email Verification Status */}
                <div className="text-right shrink-0">
                  {currentUser.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/20 transition cursor-pointer"
                    >
                      Verify Email
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Company / Gym</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Physical Address / City</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {isLoading ? "Saving to Cloud..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: SECURITY & PASSWORDS (FOR LOGGED IN USER) */}
          {authTab === "security" && isLoggedIn && currentUser && (
            <div className="space-y-6">
              {/* Change Password Block */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Change Account Password
                </h4>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Change Email Block */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Update Primary Email
                </h4>
                <form onSubmit={handleChangeEmail} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">New Email Address</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new.email@fitpulse.app"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    {isLoading ? "Updating..." : "Update Email Address"}
                  </button>
                </form>
              </div>

              {/* Delete Account Block */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Danger Zone: Delete Account
                </h4>
                <p className="text-[11px] text-slate-400">
                  Permanently erase your account, login credentials, and all synchronized cloud records. This action cannot be undone.
                </p>
                {!isDeletingAccount ? (
                  <button
                    type="button"
                    onClick={() => setIsDeletingAccount(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer"
                  >
                    Initiate Account Deletion
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-rose-500/20">
                    <label className="text-[11px] font-bold text-rose-300">
                      Type <span className="font-mono underline">DELETE</span> to confirm:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="DELETE"
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-rose-500/40 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isLoading || deleteConfirmationText !== "DELETE"}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 transition cursor-pointer"
                      >
                        {isLoading ? "Deleting..." : "Permanently Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeletingAccount(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOGIN & DEVICE HISTORY */}
          {authTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  Authenticated Multi-Device Sessions
                </span>
                <span className="text-[11px] text-slate-500">
                  {state.loginHistory?.length || 0} Total Sessions Logged
                </span>
              </div>

              {!state.loginHistory || state.loginHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active session history records found.
                </div>
              ) : (
                state.loginHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{rec.device}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {rec.method}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.browser} • {rec.os} • IP: {rec.ipAddress || "Cloud Direct"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>
                        {new Date(rec.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div>
                        {new Date(rec.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted Cloud Security (TLS 1.3 + AES-256)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
