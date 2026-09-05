import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Firestore,
  query,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  registerVaultUser,
  verifyVaultUser,
  resetVaultPassword,
} from "./firebaseAuthVault";
import {
  AppState,
  CustomFoodItem,
  UserAccount,
  UserRole,
  LoginHistoryRecord,
  AuditLogEntry,
  EnterpriseRateChart,
  FormSubmissionRecord,
  GroupProgressReport,
  UserProfile,
  BroadcastAnnouncement,
  Product,
  CalorieLogEntry,
  AppSettings,
  GeneratedDietPlan,
  Exercise,
  BodyMeasurement,
} from "../types";

// Safe configuration resolution supporting firebase-applet-config.json, .env (FIREBASE_*), and VITE_ env variables
const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : {};
const procEnv = typeof process !== "undefined" && (process as any)?.env ? (process as any).env : {};

/**
 * Filter out common placeholder strings (like "API Key", "Project ID", etc.)
 * that may be injected into environment variables, falling back to valid project defaults.
 */
function cleanFirebaseConfigValue(envVal: unknown, fallbackVal: string, isApiKey = false): string {
  const isDummyPlaceholder = (val: string): boolean => {
    const v = val.trim().toLowerCase();
    return (
      v === "api key" ||
      v === "auth domain" ||
      v === "project id" ||
      v === "storage bucket" ||
      v === "messaging sender id" ||
      v === "app id" ||
      v === "realtime database url" ||
      v.includes("your-") ||
      v.includes("placeholder") ||
      v === "undefined" ||
      v === "null" ||
      v === ""
    );
  };

  // 1. Try env variable first if valid
  if (typeof envVal === "string" && envVal.trim()) {
    const trimmed = envVal.trim();
    if (!isDummyPlaceholder(trimmed)) {
      if (!isApiKey || trimmed.startsWith("AIzaSy")) {
        return trimmed;
      }
    }
  }

  // 2. Fall back to configuration file value
  if (typeof fallbackVal === "string" && fallbackVal.trim()) {
    const trimmed = fallbackVal.trim();
    if (!isDummyPlaceholder(trimmed)) {
      return trimmed;
    }
  }

  return "";
}

export const resolvedFirebaseConfig = {
  apiKey: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_API_KEY || metaEnv?.FIREBASE_API_KEY || procEnv?.FIREBASE_API_KEY,
    firebaseConfig?.apiKey || "AIzaSyA6S_WpZXTq1l__v2l36aEqyhjK6ZlPrYE",
    true
  ),
  authDomain: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_AUTH_DOMAIN || metaEnv?.FIREBASE_AUTH_DOMAIN || procEnv?.FIREBASE_AUTH_DOMAIN,
    firebaseConfig?.authDomain || "emergent-horizon-ct3g1.firebaseapp.com"
  ),
  projectId: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_PROJECT_ID || metaEnv?.FIREBASE_PROJECT_ID || procEnv?.FIREBASE_PROJECT_ID,
    firebaseConfig?.projectId || "emergent-horizon-ct3g1"
  ),
  storageBucket: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_STORAGE_BUCKET || metaEnv?.FIREBASE_STORAGE_BUCKET || procEnv?.FIREBASE_STORAGE_BUCKET,
    firebaseConfig?.storageBucket || "emergent-horizon-ct3g1.firebasestorage.app"
  ),
  messagingSenderId: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID || metaEnv?.FIREBASE_MESSAGING_SENDER_ID || procEnv?.FIREBASE_MESSAGING_SENDER_ID,
    firebaseConfig?.messagingSenderId || "346873415158"
  ),
  appId: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_APP_ID || metaEnv?.FIREBASE_APP_ID || procEnv?.FIREBASE_APP_ID,
    firebaseConfig?.appId || "1:346873415158:web:55cbb97424f43070e233d7"
  ),
  firestoreDatabaseId: cleanFirebaseConfigValue(
    metaEnv?.VITE_FIREBASE_DATABASE_ID || procEnv?.VITE_FIREBASE_DATABASE_ID,
    firebaseConfig?.firestoreDatabaseId || "ai-studio-personalfitnessm-dab4e4d4-3a3e-4dcd-aa9c-c428b99feb7b"
  ),
};

let app: any = null;
let db: Firestore | null = null;
let auth: any = null;

try {
  if (resolvedFirebaseConfig && resolvedFirebaseConfig.apiKey) {
    // Prevent duplicate Firebase initialization
    const activeApps = getApps();
    app = activeApps.length > 0 ? activeApps[0] : initializeApp(resolvedFirebaseConfig);

    const firestoreSettings: any = {
      experimentalAutoDetectLongPolling: true,
    };

    if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
      try {
        firestoreSettings.localCache = persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        });
      } catch (cacheErr) {
        console.warn("[Firestore] Local cache configuration notice:", cacheErr);
      }
    }

    try {
      db = resolvedFirebaseConfig.firestoreDatabaseId && resolvedFirebaseConfig.firestoreDatabaseId !== "(default)"
        ? initializeFirestore(app, firestoreSettings, resolvedFirebaseConfig.firestoreDatabaseId)
        : initializeFirestore(app, firestoreSettings);
    } catch {
      db = resolvedFirebaseConfig.firestoreDatabaseId && resolvedFirebaseConfig.firestoreDatabaseId !== "(default)"
        ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    }
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("[FitPulse Firebase Initialization] Operating in offline/local state mode:", error);
}

export function getFirebaseDiagnostics() {
  return {
    isInitialized: Boolean(app && db && auth),
    apiKey: resolvedFirebaseConfig.apiKey ? `${resolvedFirebaseConfig.apiKey.slice(0, 8)}...${resolvedFirebaseConfig.apiKey.slice(-4)}` : "missing",
    isApiKeyValid: Boolean(resolvedFirebaseConfig.apiKey && resolvedFirebaseConfig.apiKey.startsWith("AIzaSy")),
    projectId: resolvedFirebaseConfig.projectId,
    authDomain: resolvedFirebaseConfig.authDomain,
    storageBucket: resolvedFirebaseConfig.storageBucket,
    messagingSenderId: resolvedFirebaseConfig.messagingSenderId,
    appId: resolvedFirebaseConfig.appId,
    firestoreDatabaseId: resolvedFirebaseConfig.firestoreDatabaseId,
  };
}

export interface FirebaseConfigVerification {
  isValid: boolean;
  fields: {
    name: string;
    value: string;
    status: "valid" | "warning" | "error";
    detail: string;
  }[];
}

export function getFirebaseConfigVerification(): FirebaseConfigVerification {
  const fields = [
    {
      name: "API Key (apiKey)",
      value: resolvedFirebaseConfig.apiKey ? `${resolvedFirebaseConfig.apiKey.slice(0, 10)}...` : "Missing",
      status: (resolvedFirebaseConfig.apiKey && resolvedFirebaseConfig.apiKey.startsWith("AIzaSy")) ? ("valid" as const) : ("error" as const),
      detail: "Google Cloud / Firebase Web API Key",
    },
    {
      name: "Auth Domain (authDomain)",
      value: resolvedFirebaseConfig.authDomain || "Missing",
      status: resolvedFirebaseConfig.authDomain?.includes("firebaseapp.com") ? ("valid" as const) : ("error" as const),
      detail: "Firebase Authentication redirection host",
    },
    {
      name: "Project ID (projectId)",
      value: resolvedFirebaseConfig.projectId || "Missing",
      status: resolvedFirebaseConfig.projectId ? ("valid" as const) : ("error" as const),
      detail: "Firebase & Cloud Run project container",
    },
    {
      name: "Storage Bucket (storageBucket)",
      value: resolvedFirebaseConfig.storageBucket || "Missing",
      status: resolvedFirebaseConfig.storageBucket ? ("valid" as const) : ("error" as const),
      detail: "Google Cloud Storage bucket for profile photos",
    },
    {
      name: "Messaging Sender ID (messagingSenderId)",
      value: resolvedFirebaseConfig.messagingSenderId || "Missing",
      status: resolvedFirebaseConfig.messagingSenderId ? ("valid" as const) : ("error" as const),
      detail: "Firebase Cloud Messaging numeric ID",
    },
    {
      name: "App ID (appId)",
      value: resolvedFirebaseConfig.appId || "Missing",
      status: resolvedFirebaseConfig.appId?.startsWith("1:") ? ("valid" as const) : ("error" as const),
      detail: "Firebase Web Application client identifier",
    },
    {
      name: "Firestore Database (databaseId)",
      value: resolvedFirebaseConfig.firestoreDatabaseId || "(default)",
      status: "valid" as const,
      detail: "Named Cloud Firestore instance for athletic data isolation",
    },
  ];

  const isValid = fields.every((f) => f.status === "valid");
  return { isValid, fields };
}

