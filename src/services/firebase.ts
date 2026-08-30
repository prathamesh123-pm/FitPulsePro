import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { AppState, CustomFoodItem } from "../types";

let app: any = null;
let db: Firestore | null = null;
let auth: any = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("Firebase initialization warning (will use local fallback):", error);
}

export { app, db, auth };

/**
 * Save / Backup user AppState to Firebase Cloud Firestore
 */
export async function syncAppStateToCloud(
  userId: string,
  state: AppState
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Cloud database not initialized" };
  }

  try {
    const userDocRef = doc(db, "users", userId, "fitnessData", "currentState");
    // Strip functions or invalid values before writing
    const cleanState = JSON.parse(JSON.stringify(state));
    await setDoc(
      userDocRef,
      {
        userId,
        lastUpdated: new Date().toISOString(),
        timestamp: serverTimestamp(),
        appState: cleanState,
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    console.error("Firestore sync error:", err);
    return { success: false, error: err?.message || "Failed to sync to cloud" };
  }
}

/**
 * Save Daily Fitness Report permanently to Firebase Cloud Firestore
 */
export async function saveDailyReportToCloud(
  userId: string,
  date: string,
  report: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: true };
  }
  try {
    const reportDocRef = doc(db, "users", userId, "dailyReports", date);
    await setDoc(
      reportDocRef,
      {
        userId,
        date,
        report: JSON.parse(JSON.stringify(report)),
        savedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    console.error("Firestore report save error:", err);
    return { success: false, error: err?.message || "Failed to save report to cloud" };
  }
}

/**
 * Save custom food item directly to Firestore collection: users/{userId}/customFoods/{foodId}
 */
export async function saveCustomFoodToCloud(
  userId: string,
  food: CustomFoodItem
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: true };
  }
  try {
    const foodDocRef = doc(db, "users", userId, "customFoods", food.id);
    await setDoc(
      foodDocRef,
      {
        ...food,
        userId,
        updatedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    console.error("Firestore custom food save error:", err);
    return { success: false, error: err?.message || "Failed to save custom food to cloud" };
  }
}

/**
 * Delete custom food item from Firestore
 */
export async function deleteCustomFoodFromCloud(
  userId: string,
  foodId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: true };
  }
  try {
    const foodDocRef = doc(db, "users", userId, "customFoods", foodId);
    await deleteDoc(foodDocRef);
    return { success: true };
  } catch (err: any) {
    console.error("Firestore custom food delete error:", err);
    return { success: false, error: err?.message || "Failed to delete custom food from cloud" };
  }
}

/**
 * Fetch all custom foods from Firestore
 */
export async function fetchCustomFoodsFromCloud(
  userId: string
): Promise<{ success: boolean; data?: CustomFoodItem[]; error?: string }> {
  if (!db) {
    return { success: false, error: "Cloud database not initialized" };
  }
  try {
    const foodsColRef = collection(db, "users", userId, "customFoods");
    const snapshot = await getDocs(foodsColRef);
    const items: CustomFoodItem[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as CustomFoodItem);
    });
    return { success: true, data: items };
  } catch (err: any) {
    console.error("Firestore custom foods fetch error:", err);
    return { success: false, error: err?.message || "Failed to fetch custom foods from cloud" };
  }
}

/**
 * Fetch / Restore user AppState from Firebase Cloud Firestore
 */
export async function fetchAppStateFromCloud(
  userId: string
): Promise<{ success: boolean; data?: AppState; error?: string }> {
  if (!db) {
    return { success: false, error: "Cloud database not initialized" };
  }

  try {
    const userDocRef = doc(db, "users", userId, "fitnessData", "currentState");
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.appState) {
        return { success: true, data: data.appState as AppState };
      }
    }
    return { success: false, error: "No cloud backup found for this account" };
  } catch (err: any) {
    console.error("Firestore fetch error:", err);
    return { success: false, error: err?.message || "Failed to fetch cloud backup" };
  }
}

/**
 * Real-time listener for multi-device sync
 */
export function subscribeToCloudChanges(
  userId: string,
  onRemoteUpdate: (state: AppState) => void
): () => void {
  if (!db) return () => {};

  try {
    const userDocRef = doc(db, "users", userId, "fitnessData", "currentState");
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
        console.warn("Firestore real-time subscription error:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe to cloud updates:", err);
    return () => {};
  }
}

/**
 * Google Authentication Sign-In
 */
export async function signInWithGoogle(): Promise<{ user?: User; error?: string }> {
  if (!auth) {
    return { error: "Authentication service unavailable" };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return { error: err?.message || "Sign in failed" };
  }
}

/**
 * Sign Out
 */
export async function logOutFromCloud(): Promise<void> {
  if (auth) {
    await signOut(auth);
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
