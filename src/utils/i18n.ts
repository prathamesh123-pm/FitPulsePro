export type Language = "en" | "mr";

export interface Translations {
  // Navigation
  dashboard: string;
  workout: string;
  diet: string;
  activity: string;
  lifestyle: string;
  health: string;
  calculators: string;
  coach: string;
  checklist: string;
  reports: string;
  ailab: string;

  // Header & Brand
  tagline: string;
  aiCoach: string;
  badges: string;
  cloudSynced: string;
  cloudOffline: string;
  lockApp: string;
  plates: string;
  prs: string;
  water: string;
  audioCoach: string;

  // Dashboard Stats
  todayCalories: string;
  targetCalories: string;
  protein: string;
  carbs: string;
  fats: string;
  waterIntake: string;
  activeWorkout: string;
  startWorkout: string;
  dailyStreak: string;
  gymAttendance: string;
  weightGoal: string;

  // Actions
  quickAdd: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  viewAll: string;
  completed: string;
  inProgress: string;

  // Motivational Quotes
  motivationalTitle: string;
  motivationalQuote: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    dashboard: "Dashboard",
    workout: "Workouts",
    diet: "Diet & Meals",
    activity: "Activities",
    lifestyle: "Lifestyle",
    health: "Health & Body",
    calculators: "Calculators",
    coach: "Coach & Gym",
    checklist: "Checklist",
    reports: "Reports & AI",
    ailab: "AI Lab",

    tagline: "Your Ultimate Fitness & Gym OS",
    aiCoach: "AI Coach",
    badges: "Badges",
    cloudSynced: "Synced",
    cloudOffline: "Cloud",
    lockApp: "Lock App",
    plates: "Barbell Plates",
    prs: "PRs & Records",
    water: "Water Tracker",
    audioCoach: "Audio Timer",

    todayCalories: "Calories Consumed",
    targetCalories: "Target Calories",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    waterIntake: "Water Intake",
    activeWorkout: "Active Workout",
    startWorkout: "Start Workout",
    dailyStreak: "Day Streak",
    gymAttendance: "Gym Attendance",
    weightGoal: "Weight Goal",

    quickAdd: "Quick Add",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    viewAll: "View All",
    completed: "Completed",
    inProgress: "In Progress",

    motivationalTitle: "Daily Motivation",
    motivationalQuote: "Discipline is doing what needs to be done, even when you don't feel like doing it.",
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    workout: "व्यायाम (Workouts)",
    diet: "आहार व डाएट",
    activity: "ऍक्टिव्हिटी",
    lifestyle: "जीवनशैली",
    health: "आरोग्य व शरीर",
    calculators: "कॅल्क्युलेटर",
    coach: "कोच व जिम",
    checklist: "चेकलिस्ट",
    reports: "अहवाल व AI",
    ailab: "AI लॅब",

    tagline: "तुमचे परिपूर्ण फिटनेस व जिम प्लॅटफॉर्म",
    aiCoach: "AI कोच",
    badges: "पदके (Badges)",
    cloudSynced: "सिंक्ड",
    cloudOffline: "क्लाउड",
    lockApp: "ॲप लॉक करा",
    plates: "प्लेट कॅल्क्युलेटर",
    prs: "पर्सनल रेकॉर्ड्स (PR)",
    water: "पाणी ट्रॅकर",
    audioCoach: "ऑडिओ टाइमर",

    todayCalories: "आजच्या कॅलरीज",
    targetCalories: "लक्ष्य कॅलरीज",
    protein: "प्रोटीन",
    carbs: "कार्बोहायड्रेट्स",
    fats: "फॅट्स",
    waterIntake: "पाण्याचे प्रमाण",
    activeWorkout: "सध्याचा व्यायाम",
    startWorkout: "व्यायाम सुरू करा",
    dailyStreak: "दिवसांची सातत्य",
    gymAttendance: "जिम उपस्थिती",
    weightGoal: "वजनाचे ध्येय",

    quickAdd: "झटपट जोडा",
    save: "जतन करा",
    cancel: "रद्द करा",
    delete: "हटवा",
    edit: "बदला",
    viewAll: "सर्व पहा",
    completed: "पूर्ण झाले",
    inProgress: "प्रगतीपथावर",

    motivationalTitle: "दैनिक प्रेरणा",
    motivationalQuote: "सातत्य आणि शिस्त हीच सर्वोत्तम शरीर आणि आरोग्याची खरी गुरुकिल्ली आहे.",
  },
};

export const MARATHI_MUSCLE_MAP: Record<string, string> = {
  Chest: "छाती (Chest)",
  Back: "पाठ (Back)",
  Biceps: "बायसेप्स (Biceps)",
  Triceps: "ट्रायसेप्स (Triceps)",
  Shoulders: "खांदे (Shoulders)",
  Legs: "पाय (Legs)",
  Thighs: "मांड्या (Thighs/Quads)",
  Calves: "पिंडऱ्या (Calves)",
  Forearms: "फोरआर्म्स (Forearms)",
  Abs: "ॲब्स (Abs)",
  Core: "मध्य शरीर (Core)",
  Glutes: "ग्लूट्स (Glutes)",
  Cardio: "कार्डिओ (Cardio)",
  "Full Body": "संपूर्ण शरीर (Full Body)",
};
