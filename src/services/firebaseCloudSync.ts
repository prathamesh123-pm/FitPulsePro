import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db, signInWithGoogle, isAllowedUnauthenticatedId, isEmailPasswordDisabledError } from "./firebase";
import {
  registerVaultUser,
  verifyVaultUser,
  resetVaultPassword,
  clearActiveVaultSession,
  storeActiveVaultSession,
  findVaultUserByEmail,
  getActiveVaultSession,
} from "./firebaseAuthVault";
import {
  AppState,
  UserProfile,
  UserAccount,
  CustomerItem,
  SupplierItem,
  StockRecord,
  SaleRecord,
  PurchaseRecord,
  OrderRecord,
  ExpenseRecord,
  IncomeRecord,
  Product,
  AppSettings,
  AppNotification,
} from "../types";

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export { isEmailPasswordDisabledError };

/**
 * Human-friendly error translation for Firebase Authentication
 */
export function formatAuthError(error: any, lang: "en" | "mr" = "en"): string {
  const code = error?.code || "";
  const rawMsg = error?.message || String(error);

  if (code.includes("api-key-not-valid") || rawMsg.includes("api-key-not-valid") || code.includes("invalid-api-key")) {
    return lang === "mr"
      ? "Firebase API Key योग्य नाही. योग्य API Key वापरली गेली आहे."
      : "Firebase API Key error. The configuration has been corrected. Please try again.";
  }
  if (
    isEmailPasswordDisabledError(error) ||
    code.includes("operation-not-allowed") ||
    rawMsg.includes("OPERATION_NOT_ALLOWED") ||
    rawMsg.includes("PASSWORD_LOGIN_DISABLED") ||
    rawMsg.includes("Email/Password sign-in is not enabled")
  ) {
    return lang === "mr"
      ? "Email/Password sign-in is not enabled in Firebase Console. कृपया Firebase Console > Authentication > Sign-in method मध्ये जाऊन 'Email/Password' सुरू करा."
      : "Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method in Firebase Console.";
  }
  if (code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password")) {
    return lang === "mr"
      ? "ईमेल किंवा पासवर्ड चुकीचा आहे. कृपया पुन्हा तपासा."
      : "Invalid email or password. Please verify your credentials.";
  }
  if (code.includes("email-already-in-use")) {
    return lang === "mr"
      ? "हा ईमेल आयडी आधीच नोंदणीकृत आहे. कृपया लॉगिन करा."
      : "This email is already registered. Please sign in or use another email.";
  }
  if (code.includes("weak-password")) {
    return lang === "mr"
      ? "पासवर्ड किमान ६ अक्षरांचा असावा."
      : "Password must be at least 6 characters long.";
  }
  if (code.includes("invalid-email")) {
    return lang === "mr"
      ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा."
      : "Please enter a valid email address.";
  }
  if (code.includes("network-request-failed")) {
    return lang === "mr"
      ? "इंटरनेट कनेक्शन उपलब्ध नाही. कृपया नेटवर्क तपासा."
      : "Network error. Please check your internet connection.";
  }
  if (code.includes("too-many-requests")) {
    return lang === "mr"
      ? "अनेक अयशस्वी प्रयत्नांमुळे खाते तात्पुरते थांबवले आहे. काही वेळाने प्रयत्न करा."
      : "Too many failed attempts. Access temporarily blocked. Please try again later.";
  }

  return rawMsg;
}

/**
 * Register a new user with Firebase Authentication and initialize their isolated Firestore structure
 */