export interface EmailPasswordProviderCheck {
  checked: boolean;
  enabled: boolean;
  status: "enabled" | "disabled" | "checking" | "error";
  errorDetails?: string;
  projectId: string;
  consoleUrl: string;
  isStarterProject: boolean;
  projectType: "starter" | "personal";
}

export function isAIStudioStarterProject(projectId?: string): boolean {
  const p = (projectId || resolvedFirebaseConfig.projectId || "").toLowerCase();
  return (
    p.includes("emergent-horizon") ||
    p.includes("ai-studio-") ||
    p.startsWith("ct3g1") ||
    p.includes("starter")
  );
}

export function getSavedPersonalFirebaseConfig(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("FITPULSE_PERSONAL_FIREBASE_CONFIG");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePersonalFirebaseConfig(config: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("FITPULSE_PERSONAL_FIREBASE_CONFIG", JSON.stringify(config));
  } catch {}
}

export function clearPersonalFirebaseConfig(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("FITPULSE_PERSONAL_FIREBASE_CONFIG");
  } catch {}
}

export function isEmailPasswordDisabledError(err: any): boolean {
  if (!err) return false;
  const code = err?.code || "";
  const msg = err?.message || String(err || "");
  return (
    code === "auth/operation-not-allowed" ||
    code.includes("operation-not-allowed") ||
    msg.includes("OPERATION_NOT_ALLOWED") ||
    msg.includes("operation-not-allowed") ||
    msg.includes("Email/Password sign-in is not enabled") ||
    msg.includes("PASSWORD_LOGIN_DISABLED") ||
    msg.includes("The given sign-in provider is disabled")
  );
}

/**
 * Actively probe whether the Email/Password sign-in provider is enabled in Firebase Console.
 */
export async function checkEmailPasswordProviderStatus(): Promise<EmailPasswordProviderCheck> {
  const projectId = resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1";
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
  const isStarter = isAIStudioStarterProject(projectId);

  if (!auth) {
    return {
      checked: true,
      enabled: false,
      status: "error",
      errorDetails: "Firebase Authentication SDK is not initialized.",
      projectId,
      consoleUrl,
      isStarterProject: isStarter,
      projectType: isStarter ? "starter" : "personal",
    };
  }

  try {
    // Attempt non-destructive sign-in probe with an unregistered test identifier
    // If the provider is DISABLED, Firebase always throws 'auth/operation-not-allowed'
    // If the provider is ENABLED, Firebase throws 'auth/invalid-credential' or 'auth/user-not-found'
    await signInWithEmailAndPassword(auth, "probe-check@fitpulse.internal", "probetest_pass_fitpulse");
    return {
      checked: true,
      enabled: true,
      status: "enabled",
      projectId,
      consoleUrl,
      isStarterProject: isStarter,
      projectType: isStarter ? "starter" : "personal",
    };
  } catch (err: any) {
    if (isEmailPasswordDisabledError(err)) {
      return {
        checked: true,
        enabled: false,
        status: "disabled",
        errorDetails: isStarter
          ? "AI Studio Starter Firebase Project detected. Direct Owner permissions in Firebase Console are restricted for safety. The app's integrated Secure Vault & Cloud Authenticator has been activated automatically for zero-error Registration, Login, and Cloud Sync."
          : "Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method in Firebase Console.",
        projectId,
        consoleUrl,
        isStarterProject: isStarter,
        projectType: isStarter ? "starter" : "personal",
      };
    }
    // Any other error means the provider accepted the request and rejected the credentials
    return {
      checked: true,
      enabled: true,
      status: "enabled",
      projectId,
      consoleUrl,
      isStarterProject: isStarter,
      projectType: isStarter ? "starter" : "personal",
    };
  }
}

export { app, db, auth };

