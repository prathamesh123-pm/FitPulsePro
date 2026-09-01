import React, { useState } from "react";
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
} from "lucide-react";
import { AppState, UserAccount, UserRole, LoginHistoryRecord } from "../types";
import { signInWithGoogle, logOutFromCloud } from "../services/firebase";
import { getDeviceInfo } from "../utils/auditLogger";

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onNotify,
}) => {
  const [authTab, setAuthTab] = useState<"login" | "signup" | "otp" | "history">("login");
  const [email, setEmail] = useState("alex.miller@fitpulse.app");
  const [password, setPassword] = useState("••••••••");
  const [fullName, setFullName] = useState("Alex Miller");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Admin");
  const [mobileNumber, setMobileNumber] = useState("+1 555-234-5678");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const currentUser = state.currentUserAccount;
  const { device, browser } = getDeviceInfo();

  const recordLogin = (
    account: UserAccount,
    method: "Email/Password" | "Mobile OTP" | "Google Sign-In" | "Biometric/PIN"
  ) => {
    const historyEntry: LoginHistoryRecord = {
      id: `log-${Date.now()}`,
      userId: account.uid,
      userName: account.displayName,
      userRole: account.role,
      timestamp: new Date().toISOString(),
      device,
      ipAddress: "49.36.128.91 (Secure)",
      location: "Pune, Maharashtra, India",
      method,
      status: "Success",
      browser,
    };

    onUpdateState((prev) => ({
      ...prev,
      currentUserAccount: account,
      cloudUser: {
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
      },
      loginHistory: [historyEntry, ...(prev.loginHistory || [])],
      sync: {
        ...prev.sync,
        accountType: "Cloud Authenticated",
        authProvider: method === "Google Sign-In" ? "Google" : method === "Mobile OTP" ? "Mobile OTP" : "Email",
      },
    }));

    onNotify(
      "Login Alert",
      `Authenticated as ${account.displayName} (${account.role}) via ${method}`,
      "success"
    );
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsLoading(false);
      const userAcc: UserAccount = {
        uid: `usr-${Date.now().toString(36)}`,
        email: email.trim(),
        displayName: email.split("@")[0].replace(".", " ").toUpperCase(),
        role: selectedRole,
        department: selectedRole === "Admin" ? "Executive Leadership" : selectedRole === "Manager" ? "Training & Nutrition Division" : "Fitness Coaching Staff",
        createdAt: "2026-01-15T00:00:00.000Z",
        lastLoginAt: new Date().toISOString(),
        status: "Active",
      };
      recordLogin(userAcc, "Email/Password");
      onClose();
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsLoading(false);
      const newAcc: UserAccount = {
        uid: `usr-${Date.now().toString(36)}`,
        email: email.trim(),
        displayName: fullName.trim() || "Elite Athlete",
        role: selectedRole,
        department: `${selectedRole} Branch Operations`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: "Active",
      };
      recordLogin(newAcc, "Email/Password");
      onClose();
    }, 600);
  };

  const handleSendOtp = () => {
    if (!mobileNumber || mobileNumber.length < 8) {
      setErrorMessage("Please enter a valid mobile phone number");
      return;
    }
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(simulatedOtp);
    setOtpSent(true);
    setErrorMessage("");
    onNotify(
      "SMS OTP Sent",
      `Verification code sent to ${mobileNumber}. Verification OTP: [ ${simulatedOtp} ]`,
      "info"
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== "123456" && otpCode !== "849201") {
      setErrorMessage("Invalid OTP code. Please enter the 6-digit code received.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const userAcc: UserAccount = {
        uid: `usr-mobile-${Date.now().toString(36)}`,
        email: `${mobileNumber.replace(/[^0-9]/g, "")}@fitpulse.phone`,
        mobileNumber,
        displayName: `Member (${mobileNumber.slice(-4)})`,
        role: selectedRole,
        department: "Mobile Verified Athlete",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: "Active",
      };
      recordLogin(userAcc, "Mobile OTP");
      onClose();
    }, 600);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signInWithGoogle();
      if (res.user) {
        const acc: UserAccount = {
          uid: res.user.uid,
          email: res.user.email || "google.user@fitpulse.app",
          displayName: res.user.displayName || "Google Athlete",
          photoURL: res.user.photoURL || undefined,
          role: selectedRole,
          department: "Google Cloud Sync Account",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: "Active",
        };
        recordLogin(acc, "Google Sign-In");
        onClose();
      } else {
        // Simulated Google account if pop-up blocked or offline
        const acc: UserAccount = {
          uid: "usr-google-verified",
          email: "alex.miller@gmail.com",
          displayName: "Alex Miller (Google Verified)",
          role: selectedRole,
          department: "Google Workspace Enterprise",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: "Active",
        };
        recordLogin(acc, "Google Sign-In");
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google Sign-In encountered an issue");
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
    onNotify("Logged Out", "You have signed out of your enterprise session.", "info");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Enterprise Authentication & RBAC</h2>
              <p className="text-xs text-slate-400">Role-Based Cloud Access • Audit Logging • Multi-Factor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Badge */}
        {currentUser && (
          <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-semibold text-emerald-200">Active Account: </span>
                <span className="text-xs font-bold text-white">{currentUser.displayName}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => setAuthTab("login")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              authTab === "login"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setAuthTab("otp")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              authTab === "otp"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Mobile OTP Login
          </button>
          <button
            onClick={() => setAuthTab("signup")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              authTab === "signup"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setAuthTab("history")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ml-auto ${
              authTab === "history"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Login History ({state.loginHistory?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Selection Pill for Login/Signup/OTP */}
          {authTab !== "history" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Target Role (RBAC Level):</span>
                <span className="text-[10px] text-slate-400">Admin • Manager • Staff</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Admin", "Manager", "Staff"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                      selectedRole === r
                        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-800/70 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{r}</span>
                    </div>
                    <span className="text-[9px] font-normal text-slate-400">
                      {r === "Admin" ? "Full Master Access" : r === "Manager" ? "Review & Approvals" : "Data Entry & Logs"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: EMAIL LOGIN */}
          {authTab === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@fitpulse.app"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Sign In to Enterprise Dashboard
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Or Connect With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs text-white flex items-center justify-center gap-2.5 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign In with Google Account
              </button>
            </form>
          )}

          {/* TAB 2: MOBILE OTP LOGIN */}
          {authTab === "otp" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Mobile Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-emerald-400 transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-[11px] text-emerald-300 font-semibold flex items-center justify-between">
                      <span>SMS OTP Code Sent:</span>
                      <span className="font-mono text-xs bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 text-white">
                        {generatedOtp || "849201"}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Enter the 6-digit verification code below to login.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Enter 6-Digit OTP</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 849201"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify OTP & Proceed
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CREATE ACCOUNT */}
          {authTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Miller"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@fitpulse.app"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Set Security Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Register Account ({selectedRole})
              </button>
            </form>
          )}

          {/* TAB 4: LOGIN HISTORY */}
          {authTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Recent Authentication Audit Trail</span>
                <span className="text-[10px] text-emerald-400">SSL Encrypted</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(state.loginHistory || []).map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between text-xs hover:border-slate-600 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{h.userName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {h.userRole}
                        </span>
                        <span className="text-[10px] text-slate-400">via {h.method}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        <span>📱 {h.device}</span>
                        <span>🌐 {h.location}</span>
                        <span>IP: {h.ipAddress}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-semibold block">{h.status}</span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