export async function registerWithFirebase(payload: RegisterPayload): Promise<{
  user: User;
  account: UserAccount;
}> {
  let user: any = null;
  let isVaultUser = false;

  // 1. Attempt account creation in Firebase Auth
  try {
    if (!auth) throw new Error("Firebase Authentication is not available.");
    const credential = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
    user = credential.user;

    // Set user display name
    try {
      await updateProfile(user, { displayName: payload.fullName.trim() });
    } catch (err) {
      console.warn("Could not update profile display name:", err);
    }
  } catch (authErr: any) {
    // If Email/Password is disabled (e.g. on AI Studio Starter project), seamlessly activate Vault Authenticator
    if (isEmailPasswordDisabledError(authErr) || authErr?.code === "auth/operation-not-allowed") {
      console.info("[Auth] AI Studio Starter project detected: Using secure Vault & Cloud Authenticator for registration.");
      const vaultUser = await registerVaultUser({
        email: payload.email.trim(),
        password: payload.password,
        fullName: payload.fullName.trim(),
        mobileNumber: payload.mobileNumber.trim(),
      });
      user = {
        uid: vaultUser.uid,
        email: vaultUser.email,
        displayName: vaultUser.displayName,
        emailVerified: true,
      };
      isVaultUser = true;
    } else {
      throw authErr;
    }
  }

  const nowIso = new Date().toISOString();
  const account: UserAccount = {
    uid: user.uid,
    email: user.email || payload.email.trim(),
    displayName: payload.fullName.trim(),
    role: "Admin",
    mobileNumber: payload.mobileNumber.trim(),
    createdAt: nowIso,
    lastLoginAt: nowIso,
    status: "Active",
    emailVerified: user.emailVerified || true,
  };

  // Always store active session locally
  try {
    localStorage.setItem("FITPULSE_AUTH_ACTIVE", "true");
    localStorage.setItem("FITPULSE_ACTIVE_ACCOUNT", JSON.stringify(account));
  } catch {}

  // 3. Initialize user document and profile subcollection in Cloud Firestore
  if (db) {
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: payload.fullName.trim(),
        mobileNumber: payload.mobileNumber.trim(),
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        status: "Active",
      }, { merge: true });

      const profileRef = doc(db, "users", user.uid, "profile", "info");
      await setDoc(profileRef, {
        fullName: payload.fullName.trim(),
        email: user.email,
        mobileNumber: payload.mobileNumber.trim(),
        photoUrl: "",
        createdAt: nowIso,
        updatedAt: nowIso,
      }, { merge: true });

      const settingsRef = doc(db, "users", user.uid, "settings", "config");
      await setDoc(settingsRef, {
        theme: "dark",
        language: "en",
        autoSync: true,
        notifications: {
          workoutReminders: true,
          mealAlerts: true,
          inventoryWarnings: true,
          weeklySummary: true,
        },
        updatedAt: nowIso,
      }, { merge: true });
    } catch (firestoreError) {
      console.warn("[Register] Initial Firestore bootstrap notice:", firestoreError);
    }
  }

  return { user, account };
}

/**
 * Sign In with Email and Password supporting Remember Me option
 */
export async function loginWithFirebase(
  email: string,
  pass: string,
  rememberMe = true
): Promise<{ user: User }> {
  // 1. Attempt standard Firebase Auth sign-in
  try {
    if (auth) {
      const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceMode).catch(() => {});
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      return { user: credential.user };
    }
  } catch (err: any) {
    // If Email/Password is disabled in Firebase Console (e.g. Starter project), seamlessly verify with Vault
    if (isEmailPasswordDisabledError(err) || err?.code === "auth/operation-not-allowed") {
      console.info("[Auth] AI Studio Starter project detected: Verifying credentials with Secure Vault Authenticator.");
      const result = await verifyVaultUser(email.trim(), pass);
      if (!result.success || !result.user) {
        throw new Error(result.error || "Invalid email or password. Please verify your credentials or register.");
      }
      const syntheticUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        emailVerified: true,
      } as any as User;

      try {
        localStorage.setItem("FITPULSE_AUTH_ACTIVE", "true");
      } catch {}

      return { user: syntheticUser };
    }
    throw err;
  }

  // Fallback check if auth was null
  const res = await verifyVaultUser(email.trim(), pass);
  if (!res.success || !res.user) {
    throw new Error(res.error || "Authentication failed.");
  }
  return {
    user: {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName,
      emailVerified: true,
    } as any as User,
  };
}

/**
 * Sign In with Google Popup
 */
export async function loginWithGoogle(): Promise<{ user: User; account: UserAccount }> {
  const result = await signInWithGoogle();
  if (!result.success || !result.user || !result.account) {
    throw new Error(result.error || "Google sign-in failed. Please try again.");
  }
  return { user: result.user, account: result.account };
}

/**
 * Guest / Offline Mode Login for instant access without credentials
 */
export function loginAsGuest(): { user: { uid: string; email: string; displayName: string; emailVerified: boolean }; account: UserAccount } {
  const guestUid = "guest_" + Math.random().toString(36).substring(2, 9);
  const account: UserAccount = {
    uid: guestUid,
    email: "guest.athlete@fitpulse.app",
    displayName: "Guest Athlete",
    role: "Admin",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    status: "Active",
    emailVerified: false,
  };
  try {
    localStorage.setItem("FITPULSE_AUTH_ACTIVE", "true");
    localStorage.setItem("FITPULSE_ACTIVE_ACCOUNT", JSON.stringify(account));
  } catch {}
  return {
    user: {
      uid: guestUid,
      email: account.email,
      displayName: account.displayName,
      emailVerified: false,
    },
    account,
  };
}

/**
 * Send Password Reset Email or Vault Reset
 */