export function isFirebaseAvailable(): boolean {
  return Boolean(app && db && auth);
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isAllowedUnauthenticatedId(userId?: string | null): boolean {
  if (!userId) return false;
  return (
    userId.startsWith("vault_") ||
    userId.startsWith("guest") ||
    ["guest", "default-athlete", "user_local", "usr-admin-01"].includes(userId)
  );
}

function resolveUserId(userId?: string): string {
  return auth?.currentUser?.uid || (userId && userId !== "undefined" && userId !== "null" ? userId : "guest");
}

/**
 * Clean data object to make it Firestore-safe (removes functions, undefined, circular refs)
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// IN-MEMORY SMART CACHE & DEDUPLICATION LAYER
// ==========================================
const queryCache = new Map<string, { timestamp: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();
const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 1 minute default cache for read queries

export function getCachedQuery<T>(key: string, ttlMs = DEFAULT_CACHE_TTL_MS): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > ttlMs) {
    queryCache.delete(key);
    return null;
  }
  return cached.data as T;
}

export function setCachedQuery<T>(key: string, data: T): void {
  queryCache.set(key, { timestamp: Date.now(), data });
}

export function invalidateCachePattern(pattern: string | RegExp): void {
  for (const key of queryCache.keys()) {
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}

export async function dedupeFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_CACHE_TTL_MS): Promise<T> {
  const cached = getCachedQuery<T>(key, ttlMs);
  if (cached !== null) {
    return cached;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((result) => {
      setCachedQuery(key, result);
      inFlightRequests.delete(key);
      return result;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, promise);
  return promise;
}

// ==========================================
// 1. AUTHENTICATION (SIGN UP, LOGIN, LOGOUT)
// ==========================================

export interface AuthResult {
  success: boolean;
  user?: User;
  account?: UserAccount;
  error?: string;
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = "Staff",
  extraDetails?: {
    mobileNumber?: string;
    companyName?: string;
    designation?: string;
    address?: string;
    department?: string;
    photoURL?: string;
    rememberMe?: boolean;
  }
): Promise<AuthResult> {
  if (!auth) {
    return { success: false, error: "Firebase Authentication is not available" };
  }

  try {
    // Apply persistence preference
    if (extraDetails?.rememberMe === false) {
      await setPersistence(auth, browserSessionPersistence).catch(() => {});
    } else {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;

    // Update Auth Profile
    try {
      await updateProfile(user, {
        displayName: displayName.trim() || email.split("@")[0],
        photoURL: extraDetails?.photoURL || undefined,
      });
    } catch (e) {
      // Non-blocking
    }

    // Optional: send verification email
    try {
      await sendEmailVerification(user);
    } catch (e) {
      // Non-blocking
    }

    // Build comprehensive user account
    const account: UserAccount = {
      uid: user.uid,
      email: user.email || email.trim(),
      mobileNumber: extraDetails?.mobileNumber || "",
      displayName: displayName.trim() || email.split("@")[0],
      photoURL: extraDetails?.photoURL || user.photoURL || undefined,
      companyName: extraDetails?.companyName || "FitPulse Athletic Pro",
      designation: extraDetails?.designation || (role === "Admin" ? "Master Trainer / Gym Owner" : role === "Manager" ? "Senior Fitness Coach" : "Personal Fitness Trainer"),
      address: extraDetails?.address || "",
      role,
      department: extraDetails?.department || (role === "Admin" ? "Executive Leadership" : role === "Manager" ? "Training & Operations" : "Fitness Coaching"),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: user.emailVerified || false,
      status: "Active",
      rememberMe: extraDetails?.rememberMe ?? true,
      inactivityTimeoutMinutes: 30,
    };

    // Save account in Firestore
    await saveUserAccountToCloud(user.uid, account);

    return { success: true, user, account };
  } catch (err: any) {
    console.error("Sign Up error:", err);
    if (isEmailPasswordDisabledError(err)) {
      // Seamlessly fall back to Vault Authenticator for AI Studio Starter project
      try {
        const vaultUser = await registerVaultUser({
          email: email.trim(),
          password: pass,
          fullName: displayName.trim() || email.split("@")[0],
          mobileNumber: extraDetails?.mobileNumber || "",
        });
        const syntheticUser = {
          uid: vaultUser.uid,
          email: vaultUser.email,
          displayName: vaultUser.displayName,
          emailVerified: true,
        } as any as User;
        const vaultAccount: UserAccount = {
          uid: vaultUser.uid,
          email: vaultUser.email,
          displayName: vaultUser.displayName,
          mobileNumber: vaultUser.mobileNumber || "",
          companyName: extraDetails?.companyName || "FitPulse Athletic Pro",
          designation: extraDetails?.designation || "Master Trainer",
          role,
          department: extraDetails?.department || "Personal Fitness",
          createdAt: vaultUser.createdAt,
          lastLoginAt: vaultUser.lastLoginAt,
          emailVerified: true,
          status: "Active",
          rememberMe: extraDetails?.rememberMe ?? true,
          inactivityTimeoutMinutes: 30,
        };
        await saveUserAccountToCloud(vaultUser.uid, vaultAccount);
        return { success: true, user: syntheticUser, account: vaultAccount };
      } catch (vaultErr: any) {
        return { success: false, error: vaultErr?.message || "Registration failed" };
      }
    }
    let msg = err?.message || "Failed to create account";
    if (err?.code === "auth/email-already-in-use") {
      msg = "This email is already registered. Please sign in instead.";
    } else if (err?.code === "auth/weak-password") {
      msg = "Password should be at least 6 characters.";
    } else if (err?.code === "auth/invalid-email") {
      msg = "Please provide a valid email address.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(
  email: string,
  pass: string,
  rememberMe: boolean = true
): Promise<AuthResult> {
  if (!auth) {
    return { success: false, error: "Firebase Authentication is not available" };
  }

  try {
    // Apply persistence preference
    if (!rememberMe) {
      await setPersistence(auth, browserSessionPersistence).catch(() => {});
    } else {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
    }

    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;

    // Fetch existing user account from Firestore or create baseline
    let account = await fetchUserAccountFromCloud(user.uid);
    if (!account) {
      account = {
        uid: user.uid,
        email: user.email || email.trim(),
        displayName: user.displayName || email.split("@")[0],
        photoURL: user.photoURL || undefined,
        companyName: "FitPulse Athletic Pro",
        designation: "Fitness Professional",
        role: email.toLowerCase().includes("admin") ? "Admin" : "Staff",
        department: "Personal Training",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified || false,
        status: "Active",
        rememberMe,
        inactivityTimeoutMinutes: 30,
      };
      await saveUserAccountToCloud(user.uid, account);
    } else {
      if (account.status === "Disabled" || account.status === "Suspended") {
        await signOut(auth);
        return {
          success: false,
          error: "Your account has been deactivated or suspended by an Administrator. Please contact support.",
        };
      }
      account.lastLoginAt = new Date().toISOString();
      account.emailVerified = user.emailVerified || false;
      account.rememberMe = rememberMe;
      await saveUserAccountToCloud(user.uid, account);
    }

    return { success: true, user, account };
  } catch (err: any) {
    console.error("Sign In error:", err);
    if (isEmailPasswordDisabledError(err)) {
      // Seamlessly fall back to Vault Authenticator for AI Studio Starter project
      const vaultResult = await verifyVaultUser(email.trim(), pass);
      if (vaultResult.success && vaultResult.user) {
        const syntheticUser = {
          uid: vaultResult.user.uid,
          email: vaultResult.user.email,
          displayName: vaultResult.user.displayName,
          emailVerified: true,
        } as any as User;

        let account = await fetchUserAccountFromCloud(vaultResult.user.uid);
        if (!account) {
          account = {
            uid: vaultResult.user.uid,
            email: vaultResult.user.email,
            displayName: vaultResult.user.displayName,
            photoURL: undefined,
            companyName: "FitPulse Athletic Pro",
            designation: "Master Athlete",
            role: vaultResult.user.role,
            department: "Personal Fitness",
            createdAt: vaultResult.user.createdAt,
            lastLoginAt: new Date().toISOString(),
            emailVerified: true,
            status: "Active",
            rememberMe,
            inactivityTimeoutMinutes: 30,
          };
          await saveUserAccountToCloud(vaultResult.user.uid, account);
        }
        return { success: true, user: syntheticUser, account };
      }
      return { success: false, error: vaultResult.error || "Invalid email or password." };
    }
    let msg = err?.message || "Authentication failed";
    if (
      err?.code === "auth/user-not-found" ||
      err?.code === "auth/wrong-password" ||
      err?.code === "auth/invalid-credential"
    ) {
      msg = "Invalid email or password. Please check your credentials or click 'Forgot Password'.";
    } else if (err?.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    } else if (err?.code === "auth/too-many-requests") {
      msg = "Too many failed attempts. Please try again in a few minutes or reset your password.";
    } else if (err?.code === "auth/user-disabled") {
      msg = "This account has been disabled. Please contact the administrator.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Send Password Reset Email Link
 */
export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!auth) {
    return { success: false, error: "Authentication service unavailable" };
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: `Password reset link has been dispatched to ${email.trim()}. Please check your inbox and spam folder.`,
    };
  } catch (err: any) {
    console.error("Password reset error:", err);
    if (isEmailPasswordDisabledError(err)) {
      const resetRes = await resetVaultPassword(email.trim());
      if (resetRes.success) {
        return { success: true, message: resetRes.message };
      }
      return { success: false, error: resetRes.error || "Failed to reset password" };
    }
    let msg = err?.message || "Failed to send reset email";
    if (err?.code === "auth/user-not-found") {
      msg = "No registered account found with this email address.";
    } else if (err?.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Change / Update Current User Password
 */
export async function changeUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!auth || !auth.currentUser) {
    return { success: false, error: "No authenticated user session found" };
  }
  try {
    await updatePassword(auth.currentUser, newPassword);
    return { success: true };
  } catch (err: any) {
    console.error("Change password error:", err);
    let msg = err?.message || "Failed to update password";
    if (err?.code === "auth/requires-recent-login") {
      msg = "This operation is sensitive and requires recent login. Please log in again before changing password.";
    } else if (err?.code === "auth/weak-password") {
      msg = "Password should be at least 6 characters.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Change / Update Current User Email
 */
export async function changeUserEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  if (!auth || !auth.currentUser) {
    return { success: false, error: "No authenticated user session found" };
  }
  try {
    await updateEmail(auth.currentUser, newEmail.trim());
    const uid = auth.currentUser.uid;
    const account = await fetchUserAccountFromCloud(uid);
    if (account) {
      account.email = newEmail.trim();
      await saveUserAccountToCloud(uid, account);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Change email error:", err);
    let msg = err?.message || "Failed to update email";
    if (err?.code === "auth/requires-recent-login") {
      msg = "This operation is sensitive and requires recent login. Please log in again.";
    } else if (err?.code === "auth/email-already-in-use") {
      msg = "This email address is already in use by another account.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Send Verification Email to Current User
 */
export async function sendUserEmailVerification(): Promise<{ success: boolean; error?: string }> {
  if (!auth || !auth.currentUser) {
    return { success: false, error: "No authenticated user found" };
  }
  try {
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (err: any) {
    console.error("Email verification dispatch error:", err);
    return { success: false, error: err?.message || "Failed to send verification email" };
  }
}

/**
 * Delete User Account from Auth and Cloud
 */
export async function deleteUserAccountAndCloudData(userId: string): Promise<{ success: boolean; error?: string }> {
  const effectiveUserId = resolveUserId(userId);
  try {
    if (db) {
      // Remove allUsers registry record
      try {
        await deleteDoc(doc(db, "allUsers", effectiveUserId));
      } catch (e) {}
      // Remove user profile doc
      try {
        await deleteDoc(doc(db, "users", effectiveUserId, "account", "profile"));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, "users", effectiveUserId, "fitnessData", "currentState"));
      } catch (e) {}
    }

    if (auth && auth.currentUser && auth.currentUser.uid === effectiveUserId) {
      await deleteUser(auth.currentUser);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Delete user account error:", err);
    let msg = err?.message || "Failed to delete account";
    if (err?.code === "auth/requires-recent-login") {
      msg = "Security confirmation required: Please log in again to confirm account deletion.";
    }
    return { success: false, error: msg };
  }
}

export const deleteUserAccount = deleteUserAccountAndCloudData;

/**
 * Sign In with Google Popup
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!auth) {
    return { success: false, error: "Authentication service unavailable" };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let account = await fetchUserAccountFromCloud(user.uid);
    if (!account) {
      account = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "FitPulse Athlete",
        photoURL: user.photoURL || undefined,
        companyName: "FitPulse Athletic Pro",
        designation: "Fitness Athlete",
        role: user.email?.toLowerCase().includes("admin") ? "Admin" : "Staff",
        department: "Athletic Performance",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified || true,
        status: "Active",
        rememberMe: true,
        inactivityTimeoutMinutes: 30,
      };
      await saveUserAccountToCloud(user.uid, account);
    } else {
      if (account.status === "Disabled" || account.status === "Suspended") {
        await signOut(auth);
        return {
          success: false,
          error: "Your account is disabled. Please contact an administrator.",
        };
      }
      account.lastLoginAt = new Date().toISOString();
      await saveUserAccountToCloud(user.uid, account);
    }

    return { success: true, user, account };
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return { success: false, error: err?.message || "Google Sign-In failed" };
  }
}

/**
 * Sign Out from Firebase
 */
export async function logOutFromCloud(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }
}

/**
 * Auth state listener
 */
export function onCloudAuthStateChanged(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ==========================================
// 2. USER ACCOUNT & PROFILE CLOUD STORAGE
// ==========================================

export async function saveUserAccountToCloud(userId: string, account: UserAccount): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/account/profile`;
  try {
    // 1. Save in user private tree
    const docRef = doc(db, "users", effectiveUserId, "account", "profile");
    await setDoc(docRef, sanitizeForFirestore(account), { merge: true });

    // 2. Save in system directory for Admin user management
    try {
      const allUsersRef = doc(db, "allUsers", effectiveUserId);
      await setDoc(allUsersRef, sanitizeForFirestore(account), { merge: true });
    } catch (e) {
      // Non-blocking
    }

    invalidateCachePattern(`user_account_${effectiveUserId}`);
    invalidateCachePattern("all_users");
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving user account to cloud:", err);
    return false;
  }
}

export async function fetchUserAccountFromCloud(userId: string): Promise<UserAccount | null> {
  if (!db) return null;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/account/profile`;
  
  return dedupeFetch(`user_account_${effectiveUserId}`, async () => {
    try {
      const docRef = doc(db, "users", effectiveUserId, "account", "profile");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserAccount;
      }
      // Fallback: check allUsers
      const allUsersRef = doc(db, "allUsers", effectiveUserId);
      const snap2 = await getDoc(allUsersRef);
      if (snap2.exists()) {
        return snap2.data() as UserAccount;
      }
      return null;
    } catch (err: any) {
      if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      console.warn("Error fetching user account from cloud:", err);
      return null;
    }
  });
}

/**
 * Fetch all registered users for Admin Dashboard
 */
export async function fetchAllUsersFromCloud(): Promise<UserAccount[]> {
  if (!db) return [];
  const path = `allUsers`;
  return dedupeFetch("all_users", async () => {
    try {
      const colRef = collection(db, "allUsers");
      const snap = await getDocs(colRef);
      const users: UserAccount[] = [];
      snap.forEach((doc) => {
        if (doc.exists()) {
          users.push(doc.data() as UserAccount);
        }
      });
      return users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err: any) {
      console.warn("Error fetching all users directory:", err);
      return [];
    }
  }, 30000);
}

/**
 * Admin: Update User Status or Role
 */
export async function updateUserStatusInCloud(
  userId: string,
  status?: "Active" | "Pending" | "Disabled" | "Suspended",
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  try {
    const updates: Partial<UserAccount> = {};
    if (status) updates.status = status;
    if (role) updates.role = role;

    const userDocRef = doc(db, "users", effectiveUserId, "account", "profile");
    await setDoc(userDocRef, updates, { merge: true });

    const allUsersRef = doc(db, "allUsers", effectiveUserId);
    await setDoc(allUsersRef, updates, { merge: true });

    return { success: true };
  } catch (err: any) {
    console.error("Error updating user status:", err);
    return { success: false, error: err?.message || "Failed to update user status" };
  }
}

/**
 * Admin: Send password reset link to user email
 */
export async function adminResetUserPassword(email: string): Promise<{ success: boolean; error?: string }> {
  return await sendPasswordResetLink(email);
}

/**
 * Save User Profile to Cloud
 */
export async function saveUserProfileToCloud(userId: string, profile: UserProfile): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/account/fitnessProfile`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "account", "fitnessProfile");
    await setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
    return true;
  } catch (err: any) {
    console.warn("Error saving user profile to cloud:", err);
    return false;
  }
}

/**
 * Fetch User Profile from Cloud
 */
export async function fetchUserProfileFromCloud(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/account/fitnessProfile`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "account", "fitnessProfile");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err: any) {
    console.warn("Error fetching user profile from cloud:", err);
    return null;
  }
}

// ==========================================
// 2.5 BROADCAST ANNOUNCEMENTS & NOTIFICATIONS
// ==========================================

export async function saveBroadcastAnnouncement(announcement: BroadcastAnnouncement): Promise<boolean> {
  if (!db) return true;
  const path = `announcements/${announcement.id}`;
  try {
    const docRef = doc(db, "announcements", announcement.id);
    await setDoc(docRef, sanitizeForFirestore(announcement), { merge: true });
    return true;
  } catch (err: any) {
    console.warn("Error saving announcement to cloud:", err);
    return false;
  }
}

export async function fetchBroadcastAnnouncements(): Promise<BroadcastAnnouncement[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, "announcements");
    const snap = await getDocs(colRef);
    const items: BroadcastAnnouncement[] = [];
    snap.forEach((d) => {
      items.push(d.data() as BroadcastAnnouncement);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err: any) {
    console.warn("Error fetching announcements:", err);
    return [];
  }
}

export function subscribeToAnnouncements(
  callback: (announcements: BroadcastAnnouncement[]) => void
): () => void {
  if (!db) return () => {};
  try {
    const colRef = collection(db, "announcements");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: BroadcastAnnouncement[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as BroadcastAnnouncement);
        });
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        console.info("[Firestore Announcements] Operating in cached/offline state:", error?.message);
      }
    );
  } catch (err) {
    console.warn("Error subscribing to announcements:", err);
    return () => {};
  }
}

