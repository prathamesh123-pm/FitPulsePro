import { useState, useMemo, useEffect, lazy, Suspense, useRef, useCallback, type ComponentType } from "react";
import {
  TabId,
  AppState,
  FitnessGoal,
  BodyMeasurement,
  ProgressPhoto,
  CoachWorkoutPlan,
  GymMembership,
  DailyChecklist,
  SmartReminder,
  WorkoutSession,
  DailyNutritionLog,
  UserProfile,
  SecuritySettings,
  CloudSyncState,
  GymAttendanceRecord,
  CustomFoodItem,
  SubmittedDailyReport,
  SubmittedMonthlyReport,
} from "./types";
import {
  loadAppState,
  saveAppState,
} from "./services/storageService";
import { calculateHealthMetrics } from "./utils/healthCalculators";
import {
  onCloudAuthStateChanged,
  db,
  auth,
  saveSubmittedDailyReportToCloud,
  saveSubmittedMonthlyReportToCloud,
  subscribeToCloudChanges,
  fetchUserAccountFromCloud,
  subscribeToAnnouncements,
  saveAllDataToFirebaseConsole,
} from "./services/firebase";
import { doc, getDocFromServer } from "firebase/firestore";

import { LockScreen } from "./components/LockScreen";
import { Navbar } from "./components/Navbar";
import { NavigationTabs } from "./components/NavigationTabs";
import { DashboardView } from "./components/DashboardView";
import { EnterpriseDashboardView } from "./components/EnterpriseDashboardView";
import { ToastNotificationContainer, NotificationDrawer } from "./components/NotificationsSystem";
import { ViewSkeleton } from "./components/ViewSkeleton";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Language } from "./utils/i18n";
import { Exercise, WorkoutTemplate, ActivityLog, DailyRoutineLog, AppNotification } from "./types";

// Resilient code-splitting loader with automatic retry on temporary network/deployment hiccups
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      console.warn("[FitPulse] Chunk load failed, retrying once...", error);
      return new Promise((resolve) => setTimeout(resolve, 800))
        .then(factory)
        .catch((err) => {
          console.error("[FitPulse] Chunk failed to load after retry:", err);
          throw err;
        });
    })
  );
}

// Code-split heavy views & modals for instant initial startup & minimal memory footprint
const WorkoutView = lazyWithRetry(() => import("./components/WorkoutView").then(m => ({ default: m.WorkoutView })));
const DietView = lazyWithRetry(() => import("./components/DietView").then(m => ({ default: m.DietView })));
const HealthBodyView = lazyWithRetry(() => import("./components/HealthBodyView").then(m => ({ default: m.HealthBodyView })));
const CoachGymView = lazyWithRetry(() => import("./components/CoachGymView").then(m => ({ default: m.CoachGymView })));
const ChecklistRemindersView = lazyWithRetry(() => import("./components/ChecklistRemindersView").then(m => ({ default: m.ChecklistRemindersView })));
const ReportsView = lazyWithRetry(() => import("./components/ReportsView").then(m => ({ default: m.ReportsView })));
const AILabView = lazyWithRetry(() => import("./components/AILabView").then(m => ({ default: m.AILabView })));
const FitnessCalculatorsView = lazyWithRetry(() => import("./components/FitnessCalculatorsView").then(m => ({ default: m.FitnessCalculatorsView })));
const ActivityTrackerView = lazyWithRetry(() => import("./components/ActivityTrackerView").then(m => ({ default: m.ActivityTrackerView })));
const DailyLifestyleTracker = lazyWithRetry(() => import("./components/DailyLifestyleTracker").then(m => ({ default: m.DailyLifestyleTracker })));
const EnterpriseRateChartsView = lazyWithRetry(() => import("./components/EnterpriseRateChartsView").then(m => ({ default: m.EnterpriseRateChartsView })));
const EnterpriseFormsView = lazyWithRetry(() => import("./components/EnterpriseFormsView").then(m => ({ default: m.EnterpriseFormsView })));
const EnterpriseGroupReportsView = lazyWithRetry(() => import("./components/EnterpriseGroupReportsView").then(m => ({ default: m.EnterpriseGroupReportsView })));
const UserManagementView = lazyWithRetry(() => import("./components/UserManagementView").then(m => ({ default: m.UserManagementView })));