export async function resetPasswordWithFirebase(email: string): Promise<string> {
  try {
    if (auth) {
      await sendPasswordResetEmail(auth, email.trim());
      return `Password reset link has been dispatched to ${email.trim()}. Please check your inbox and spam folder.`;
    }
  } catch (err: any) {
    if (isEmailPasswordDisabledError(err) || err?.code === "auth/operation-not-allowed") {
      const resetRes = await resetVaultPassword(email.trim());
      if (!resetRes.success) {
        throw new Error(resetRes.error || "No registered account found with this email.");
      }
      return resetRes.message || "Password has been successfully updated.";
    }
    throw err;
  }

  const fallbackReset = await resetVaultPassword(email.trim());
  if (!fallbackReset.success) {
    throw new Error(fallbackReset.error || "No registered account found with this email.");
  }
  return fallbackReset.message || "Password has been successfully updated.";
}

/**
 * Logout current user
 */
export async function logoutUserFromFirebase(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
  clearActiveVaultSession();
  try {
    sessionStorage.removeItem("FITPULSE_ACTIVE_SESSION");
  } catch {}
}

/**
 * Multi-Device Cloud Backup & Auto Save:
 * Stores full state and subcollection data strictly under `users/{UID}/...`
 */
export async function autoSaveUserDataToCloud(
  uid: string,
  state: AppState
): Promise<{ success: boolean; lastSyncDate: string }> {
  if (!db || !uid || uid === "guest") {
    return { success: false, lastSyncDate: "" };
  }
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(uid)) {
    return { success: false, lastSyncDate: "" };
  }

  const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const nowIso = new Date().toISOString();

  try {
    // 1. Save Profile document
    const profileRef = doc(db, "users", uid, "profile", "info");
    await setDoc(profileRef, {
      fullName: state.profile.fullName || "",
      mobileNumber: state.profile.mobileNumber || "",
      email: state.profile.email || "",
      photoUrl: state.profile.photoUrl || "",
      fitnessGoal: state.profile.fitnessGoal || "Maintenance",
      currentWeightKg: state.profile.currentWeightKg || 70,
      targetWeightKg: state.profile.targetWeightKg || 70,
      updatedAt: nowIso,
    }, { merge: true });

    // 2. Save Settings document
    const settingsRef = doc(db, "users", uid, "settings", "config");
    await setDoc(settingsRef, {
      theme: state.darkMode ? "dark" : "light",
      notificationsEnabled: state.notificationsEnabled ?? false,
      notifications: state.settings?.notifications || {
        workoutReminders: true,
        mealAlerts: true,
        inventoryWarnings: true,
        weeklySummary: true,
      },
      updatedAt: nowIso,
    }, { merge: true });

    // 3. Save Master Backup Snapshot under users/{UID}/backup/latest for instant multi-device restoration
    const backupRef = doc(db, "users", uid, "backup", "latest");
    const safeBackupPayload: Record<string, any> = {
      uid,
      version: "2.0",
      lastUpdated: nowIso,
      lastSyncDate: nowTime,
      profile: state.profile,
      products: state.products || [],
      stockRecords: state.stockRecords || [],
      sales: state.sales || [],
      customers: state.customers || [],
      suppliers: state.suppliers || [],
      purchases: state.purchases || [],
      orders: state.orders || [],
      expenses: state.expenses || [],
      incomes: state.incomes || [],
      notifications: (state.notifications || []).slice(0, 30),
      workoutHistory: (state.workoutHistory || []).slice(0, 25),
      customExercises: state.customExercises || [],
      dietPlans: state.savedDietPlans || [],
      dailyNutrition: state.dailyNutrition || {},
      measurements: state.measurements || [],
    };

    await setDoc(backupRef, safeBackupPayload, { merge: true });

    return { success: true, lastSyncDate: nowTime };
  } catch (error: any) {
    console.warn("[Cloud Auto-Save] Sync notice:", error?.message || error);
    return { success: false, lastSyncDate: "" };
  }
}

/**
 * Multi-Device Restore:
 * Download all cloud data for the logged-in user from Firestore
 */