// ==========================================
// 3. LOGIN HISTORY STORAGE
// ==========================================

export async function saveLoginHistoryToCloud(userId: string, record: LoginHistoryRecord): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/loginHistory/${record.id}`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "loginHistory", record.id);
    await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving login history to cloud:", err);
    return false;
  }
}

export async function fetchLoginHistoryFromCloud(userId: string): Promise<LoginHistoryRecord[]> {
  if (!db) return [];
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/loginHistory`;
  try {
    const colRef = collection(db, "users", effectiveUserId, "loginHistory");
    const snapshot = await getDocs(colRef);
    const records: LoginHistoryRecord[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as LoginHistoryRecord);
    });
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn("Error fetching login history from cloud:", err);
    return [];
  }
}

// ==========================================
// 4. ENTERPRISE RATE CHARTS
// ==========================================

export async function saveRateChartToCloud(userId: string, chart: EnterpriseRateChart): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/rateCharts/${chart.id}`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "rateCharts", chart.id);
    await setDoc(docRef, sanitizeForFirestore(chart), { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving rate chart to cloud:", err);
    return false;
  }
}

export async function fetchRateChartsFromCloud(userId: string): Promise<EnterpriseRateChart[]> {
  if (!db) return [];
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/rateCharts`;
  try {
    const colRef = collection(db, "users", effectiveUserId, "rateCharts");
    const snapshot = await getDocs(colRef);
    const records: EnterpriseRateChart[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as EnterpriseRateChart);
    });
    return records;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn("Error fetching rate charts from cloud:", err);
    return [];
  }
}

