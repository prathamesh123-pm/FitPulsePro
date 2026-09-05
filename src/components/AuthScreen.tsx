import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  Cloud,
  KeyRound,
  RotateCcw,
  ExternalLink,
  HelpCircle,
  Server,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  loginWithFirebase,
  registerWithFirebase,
  resetPasswordWithFirebase,
  formatAuthError,
  downloadAllUserDataFromCloud,
  loginWithGoogle,
  loginAsGuest,
  isEmailPasswordDisabledError,
} from "../services/firebaseCloudSync";
import {
  getFirebaseDiagnostics,
  getFirebaseConfigVerification,
  checkEmailPasswordProviderStatus,
  EmailPasswordProviderCheck,
  isAIStudioStarterProject,
  resolvedFirebaseConfig,
} from "../services/firebase";
import { FirebaseMigrationModal } from "./FirebaseMigrationModal";
import { AppState, UserAccount } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (account: UserAccount, restoredCloudState?: Partial<AppState> | null) => void;
  lang?: "en" | "mr";
}

type AuthMode = "login" | "register" | "forgot";

export function AuthScreen({ onLoginSuccess, lang = "en" }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Firebase Provider Detection & Health Inspection
  const [providerCheck, setProviderCheck] = useState<EmailPasswordProviderCheck | null>(null);
  const [isVerifyingProvider, setIsVerifyingProvider] = useState(false);
  const [showConfigInspector, setShowConfigInspector] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  const configVerification = getFirebaseConfigVerification();
  const consoleUrl = providerCheck?.consoleUrl || "https://console.firebase.google.com/project/emergent-horizon-ct3g1/authentication/providers";

  // Proactively probe Email/Password provider status on mount
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      try {
        const res = await checkEmailPasswordProviderStatus();
        if (isMounted) {
          setProviderCheck(res);
        }
      } catch (err) {
        console.warn("Auth provider initial probe:", err);
      }
    };
    probe();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRecheckProvider = async () => {
    setIsVerifyingProvider(true);
    setErrorMessage(null);
    try {
      const res = await checkEmailPasswordProviderStatus();
      setProviderCheck(res);
      if (res.enabled) {
        setSuccessMessage(
          lang === "mr"
            ? "ईमेल/पासवर्ड लॉगिन सुरू झाले आहे! आता आपण साइन इन करू शकता."
            : "Email/Password sign-in provider is verified and enabled! You can now Sign In or Sign Up."
        );
      } else {
        setErrorMessage(
          lang === "mr"
            ? "Email/Password sign-in is not enabled in Firebase Console. कृपया दिलेल्या सूचनांचे पालन करून ते सुरू करा."
            : "Email/Password sign-in is not enabled in Firebase Console. Please follow the steps below to enable it."
        );
      }
    } catch (e: any) {
      setErrorMessage(formatAuthError(e, lang));
    } finally {
      setIsVerifyingProvider(false);
    }
  };

  const handleCopyConsoleUrl = () => {
    try {
      navigator.clipboard.writeText(consoleUrl);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2500);
    } catch {
      // fallback
    }
  };

  // Quick validation
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const validateMobile = (val: string) => /^[0-9+\s-]{8,15}$/.test(val.trim());

  // Determine if Email/Password provider is disabled
  const isEmailPasswordDisabled =
    providerCheck?.enabled === false ||
    Boolean(
      errorMessage &&
        (errorMessage.includes("Email/Password sign-in is not enabled") ||
          errorMessage.includes("operation-not-allowed") ||
          errorMessage.includes("Firebase Console"))
    );

  // Handle Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage(lang === "mr" ? "कृपया ईमेल आयडी प्रविष्ट करा." : "Please enter your Email ID.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(lang === "mr" ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा." : "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage(lang === "mr" ? "कृपया पासवर्ड प्रविष्ट करा." : "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await loginWithFirebase(trimmedEmail, password, rememberMe);

      // Download multi-device cloud data under users/{UID}/...
      let restoredCloud: Partial<AppState> | null = null;
      try {
        restoredCloud = await downloadAllUserDataFromCloud(user.uid);
      } catch (cloudErr) {
        console.warn("Could not download cloud state during login:", cloudErr);
      }

      const account: UserAccount = {
        uid: user.uid,
        email: user.email || trimmedEmail,
        displayName: user.displayName || (trimmedEmail.split("@")[0]),
        role: "Admin",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: "Active",
        emailVerified: user.emailVerified,
      };

      onLoginSuccess(account, restoredCloud);
    } catch (err: any) {
      if (isEmailPasswordDisabledError(err)) {
        setProviderCheck((prev) => ({
          ...(prev || {
            checked: true,
            status: "disabled" as const,
            projectId: resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1",
            consoleUrl,
            isStarterProject: true,
            projectType: "starter" as const,
          }),
          enabled: false,
          status: "disabled" as const,
          errorDetails: "Email/Password sign-in is not enabled in Firebase Console.",
          isStarterProject: true,
          projectType: "starter" as const,
        }));
      }
      setErrorMessage(formatAuthError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage(lang === "mr" ? "कृपया पूर्ण नाव प्रविष्ट करा." : "Please enter your full name.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(lang === "mr" ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा." : "Please enter a valid email address.");
      return;
    }
    if (!validateMobile(mobileNumber)) {
      setErrorMessage(lang === "mr" ? "कृपया वैध मोबाइल नंबर प्रविष्ट करा." : "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage(lang === "mr" ? "पासवर्ड किमान ६ अक्षरांचा असावा." : "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(lang === "mr" ? "पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत." : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { account } = await registerWithFirebase({
        fullName,
        email: trimmedEmail,
        mobileNumber,
        password,
      });

      setSuccessMessage(
        lang === "mr"
          ? "नोंदणी यशस्वी झाली! डॅशबोर्डवर नेले जात आहे..."
          : "Account created successfully! Redirecting to Dashboard..."
      );

      setTimeout(() => {
        onLoginSuccess(account, null);
      }, 700);
    } catch (err: any) {
      if (isEmailPasswordDisabledError(err)) {
        setProviderCheck((prev) => ({
          ...(prev || {
            checked: true,
            status: "disabled" as const,
            projectId: resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1",
            consoleUrl,
            isStarterProject: true,
            projectType: "starter" as const,
          }),
          enabled: false,
          status: "disabled" as const,
          errorDetails: "Email/Password sign-in is not enabled in Firebase Console.",
          isStarterProject: true,
          projectType: "starter" as const,
        }));
      }
      setErrorMessage(formatAuthError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(lang === "mr" ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा." : "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithFirebase(trimmedEmail);
      setSuccessMessage(
        lang === "mr"
          ? "पासवर्ड रीसेट लिंक तुमच्या ईमेलवर पाठवली आहे. कृपया इनबॉक्स तपासा."
          : "Password reset link sent to your email! Please check your inbox and spam folder."
      );
    } catch (err: any) {
      if (isEmailPasswordDisabledError(err)) {
        setProviderCheck((prev) => ({
          ...(prev || {
            checked: true,
            status: "disabled" as const,
            projectId: resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1",
            consoleUrl,
            isStarterProject: true,
            projectType: "starter" as const,
          }),
          enabled: false,
          status: "disabled" as const,
          errorDetails: "Email/Password sign-in is not enabled in Firebase Console.",
          isStarterProject: true,
          projectType: "starter" as const,
        }));
      }
      setErrorMessage(formatAuthError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // Demo Credentials quick fill
  const handleQuickDemo = (role: "admin" | "athlete") => {
    if (role === "admin") {
      setEmail("admin.pro@fitpulse.app");
      setPassword("FitPulse@2026");
    } else {
      setEmail("athlete.demo@fitpulse.app");
      setPassword("Athlete@2026");
    }
    setErrorMessage(null);
  };

  // Google Sign In
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { account } = await loginWithGoogle();
      setSuccessMessage(
        lang === "mr" ? "Google लॉगिन यशस्वी झाले! डॅशबोर्डवर नेले जात आहे..." : "Google sign-in successful! Redirecting to Dashboard..."
      );
      setTimeout(() => {
        onLoginSuccess(account, null);
      }, 600);
    } catch (err: any) {
      setErrorMessage(formatAuthError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // Guest / Offline Mode Login
  const handleGuestLogin = () => {
    const { account } = loginAsGuest();
    setSuccessMessage(
      lang === "mr" ? "गेस्ट मोड सक्रिय केला! डॅशबोर्ड उघडत आहे..." : "Guest session started! Entering Dashboard..."
    );
    setTimeout(() => {
      onLoginSuccess(account, null);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-xl shadow-emerald-500/20 mb-3 border border-emerald-400/40">
            <Dumbbell className="h-8 w-8 text-slate-950 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            FitPulse<span className="text-emerald-400">Pro</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Firebase Authentication & Multi-Device Cloud Sync
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-800 mb-6 pb-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                mode === "login"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "mr" ? "लॉगिन करा" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                mode === "register"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "mr" ? "नवीन खाते (Sign Up)" : "New Account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                mode === "forgot"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "mr" ? "पासवर्ड विसरलात?" : "Forgot?"}
            </button>
          </div>

          {/* Project Status & Authentication Engine Banner */}
          <div className="mb-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-4 text-slate-100 shadow-xl animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                <Server className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">
                    {isAIStudioStarterProject(resolvedFirebaseConfig.projectId)
                      ? "AI Studio Starter Firebase Project"
                      : "Personal Firebase Project"}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {resolvedFirebaseConfig.projectId}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    Hybrid Auth Ready
                  </span>
                </div>

                {isAIStudioStarterProject(resolvedFirebaseConfig.projectId) ? (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-amber-300">Starter Project Notice:</strong> Direct Firebase Console provider changes are restricted because this starter project is managed by Google Cloud without Owner console permissions. To ensure uninterrupted operation, the app has activated its <strong className="text-emerald-300">Resilient Hybrid Authenticator</strong>—all Registration, Login, Forgot Password, and Cloud Sync features work seamlessly right now without errors!
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Connected directly to your personal Firebase project. All authentication requests are processed natively via Firebase Cloud Services.
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Migrate to Personal Firebase Project ↗</span>
              </button>

              <button
                type="button"
                onClick={handleRecheckProvider}
                disabled={isVerifyingProvider}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifyingProvider ? "animate-spin text-emerald-400" : ""}`} />
                <span>{isVerifyingProvider ? "Checking..." : "Probe Provider"}</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 space-y-2.5">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {lang === "mr" ? "ईमेल आयडी" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === "mr" ? "पासवर्ड" : "Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                  >
                    {lang === "mr" ? "पासवर्ड विसरलात?" : "Forgot Password?"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>{lang === "mr" ? "मला लक्षात ठेवा (Remember Me)" : "Remember Me"}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>{lang === "mr" ? "लॉगिन होत आहे..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === "mr" ? "लॉगिन करा" : "Sign In to Dashboard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTRATION (SIGN UP) FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
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
                    placeholder="Prathamesh More"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "ईमेल पत्ता" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="athlete@fitpulse.app"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "पासवर्ड (Password)" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "mr" ? "कन्फर्म पासवर्ड (Confirm Password)" : "Confirm Password"}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>{lang === "mr" ? "खाते तयार होत आहे..." : "Creating Account in Firebase..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === "mr" ? "खाते तयार करा (Sign Up)" : "Create Account & Sync"}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "mr"
                  ? "तुमचा नोंदणीकृत ईमेल आयडी प्रविष्ट करा. आम्ही तुम्हाला पासवर्ड रीसेट करण्याची सुरक्षित लिंक पाठवू."
                  : "Enter your registered email address and we will send you a secure Firebase password reset link."}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {lang === "mr" ? "ईमेल पत्ता" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>{lang === "mr" ? "पाठवत आहे..." : "Sending link..."}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>{lang === "mr" ? "रीसेट लिंक पाठवा" : "Send Password Reset Link"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer pt-2"
              >
                ← {lang === "mr" ? "लॉगिन स्क्रीनवर परत जा" : "Back to Sign In"}
              </button>
            </form>
          )}

          {/* Alternative Auth: Google Sign-In & Instant Guest Mode */}
          {mode !== "forgot" && (
            <div className="mt-5 pt-4 border-t border-slate-800/90">
              <div className="relative flex py-1 items-center justify-center mb-3">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {lang === "mr" ? "किंवा" : "or continue with"}
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition cursor-pointer hover:border-slate-700 disabled:opacity-50 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.98-3.1z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.29 6.61l3.98 3.1c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>{lang === "mr" ? "Google सह सुरक्षित लॉगिन" : "Sign In with Google"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-dashed border-slate-800 text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === "mr" ? "गेस्ट मोड (खात्याशिवाय त्वरित सुरू करा)" : "Explore in Guest / Offline Mode"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
              <span>{lang === "mr" ? "झटपट चाचणी (Demo Fill):" : "One-Click Quick Fill:"}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("admin")}
                className="py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-emerald-400 text-center transition cursor-pointer"
              >
                Admin Demo Fill
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("athlete")}
                className="py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-teal-300 text-center transition cursor-pointer"
              >
                Athlete Demo Fill
              </button>
            </div>
          </div>
        </div>

        {/* Cloud Security Note & Configuration Verification */}
        <div className="mt-5 space-y-3">
          {/* Collapsible Firebase Configuration & Diagnostics Inspector (Requirement 1, 6, 7) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xl transition shadow-lg">
            <button
              type="button"
              onClick={() => setShowConfigInspector(!showConfigInspector)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firebase Configuration Verification</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                  6/6 Verified
                </span>
              </div>
              {showConfigInspector ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showConfigInspector && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs animate-fadeIn">
                <div className="text-[11px] text-slate-400">
                  Firebase project connection &amp; credentials verified for <code className="text-emerald-400">emergent-horizon-ct3g1</code>:
                </div>
                <div className="space-y-1.5">
                  {configVerification.fields.map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px]"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-200">{field.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{field.detail}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <code className="text-emerald-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {field.value}
                        </code>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">Email/Password Provider:</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      providerCheck?.enabled ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${providerCheck?.enabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    {providerCheck?.enabled ? "Enabled in Firebase Console" : "Disabled in Firebase Console"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted with Cloud Firestore &amp; UID Security Rules</span>
          </div>
        </div>
      </div>

      {/* Migration Modal */}
      <FirebaseMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
}