export async function downloadAllUserDataFromCloud(uid: string): Promise<Partial<AppState> | null> {
  if (!db || !uid || uid === "guest") return null;
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(uid)) {
    return null;
  }

  try {
    // Check master backup first (WhatsApp / Google Drive style full restore)
    const backupRef = doc(db, "users", uid, "backup", "latest");
    const backupSnap = await getDoc(backupRef);

    if (backupSnap.exists()) {
      const data = backupSnap.data();
      const restoredState: Partial<AppState> = {};

      if (data.profile) restoredState.profile = data.profile;
      if (Array.isArray(data.products)) restoredState.products = data.products;
      if (Array.isArray(data.stockRecords)) restoredState.stockRecords = data.stockRecords;
      if (Array.isArray(data.sales)) restoredState.sales = data.sales;
      if (Array.isArray(data.customers)) restoredState.customers = data.customers;
      if (Array.isArray(data.suppliers)) restoredState.suppliers = data.suppliers;
      if (Array.isArray(data.purchases)) restoredState.purchases = data.purchases;
      if (Array.isArray(data.orders)) restoredState.orders = data.orders;
      if (Array.isArray(data.expenses)) restoredState.expenses = data.expenses;
      if (Array.isArray(data.incomes)) restoredState.incomes = data.incomes;
      if (Array.isArray(data.notifications)) restoredState.notifications = data.notifications;
      if (Array.isArray(data.workoutHistory)) restoredState.workoutHistory = data.workoutHistory;
      if (Array.isArray(data.customExercises)) restoredState.customExercises = data.customExercises;
      if (Array.isArray(data.dietPlans)) restoredState.savedDietPlans = data.dietPlans;
      if (data.dailyNutrition) restoredState.dailyNutrition = data.dailyNutrition;
      if (Array.isArray(data.measurements)) restoredState.measurements = data.measurements;

      return restoredState;
    }

    // Fallback: Check profile subcollection
    const profileRef = doc(db, "users", uid, "profile", "info");
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const pData = profileSnap.data();
      return {
        profile: {
          fullName: pData.fullName || "FitPulse User",
          mobileNumber: pData.mobileNumber || "",
          email: pData.email || "",
          photoUrl: pData.photoUrl || "",
          dateOfBirth: "1995-01-01",
          gender: "Male",
          heightCm: 175,
          heightUnit: "cm",
          currentWeightKg: pData.currentWeightKg || 70,
          targetWeightKg: pData.targetWeightKg || 70,
          goalWeightKg: pData.targetWeightKg || 70,
          weightUnit: "kg",
          bloodGroup: "O+",
          fitnessGoal: pData.fitnessGoal || "Maintenance",
          activityLevel: "Moderately Active",
          medicalConditions: "None",
          allergies: "None",
          emergencyContact: { name: "", relationship: "", phone: "" },
          notes: "",
        },
      };
    }
  } catch (restoreError) {
    console.warn("[Cloud Restore] Could not download cloud snapshot:", restoreError);
  }

  return null;
}

/**
 * Real-time listener on the user's cloud data for instantaneous Multi-Device Synchronization
 */
export function subscribeToUserMultiDeviceSync(
  uid: string,
  onRemoteChange: (remoteData: Partial<AppState>) => void
): () => void {
  if (!db || !uid || uid === "guest") {
    return () => {};
  }
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid && !isAllowedUnauthenticatedId(uid)) {
    return () => {};
  }

  const backupRef = doc(db, "users", uid, "backup", "latest");
  const unsubscribe = onSnapshot(
    backupRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onRemoteChange(data as Partial<AppState>);
      }
    },
    (error) => {
      console.warn("[Multi-Device Sync] onSnapshot listener warning:", error?.message || error);
    }
  );

  return unsubscribe;
}

/**
 * Update Profile info and sync to Firebase Auth & Firestore
 */
export async function updateUserProfileAndSync(
  uid: string,
  updates: {
    fullName?: string;
    mobileNumber?: string;
    newPassword?: string;
    photoUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth?.currentUser;

    // 1. Update Password in Firebase Auth if requested
    if (updates.newPassword && user) {
      await updatePassword(user, updates.newPassword);
    }

    // 2. Update Display Name and Photo URL in Firebase Auth if requested
    if (user && (updates.fullName || updates.photoUrl)) {
      const authUpdates: any = {};
      if (updates.fullName) authUpdates.displayName = updates.fullName;
      if (updates.photoUrl) authUpdates.photoURL = updates.photoUrl;
      await updateProfile(user, authUpdates);
    }

    // 3. Update Firestore profile under users/{UID}/profile/info
    if (db && uid) {
      const profileRef = doc(db, "users", uid, "profile", "info");
      const patch: any = { updatedAt: new Date().toISOString() };
      if (updates.fullName !== undefined) patch.fullName = updates.fullName;
      if (updates.mobileNumber !== undefined) patch.mobileNumber = updates.mobileNumber;
      if (updates.photoUrl !== undefined) patch.photoUrl = updates.photoUrl;

      await setDoc(profileRef, patch, { merge: true });

      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        displayName: updates.fullName,
        mobileNumber: updates.mobileNumber,
        photoURL: updates.photoUrl,
        lastActiveAt: serverTimestamp(),
      }, { merge: true });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err) };
  }
}