// ==========================================
// 5. DYNAMIC FORMS & SUBMISSIONS
// ==========================================

export async function saveFormSubmissionToCloud(userId: string, form: FormSubmissionRecord): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/forms/${form.id}`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "forms", form.id);
    await setDoc(docRef, sanitizeForFirestore(form), { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving form submission to cloud:", err);
    return false;
  }
}

export async function fetchFormSubmissionsFromCloud(userId: string): Promise<FormSubmissionRecord[]> {
  if (!db) return [];
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/forms`;
  try {
    const colRef = collection(db, "users", effectiveUserId, "forms");
    const snapshot = await getDocs(colRef);
    const records: FormSubmissionRecord[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as FormSubmissionRecord);
    });
    return records;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn("Error fetching form submissions from cloud:", err);
    return [];
  }
}

// ==========================================
// 6. GROUP COHORT PROGRESS REPORTS
// ==========================================

export async function saveGroupReportToCloud(userId: string, report: GroupProgressReport): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/groupReports/${report.id}`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "groupReports", report.id);
    await setDoc(docRef, sanitizeForFirestore(report), { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving group report to cloud:", err);
    return false;
  }
}

export async function fetchGroupReportsFromCloud(userId: string): Promise<GroupProgressReport[]> {
  if (!db) return [];
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/groupReports`;
  try {
    const colRef = collection(db, "users", effectiveUserId, "groupReports");
    const snapshot = await getDocs(colRef);
    const records: GroupProgressReport[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as GroupProgressReport);
    });
    return records;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn("Error fetching group reports from cloud:", err);
    return [];
  }
}

// ==========================================
// 7. AUDIT LOGS & ACTIVITIES
// ==========================================

export async function saveAuditLogToCloud(userId: string, logEntry: AuditLogEntry): Promise<boolean> {
  if (!db) return true;
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/auditLogs/${logEntry.id}`;
  try {
    const docRef = doc(db, "users", effectiveUserId, "auditLogs", logEntry.id);
    await setDoc(docRef, sanitizeForFirestore(logEntry), { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Error saving audit log to cloud:", err);
    return false;
  }
}

export async function fetchAuditLogsFromCloud(userId: string): Promise<AuditLogEntry[]> {
  if (!db) return [];
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/auditLogs`;
  try {
    const colRef = collection(db, "users", effectiveUserId, "auditLogs");
    const snapshot = await getDocs(colRef);
    const records: AuditLogEntry[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as AuditLogEntry);
    });
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn("Error fetching audit logs from cloud:", err);
    return [];
  }
}

// ==========================================
// 8. CUSTOM FOODS & MEAL DICTIONARY
// ==========================================

export async function saveCustomFoodToCloud(
  userId: string,
  food: CustomFoodItem
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/customFoods/${food.id}`;
  try {
    const foodDocRef = doc(db, "users", effectiveUserId, "customFoods", food.id);
    await setDoc(
      foodDocRef,
      {
        ...sanitizeForFirestore(food),
        userId: effectiveUserId,
        updatedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore custom food save error:", err);
    return { success: false, error: err?.message || "Failed to save custom food to cloud" };
  }
}

export async function deleteCustomFoodFromCloud(
  userId: string,
  foodId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/customFoods/${foodId}`;
  try {
    const foodDocRef = doc(db, "users", effectiveUserId, "customFoods", foodId);
    await deleteDoc(foodDocRef);
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    console.error("Firestore custom food delete error:", err);
    return { success: false, error: err?.message || "Failed to delete custom food from cloud" };
  }
}

export async function fetchCustomFoodsFromCloud(
  userId: string
): Promise<{ success: boolean; data?: CustomFoodItem[]; error?: string }> {
  if (!db) return { success: false, error: "Cloud database not initialized" };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/customFoods`;
  try {
    const foodsColRef = collection(db, "users", effectiveUserId, "customFoods");
    const snapshot = await getDocs(foodsColRef);
    const items: CustomFoodItem[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as CustomFoodItem);
    });
    return { success: true, data: items };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    console.error("Firestore custom foods fetch error:", err);
    return { success: false, error: err?.message || "Failed to fetch custom foods from cloud" };
  }
}

// ==========================================
// 9. DAILY & MONTHLY REPORTS
// ==========================================

export async function saveDailyReportToCloud(
  userId: string,
  date: string,
  report: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/dailyReports/${date}`;
  try {
    const reportDocRef = doc(db, "users", effectiveUserId, "dailyReports", date);
    await setDoc(
      reportDocRef,
      {
        userId: effectiveUserId,
        date,
        report: sanitizeForFirestore(report),
        savedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore report save error:", err);
    return { success: false, error: err?.message || "Failed to save report to cloud" };
  }
}

export async function saveSubmittedDailyReportToCloud(
  userId: string,
  date: string,
  submission: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/submittedDailyReports/${date}`;
  try {
    const subDocRef = doc(db, "users", effectiveUserId, "submittedDailyReports", date);
    await setDoc(
      subDocRef,
      {
        userId: effectiveUserId,
        date,
        submission: sanitizeForFirestore(submission),
        submittedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore daily submission save error:", err);
    return { success: false, error: err?.message || "Failed to submit daily report to cloud" };
  }
}

export async function saveMonthlyReportToCloud(
  userId: string,
  yearMonth: string,
  report: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/monthlyReports/${yearMonth}`;
  try {
    const reportDocRef = doc(db, "users", effectiveUserId, "monthlyReports", yearMonth);
    await setDoc(
      reportDocRef,
      {
        userId: effectiveUserId,
        yearMonth,
        report: sanitizeForFirestore(report),
        savedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore monthly report save error:", err);
    return { success: false, error: err?.message || "Failed to save monthly report to cloud" };
  }
}

export async function saveSubmittedMonthlyReportToCloud(
  userId: string,
  yearMonth: string,
  submission: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: true };
  const effectiveUserId = resolveUserId(userId);
  const path = `users/${effectiveUserId}/submittedMonthlyReports/${yearMonth}`;
  try {
    const subDocRef = doc(db, "users", effectiveUserId, "submittedMonthlyReports", yearMonth);
    await setDoc(
      subDocRef,
      {
        userId: effectiveUserId,
        yearMonth,
        submission: sanitizeForFirestore(submission),
        submittedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore monthly submission save error:", err);
    return { success: false, error: err?.message || "Failed to submit monthly report to cloud" };
  }
}

// ==========================================
// 10. COMPLETE APP STATE CLOUD SYNC & RESTORE
// ==========================================

// Single in-flight lock and queue manager for syncAppStateToCloud
let isSyncInFlight = false;
let pendingSyncTask: { userId: string; state: AppState; resolve: (val: any) => void } | null = null;
let lastSyncedStateString = "";
let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 2000;

/**
 * Save / Auto-Backup complete user AppState to Firebase Cloud Firestore
 * Keyed under user's unique UID: users/{userId}/fitnessData/currentState
 */
export async function syncAppStateToCloud(
  userId: string,
  state: AppState
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Cloud database not initialized" };
  }

  // Fast offline check - do not queue writes when offline to prevent stream exhaustion
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: true };
  }

  const effectiveUserId = resolveUserId(userId);
  if (!effectiveUserId) return { success: false, error: "Invalid user ID" };

  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(effectiveUserId)) {
    return { success: false, error: "Authentication required to sync to cloud" };
  }

  // If another sync is actively in progress, queue this latest one to run right after
  if (isSyncInFlight) {
    return new Promise((resolve) => {
      pendingSyncTask = { userId: effectiveUserId, state, resolve };
    });
  }

  // Rate limit: ensure at least MIN_SYNC_INTERVAL_MS between actual writes
  const now = Date.now();
  if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL_MS) {
    return new Promise((resolve) => {
      pendingSyncTask = { userId: effectiveUserId, state, resolve };
      setTimeout(() => {
        if (!isSyncInFlight && pendingSyncTask) {
          const task = pendingSyncTask;
          pendingSyncTask = null;
          syncAppStateToCloud(task.userId, task.state).then(task.resolve);
        }
      }, MIN_SYNC_INTERVAL_MS - (now - lastSyncTimestamp));
    });
  }

  isSyncInFlight = true;
  lastSyncTimestamp = Date.now();

  const path = `users/${effectiveUserId}/fitnessData/currentState`;
  try {
    const cleanState = sanitizeForFirestore(state);
    
    // Quick diff check: if state is identical to last successfully synced state, skip Firestore write
    const stateString = JSON.stringify(cleanState);
    if (stateString === lastSyncedStateString) {
      isSyncInFlight = false;
      return { success: true };
    }

    const userDocRef = doc(db, "users", effectiveUserId, "fitnessData", "currentState");
    await setDoc(
      userDocRef,
      {
        userId: effectiveUserId,
        lastUpdated: new Date().toISOString(),
        timestamp: serverTimestamp(),
        appState: cleanState,
      },
      { merge: true }
    );

    lastSyncedStateString = stateString;
    return { success: true };
  } catch (err: any) {
    if (
      err?.code === "resource-exhausted" ||
      err?.message?.includes("resource-exhausted") ||
      err?.message?.includes("Write stream exhausted")
    ) {
      console.warn("Firestore write stream throttled. Backing off:", err.message);
      return { success: false, error: "Write stream temporarily congested. Automatic backoff engaged." };
    }
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error("Firestore sync error:", err);
    return { success: false, error: err?.message || "Failed to sync to cloud" };
  } finally {
    isSyncInFlight = false;

    // Process queued pending task if state changed while write was in flight
    if (pendingSyncTask) {
      const nextTask = pendingSyncTask;
      pendingSyncTask = null;
      setTimeout(() => {
        syncAppStateToCloud(nextTask.userId, nextTask.state).then(nextTask.resolve);
      }, 500);
    }
  }
}

