import { useState, useMemo, useEffect } from "react";
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
} from "./services/firebase";
import { doc, getDocFromServer } from "firebase/firestore";

import { LockScreen } from "./components/LockScreen";
import { Navbar } from "./components/Navbar";
import { NavigationTabs } from "./components/NavigationTabs";
import { DashboardView } from "./components/DashboardView";
import { WorkoutView } from "./components/WorkoutView";
import { DietView } from "./components/DietView";
import { HealthBodyView } from "./components/HealthBodyView";
import { CoachGymView } from "./components/CoachGymView";
import { ChecklistRemindersView } from "./components/ChecklistRemindersView";
import { ReportsView } from "./components/ReportsView";
import { AILabView } from "./components/AILabView";
import { FitnessCalculatorsView } from "./components/FitnessCalculatorsView";
import { ActivityTrackerView } from "./components/ActivityTrackerView";
import { DailyLifestyleTracker } from "./components/DailyLifestyleTracker";
import { SecurityProfileModal } from "./components/SecurityProfileModal";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { AchievementsModal } from "./components/AchievementsModal";
import { PlateCalculatorModal } from "./components/PlateCalculatorModal";
import { PersonalRecordsModal } from "./components/PersonalRecordsModal";
import { WaterTrackerModal } from "./components/WaterTrackerModal";
import { AudioCoachHUD } from "./components/AudioCoachHUD";
import { Language } from "./utils/i18n";
import { Exercise, WorkoutTemplate, ActivityLog, DailyRoutineLog } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(appState.security?.isLocked && appState.security?.pinEnabled));
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

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

  // Auto-save whenever appState updates
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Firebase connection verification test & auth state listener on app startup
  useEffect(() => {
    // 1. Listen for user authentication changes
    const unsubAuth = onCloudAuthStateChanged((user) => {
      if (user) {
        setAppState((prev) => ({
          ...prev,
          cloudUser: {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "FitPulse Athlete",
            photoUrl: user.photoURL || undefined,
            isAnonymous: user.isAnonymous,
          },
          sync: {
            ...prev.sync,
            syncStatus: "synced",
            lastSyncDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        }));
      }
    });

    // 2. Connection verification test per Firebase integration instructions
    if (db) {
      try {
        const testRef = doc(db, "_connection_test_", "ping");
        getDocFromServer(testRef).catch(() => {
          // Even if document is missing, reaching Firestore confirms active connection
        });
      } catch (err) {
        // Silently handled
      }
    }

    return () => {
      unsubAuth();
    };
  }, []);

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
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
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

        {/* Tab Content Switcher */}
        <div className="mt-6">
          {activeTab === "dashboard" && (
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
          )}

          {activeTab === "workout" && (
            <WorkoutView
              activeWorkout={appState.activeWorkout}
              workoutHistory={appState.workoutHistory}
              customExercises={appState.customExercises || []}
              workoutTemplates={appState.workoutTemplates || []}
              onSaveActiveWorkout={handleSaveActiveWorkout}
              onFinishWorkout={handleFinishWorkout}
              onDeleteWorkoutHistory={handleDeleteWorkoutHistory}
              onUpdateCustomExercises={handleUpdateCustomExercises}
              onUpdateWorkoutTemplates={handleUpdateWorkoutTemplates}
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
              isWorkoutCompletedToday={Boolean(appState.workoutHistory.some((w) => w.date === "2026-08-28" && w.completed))}
            />
          )}

          {activeTab === "activity" && (
            <ActivityTrackerView
              activityLogs={appState.activityLogs || []}
              onUpdateActivityLogs={handleUpdateActivityLogs}
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
        </div>
      </main>

      {/* Profile & Security Modal */}
      <SecurityProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={appState.profile}
        security={appState.security}
        sync={appState.sync}
        fullAppState={appState}
        onUpdateProfile={handleUpdateProfile}
        onUpdateSecurity={handleUpdateSecurity}
        onUpdateSync={handleUpdateSync}
        onRestoreAppState={handleRestoreAppState}
      />

      {/* Cloud Sync & Firebase Multi-Device Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        syncStatus={appState.sync}
        fullAppState={appState}
        onTriggerSync={handleTriggerSync}
        onRestoreAppState={handleRestoreAppState}
      />

      {/* Section 41: Achievements & Milestones Modal */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        achievements={appState.achievements || []}
      />

      {/* Barbell Plate Loader Visualizer Modal */}
      <PlateCalculatorModal
        isOpen={isPlateCalculatorOpen}
        onClose={() => setIsPlateCalculatorOpen(false)}
        lang={lang}
      />

      {/* Personal Records & Strength PRs Modal */}
      <PersonalRecordsModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        userBodyweightKg={appState.profile.weightKg}
        lang={lang}
      />

      {/* Daily Hydration Visual Water Tracker Modal */}
      <WaterTrackerModal
        isOpen={isWaterTrackerOpen}
        onClose={() => setIsWaterTrackerOpen(false)}
        currentWaterMl={appState.dailyNutrition["2026-08-28"]?.waterLoggedMl || 0}
        targetWaterMl={healthMetrics.dailyWaterMl}
        onAddWater={(amount) => handleQuickAddWater(amount)}
        lang={lang}
      />

      {/* Audio Coach, Rest Timer & Tempo Metronome HUD */}
      <AudioCoachHUD
        isOpen={isAudioCoachOpen}
        onClose={() => setIsAudioCoachOpen(false)}
        lang={lang}
      />
    </div>
  );
}