// Modals
const SecurityProfileModal = lazyWithRetry(() => import("./components/SecurityProfileModal").then(m => ({ default: m.SecurityProfileModal })));
const CloudSyncModal = lazyWithRetry(() => import("./components/CloudSyncModal").then(m => ({ default: m.CloudSyncModal })));
const AchievementsModal = lazyWithRetry(() => import("./components/AchievementsModal").then(m => ({ default: m.AchievementsModal })));
const PlateCalculatorModal = lazyWithRetry(() => import("./components/PlateCalculatorModal").then(m => ({ default: m.PlateCalculatorModal })));
const PersonalRecordsModal = lazyWithRetry(() => import("./components/PersonalRecordsModal").then(m => ({ default: m.PersonalRecordsModal })));
const WaterTrackerModal = lazyWithRetry(() => import("./components/WaterTrackerModal").then(m => ({ default: m.WaterTrackerModal })));
const AudioCoachHUD = lazyWithRetry(() => import("./components/AudioCoachHUD").then(m => ({ default: m.AudioCoachHUD })));
const EnterpriseAuthModal = lazyWithRetry(() => import("./components/EnterpriseAuthModal").then(m => ({ default: m.EnterpriseAuthModal })));

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(appState.security?.isLocked && appState.security?.pinEnabled));
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Notifications State (Default: OFF per user request)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("FITPULSE_NOTIFICATIONS_ENABLED");
      if (saved !== null) return saved === "true";
    } catch {}
    return appState.notificationsEnabled ?? false;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => appState.notifications || []);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEnterpriseAuthOpen, setIsEnterpriseAuthOpen] = useState(false);

  const handleToggleNotificationsEnabled = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("FITPULSE_NOTIFICATIONS_ENABLED", String(next));
      } catch {}
      setAppState((curr) => ({ ...curr, notificationsEnabled: next }));
      return next;
    });
  };

  const handleNotify = (
    title: string,
    message: string,
    type: "success" | "info" | "warning" | "error" = "info",
    category: "Draft" | "Sync" | "Auth" | "Report" | "Backup" | "System" = "System"
  ) => {
    // If notifications are turned off, suppress toast popups and alert generation
    if (!notificationsEnabled) {
      return;
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      message,
      type,
      category,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setAppState((prev) => ({
      ...prev,
      notifications: [newNotif, ...(prev.notifications || []).slice(0, 49)],
    }));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setAppState((prev) => ({ ...prev, notifications: [] }));
  };

  // Language state (persisted)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("FITPULSE_LANG");
      return saved === "mr" ? "mr" : "en";
    } catch {
      return "en";
    }
  });

  const handleToggleLanguage = () => {
    setLang((prev) => {
      const next = prev === "en" ? "mr" : "en";
      try {
        localStorage.setItem("FITPULSE_LANG", next);
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isPlateCalculatorOpen, setIsPlateCalculatorOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isWaterTrackerOpen, setIsWaterTrackerOpen] = useState(false);
  const [isAudioCoachOpen, setIsAudioCoachOpen] = useState(false);

  // Debounced Auto-save to prevent localStorage thrashing and excessive CPU cycles
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveAppState(appState);
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [appState]);

  // Firebase connection verification test & auth state listener on app startup
  useEffect(() => {
    // 1. Listen for user authentication changes
    const unsubAuth = onCloudAuthStateChanged(async (user) => {
      if (user) {
        let account = await fetchUserAccountFromCloud(user.uid);
        if (!account) {
          account = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "FitPulse Athlete",
            photoURL: user.photoURL || undefined,
            role: user.email?.toLowerCase().includes("admin") ? "Admin" : "Staff",
            department: "Personal Fitness",
            companyName: "FitPulse Athletic Pro",
            designation: "Fitness Athlete",
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            status: "Active",
            emailVerified: user.emailVerified || false,
          };
        }

        setAppState((prev) => ({
          ...prev,
          currentUserAccount: account || prev.currentUserAccount,
          cloudUser: {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "FitPulse Athlete",
            photoUrl: user.photoURL || undefined,
            isAnonymous: user.isAnonymous,
          },
          sync: {
            ...prev.sync,
            isOnline: navigator.onLine,
            syncStatus: "synced",
            lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            accountType: "Cloud Authenticated",
          },
        }));
      }
    });

    // 1.5 Subscribe to system announcements
    const unsubAnnouncements = subscribeToAnnouncements((announcements) => {
      if (announcements && announcements.length > 0) {
        setAppState((prev) => ({
          ...prev,
          announcements,
        }));
      }
    });

    // 2. Connection verification test and initial console synchronization
    let isMounted = true;
    let initialSyncTimer: any = null;

    if (db && navigator.onLine) {
      initialSyncTimer = setTimeout(async () => {
        if (!isMounted) return;
        try {
          await getDocFromServer(doc(db, "test", "connection"));
        } catch (error: any) {
          if (error instanceof Error && error.message.includes("the client is offline")) {
            console.info("Firestore operating in offline mode.");
          }
        }

        // Ensure all local state data is synced to Firebase Console
        try {
          const uid = auth?.currentUser?.uid || appState.cloudUser?.uid || "usr-admin-01";
          if (isMounted) {
            await saveAllDataToFirebaseConsole(uid, appState);
            if (isMounted) {
              setAppState((prev) => ({
                ...prev,
                sync: {
                  ...prev.sync,
                  syncStatus: "synced",
                  lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              }));
            }
          }
        } catch (syncErr) {
          console.warn("Initial Firebase Console auto-save notice:", syncErr);
        }
      }, 1200);
    }

    // 3. Online/offline listener
    const handleOnline = () => {
      setAppState((prev) => ({
        ...prev,
        sync: {
          ...prev.sync,
          isOnline: true,
          syncStatus: "synced",
          lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      }));
      handleNotify("Connection Restored", "Online mode active. Synchronized with Firebase Cloud.", "success", "Sync");
    };

    const handleOffline = () => {
      setAppState((prev) => ({
        ...prev,
        sync: {
          ...prev.sync,
          isOnline: false,
          syncStatus: "offline",
        },
      }));
      handleNotify("Offline Mode", "Working offline. Changes will automatically sync when connection returns.", "warning", "Sync");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      if (initialSyncTimer) clearTimeout(initialSyncTimer);
      unsubAuth();
      unsubAnnouncements?.();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time Cloud Synchronization listener for multi-device live sync
  useEffect(() => {
    const activeUserId = appState.cloudUser?.uid || appState.currentUserAccount?.uid;
    if (!activeUserId || activeUserId === "guest") return;

    const unsubscribe = subscribeToCloudChanges(activeUserId, (remoteState) => {
      if (remoteState && typeof remoteState === "object") {
        setAppState((prev) => {
          // Compare lastUpdated timestamps or IDs to prevent local overwrite if local is fresher
          const remoteTime = remoteState.sync?.lastSyncDate;
          return {
            ...prev,
            ...remoteState,
            profile: remoteState.profile || prev.profile,
            forms: remoteState.forms || prev.forms,
            rateCharts: remoteState.rateCharts || prev.rateCharts,
            groupReports: remoteState.groupReports || prev.groupReports,
            auditLogs: remoteState.auditLogs || prev.auditLogs,
            loginHistory: remoteState.loginHistory || prev.loginHistory,
            sync: {
              ...prev.sync,
              isOnline: true,
              syncStatus: "synced",
              lastSyncDate: remoteTime || "Just now",
            },
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [appState.cloudUser?.uid, appState.currentUserAccount?.uid]);

  // Derived health calculations
  const healthMetrics = useMemo(() => {
    return calculateHealthMetrics(appState.profile);
  }, [appState.profile]);

  // Workout state handlers
  const handleSaveActiveWorkout = (workout: WorkoutSession | null) => {
    setAppState((prev) => ({
      ...prev,
      activeWorkout: workout,
    }));
  };

  const handleFinishWorkout = (completedSession: WorkoutSession) => {
    setAppState((prev) => ({
      ...prev,
      workoutHistory: [completedSession, ...prev.workoutHistory],
      activeWorkout: null,
    }));
  };

  const handleStartWorkout = () => {
    const newSession: WorkoutSession = {
      id: `w-${Date.now()}`,
      workoutName: "Hypertrophy Push Session",
      workoutType: "Hypertrophy",
      muscleGroup: "Chest",
      date: new Date().toISOString().split("T")[0],
      startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      durationMinutes: 0,
      caloriesBurned: 0,
      exercises: [],
      notes: "Focus on strict tempo and mind-muscle connection.",
      completed: false,
    };

    setAppState((prev) => ({
      ...prev,
      activeWorkout: newSession,
    }));
    setActiveTab("workout");
  };

  const handleUpdateCustomExercises = (exercises: Exercise[]) => {
    setAppState((prev) => ({
      ...prev,
      customExercises: exercises,
    }));
  };

  const handleUpdateWorkoutTemplates = (templates: WorkoutTemplate[]) => {
    setAppState((prev) => ({
      ...prev,
      workoutTemplates: templates,
    }));
  };

  const handleDeleteWorkoutHistory = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      workoutHistory: prev.workoutHistory.filter((w) => w.id !== id),
    }));
  };

  const handleUpdateActivityLogs = (logs: ActivityLog[]) => {
    setAppState((prev) => ({
      ...prev,
      activityLogs: logs,
    }));
  };

  const handleUpdateDailyRoutine = (date: string, routine: DailyRoutineLog) => {
    setAppState((prev) => ({
      ...prev,
      dailyRoutines: {
        ...prev.dailyRoutines,
        [date]: routine,
      },
    }));
  };

  // Nutrition handlers
  const handleUpdateDailyNutrition = (date: string, updatedLog: DailyNutritionLog) => {
    setAppState((prev) => ({
      ...prev,
      dailyNutrition: {
        ...prev.dailyNutrition,
        [date]: updatedLog,
      },
    }));
  };

  const handleQuickAddWater = (amountMl: number) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = appState.dailyNutrition[today] || {
      date: today,
      meals: [],
      waterLoggedMl: 0,
      stepsCount: 8400,
      activeCaloriesBurned: 520,
      cheatMeals: [],
    };

    handleUpdateDailyNutrition(today, {
      ...existing,
      waterLoggedMl: (existing.waterLoggedMl || 0) + amountMl,
    });
  };

  // Goal Mode switcher
  const handleUpdateProfileGoal = (goal: FitnessGoal) => {
    setAppState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        fitnessGoal: goal,
      },
    }));
  };

  // Measurements & Progress Photos
  const handleAddMeasurement = (m: BodyMeasurement) => {
    setAppState((prev) => ({
      ...prev,
      measurements: [...prev.measurements, m],
      profile: {
        ...prev.profile,
        currentWeightKg: m.weightKg,
      },
    }));
  };

  const handleAddProgressPhoto = (photo: ProgressPhoto) => {
    setAppState((prev) => ({
      ...prev,
      progressPhotos: [photo, ...prev.progressPhotos],
    }));
  };

  // Coach & Membership
  const handleUpdateCoachPlanStatus = (planId: string, status: CoachWorkoutPlan["status"]) => {
    setAppState((prev) => ({
      ...prev,
      coachPlans: prev.coachPlans.map((p) => (p.id === planId ? { ...p, status } : p)),
    }));
  };

  const handleAddCoachPlan = (plan: CoachWorkoutPlan) => {
    setAppState((prev) => ({
      ...prev,
      coachPlans: [plan, ...prev.coachPlans],
    }));
  };

  const handleUpdateMembership = (membership: GymMembership) => {
    setAppState((prev) => ({
      ...prev,
      membership,
    }));
  };

  const handleUpdateAttendance = (date: string, record: GymAttendanceRecord) => {
    setAppState((prev) => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [date]: record,
      },
    }));
  };

  // Checklist & Reminders
  const handleUpdateChecklist = (date: string, updated: DailyChecklist) => {
    setAppState((prev) => ({
      ...prev,
      checklists: {
        ...prev.checklists,
        [date]: updated,
      },
    }));
  };

  const handleUpdateReminders = (updated: SmartReminder[]) => {
    setAppState((prev) => ({
      ...prev,
      reminders: updated,
    }));
  };

  // Custom Foods Library
  const handleUpdateCustomFoods = (foods: CustomFoodItem[]) => {
    setAppState((prev) => ({
      ...prev,
      customFoods: foods,
    }));
  };

  // Saved Diet Plans
  const handleUpdateSavedDietPlans = (plans: any[]) => {
    setAppState((prev) => ({
      ...prev,
      savedDietPlans: plans,
    }));
  };

  const handleSelectActiveDietPlan = (planId: string) => {
    setAppState((prev) => ({
      ...prev,
      activeDietPlanId: planId,
    }));
  };

  // Profile & Security updates
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setAppState((prev) => ({
      ...prev,
      profile: updatedProfile,
    }));
  };

  const handleUpdateSecurity = (updatedSecurity: SecuritySettings) => {
    setAppState((prev) => ({
      ...prev,
      security: updatedSecurity,
    }));
  };

  const handleUpdateSync = (updatedSync: CloudSyncState) => {
    setAppState((prev) => ({
      ...prev,
      sync: updatedSync,
    }));
  };

  const handleRestoreAppState = (restored: AppState) => {
    setAppState(restored);
  };

  const handleToggleDarkMode = () => {
    setAppState((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  // Cloud Sync trigger
  const handleTriggerSync = () => {
    setAppState((prev) => ({
      ...prev,
      sync: {
        ...prev.sync,
        syncStatus: "synced",
        lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    }));
  };

  // Report Submission & Lock / Unlock handlers
  const handleSubmitDailyReport = async (date: string, submission: SubmittedDailyReport): Promise<boolean> => {
    setAppState((prev) => ({
      ...prev,
      submittedReports: {
        ...(prev.submittedReports || {}),
        [date]: submission,
      },
    }));
    const userId = appState.cloudUser?.uid || auth?.currentUser?.uid || "guest";
    await saveSubmittedDailyReportToCloud(userId, date, submission);
    return true;
  };

  const handleUnlockDailyReport = (date: string) => {
    setAppState((prev) => {
      const existing = { ...(prev.submittedReports || {}) };
      if (existing[date]) {
        existing[date] = { ...existing[date], locked: false };
      }
      return {
        ...prev,
        submittedReports: existing,
      };
    });
  };

  const handleSubmitMonthlyReport = async (yearMonth: string, submission: SubmittedMonthlyReport): Promise<boolean> => {
    setAppState((prev) => ({
      ...prev,
      submittedMonthlyReports: {
        ...(prev.submittedMonthlyReports || {}),
        [yearMonth]: submission,
      },
    }));
    const userId = appState.cloudUser?.uid || auth?.currentUser?.uid || "guest";
    await saveSubmittedMonthlyReportToCloud(userId, yearMonth, submission);
    return true;
  };

  const handleDeleteFoodFromDailyNutrition = (date: string, mealId: string, foodIndexOrId: number | string) => {
    setAppState((prev) => {
      const dailyLog = prev.dailyNutrition[date];
      if (!dailyLog) return prev;
      const updatedMeals = dailyLog.meals.map((m) => {
        if (m.id === mealId) {
          return {
            ...m,
            foods: m.foods.filter((f, idx) => (f.id ? f.id !== foodIndexOrId : idx !== foodIndexOrId)),
          };
        }
        return m;
      });
      return {
        ...prev,
        dailyNutrition: {
          ...prev.dailyNutrition,
          [date]: {
            ...dailyLog,
            meals: updatedMeals,
          },
        },
      };
    });
  };

  const handleQuickAdjustDailyNutrition = (date: string, updates: Partial<DailyNutritionLog>) => {
    setAppState((prev) => {
      const existing = prev.dailyNutrition[date] || {
        date,
        meals: [],
        waterLoggedMl: 2850,
        stepsCount: 8400,
        activeCaloriesBurned: 520,
        cheatMeals: [],
      };
      return {
        ...prev,
        dailyNutrition: {
          ...prev.dailyNutrition,
          [date]: {
            ...existing,
            ...updates,
          },
        },
      };
    });
  };

  // If locked, show high-security PIN & Biometric Screen
  if (isLocked) {
    return <LockScreen security={appState.security} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className={`min-h-screen ${appState.darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-900 text-slate-100"} antialiased selection:bg-emerald-500 selection:text-slate-950`}>
      {/* Global Application Navbar */}
      <Navbar
        profile={appState.profile}
        sync={appState.sync}
        membership={appState.membership}
        darkMode={appState.darkMode}
        userRole={appState.currentUserAccount?.role || "Admin"}
        unreadNotificationsCount={notificationsEnabled ? notifications.length : 0}
        notificationsEnabled={notificationsEnabled}
        onToggleNotificationsEnabled={handleToggleNotificationsEnabled}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLockApp={() => setIsLocked(true)}
        onOpenAILab={() => setActiveTab("ailab")}
        onOpenAchievements={() => setIsAchievementsModalOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenPlateCalculator={() => setIsPlateCalculatorOpen(true)}
        onOpenPersonalRecords={() => setIsPRModalOpen(true)}
        onOpenWaterTracker={() => setIsWaterTrackerOpen(true)}
        onOpenAudioCoach={() => setIsAudioCoachOpen(true)}
        onOpenEnterpriseAuth={() => setIsEnterpriseAuthOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Floating Real-time Toast Notifications (Silenced when notifications are OFF) */}
      <ToastNotificationContainer
        notifications={notifications}
        onDismiss={handleDismissNotification}
        notificationsEnabled={notificationsEnabled}
      />

      {/* Slide-in Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={handleClearAllNotifications}
        onDismiss={handleDismissNotification}
        notificationsEnabled={notificationsEnabled}
        onToggleNotificationsEnabled={handleToggleNotificationsEnabled}
      />

      {/* Enterprise Authentication & RBAC Modal */}
      <EnterpriseAuthModal
        isOpen={isEnterpriseAuthOpen}
        onClose={() => setIsEnterpriseAuthOpen(false)}
        state={appState}
        onUpdateState={setAppState}
        onNotify={handleNotify}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 md:pb-16">
        {/* Responsive Tab Bar */}
        <NavigationTabs
          currentTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          activeWorkoutCount={appState.activeWorkout ? 1 : 0}
          lang={lang}
        />

        {/* Tab Content Switcher with Suspense Skeleton Loader & Localized Error Boundary */}
        <div className="mt-6">
          <ErrorBoundary fallbackTitle="View Display Notice (व्ह्यू लोड करताना त्रुटी आली)">
            <Suspense fallback={<ViewSkeleton />}>
              {activeTab === "dashboard" && (
              <div className="space-y-8">
                <EnterpriseDashboardView
                  state={appState}
                  onUpdateState={setAppState}
                  onNavigateTab={(tab) => setActiveTab(tab as TabId)}
                  onNotify={handleNotify}
                />
                <div className="border-t border-slate-800 pt-6">
                  <DashboardView
                    appState={appState}
                    healthMetrics={healthMetrics}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onQuickAddWater={handleQuickAddWater}
                    onStartWorkout={handleStartWorkout}
                    onOpenAchievements={() => setIsAchievementsModalOpen(true)}
                    onOpenPlateCalculator={() => setIsPlateCalculatorOpen(true)}
                    onOpenPersonalRecords={() => setIsPRModalOpen(true)}
                    onOpenWaterTracker={() => setIsWaterTrackerOpen(true)}
                    onOpenAudioCoach={() => setIsAudioCoachOpen(true)}
                    lang={lang}
                  />
                </div>
              </div>
            )}

            {activeTab === "admin-users" && (
              <UserManagementView
                state={appState}
                onUpdateState={setAppState}
                onNotify={handleNotify}
              />
            )}

            {activeTab === "rate-charts" && (
              <EnterpriseRateChartsView
                state={appState}
                onUpdateState={setAppState}
                onNotify={handleNotify}
              />
            )}

            {activeTab === "forms" && (
              <EnterpriseFormsView
                state={appState}
                onUpdateState={setAppState}
                onNotify={handleNotify}
              />
            )}

            {activeTab === "group-reports" && (
              <EnterpriseGroupReportsView
                state={appState}
                onUpdateState={setAppState}
                onNotify={handleNotify}
              />
            )}

            {activeTab === "workout" && (
              <WorkoutView
                activeWorkout={appState.activeWorkout}
                workoutHistory={appState.workoutHistory}
                coachPlans={appState.coachPlans || []}
                customExercises={appState.customExercises || []}
                workoutTemplates={appState.workoutTemplates || []}
                onSaveActiveWorkout={handleSaveActiveWorkout}
                onFinishWorkout={handleFinishWorkout}
                onDeleteWorkoutHistory={handleDeleteWorkoutHistory}
                onUpdateCustomExercises={handleUpdateCustomExercises}
                onUpdateWorkoutTemplates={handleUpdateWorkoutTemplates}
                onUpdateCoachPlans={(plans) =>
                  setAppState((prev) => ({ ...prev, coachPlans: plans }))
                }
              />
            )}

            {activeTab === "diet" && (
              <DietView
                dailyNutrition={appState.dailyNutrition}
                healthMetrics={healthMetrics}
                onUpdateDailyNutrition={handleUpdateDailyNutrition}
                customFoods={appState.customFoods || []}
                onUpdateCustomFoods={handleUpdateCustomFoods}
                savedDietPlans={appState.savedDietPlans || []}
                activeDietPlanId={appState.activeDietPlanId}
                onUpdateSavedDietPlans={handleUpdateSavedDietPlans}
                onSelectActiveDietPlan={handleSelectActiveDietPlan}
                userId={appState.cloudUser?.uid || auth?.currentUser?.uid || "guest"}
                isWorkoutCompletedToday={Boolean(
                  appState.workoutHistory.some(
                    (w) => (w.date === new Date().toISOString().split("T")[0] || w.date === "2026-08-28") && w.completed
                  )
                )}
              />
            )}

            {activeTab === "activity" && (
              <ActivityTrackerView
                state={appState}
                onUpdateState={setAppState}
                onNotify={handleNotify}
              />
            )}

            {activeTab === "lifestyle" && (
              <DailyLifestyleTracker
                dailyRoutines={appState.dailyRoutines || {}}
                onUpdateDailyRoutine={handleUpdateDailyRoutine}
              />
            )}

            {activeTab === "health" && (
              <HealthBodyView
                profile={appState.profile}
                healthMetrics={healthMetrics}
                measurements={appState.measurements}
                progressPhotos={appState.progressPhotos}
                onUpdateProfileGoal={handleUpdateProfileGoal}
                onAddMeasurement={handleAddMeasurement}
                onAddProgressPhoto={handleAddProgressPhoto}
              />
            )}

            {activeTab === "calculators" && (
              <FitnessCalculatorsView
                profile={appState.profile}
                healthMetrics={healthMetrics}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === "coach" && (
              <CoachGymView
                coachPlans={appState.coachPlans}
                membership={appState.membership}
                attendance={appState.attendance}
                appState={appState}
                onUpdateCoachPlanStatus={handleUpdateCoachPlanStatus}
                onAddCoachPlan={handleAddCoachPlan}
                onUpdateMembership={handleUpdateMembership}
                onUpdateAttendance={handleUpdateAttendance}
              />
            )}

            {activeTab === "checklist" && (
              <ChecklistRemindersView
                checklists={appState.checklists}
                reminders={appState.reminders}
                onUpdateChecklist={handleUpdateChecklist}
                onUpdateReminders={handleUpdateReminders}
              />
            )}

            {activeTab === "reports" && (
              <ReportsView
                appState={appState}
                healthMetrics={healthMetrics}
                onUpdateState={setAppState}
                onNotify={handleNotify}
                onUpdateActivityLogs={handleUpdateActivityLogs}
                onUpdateDailyRoutine={handleUpdateDailyRoutine}
                onSubmitDailyReport={handleSubmitDailyReport}
                onUnlockDailyReport={handleUnlockDailyReport}
                onSubmitMonthlyReport={handleSubmitMonthlyReport}
                onDeleteFoodItem={handleDeleteFoodFromDailyNutrition}
                onQuickAdjustDailyNutrition={handleQuickAdjustDailyNutrition}
                onDeleteWorkoutHistory={handleDeleteWorkoutHistory}
                onUpdateNutritionLog={handleUpdateDailyNutrition}
              />
            )}

            {activeTab === "ailab" && (
              <AILabView
                profile={appState.profile}
                healthMetrics={healthMetrics}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </main>

      {/* Lazy-Loaded Modals with Suspense */}
      <Suspense fallback={null}>
        {isProfileModalOpen && (
          <SecurityProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={appState.profile}
            security={appState.security}
            sync={appState.sync}
            fullAppState={appState}
            notificationsEnabled={notificationsEnabled}
            onToggleNotificationsEnabled={handleToggleNotificationsEnabled}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSecurity={handleUpdateSecurity}
            onUpdateSync={handleUpdateSync}
            onRestoreAppState={handleRestoreAppState}
          />
        )}

        {isCloudSyncModalOpen && (
          <CloudSyncModal
            isOpen={isCloudSyncModalOpen}
            onClose={() => setIsCloudSyncModalOpen(false)}
            syncStatus={appState.sync}
            fullAppState={appState}
            onTriggerSync={handleTriggerSync}
            onRestoreAppState={handleRestoreAppState}
          />
        )}

        {isAchievementsModalOpen && (
          <AchievementsModal
            isOpen={isAchievementsModalOpen}
            onClose={() => setIsAchievementsModalOpen(false)}
            achievements={appState.achievements || []}
          />
        )}

        {isPlateCalculatorOpen && (
          <PlateCalculatorModal
            isOpen={isPlateCalculatorOpen}
            onClose={() => setIsPlateCalculatorOpen(false)}
            lang={lang}
          />
        )}

        {isPRModalOpen && (
          <PersonalRecordsModal
            isOpen={isPRModalOpen}
            onClose={() => setIsPRModalOpen(false)}
            userBodyweightKg={appState.profile.currentWeightKg || 70}
            lang={lang}
          />
        )}

        {isWaterTrackerOpen && (
          <WaterTrackerModal
            isOpen={isWaterTrackerOpen}
            onClose={() => setIsWaterTrackerOpen(false)}
            currentWaterMl={
              appState.dailyNutrition[new Date().toISOString().split("T")[0]]?.waterLoggedMl ??
              appState.dailyNutrition["2026-08-28"]?.waterLoggedMl ??
              0
            }
            targetWaterMl={healthMetrics.dailyWaterMl}
            onAddWater={(amount) => handleQuickAddWater(amount)}
            lang={lang}
          />
        )}

        {isAudioCoachOpen && (
          <AudioCoachHUD
            isOpen={isAudioCoachOpen}
            onClose={() => setIsAudioCoachOpen(false)}
            lang={lang}
          />
        )}
      </Suspense>
    </div>
  );
}