/**
 * Fetch / Restore complete user AppState from Firebase Cloud Firestore
 */
export async function fetchAppStateFromCloud(
  userId: string
): Promise<{ success: boolean; data?: AppState; error?: string }> {
  if (!db) {
    return { success: false, error: "Cloud database not initialized" };
  }

  const effectiveUserId = resolveUserId(userId);
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(effectiveUserId)) {
    return { success: false, error: "Authentication required to fetch cloud backup" };
  }

  const path = `users/${effectiveUserId}/fitnessData/currentState`;
  try {
    const userDocRef = doc(db, "users", effectiveUserId, "fitnessData", "currentState");
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.appState) {
        return { success: true, data: data.appState as AppState };
      }
    }
    return { success: false, error: "No cloud backup found for this account" };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      console.warn(`[Firestore Fetch] Permission denied for path ${path}. Auth user: ${auth?.currentUser?.uid || "none"}`);
      return { success: false, error: "Missing or insufficient permissions to fetch cloud backup" };
    }
    console.error("Firestore fetch error:", err);
    return { success: false, error: err?.message || "Failed to fetch cloud backup" };
  }
}

/**
 * Real-time listener for instant multi-device cloud synchronization
 */
export function subscribeToCloudChanges(
  userId: string,
  onRemoteUpdate: (state: AppState) => void
): () => void {
  if (!db) return () => {};

  const effectiveUserId = resolveUserId(userId);
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(effectiveUserId)) {
    return () => {};
  }
  if (currentUid && currentUid !== effectiveUserId && !isAllowedUnauthenticatedId(effectiveUserId)) {
    return () => {};
  }

  const path = `users/${effectiveUserId}/fitnessData/currentState`;
  try {
    const userDocRef = doc(db, "users", effectiveUserId, "fitnessData", "currentState");
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.appState) {
            onRemoteUpdate(data.appState as AppState);
          }
        }
      },
      (error) => {
        if (error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions")) {
          console.warn(`[Firestore Subscription] Permission denied for path ${path}. Auth user: ${auth?.currentUser?.uid || "none"}`);
          return;
        }
        console.warn("Firestore real-time subscription error:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe to cloud updates:", err);
    return () => {};
  }
}

// ==========================================
// 11. BULK SAVE ALL DATA TO FIREBASE CONSOLE
// ==========================================

export interface SaveAllDataResult {
  success: boolean;
  error?: string;
  totalRecordsSaved: number;
  syncedBreakdown: {
    currentState: boolean;
    profile: boolean;
    membership: boolean;
    goals: boolean;
    activities: number;
    dailyRoutines: number;
    attendance: number;
    workoutHistory: number;
    customFoods: number;
    rateCharts: number;
    forms: number;
    groupReports: number;
    auditLogs: number;
    allUsersIndex: boolean;
  };
  databaseId: string;
  projectId: string;
  consoleUrl: string;
  timestamp: string;
}

export const FIREBASE_CONSOLE_URL =
  firebaseConfig && firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId
    ? `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`
    : `https://console.firebase.google.com/`;

/**
 * Save ALL fitness data across all collections into Firebase Firestore Console.
 * Populates individual Firestore documents & collections for easy browsing in the Firebase Console:
 * - users/{userId}/fitnessData/currentState (full state JSON backup)
 * - users/{userId}/fitnessData/profile
 * - users/{userId}/fitnessData/membership
 * - users/{userId}/fitnessData/goals
 * - users/{userId}/fitnessData/metricsSummary
 * - users/{userId}/activityLogs/{id}
 * - users/{userId}/dailyRoutines/{id}
 * - users/{userId}/attendance/{id}
 * - users/{userId}/workoutHistory/{id}
 * - users/{userId}/customFoods/{id}
 * - users/{userId}/rateCharts/{id}
 * - users/{userId}/forms/{id}
 * - users/{userId}/groupReports/{id}
 * - users/{userId}/auditLogs/{id}
 * - allUsers/{userId} (root directory entry)
 */
