import {
  AppState,
  UserProfile,
  GymMembership,
  SmartReminder,
  WorkoutSession,
  WorkoutTemplate,
  ActivityLog,
  DailyRoutineLog,
  Exercise,
  BodyMeasurement,
  ProgressPhoto,
  CoachWorkoutPlan,
  DailyNutritionLog,
  CustomFoodItem,
} from "../types";
import { syncAppStateToCloud } from "./firebase";
import { DEFAULT_SAVED_DIET_PLANS } from "../data/defaultDietPlans";

const STORAGE_KEY = "FITPULSE_APP_STATE_V1";

export const DEFAULT_CUSTOM_FOODS: CustomFoodItem[] = [
  {
    id: "cf-1",
    name: "Grilled Chicken Breast",
    mealType: "Lunch",
    quantity: 150,
    unit: "Gram",
    calories: 247,
    protein: 46.5,
    carbs: 0,
    fat: 5.4,
    fiber: 0,
    sugar: 0,
    notes: "Skinless boneless, weighed raw",
    isFavorite: true,
    isCustom: true,
    createdAt: "2026-08-20T10:00:00.000Z",
    lastUsed: "2026-08-28T13:15:00.000Z",
    category: "Meat & Poultry",
  },
  {
    id: "cf-2",
    name: "Rolled Oats & Whey Protein",
    mealType: "Breakfast",
    quantity: 60,
    unit: "Gram",
    calories: 340,
    protein: 32,
    carbs: 42,
    fat: 5,
    fiber: 6.5,
    sugar: 1.5,
    notes: "Overnight oats with 1 scoop gold standard isolate",
    isFavorite: true,
    isCustom: true,
    createdAt: "2026-08-21T08:00:00.000Z",
    lastUsed: "2026-08-28T08:15:00.000Z",
    category: "Breakfast & Grains",
  },
  {
    id: "cf-3",
    name: "Steamed White Basmati Rice",
    mealType: "Lunch",
    quantity: 180,
    unit: "Gram",
    calories: 234,
    protein: 4.8,
    carbs: 52,
    fat: 0.6,
    fiber: 1.2,
    sugar: 0.1,
    notes: "Cooked jasmine/basmati rice",
    isFavorite: false,
    isCustom: true,
    createdAt: "2026-08-22T12:00:00.000Z",
    lastUsed: "2026-08-27T13:00:00.000Z",
    category: "Carbs & Grains",
  },
  {
    id: "cf-4",
    name: "Whole Boiled Eggs (Large)",
    mealType: "Breakfast",
    quantity: 3,
    unit: "Piece",
    calories: 216,
    protein: 18.6,
    carbs: 1.2,
    fat: 15,
    fiber: 0,
    sugar: 0.9,
    notes: "Free range pasture eggs",
    isFavorite: true,
    isCustom: true,
    createdAt: "2026-08-23T07:30:00.000Z",
    lastUsed: "2026-08-28T08:15:00.000Z",
    category: "Dairy & Eggs",
  },
  {
    id: "cf-5",
    name: "Greek Yogurt 0% Fat",
    mealType: "Snack",
    quantity: 1,
    unit: "Bowl",
    calories: 130,
    protein: 22,
    carbs: 7,
    fat: 0,
    fiber: 0,
    sugar: 6,
    notes: "Authentic strained Greek yogurt, unsweetened",
    isFavorite: true,
    isCustom: true,
    createdAt: "2026-08-24T15:00:00.000Z",
    lastUsed: "2026-08-28T16:00:00.000Z",
    category: "Dairy & Eggs",
  },
  {
    id: "cf-6",
    name: "Peanut Butter (100% Roasted)",
    mealType: "Snack",
    quantity: 2,
    unit: "Tbsp",
    calories: 188,
    protein: 8,
    carbs: 6,
    fat: 16,
    fiber: 2,
    sugar: 1.5,
    notes: "No added palm oil or sugar",
    isFavorite: false,
    isCustom: true,
    createdAt: "2026-08-25T16:00:00.000Z",
    lastUsed: "2026-08-26T16:00:00.000Z",
    category: "Fats & Nuts",
  },
  {
    id: "cf-7",
    name: "Whey Protein Isolate Shake",
    mealType: "Post Workout",
    quantity: 1,
    unit: "Scoop",
    calories: 120,
    protein: 27,
    carbs: 1.5,
    fat: 0.5,
    fiber: 0,
    sugar: 0.5,
    notes: "Mixed with 300ml cold water",
    isFavorite: true,
    isCustom: true,
    createdAt: "2026-08-26T18:00:00.000Z",
    lastUsed: "2026-08-28T18:15:00.000Z",
    category: "Supplements",
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  fullName: "Alex Miller",
  mobileNumber: "+1 (555) 234-5678",
  email: "alex.miller@fitpulse.app",
  dateOfBirth: "1997-06-15",
  gender: "Male",
  heightCm: 178,
  heightUnit: "cm",
  currentWeightKg: 78.5,
  targetWeightKg: 74.0,
  goalWeightKg: 74.0,
  weightUnit: "kg",
  bloodGroup: "O+",
  fitnessGoal: "Weight Loss",
  activityLevel: "Moderately Active",
  medicalConditions: "Mild right knee patellar tightness",
  allergies: "Shellfish",
  emergencyContact: {
    name: "Sarah Miller",
    relationship: "Spouse",
    phone: "+1 (555) 987-6543",
  },
  notes: "Focusing on a high-protein calorie deficit with progressive overload on compounds.",
};

export const DEFAULT_MEMBERSHIP: GymMembership = {
  gymName: "Metropolis Barbell Club",
  gymAddress: "742 Evergreen Fitness Blvd, Suite 400, Metro City",
  gymContactNumber: "+1 (555) 348-4967",
  trainerName: "Coach Marcus Vance (CSCS)",
  trainerContact: "+1 (555) 782-9012",
  startDate: "2026-01-15",
  expiryDate: "2026-09-15", // 18 days left for reminder demo
  membershipType: "Yearly",
  fees: 850,
  amountPaid: 850,
  remainingAmount: 0,
  paymentDate: "2026-01-15",
  renewalDate: "2026-09-10",
  notes: "Includes 24/7 all-access weight room, Olympic platforms, sauna, recovery cold plunge, and towel service.",
  autoReminder: true,
  gymBranch: "Downtown Flagship Center",
  planName: "Annual Gold All-Access & Recovery Spa",
  feesUSD: 850,
  currency: "$",
  paymentStatus: "Paid",
  trainerFees: 200,
};

export const DEFAULT_REMINDERS: SmartReminder[] = [
  { id: "rem-1", title: "Morning Hydration (750ml)", type: "Water", time: "07:00", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { id: "rem-2", title: "Breakfast & Multivitamin", type: "Meal", time: "08:15", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { id: "rem-3", title: "Daily Morning Weigh-In", type: "Weight", time: "08:30", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { id: "rem-4", title: "Pre-Workout Meal & Energy", type: "Workout", time: "16:30", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "rem-5", title: "Weight Room Workout Session", type: "Workout", time: "17:30", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "rem-6", title: "Post-Workout Whey & Creatine", type: "Supplement", time: "19:00", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "rem-7", title: "Weekly Progress Photo Check", type: "Progress Photo", time: "09:00", enabled: true, days: ["Sun"] },
  { id: "rem-8", title: "Bedtime Sleep Routine (8h Goal)", type: "Sleep", time: "22:30", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { id: "rem-9", title: "Gym Membership Renewal Alert", type: "Membership", time: "10:00", enabled: true, days: ["Mon"] },
];

export const DEFAULT_ATTENDANCE: Record<string, any> = {
  "2026-08-28": { id: "att-28", date: "2026-08-28", status: "Present", checkInTime: "17:28", checkOutTime: "18:50", gymName: "Metropolis Barbell Club", workoutTitle: "Upper Power & Push", notes: "Hit 82.5kg PR on bench" },
  "2026-08-27": { id: "att-27", date: "2026-08-27", status: "Rest Day", notes: "Active recovery and mobility routine" },
  "2026-08-26": { id: "att-26", date: "2026-08-26", status: "Present", checkInTime: "17:30", checkOutTime: "18:45", gymName: "Metropolis Barbell Club", workoutTitle: "Chest & Triceps" },
  "2026-08-25": { id: "att-25", date: "2026-08-25", status: "Present", checkInTime: "18:15", checkOutTime: "19:30", gymName: "Metropolis Barbell Club", workoutTitle: "Shoulders & Arms" },
  "2026-08-24": { id: "att-24", date: "2026-08-24", status: "Present", checkInTime: "18:00", checkOutTime: "19:15", gymName: "Metropolis Barbell Club", workoutTitle: "Legs Hypertrophy" },
  "2026-08-23": { id: "att-23", date: "2026-08-23", status: "Rest Day", notes: "Full recovery sleep" },
  "2026-08-22": { id: "att-22", date: "2026-08-22", status: "Present", checkInTime: "10:30", checkOutTime: "11:55", gymName: "Metropolis Barbell Club", workoutTitle: "Full Body Compound" },
  "2026-08-21": { id: "att-21", date: "2026-08-21", status: "Present", checkInTime: "17:45", checkOutTime: "19:00", gymName: "Metropolis Barbell Club", workoutTitle: "Back & Biceps" },
  "2026-08-20": { id: "att-20", date: "2026-08-20", status: "Rest Day" },
  "2026-08-19": { id: "att-19", date: "2026-08-19", status: "Present", checkInTime: "18:00", checkOutTime: "19:20", gymName: "Metropolis Barbell Club", workoutTitle: "Chest & Shoulders" },
  "2026-08-18": { id: "att-18", date: "2026-08-18", status: "Present", checkInTime: "17:30", checkOutTime: "18:50", gymName: "Metropolis Barbell Club", workoutTitle: "Hamstrings & Glutes" },
  "2026-08-17": { id: "att-17", date: "2026-08-17", status: "Present", checkInTime: "18:10", checkOutTime: "19:25", gymName: "Metropolis Barbell Club", workoutTitle: "Upper Body Hypertrophy" },
  "2026-08-16": { id: "att-16", date: "2026-08-16", status: "Rest Day" },
  "2026-08-15": { id: "att-15", date: "2026-08-15", status: "Holiday", notes: "Gym Closed - National Holiday" },
  "2026-08-14": { id: "att-14", date: "2026-08-14", status: "Present", checkInTime: "17:00", checkOutTime: "18:15", gymName: "Metropolis Barbell Club", workoutTitle: "Leg Day Squats" },
  "2026-08-13": { id: "att-13", date: "2026-08-13", status: "Present", checkInTime: "17:30", checkOutTime: "18:45", gymName: "Metropolis Barbell Club", workoutTitle: "Pull & Rows" },
  "2026-08-12": { id: "att-12", date: "2026-08-12", status: "Present", checkInTime: "18:00", checkOutTime: "19:15", gymName: "Metropolis Barbell Club", workoutTitle: "Push Strength" },
  "2026-08-11": { id: "att-11", date: "2026-08-11", status: "Absent", notes: "Delayed travel flight - missed gym session" },
  "2026-08-10": { id: "att-10", date: "2026-08-10", status: "Present", checkInTime: "18:15", checkOutTime: "19:30", gymName: "Metropolis Barbell Club", workoutTitle: "Quads & Calves" },
  "2026-08-09": { id: "att-09", date: "2026-08-09", status: "Rest Day" },
  "2026-08-08": { id: "att-08", date: "2026-08-08", status: "Present", checkInTime: "11:00", checkOutTime: "12:15", gymName: "Metropolis Barbell Club", workoutTitle: "Arms & Core" },
  "2026-08-07": { id: "att-07", date: "2026-08-07", status: "Present", checkInTime: "17:30", checkOutTime: "18:45", gymName: "Metropolis Barbell Club", workoutTitle: "Deadlift & Back" },
  "2026-08-06": { id: "att-06", date: "2026-08-06", status: "Present", checkInTime: "18:00", checkOutTime: "19:15", gymName: "Metropolis Barbell Club", workoutTitle: "Chest Heavy" },
  "2026-08-05": { id: "att-05", date: "2026-08-05", status: "Rest Day" },
  "2026-08-04": { id: "att-04", date: "2026-08-04", status: "Present", checkInTime: "17:45", checkOutTime: "19:00", gymName: "Metropolis Barbell Club", workoutTitle: "Legs & Abs" },
  "2026-08-03": { id: "att-03", date: "2026-08-03", status: "Present", checkInTime: "18:00", checkOutTime: "19:20", gymName: "Metropolis Barbell Club", workoutTitle: "Shoulders Delts" },
  "2026-08-02": { id: "att-02", date: "2026-08-02", status: "Rest Day" },
  "2026-08-01": { id: "att-01", date: "2026-08-01", status: "Present", checkInTime: "10:00", checkOutTime: "11:30", gymName: "Metropolis Barbell Club", workoutTitle: "Baseline Testing" },
};

export const DEFAULT_ACHIEVEMENTS: any[] = [
  { id: "ach-1", title: "7 Days Workout Streak", description: "Completed scheduled weight sessions 7 consecutive days", category: "Workout", iconName: "Flame", unlocked: true, unlockedDate: "2026-08-07", progress: 7, target: 7, unit: "days" },
  { id: "ach-2", title: "15 Days Workout Streak", description: "Maintained training momentum for 15 days", category: "Workout", iconName: "Trophy", unlocked: true, unlockedDate: "2026-08-19", progress: 15, target: 15, unit: "days" },
  { id: "ach-3", title: "30 Days Workout Streak", description: "Iron discipline: Complete 30-day workout schedule", category: "Streak", iconName: "Award", unlocked: false, progress: 21, target: 30, unit: "days" },
  { id: "ach-4", title: "100 Days Workout Streak", description: "Elite athlete status: 100 days of relentless gym attendance", category: "Streak", iconName: "Crown", unlocked: false, progress: 21, target: 100, unit: "days" },
  { id: "ach-5", title: "Protein Goal Completed", description: "Achieved daily protein targets for 20 days", category: "Diet", iconName: "Beef", unlocked: true, unlockedDate: "2026-08-20", progress: 24, target: 20, unit: "days" },
  { id: "ach-6", title: "Water Goal Completed", description: "Logged 3,000ml hydration for 25 days", category: "Hydration", iconName: "Droplets", unlocked: true, unlockedDate: "2026-08-25", progress: 26, target: 25, unit: "days" },
  { id: "ach-7", title: "Weight Loss Milestone", description: "Reduced body weight by 2.5kg while preserving lean mass", category: "Milestone", iconName: "TrendingDown", unlocked: true, unlockedDate: "2026-08-24", progress: 2.7, target: 2.5, unit: "kg" },
  { id: "ach-8", title: "Weight Gain Milestone", description: "Controlled lean mass bulking milestone (for Hypertrophy phase)", category: "Milestone", iconName: "TrendingUp", unlocked: false, progress: 0, target: 3.0, unit: "kg" },
  { id: "ach-9", title: "Perfect Diet Week", description: "7 consecutive days of 100% meal compliance and zero cheat meals", category: "Diet", iconName: "Sparkles", unlocked: true, unlockedDate: "2026-08-22", progress: 7, target: 7, unit: "days" },
  { id: "ach-10", title: "Perfect Workout Week", description: "Completed every prescribed exercise and set with progressive overload", category: "Workout", iconName: "CheckCircle2", unlocked: true, unlockedDate: "2026-08-22", progress: 7, target: 7, unit: "days" },
];

export const DEFAULT_MISTAKES: any[] = [
  {
    id: "mistake-1",
    mistakeType: "Low Water Intake",
    date: "2026-08-27",
    reason: "Logged only 1,800ml due to afternoon executive meetings",
    frequency: 3,
    severity: "Medium",
    aiSuggestion: "Place a 1,000ml stainless steel bottle on the office desk and sip 250ml every 45 minutes.",
  },
  {
    id: "mistake-2",
    mistakeType: "Skipped Lunch",
    date: "2026-08-25",
    reason: "Unexpected conference call clashed directly with the 13:30 scheduled meal",
    frequency: 2,
    severity: "High",
    aiSuggestion: "Keep a shaker bottle containing 35g Whey + 40g oat flour in your work bag for rapid 2-minute nutrition.",
  },
  {
    id: "mistake-3",
    mistakeType: "Low Sleep",
    date: "2026-08-26",
    reason: "Late night laptop screen time caused delay in sleep latency (5.5h total)",
    frequency: 4,
    severity: "High",
    aiSuggestion: "Set phone to Do-Not-Disturb and activate warm amber night light mode at 22:15 sharp.",
  },
  {
    id: "mistake-4",
    mistakeType: "High Calories",
    date: "2026-08-15",
    reason: "Unplanned weekend dessert brought daily calories to 2,650 kcal (+450 over budget)",
    frequency: 1,
    severity: "Medium",
    aiSuggestion: "When celebrating social events, bank 300 kcal earlier in the day via lean white fish or egg whites.",
  },
  {
    id: "mistake-5",
    mistakeType: "Missed Gym",
    date: "2026-08-11",
    reason: "Intercity flight delayed by 4 hours during evening travel",
    frequency: 1,
    severity: "Low",
    aiSuggestion: "Perform the FitPulse 20-minute hotel room bodyweight conditioning routine when travel disrupts gym access.",
  },
];

export const DEFAULT_CARDIO_SESSIONS: any[] = [
  { id: "c-1", date: "2026-08-28", type: "Cardio", durationMinutes: 20, caloriesBurned: 180, distanceKm: 2.5, notes: "Post-lift incline treadmill" },
  { id: "c-2", date: "2026-08-26", type: "Cycling", durationMinutes: 30, caloriesBurned: 240, distanceKm: 8.4, notes: "Stationary bike aerobic zone 2" },
  { id: "c-3", date: "2026-08-24", type: "Running", durationMinutes: 25, caloriesBurned: 260, distanceKm: 3.8, notes: "Outdoor park tempo run" },
  { id: "c-4", date: "2026-08-22", type: "Treadmill", durationMinutes: 25, caloriesBurned: 210, distanceKm: 3.2, notes: "Speed interval sprints" },
];

export const DEFAULT_NIGHTLY_REPORTS: Record<string, any> = {
  "2026-08-28": {
    id: "coach-2026-08-28",
    date: "2026-08-28",
    headline: "Nightly AI Fitness Coach Synthesis",
    coachInsights: [
      "You missed your protein target today by 12g (145g achieved vs 157g goal).",
      "You skipped no scheduled major meals; great adherence to the 9-meal structure.",
      "You completed 8,420 steps today — close to your 10,000 threshold.",
      "Increase water intake tomorrow by at least 400ml for optimal cellular hydration.",
      "You should train Back & Posterior Chain tomorrow to maintain optimal push/pull muscular balance.",
      "Ensure at least 7.5 to 8 hours of sleep tonight to maximize muscle protein synthesis and CNS recovery.",
    ],
    tomorrowWorkoutFocus: "Back & Posterior Chain (Deadlifts, Lat Pulldowns, Barbell Rows)",
    tomorrowActionItems: [
      "Drink 500ml warm water with lemon upon waking up",
      "Hit 40g+ protein with breakfast",
      "Complete 20 minutes brisk walking or cycling",
      "Hit the Back & Biceps hypertrophy workout with strict tempo",
    ],
    encouragement: "Excellent progress this week. Your body fat has reduced by 2.3% and lean muscle mass is 100% preserved. Keep going!",
  },
};

export const DEFAULT_WORKOUT_HISTORY: WorkoutSession[] = [
    {
      id: "w-hist-1",
      workoutName: "Upper Power & Push",
      workoutType: "Strength",
      muscleGroup: "Chest",
      date: "2026-08-26",
      startTime: "17:30",
      endTime: "18:45",
      durationMinutes: 75,
      caloriesBurned: 460,
      notes: "Hit solid 80kg bench for 4 sets. Great energy.",
      workoutMood: "Energized",
      energyLevel: 9,
      completed: true,
      exercises: [
        {
          exerciseId: "chest-1",
          exerciseName: "Flat Bench Press",
          muscleGroup: "Chest",
          sets: [
            { id: "s1", setNumber: 1, weightKg: 75, reps: 10, completed: true, failure: false },
            { id: "s2", setNumber: 2, weightKg: 80, reps: 8, completed: true, failure: false },
            { id: "s3", setNumber: 3, weightKg: 80, reps: 8, completed: true, failure: false },
            { id: "s4", setNumber: 4, weightKg: 82.5, reps: 6, completed: true, failure: true },
          ],
        },
        {
          exerciseId: "chest-2",
          exerciseName: "Incline Bench Press",
          muscleGroup: "Chest",
          sets: [
            { id: "s5", setNumber: 1, weightKg: 60, reps: 10, completed: true, failure: false },
            { id: "s6", setNumber: 2, weightKg: 65, reps: 8, completed: true, failure: false },
            { id: "s7", setNumber: 3, weightKg: 65, reps: 8, completed: true, failure: false },
          ],
        },
        {
          exerciseId: "triceps-1",
          exerciseName: "Pushdown",
          muscleGroup: "Triceps",
          sets: [
            { id: "s8", setNumber: 1, weightKg: 30, reps: 15, completed: true, failure: false },
            { id: "s9", setNumber: 2, weightKg: 35, reps: 12, completed: true, failure: false },
            { id: "s10", setNumber: 3, weightKg: 35, reps: 11, completed: true, failure: true },
          ],
        },
      ],
    },
    {
      id: "w-hist-2",
      workoutName: "Leg Hypertrophy & Posterior Chain",
      workoutType: "Hypertrophy",
      muscleGroup: "Legs",
      date: "2026-08-24",
      startTime: "18:00",
      endTime: "19:15",
      durationMinutes: 75,
      caloriesBurned: 510,
      notes: "Squats felt deep and explosive. Hamstrings burned on RDLs.",
      workoutMood: "Great",
      energyLevel: 8,
      completed: true,
      exercises: [
        {
          exerciseId: "legs-1",
          exerciseName: "Squat",
          muscleGroup: "Legs",
          sets: [
            { id: "sq1", setNumber: 1, weightKg: 90, reps: 10, completed: true, failure: false },
            { id: "sq2", setNumber: 2, weightKg: 100, reps: 8, completed: true, failure: false },
            { id: "sq3", setNumber: 3, weightKg: 105, reps: 8, completed: true, failure: false },
            { id: "sq4", setNumber: 4, weightKg: 110, reps: 6, completed: true, failure: false },
          ],
        },
        {
          exerciseId: "legs-6",
          exerciseName: "Romanian Deadlift",
          muscleGroup: "Legs",
          sets: [
            { id: "rdl1", setNumber: 1, weightKg: 80, reps: 10, completed: true, failure: false },
            { id: "rdl2", setNumber: 2, weightKg: 85, reps: 8, completed: true, failure: false },
            { id: "rdl3", setNumber: 3, weightKg: 85, reps: 8, completed: true, failure: false },
          ],
        },
      ],
    },
  ];

export const DEFAULT_DAILY_NUTRITION: Record<string, DailyNutritionLog> = {
    "2026-08-28": {
      date: "2026-08-28",
      waterLoggedMl: 2600,
      stepsCount: 8420,
      activeCaloriesBurned: 480,
      cheatMeals: [],
      meals: [
        {
          id: "m-1",
          mealType: "Morning Water",
          plannedTime: "07:00",
          actualTime: "07:15",
          completed: true,
          missed: false,
          notes: "Large warm glass with lemon & pinch of pink salt",
          foods: [
            { id: "f-w1", name: "Filtered Pure Water", servingSize: "500ml", quantity: 1, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 500 },
          ],
        },
        {
          id: "m-2",
          mealType: "Breakfast",
          plannedTime: "08:15",
          actualTime: "08:30",
          completed: true,
          missed: false,
          notes: "Classic high protein oatmeal bowl",
          foods: [
            { id: "f-b1", name: "Rolled Oats (Dry)", servingSize: "50g", quantity: 1.2, calories: 228, protein: 7.8, carbs: 40.8, fat: 4.2, fiber: 6 },
            { id: "f-b2", name: "Whey Protein Isolate Scoop", servingSize: "1 scoop (30g)", quantity: 1, calories: 115, protein: 25, carbs: 1.5, fat: 0.5, fiber: 0, waterMl: 250 },
            { id: "f-b3", name: "Blueberries (Fresh)", servingSize: "1 cup (148g)", quantity: 0.5, calories: 42, protein: 0.5, carbs: 10.5, fat: 0.2, fiber: 1.8 },
          ],
        },
        {
          id: "m-3",
          mealType: "Mid Morning",
          plannedTime: "11:00",
          actualTime: "11:10",
          completed: true,
          missed: false,
          notes: "Green tea and handful of raw almonds",
          foods: [
            { id: "f-mm1", name: "Almonds (Raw)", servingSize: "1 oz (28g)", quantity: 1, calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
          ],
        },
        {
          id: "m-4",
          mealType: "Lunch",
          plannedTime: "13:30",
          actualTime: "13:35",
          completed: true,
          missed: false,
          notes: "Meal prepped grilled chicken & fragrant jasmine rice with broccoli",
          foods: [
            { id: "f-l1", name: "Chicken Breast (Cooked)", servingSize: "100g", quantity: 1.8, calories: 297, protein: 55.8, carbs: 0, fat: 6.5, fiber: 0 },
            { id: "f-l2", name: "Brown Rice (Cooked)", servingSize: "1 cup (150g)", quantity: 1, calories: 185, protein: 4.5, carbs: 39, fat: 1.5, fiber: 3.5 },
            { id: "f-l3", name: "Steamed Broccoli", servingSize: "1 cup (150g)", quantity: 1, calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1 },
            { id: "f-l4", name: "Extra Virgin Olive Oil", servingSize: "1 tbsp", quantity: 0.5, calories: 60, protein: 0, carbs: 0, fat: 6.8, fiber: 0 },
          ],
        },
        {
          id: "m-5",
          mealType: "Pre Workout",
          plannedTime: "16:45",
          actualTime: "16:45",
          completed: true,
          missed: false,
          notes: "Quick digesting carbs & black coffee",
          foods: [
            { id: "f-pw1", name: "Banana", servingSize: "1 medium", quantity: 1, calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
            { id: "f-pw2", name: "Black Coffee (Pre-Workout)", servingSize: "1 mug", quantity: 1, calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, waterMl: 235 },
          ],
        },
        {
          id: "m-6",
          mealType: "Post Workout",
          plannedTime: "18:45",
          actualTime: "",
          completed: false,
          missed: false,
          notes: "Ready for gym shaker",
          foods: [
            { id: "f-po1", name: "Whey Protein Isolate Scoop", servingSize: "1 scoop", quantity: 1, calories: 115, protein: 25, carbs: 1.5, fat: 0.5, fiber: 0, waterMl: 300 },
            { id: "f-po2", name: "Creatine Monohydrate", servingSize: "5g", quantity: 1, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          ],
        },
        {
          id: "m-7",
          mealType: "Evening Snack",
          plannedTime: "19:30",
          actualTime: "",
          completed: false,
          missed: false,
          notes: "",
          foods: [],
        },
        {
          id: "m-8",
          mealType: "Dinner",
          plannedTime: "20:30",
          actualTime: "",
          completed: false,
          missed: false,
          notes: "Baked salmon and roasted asparagus planned",
          foods: [
            { id: "f-d1", name: "Atlantic Salmon (Grilled)", servingSize: "100g", quantity: 1.5, calories: 309, protein: 33, carbs: 0, fat: 18.6, fiber: 0 },
            { id: "f-d2", name: "Sweet Potato (Baked)", servingSize: "1 medium", quantity: 1, calories: 112, protein: 2.1, carbs: 26, fat: 0.2, fiber: 3.9 },
          ],
        },
        {
          id: "m-9",
          mealType: "Before Sleep",
          plannedTime: "22:15",
          actualTime: "",
          completed: false,
          missed: false,
          notes: "Slow digesting casein or Greek yogurt with chamomile",
          foods: [
            { id: "f-bs1", name: "Greek Yogurt (Non-fat)", servingSize: "1 cup", quantity: 0.75, calories: 75, protein: 12.8, carbs: 4.5, fat: 0.5, fiber: 0 },
          ],
        },
      ],
    },
  };

export const DEFAULT_MEASUREMENTS: BodyMeasurement[] = [
    {
      id: "m-log-1",
      date: "2026-08-01",
      weightKg: 81.2,
      chestCm: 104,
      waistCm: 89,
      hipCm: 99,
      neckCm: 39,
      shouldersCm: 120,
      leftArmCm: 37.0,
      rightArmCm: 37.2,
      leftThighCm: 59,
      rightThighCm: 59.5,
      calvesCm: 38,
      bodyFatPct: 18.2,
      bmi: 25.6,
      notes: "Starting 8-week lean definition cycle.",
    },
    {
      id: "m-log-2",
      date: "2026-08-15",
      weightKg: 79.8,
      chestCm: 104.5,
      waistCm: 87.5,
      hipCm: 98,
      neckCm: 39,
      shouldersCm: 120.5,
      leftArmCm: 37.2,
      rightArmCm: 37.4,
      leftThighCm: 58.8,
      rightThighCm: 59.0,
      calvesCm: 38,
      bodyFatPct: 17.1,
      bmi: 25.2,
      notes: "Noticeable waist slimming while maintaining shoulder & chest volume.",
    },
    {
      id: "m-log-3",
      date: "2026-08-28",
      weightKg: 78.5,
      chestCm: 105,
      waistCm: 85.8,
      hipCm: 97,
      neckCm: 38.5,
      shouldersCm: 121,
      leftArmCm: 37.5,
      rightArmCm: 37.6,
      leftThighCm: 58.5,
      rightThighCm: 58.7,
      calvesCm: 38,
      bodyFatPct: 15.9,
      bmi: 24.8,
      notes: "Targeting 14% body fat. Abs lines visibly appearing.",
    },
  ];

export const DEFAULT_PROGRESS_PHOTOS: ProgressPhoto[] = [
    {
      id: "photo-1",
      date: "2026-08-01",
      category: "Front",
      photoUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80",
      weightKg: 81.2,
      bodyFatPct: 18.2,
      notes: "Day 1 Baseline photo before deficit.",
    },
    {
      id: "photo-2",
      date: "2026-08-28",
      category: "Front",
      photoUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
      weightKg: 78.5,
      bodyFatPct: 15.9,
      notes: "Week 4 Progress check. Significant abdominal definition and tighter waist.",
    },
  ];

export const DEFAULT_COACH_PLANS: CoachWorkoutPlan[] = [
    {
      id: "cp-1",
      coachName: "Coach Marcus Vance (CSCS)",
      planTitle: "Chest Hypertrophy & Upper Pec Accentuation",
      workoutDate: "2026-08-28",
      difficulty: "Advanced",
      instructions: "Ensure a full 2-second pause at the bottom stretch on all dumbbell presses. Do not rush the eccentric phase.",
      notes: "Aim for progressive overload on Set 3. Drink at least 1L during the session.",
      status: "Assigned",
      exercises: [
        {
          exerciseId: "chest-2",
          exerciseName: "Incline Bench Press",
          sets: 4,
          reps: "8-10",
          weightKg: 70,
          restTimeSec: 90,
          instructions: "Keep shoulder blades retracted and depressed.",
          notes: "Target upper chest shelf.",
        },
        {
          exerciseId: "chest-5",
          exerciseName: "Cable Fly",
          sets: 3,
          reps: "12-15",
          weightKg: 15,
          restTimeSec: 60,
          instructions: "Cross wrists slightly at peak contraction for max squeeze.",
          notes: "Focus purely on pectoral pump.",
        },
        {
          exerciseId: "triceps-1",
          exerciseName: "Pushdown",
          sets: 3,
          reps: "12-15",
          weightKg: 35,
          restTimeSec: 60,
          instructions: "Spread rope apart at the bottom.",
          notes: "Lockout with strict elbow discipline.",
        },
      ],
    },
  ];

export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "tpl-push-1",
    name: "Push Day Hypertrophy",
    description: "High-volume chest, front/lateral delts, and triceps builder with compound overloads.",
    muscleGroup: "Chest",
    workoutType: "Hypertrophy",
    estimatedMinutes: 60,
    createdAt: "2026-08-01",
    exercises: [
      { exerciseId: "chest-1", exerciseName: "Flat Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", difficulty: "Intermediate", plannedSets: 4, plannedReps: 10, plannedWeightKg: 80, exerciseNotes: "Warm up with bar, pause slightly on chest" },
      { exerciseId: "chest-2", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell", difficulty: "Intermediate", plannedSets: 4, plannedReps: 12, plannedWeightKg: 28, exerciseNotes: "30-degree incline angle for upper pectoral focus" },
      { exerciseId: "shoulders-1", exerciseName: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", difficulty: "Beginner", plannedSets: 4, plannedReps: 15, plannedWeightKg: 12, exerciseNotes: "Lead with elbows, controlled negative" },
      { exerciseId: "triceps-1", exerciseName: "Rope Triceps Pushdown", muscleGroup: "Triceps", equipment: "Cable", difficulty: "Beginner", plannedSets: 3, plannedReps: 15, plannedWeightKg: 35, exerciseNotes: "Flare rope at full extension" },
    ],
  },
  {
    id: "tpl-pull-1",
    name: "Pull Strength & Lat Focus",
    description: "Thick back, traps, rear delts, and peak biceps training.",
    muscleGroup: "Back",
    workoutType: "Strength",
    estimatedMinutes: 55,
    createdAt: "2026-08-02",
    exercises: [
      { exerciseId: "back-1", exerciseName: "Conventional Barbell Deadlift", muscleGroup: "Back", equipment: "Barbell", difficulty: "Advanced", plannedSets: 4, plannedReps: 6, plannedWeightKg: 130, exerciseNotes: "Brace core tightly, hinge from hips" },
      { exerciseId: "back-2", exerciseName: "Lat Pulldown (Wide Grip)", muscleGroup: "Back", equipment: "Cable", difficulty: "Beginner", plannedSets: 4, plannedReps: 12, plannedWeightKg: 65, exerciseNotes: "Pull to upper sternum, avoid excessive rocking" },
      { exerciseId: "biceps-1", exerciseName: "Barbell Bicep Curl", muscleGroup: "Biceps", equipment: "Barbell", difficulty: "Beginner", plannedSets: 4, plannedReps: 10, plannedWeightKg: 35, exerciseNotes: "Keep elbows pinned to ribcage" },
    ],
  },
  {
    id: "tpl-legs-1",
    name: "Legs & Core Power Blaster",
    description: "Quads, hamstrings, calves, and anti-extension core stability.",
    muscleGroup: "Legs",
    workoutType: "Strength",
    estimatedMinutes: 60,
    createdAt: "2026-08-03",
    exercises: [
      { exerciseId: "legs-1", exerciseName: "Barbell Back Squat", muscleGroup: "Legs", equipment: "Barbell", difficulty: "Advanced", plannedSets: 4, plannedReps: 8, plannedWeightKg: 105, exerciseNotes: "Depth to parallel or slightly below" },
      { exerciseId: "legs-2", exerciseName: "Leg Press 45°", muscleGroup: "Legs", equipment: "Machine", difficulty: "Intermediate", plannedSets: 4, plannedReps: 12, plannedWeightKg: 180, exerciseNotes: "Do not lock knees completely at top" },
      { exerciseId: "calves-1", exerciseName: "Standing Calf Raise", muscleGroup: "Calves", equipment: "Machine", difficulty: "Beginner", plannedSets: 4, plannedReps: 15, plannedWeightKg: 70, exerciseNotes: "Deep stretch at bottom for 2 sec" },
    ],
  },
  {
    id: "tpl-upper-1",
    name: "Upper Body Power & Tone",
    description: "Balanced horizontal/vertical push-pull routine.",
    muscleGroup: "Mixed",
    workoutType: "Hypertrophy",
    estimatedMinutes: 50,
    createdAt: "2026-08-04",
    exercises: [
      { exerciseId: "chest-3", exerciseName: "Cable Chest Fly", muscleGroup: "Chest", equipment: "Cable", difficulty: "Beginner", plannedSets: 3, plannedReps: 15, plannedWeightKg: 20 },
      { exerciseId: "back-3", exerciseName: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable", difficulty: "Beginner", plannedSets: 4, plannedReps: 12, plannedWeightKg: 60 },
      { exerciseId: "shoulders-2", exerciseName: "Overhead Dumbbell Press", muscleGroup: "Shoulders", equipment: "Dumbbell", difficulty: "Intermediate", plannedSets: 3, plannedReps: 10, plannedWeightKg: 24 },
    ],
  },
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act-1",
    date: "2026-08-28",
    activityType: "Walking",
    startTime: "07:15",
    durationMinutes: 45,
    distanceKm: 4.2,
    caloriesBurned: 210,
    avgSpeedKmh: 5.6,
    heartRateBpm: 112,
    routeNotes: "Brisk morning neighbourhood park loop",
  },
  {
    id: "act-2",
    date: "2026-08-27",
    activityType: "Cycling",
    startTime: "18:00",
    durationMinutes: 35,
    distanceKm: 12.5,
    caloriesBurned: 320,
    avgSpeedKmh: 21.4,
    heartRateBpm: 138,
    routeNotes: "Outdoor riverside trail tempo ride",
  },
  {
    id: "act-3",
    date: "2026-08-26",
    activityType: "Treadmill",
    startTime: "18:45",
    durationMinutes: 25,
    distanceKm: 3.5,
    caloriesBurned: 240,
    avgSpeedKmh: 8.4,
    heartRateBpm: 148,
    routeNotes: "Post-lifting incline treadmill jog (3% incline)",
  },
];

export const DEFAULT_DAILY_ROUTINES: Record<string, DailyRoutineLog> = {
  "2026-08-28": {
    date: "2026-08-28",
    wakeUpTime: "06:30",
    sleepTime: "22:45",
    morningWaterTime: "06:45",
    breakfastTime: "08:15",
    midMorningTime: "10:45",
    lunchTime: "13:15",
    preWorkoutTime: "16:30",
    postWorkoutTime: "18:15",
    eveningSnackTime: "19:30",
    dinnerTime: "21:00",
    beforeSleepTime: "22:15",
    additionalDrinksNotes: "1 Green tea at 11:00 AM, 1 Black espresso at 3:30 PM",
  },
};

export const INITIAL_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  activeWorkout: null,
  workoutHistory: DEFAULT_WORKOUT_HISTORY,
  dailyNutrition: DEFAULT_DAILY_NUTRITION,
  measurements: DEFAULT_MEASUREMENTS,
  progressPhotos: DEFAULT_PROGRESS_PHOTOS,
  coachPlans: DEFAULT_COACH_PLANS,
  membership: DEFAULT_MEMBERSHIP,
  checklists: {
    "2026-08-28": {
      date: "2026-08-28",
      workout: true,
      cardio: true,
      warmUp: true,
      stretching: true,
      coolDown: false,
      allMeals: false,
      proteinGoal: true,
      caloriesGoal: true,
      waterGoal: true,
      supplements: true,
      sleepGoal: true,
      sleepHours: 7.5,
      stepsGoal: true,
      stepsCount: 8420,
      weightUpdated: true,
      progressPhoto: false,
    },
  },
  reminders: DEFAULT_REMINDERS,
  attendance: DEFAULT_ATTENDANCE,
  achievements: DEFAULT_ACHIEVEMENTS,
  mistakes: DEFAULT_MISTAKES,
  cardioSessions: DEFAULT_CARDIO_SESSIONS,
  customExercises: [],
  customFoods: DEFAULT_CUSTOM_FOODS,
  savedDietPlans: DEFAULT_SAVED_DIET_PLANS,
  activeDietPlanId: "plan-weight-loss",
  workoutTemplates: DEFAULT_WORKOUT_TEMPLATES,
  activityLogs: DEFAULT_ACTIVITY_LOGS,
  dailyRoutines: DEFAULT_DAILY_ROUTINES,
  nightlyReports: DEFAULT_NIGHTLY_REPORTS,
  security: {
    pinEnabled: false,
    pinCode: "1234",
    biometricEnabled: false,
    isLocked: false,
    lastActiveTimestamp: Date.now(),
  },
  sync: {
    isOnline: true,
    lastSyncDate: "Just now",
    syncStatus: "synced",
    accountType: "Local Encrypted",
    authProvider: "Google",
  },
  darkMode: true,
};

export function loadAppState(): AppState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Merge with initial state to ensure newly added properties exist
      return {
        ...INITIAL_STATE,
        ...parsed,
        profile: { ...INITIAL_STATE.profile, ...(parsed.profile || {}) },
        security: { ...INITIAL_STATE.security, ...(parsed.security || {}) },
        membership: {
          ...INITIAL_STATE.membership,
          ...(parsed.membership || {}),
          gymAddress: parsed.membership?.gymAddress || INITIAL_STATE.membership.gymAddress,
          gymContactNumber: parsed.membership?.gymContactNumber || INITIAL_STATE.membership.gymContactNumber,
          membershipType: parsed.membership?.membershipType || INITIAL_STATE.membership.membershipType || "Yearly",
          amountPaid: typeof parsed.membership?.amountPaid === "number" ? parsed.membership.amountPaid : (parsed.membership?.fees || INITIAL_STATE.membership.fees),
          remainingAmount: typeof parsed.membership?.remainingAmount === "number" ? parsed.membership.remainingAmount : 0,
          paymentDate: parsed.membership?.paymentDate || parsed.membership?.startDate || INITIAL_STATE.membership.paymentDate,
          notes: parsed.membership?.notes ?? INITIAL_STATE.membership.notes,
        },
        attendance: { ...INITIAL_STATE.attendance, ...(parsed.attendance || {}) },
        achievements: (parsed.achievements && parsed.achievements.length > 0) ? parsed.achievements : INITIAL_STATE.achievements,
        mistakes: (parsed.mistakes && parsed.mistakes.length > 0) ? parsed.mistakes : INITIAL_STATE.mistakes,
        cardioSessions: (parsed.cardioSessions && parsed.cardioSessions.length > 0) ? parsed.cardioSessions : INITIAL_STATE.cardioSessions,
        customExercises: parsed.customExercises || [],
        customFoods: (parsed.customFoods && parsed.customFoods.length > 0) ? parsed.customFoods : DEFAULT_CUSTOM_FOODS,
        savedDietPlans: (parsed.savedDietPlans && parsed.savedDietPlans.length > 0) ? parsed.savedDietPlans : DEFAULT_SAVED_DIET_PLANS,
        activeDietPlanId: parsed.activeDietPlanId || "plan-weight-loss",
        workoutTemplates: (parsed.workoutTemplates && parsed.workoutTemplates.length > 0) ? parsed.workoutTemplates : INITIAL_STATE.workoutTemplates,
        activityLogs: (parsed.activityLogs && parsed.activityLogs.length > 0) ? parsed.activityLogs : INITIAL_STATE.activityLogs,
        dailyRoutines: { ...INITIAL_STATE.dailyRoutines, ...(parsed.dailyRoutines || {}) },
        nightlyReports: { ...INITIAL_STATE.nightlyReports, ...(parsed.nightlyReports || {}) },
      };
    }
  } catch (err) {
    console.error("Failed to load app state:", err);
  }
  return INITIAL_STATE;
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Asynchronously synchronize to Firestore if user is authenticated or guest
    const userId = state.cloudUser?.uid || "guest";
    if (userId) {
      syncAppStateToCloud(userId, state).catch(() => {
        // Offline resilience
      });
    }
  } catch (err) {
    console.error("Failed to save app state:", err);
  }
}

export function exportAppStateJSON(state?: AppState): void {
  const currentState = state || loadAppState();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `FitPulse_Backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importAppStateJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") return false;
    const merged: AppState = {
      ...INITIAL_STATE,
      ...parsed,
      profile: { ...INITIAL_STATE.profile, ...(parsed.profile || {}) },
      security: { ...INITIAL_STATE.security, ...(parsed.security || {}) },
      membership: { ...INITIAL_STATE.membership, ...(parsed.membership || {}) },
    };
    saveAppState(merged);
    return true;
  } catch (err) {
    console.error("Failed to import app state:", err);
    return false;
  }
}