export async function saveAllDataToFirebaseConsole(
  userId: string,
  state: AppState,
  onProgress?: (stageName: string, progressPercent: number) => void
): Promise<SaveAllDataResult> {
  const result: SaveAllDataResult = {
    success: false,
    totalRecordsSaved: 0,
    syncedBreakdown: {
      currentState: false,
      profile: false,
      membership: false,
      goals: false,
      activities: 0,
      dailyRoutines: 0,
      attendance: 0,
      workoutHistory: 0,
      customFoods: 0,
      rateCharts: 0,
      forms: 0,
      groupReports: 0,
      auditLogs: 0,
      allUsersIndex: false,
    },
    databaseId: firebaseConfig?.firestoreDatabaseId || "default",
    projectId: firebaseConfig?.projectId || "",
    consoleUrl: FIREBASE_CONSOLE_URL,
    timestamp: new Date().toISOString(),
  };

  if (!db) {
    result.error = "Firebase Cloud Firestore is not initialized.";
    return result;
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    result.error = "Offline: Please connect to the internet to save data to Firebase Console.";
    return result;
  }

  const effectiveUserId = resolveUserId(userId);
  if (!effectiveUserId) {
    result.error = "Invalid User ID for Firebase Console save.";
    return result;
  }

  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(effectiveUserId)) {
    result.error = "Authentication required to save data to cloud.";
    return result;
  }

  try {
    onProgress?.("1/6: मास्टर स्नॅपशॉट (Master Snapshot) सेव्ह करत आहे...", 15);

    // 1. Master currentState document
    const cleanState = sanitizeForFirestore(state);
    const currentStateRef = doc(db, "users", effectiveUserId, "fitnessData", "currentState");
    await setDoc(
      currentStateRef,
      {
        userId: effectiveUserId,
        lastUpdated: new Date().toISOString(),
        timestamp: serverTimestamp(),
        appState: cleanState,
        schemaVersion: "2.5.0",
        appName: "FitPulse Pro Enterprise",
      },
      { merge: true }
    );
    result.syncedBreakdown.currentState = true;
    result.totalRecordsSaved += 1;

    onProgress?.("2/6: प्रोफाईल, गोल्स आणि मेंबरशिप (Profile & Membership) सेव्ह करत आहे...", 30);

    // 2. Structured profile, membership, goals, summary
    if (state.profile) {
      const profileRef = doc(db, "users", effectiveUserId, "fitnessData", "profile");
      await setDoc(
        profileRef,
        {
          ...sanitizeForFirestore(state.profile),
          userId: effectiveUserId,
          lastUpdated: new Date().toISOString(),
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );
      result.syncedBreakdown.profile = true;
      result.totalRecordsSaved += 1;
    }

    if (state.membership) {
      const membershipRef = doc(db, "users", effectiveUserId, "fitnessData", "membership");
      await setDoc(
        membershipRef,
        {
          ...sanitizeForFirestore(state.membership),
          userId: effectiveUserId,
          lastUpdated: new Date().toISOString(),
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );
      result.syncedBreakdown.membership = true;
      result.totalRecordsSaved += 1;
    }

    if (state.fitnessGoals) {
      const goalsRef = doc(db, "users", effectiveUserId, "fitnessData", "goals");
      await setDoc(
        goalsRef,
        {
          ...sanitizeForFirestore(state.fitnessGoals),
          userId: effectiveUserId,
          lastUpdated: new Date().toISOString(),
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );
      result.syncedBreakdown.goals = true;
      result.totalRecordsSaved += 1;
    }

    // Key metrics summary document
    const summaryRef = doc(db, "users", effectiveUserId, "fitnessData", "metricsSummary");
    await setDoc(
      summaryRef,
      {
        userId: effectiveUserId,
        totalActivities: state.activityLogs?.length || 0,
        totalAttendanceDays: Object.keys(state.attendance || {}).length,
        totalWorkouts: state.workoutHistory?.length || 0,
        totalCustomFoods: state.customFoods?.length || 0,
        totalRateCharts: state.rateCharts?.length || 0,
        totalForms: state.forms?.length || 0,
        totalGroupReports: state.groupReports?.length || 0,
        totalAuditLogs: state.auditLogs?.length || 0,
        lastBackupAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    result.totalRecordsSaved += 1;

    onProgress?.("3/6: ॲक्टिव्हिटी आणि वर्कआउट इतिहास (Activities & Workouts) सेव्ह करत आहे...", 50);

    // 3. Activity Logs subcollection
    if (state.activityLogs && state.activityLogs.length > 0) {
      for (const act of state.activityLogs) {
        const actId = act.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const actRef = doc(db, "users", effectiveUserId, "activityLogs", actId);
        await setDoc(
          actRef,
          {
            ...sanitizeForFirestore(act),
            userId: effectiveUserId,
            timestamp: act.date || new Date().toISOString(),
          },
          { merge: true }
        );
        result.syncedBreakdown.activities += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Workout history
    if (state.workoutHistory && state.workoutHistory.length > 0) {
      for (const w of state.workoutHistory) {
        const wId = w.id || `workout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const wRef = doc(db, "users", effectiveUserId, "workoutHistory", wId);
        await setDoc(
          wRef,
          {
            ...sanitizeForFirestore(w),
            userId: effectiveUserId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        result.syncedBreakdown.workoutHistory += 1;
        result.totalRecordsSaved += 1;
      }
    }

    onProgress?.("4/6: अटेंडन्स आणि डेली रुटीन (Attendance & Routines) सेव्ह करत आहे...", 70);

    // 4. Attendance records
    if (state.attendance) {
      const attendanceEntries = Object.entries(state.attendance);
      for (const [dateKey, record] of attendanceEntries) {
        const attRef = doc(db, "users", effectiveUserId, "attendance", dateKey);
        await setDoc(
          attRef,
          {
            ...sanitizeForFirestore(record),
            dateKey,
            userId: effectiveUserId,
            savedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        result.syncedBreakdown.attendance += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Daily Routines
    if (state.dailyRoutines) {
      const routineEntries = Object.entries(state.dailyRoutines);
      for (const [dateKey, routine] of routineEntries) {
        const routineRef = doc(db, "users", effectiveUserId, "dailyRoutines", dateKey);
        await setDoc(
          routineRef,
          {
            ...sanitizeForFirestore(routine),
            dateKey,
            userId: effectiveUserId,
            savedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        result.syncedBreakdown.dailyRoutines += 1;
        result.totalRecordsSaved += 1;
      }
    }

    onProgress?.("5/6: डाएट, फॉर्म्स आणि रिपोर्ट्स (Diet, Forms & Reports) सेव्ह करत आहे...", 85);

    // 5. Custom Foods
    if (state.customFoods && state.customFoods.length > 0) {
      for (const food of state.customFoods) {
        const foodId = food.id || `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const foodRef = doc(db, "users", effectiveUserId, "customFoods", foodId);
        await setDoc(
          foodRef,
          {
            ...sanitizeForFirestore(food),
            userId: effectiveUserId,
          },
          { merge: true }
        );
        result.syncedBreakdown.customFoods += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Rate Charts (both under user and global)
    if (state.rateCharts && state.rateCharts.length > 0) {
      for (const chart of state.rateCharts) {
        const chartId = chart.id || `chart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const chartRef = doc(db, "users", effectiveUserId, "rateCharts", chartId);
        await setDoc(chartRef, sanitizeForFirestore(chart), { merge: true });
        
        // Also ensure global rateCharts has it
        try {
          const globalChartRef = doc(db, "rateCharts", chartId);
          await setDoc(globalChartRef, sanitizeForFirestore(chart), { merge: true });
        } catch {}

        result.syncedBreakdown.rateCharts += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Forms
    if (state.forms && state.forms.length > 0) {
      for (const form of state.forms) {
        const formId = form.id || `form-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const formRef = doc(db, "users", effectiveUserId, "forms", formId);
        await setDoc(formRef, sanitizeForFirestore(form), { merge: true });
        result.syncedBreakdown.forms += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Group Reports
    if (state.groupReports && state.groupReports.length > 0) {
      for (const rep of state.groupReports) {
        const repId = rep.id || `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const repRef = doc(db, "users", effectiveUserId, "groupReports", repId);
        await setDoc(repRef, sanitizeForFirestore(rep), { merge: true });
        result.syncedBreakdown.groupReports += 1;
        result.totalRecordsSaved += 1;
      }
    }

    // Audit Logs
    if (state.auditLogs && state.auditLogs.length > 0) {
      const recentLogs = state.auditLogs.slice(0, 50);
      for (const logItem of recentLogs) {
        const logId = logItem.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const logRef = doc(db, "users", effectiveUserId, "auditLogs", logId);
        await setDoc(logRef, sanitizeForFirestore(logItem), { merge: true });
        result.syncedBreakdown.auditLogs += 1;
        result.totalRecordsSaved += 1;
      }
    }

    onProgress?.("6/6: युजर डिरेक्टरी इंडेक्स (allUsers Index) अपडेट करत आहे...", 95);

    // 6. Root Directory allUsers document
    try {
      const allUsersRef = doc(db, "allUsers", effectiveUserId);
      await setDoc(
        allUsersRef,
        {
          uid: effectiveUserId,
          displayName: state.profile?.fullName || state.currentUserAccount?.displayName || "Athlete",
          email: state.profile?.email || state.currentUserAccount?.email || "user@fitpulse.app",
          role: state.currentUserAccount?.role || "Admin",
          fitnessGoal: state.profile?.fitnessGoal || "General Fitness",
          currentWeightKg: state.profile?.currentWeightKg || null,
          totalWorkouts: state.workoutHistory?.length || 0,
          totalActivities: state.activityLogs?.length || 0,
          membershipTier: state.membership?.membershipType || "Standard",
          lastSyncAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );
      result.syncedBreakdown.allUsersIndex = true;
      result.totalRecordsSaved += 1;
    } catch (idxErr) {
      console.warn("Notice: allUsers index update skipped:", idxErr);
    }

    onProgress?.("यशस्वी! सर्व डेटा फायरबेस कन्सोलमध्ये सेव्ह झाला आहे!", 100);
    result.success = true;
    return result;
  } catch (err: any) {
    console.error("Failed to save all data to Firebase Console:", err);
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUserId}`);
    }
    result.error = err?.message || "सर्व डेटा सेव्ह करताना त्रुटी आली.";
    return result;
  }
}

// ==========================================
// USER MANAGEMENT CLOUD OPERATIONS
// ==========================================

export async function deleteUserFromCloud(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    // Delete from allUsers
    await deleteDoc(doc(db, "allUsers", userId)).catch(() => {});
    // Delete user account doc
    await deleteDoc(doc(db, "users", userId, "account", "main")).catch(() => {});
    // Delete user profile doc
    await deleteDoc(doc(db, "users", userId)).catch(() => {});
    invalidateCachePattern("allUsers");
    return { success: true };
  } catch (err: any) {
    console.error("deleteUserFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete user" };
  }
}

// ==========================================
// PRODUCT MANAGEMENT CLOUD OPERATIONS
// ==========================================

export async function saveProductToCloud(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    const id = product.id || `prod-${Date.now()}`;
    const productData = {
      ...product,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "products", id), sanitizeForFirestore(productData), { merge: true });
    invalidateCachePattern("products");
    return { success: true };
  } catch (err: any) {
    console.error("saveProductToCloud error:", err);
    if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
      handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
    }
    return { success: false, error: err.message || "Failed to save product" };
  }
}

export async function fetchProductsFromCloud(): Promise<Product[]> {
  if (!db) return [];
  return dedupeFetch("products", async () => {
    try {
      const snap = await getDocs(collection(db!, "products"));
      const list: Product[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Product);
      });
      return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (err: any) {
      console.warn("fetchProductsFromCloud warn:", err);
      return [];
    }
  }, 10000);
}

export async function deleteProductFromCloud(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await deleteDoc(doc(db, "products", productId));
    invalidateCachePattern("products");
    return { success: true };
  } catch (err: any) {
    console.error("deleteProductFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete product" };
  }
}

// ==========================================
// EXERCISE DATABASE CLOUD OPERATIONS
// ==========================================

export async function saveExerciseToCloud(exercise: Exercise): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    const id = exercise.id || `ex-${Date.now()}`;
    const data = { ...exercise, id };
    await setDoc(doc(db, "exercises", id), sanitizeForFirestore(data), { merge: true });
    invalidateCachePattern("exercises");
    return { success: true };
  } catch (err: any) {
    console.error("saveExerciseToCloud error:", err);
    return { success: false, error: err.message || "Failed to save exercise" };
  }
}

export async function fetchExercisesFromCloud(): Promise<Exercise[]> {
  if (!db) return [];
  return dedupeFetch("exercises", async () => {
    try {
      const snap = await getDocs(collection(db!, "exercises"));
      const list: Exercise[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Exercise);
      });
      return list;
    } catch (err: any) {
      console.warn("fetchExercisesFromCloud warn:", err);
      return [];
    }
  }, 15000);
}

export async function deleteExerciseFromCloud(exerciseId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await deleteDoc(doc(db, "exercises", exerciseId));
    invalidateCachePattern("exercises");
    return { success: true };
  } catch (err: any) {
    console.error("deleteExerciseFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete exercise" };
  }
}

// ==========================================
// DIET PLAN CLOUD OPERATIONS
// ==========================================

export async function saveDietPlanToCloud(dietPlan: GeneratedDietPlan): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    const id = dietPlan.id || `dp-${Date.now()}`;
    const data = { ...dietPlan, id };
    await setDoc(doc(db, "dietPlans", id), sanitizeForFirestore(data), { merge: true });
    invalidateCachePattern("dietPlans");
    return { success: true };
  } catch (err: any) {
    console.error("saveDietPlanToCloud error:", err);
    return { success: false, error: err.message || "Failed to save diet plan" };
  }
}

export async function fetchDietPlansFromCloud(): Promise<GeneratedDietPlan[]> {
  if (!db) return [];
  return dedupeFetch("dietPlans", async () => {
    try {
      const snap = await getDocs(collection(db!, "dietPlans"));
      const list: GeneratedDietPlan[] = [];
      snap.forEach((d) => {
        list.push(d.data() as GeneratedDietPlan);
      });
      return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (err: any) {
      console.warn("fetchDietPlansFromCloud warn:", err);
      return [];
    }
  }, 15000);
}

export async function deleteDietPlanFromCloud(dietPlanId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await deleteDoc(doc(db, "dietPlans", dietPlanId));
    invalidateCachePattern("dietPlans");
    return { success: true };
  } catch (err: any) {
    console.error("deleteDietPlanFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete diet plan" };
  }
}

// ==========================================
// CALORIE TRACKER CLOUD OPERATIONS
// ==========================================

export async function saveCalorieLogToCloud(entry: CalorieLogEntry): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    const id = entry.id || `cal-${entry.date}`;
    const data = { ...entry, id };
    await setDoc(doc(db, "calories", id), sanitizeForFirestore(data), { merge: true });
    invalidateCachePattern("calories");
    return { success: true };
  } catch (err: any) {
    console.error("saveCalorieLogToCloud error:", err);
    return { success: false, error: err.message || "Failed to save calorie record" };
  }
}

export async function fetchCalorieLogsFromCloud(): Promise<CalorieLogEntry[]> {
  if (!db) return [];
  return dedupeFetch("calories", async () => {
    try {
      const snap = await getDocs(collection(db!, "calories"));
      const list: CalorieLogEntry[] = [];
      snap.forEach((d) => {
        list.push(d.data() as CalorieLogEntry);
      });
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err: any) {
      console.warn("fetchCalorieLogsFromCloud warn:", err);
      return [];
    }
  }, 10000);
}

export async function deleteCalorieLogFromCloud(calorieLogId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await deleteDoc(doc(db, "calories", calorieLogId));
    invalidateCachePattern("calories");
    return { success: true };
  } catch (err: any) {
    console.error("deleteCalorieLogFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete calorie record" };
  }
}

// ==========================================
// PROGRESS TRACKER CLOUD OPERATIONS
// ==========================================

export async function saveProgressMeasurementToCloud(measurement: BodyMeasurement): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    const id = measurement.id || `prog-${measurement.date}`;
    const data = { ...measurement, id };
    await setDoc(doc(db, "progress", id), sanitizeForFirestore(data), { merge: true });
    invalidateCachePattern("progress");
    return { success: true };
  } catch (err: any) {
    console.error("saveProgressMeasurementToCloud error:", err);
    return { success: false, error: err.message || "Failed to save progress entry" };
  }
}

export async function fetchProgressMeasurementsFromCloud(): Promise<BodyMeasurement[]> {
  if (!db) return [];
  return dedupeFetch("progress", async () => {
    try {
      const snap = await getDocs(collection(db!, "progress"));
      const list: BodyMeasurement[] = [];
      snap.forEach((d) => {
        list.push(d.data() as BodyMeasurement);
      });
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err: any) {
      console.warn("fetchProgressMeasurementsFromCloud warn:", err);
      return [];
    }
  }, 10000);
}

export async function deleteProgressMeasurementFromCloud(measurementId: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await deleteDoc(doc(db, "progress", measurementId));
    invalidateCachePattern("progress");
    return { success: true };
  } catch (err: any) {
    console.error("deleteProgressMeasurementFromCloud error:", err);
    return { success: false, error: err.message || "Failed to delete progress measurement" };
  }
}

// ==========================================
// SETTINGS CLOUD OPERATIONS
// ==========================================

export async function saveAppSettingsToCloud(settings: AppSettings, userId = "global-settings"): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not connected" };
  try {
    await setDoc(doc(db, "settings", userId), sanitizeForFirestore(settings), { merge: true });
    invalidateCachePattern("settings");
    return { success: true };
  } catch (err: any) {
    console.error("saveAppSettingsToCloud error:", err);
    return { success: false, error: err.message || "Failed to save settings" };
  }
}

export async function fetchAppSettingsFromCloud(userId = "global-settings"): Promise<AppSettings | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "settings", userId));
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return null;
  } catch (err: any) {
    console.warn("fetchAppSettingsFromCloud warn:", err);
    return null;
  }
}

export const saveSettingsToCloud = saveAppSettingsToCloud;
export const fetchSettingsFromCloud = fetchAppSettingsFromCloud;

export async function syncOfflineCacheToCloud(): Promise<boolean> {
  return true;
}

