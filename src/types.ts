export type FitnessGoal =
  | "Weight Loss"
  | "Weight Gain"
  | "Muscle Gain"
  | "Body Recomposition"
  | "Maintenance";

export type ActivityLevel =
  | "Sedentary"
  | "Lightly Active"
  | "Moderately Active"
  | "Very Active"
  | "Extra Active";

export type Gender = "Male" | "Female" | "Other";

export type TabId =
  | "dashboard"
  | "workout"
  | "diet"
  | "activity"
  | "lifestyle"
  | "health"
  | "calculators"
  | "coach"
  | "checklist"
  | "reports"
  | "ailab";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface UserProfile {
  photoUrl: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  heightCm: number;
  heightUnit: "cm" | "ft";
  currentWeightKg: number;
  targetWeightKg: number;
  goalWeightKg: number;
  weightUnit: "kg" | "lbs";
  bloodGroup: string;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  medicalConditions: string;
  allergies: string;
  emergencyContact: EmergencyContact;
  notes: string;
  securityPinEnabled?: boolean;
  age?: number;
  workoutDaysPerWeek?: number;
}

export interface HealthCalculations {
  bmi: number;
  bmiStatus: "Underweight" | "Normal" | "Overweight" | "Obese";
  bmr: number;
  tdee: number;
  idealBodyWeightKg: number;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  healthyWeightRangeKg: { min: number; max: number };
  dailyCaloriesRequired: number;
  dailyCaloriesWeightLoss: number;
  dailyCaloriesWeightGain: number;
  dailyCaloriesMaintenance: number;
  dailyCaloriesMuscleGain: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
  dailyFiberGrams: number;
  dailyWaterMl: number;
  weightToLoseKg: number;
  weightToGainKg: number;
  estimatedWeeks: number;
}

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Biceps"
  | "Triceps"
  | "Shoulders"
  | "Legs"
  | "Thighs"
  | "Calves"
  | "Forearms"
  | "Abs"
  | "Core"
  | "Glutes"
  | "Cardio"
  | "Full Body";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: string[];
  equipment: "Barbell" | "Dumbbell" | "Machine" | "Cable" | "Bodyweight" | "Cardio Equipment" | "Kettlebell" | string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  machineName?: string;
  instructions: string;
  description?: string;
  safetyTips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  animationUrl?: string;
  notes?: string;
  isCustom?: boolean;
  orderIndex?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightKg: number; // Actual Weight
  plannedWeightKg?: number; // Planned Weight
  reps: number; // Actual Reps
  plannedReps?: number; // Planned Reps
  completed: boolean;
  failure?: boolean;
  notes?: string;
  type?: "normal" | "warmup" | "dropset" | "failure";
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  machineName?: string;
  equipment?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  plannedSets?: number;
  plannedReps?: number;
  plannedWeightKg?: number;
  exerciseNotes?: string;
  sets: WorkoutSet[];
}

export type WorkoutMood = "Energized" | "Great" | "Normal" | "Tired" | "Exhausted";

export interface WorkoutSession {
  id: string;
  workoutName: string;
  title?: string;
  workoutType: "Strength" | "Hypertrophy" | "Cardio" | "HIIT" | "Calisthenics" | "Endurance";
  muscleGroup: MuscleGroup | "Mixed";
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  caloriesBurned: number;
  totalExercises?: number;
  totalSets?: number;
  totalReps?: number;
  totalVolumeKg?: number;
  personalRecords?: string[];
  notes: string;
  workoutMood?: WorkoutMood;
  energyLevel?: number; // 1-10
  exercises: WorkoutExerciseLog[];
  completed: boolean;
  isCoachAssigned?: boolean;
  isPR?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  muscleGroup: MuscleGroup | "Mixed";
  workoutType: "Strength" | "Hypertrophy" | "Cardio" | "HIIT" | "Calisthenics" | "Endurance";
  estimatedMinutes?: number;
  estimatedDurationMinutes?: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: MuscleGroup;
    machineName?: string;
    equipment: string;
    difficulty?: "Beginner" | "Intermediate" | "Advanced";
    exerciseNotes?: string;
    plannedSets: number;
    plannedReps: number;
    plannedWeightKg: number;
  }[];
  createdAt: string;
}

export type ActivityType =
  | "Walking"
  | "Running"
  | "Cycling"
  | "Treadmill"
  | "Outdoor Running"
  | "Elliptical"
  | "Jump Rope"
  | "Swimming"
  | "Sports"
  | "Other Sports"
  | "Other"
  | "Gym Workout"
  | "Yoga"
  | "HIIT";

export interface ActivityLog {
  id: string;
  date: string;
  activityType: ActivityType;
  startTime?: string;
  durationMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
  avgSpeedKmh?: number;
  heartRateBpm?: number;
  routeNotes?: string;
}

export interface DailyRoutineLog {
  date: string;
  wakeUpTime: string;
  sleepTime: string;
  morningWaterTime: string;
  breakfastTime: string;
  midMorningTime: string;
  lunchTime: string;
  preWorkoutTime: string;
  postWorkoutTime: string;
  eveningSnackTime: string;
  dinnerTime: string;
  beforeSleepTime: string;
  additionalDrinksNotes?: string;
}

export interface ProgressiveOverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  lastVolume: number;
  currentVolume: number;
  recommendation: "Increase Weight" | "Increase Repetitions" | "Increase Sets" | "Maintain Weight" | "Reduce Weight";
  deltaText: string;
  explanation: string;
}

export type MealType =
  | "Morning Water"
  | "Pre Workout"
  | "Post Workout"
  | "Breakfast"
  | "Mid Morning"
  | "Lunch"
  | "Evening Snack"
  | "Dinner"
  | "Before Sleep";

export interface CustomFoodItem {
  id: string;
  name: string;
  mealType?: string; // "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Pre Workout" | "Post Workout" | etc.
  quantity: number;
  unit: string; // "Gram" | "Piece" | "Bowl" | "Glass" | "Cup" | "Tbsp" | "Tsp" | "Scoop" | "Slice" | "Serving"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  notes?: string;
  isFavorite?: boolean;
  isCustom?: boolean;
  lastUsed?: string;
  createdAt: string;
  category?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  servingSize?: string;
  quantity: number;
  unit?: string;
  mealType?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  waterMl?: number;
  notes?: string;
  isFavorite?: boolean;
  isCustom?: boolean;
  lastUsed?: string;
  category?: string;
}

export interface MealLog {
  id: string;
  mealType: MealType;
  plannedTime: string;
  actualTime: string;
  foods: FoodItem[];
  completed: boolean;
  missed: boolean;
  notes: string;
}

export type MealPlanItem = MealLog;

export interface CheatMealRecord {
  id: string;
  date: string;
  name?: string;
  foodName?: string;
  calories: number;
  reason: string;
  burnPlan?: string;
  notes?: string;
}

export type CheatMealLog = CheatMealRecord;

export interface DailyNutritionLog {
  date: string;
  meals: MealLog[];
  waterLoggedMl: number;
  stepsCount: number;
  activeCaloriesBurned: number;
  walkingDistanceKm?: number;
  activeMinutes?: number;
  sleepHours?: number;
  dietStatus?: "Diet Followed" | "Diet Missed" | "Diet Broken";
  cheatMeals: CheatMealRecord[];
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  shouldersCm: number;
  leftArmCm: number;
  rightArmCm: number;
  leftThighCm: number;
  rightThighCm: number;
  calvesCm: number;
  bodyFatPct: number;
  bmi: number;
  notes?: string;
}

export type PhotoCategory = "Front" | "Back" | "Left" | "Right" | "Weekly" | "Monthly";

export interface ProgressPhoto {
  id: string;
  date: string;
  category: PhotoCategory;
  photoUrl: string;
  weightKg: number;
  bodyFatPct?: number;
  notes: string;
}

export interface CoachAssignedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  weightKg: number;
  restTimeSec: number;
  instructions: string;
  notes: string;
  mediaUrl?: string;
}

export interface CoachWorkoutPlan {
  id: string;
  coachName: string;
  planTitle: string;
  workoutDate: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  instructions: string;
  notes: string;
  exercises: CoachAssignedExercise[];
  status: "Assigned" | "Completed" | "Skipped" | "Modified" | "In-Progress";
}

export type MembershipType = "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";

export interface GymMembership {
  gymName: string;
  gymAddress: string;
  gymContactNumber: string;
  trainerName: string;
  trainerContact?: string;
  startDate: string;
  expiryDate: string;
  membershipType: MembershipType;
  fees: number;
  amountPaid: number;
  remainingAmount: number;
  paymentDate: string;
  renewalDate: string;
  notes: string;
  autoReminder: boolean;
  gymBranch?: string;
  planName?: string;
  feesUSD?: number;
  currency?: string;
  paymentStatus?: "Paid" | "Pending" | "Overdue";
  trainerFees?: number;
}

export interface DietPlanFoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  waterMl?: number;
  notes?: string;
}

export interface DietPlanMeal {
  id: string;
  mealName: string;
  mealTime: string;
  foods: DietPlanFoodItem[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  targetWaterMl: number;
  notes?: string;
}

export interface SavedDietPlan {
  id: string;
  planName: string;
  description: string;
  category: "Weight Loss" | "Muscle Gain" | "Maintenance" | "Custom";
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalWaterMl: number;
  meals: DietPlanMeal[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface DailyChecklist {
  date: string;
  workout: boolean;
  cardio: boolean;
  warmUp: boolean;
  stretching: boolean;
  coolDown: boolean;
  allMeals: boolean;
  proteinGoal: boolean;
  caloriesGoal: boolean;
  waterGoal: boolean;
  supplements: boolean;
  sleepGoal: boolean;
  sleepHours: number;
  stepsGoal: boolean;
  stepsCount: number;
  weightUpdated: boolean;
  progressPhoto: boolean;
}

export interface SmartReminder {
  id: string;
  title: string;
  type:
    | "Workout"
    | "Meal"
    | "Water"
    | "Supplement"
    | "Membership"
    | "Weight"
    | "Progress Photo"
    | "Sleep";
  time: string;
  enabled: boolean;
  days: string[];
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pinCode: string; // 4 digits
  biometricEnabled: boolean;
  isLocked: boolean;
  lastActiveTimestamp: number;
}

export interface CloudSyncState {
  isOnline: boolean;
  lastSyncDate: string;
  syncStatus: "synced" | "syncing" | "offline" | "error";
  accountType: "Local Encrypted" | "Cloud Authenticated";
  authProvider: "Google" | "Email" | "Mobile OTP" | "Guest";
  autoSyncEnabled?: boolean;
}

export type CloudSyncStatus = CloudSyncState;

export type GymAttendanceStatus = "Present" | "Absent" | "Holiday" | "Rest Day" | "Missed Workout";

export interface GymAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: GymAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  gymName?: string;
  notes?: string;
  workoutTitle?: string;
}

export interface FitnessAchievement {
  id: string;
  title: string;
  description: string;
  category: "Workout" | "Diet" | "Hydration" | "Milestone" | "Streak";
  iconName: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
  unit?: string;
}

export type MistakeType =
  | "Skipped Breakfast"
  | "Skipped Lunch"
  | "Skipped Dinner"
  | "Skipped Protein"
  | "Skipped Workout"
  | "Skipped Cardio"
  | "Low Water Intake"
  | "Low Sleep"
  | "High Calories"
  | "Low Protein"
  | "Too Many Cheat Meals"
  | "Missed Gym";

export interface UserMistakeItem {
  id: string;
  mistakeType: MistakeType;
  date: string;
  reason: string;
  frequency: number;
  severity: "Low" | "Medium" | "High";
  aiSuggestion: string;
}

export interface CardioSession {
  id: string;
  date: string;
  type: "Cardio" | "Cycling" | "Running" | "Treadmill";
  durationMinutes: number;
  caloriesBurned: number;
  distanceKm: number;
  notes?: string;
}

export interface SubmittedDailyReport {
  date: string;
  submittedAt: string;
  locked: boolean;
  notes?: string;
  metrics: {
    caloriesConsumed: number;
    caloriesBurned: number;
    remainingCalories: number;
    proteinGrams: number;
    waterLiters: number;
    steps: number;
    workoutTimeMins: number;
    gymAttendanceStatus: string;
    weightKg: number;
    overallScore: number;
  };
  validationChecks: {
    workoutChecked: boolean;
    dietChecked: boolean;
    waterChecked: boolean;
    stepsChecked: boolean;
  };
}

export interface SubmittedMonthlyReport {
  yearMonth: string; // YYYY-MM
  submittedAt: string;
  locked: boolean;
  monthName: string;
  year: number;
  totalDays: number;
  overallConsistencyPct: number;
  workoutSessions: number;
  totalVolumeKg: number;
  dietAdherencePct: number;
  gymAttendancePct: number;
  weightChangeKg: number;
  monthlyScore: number;
  notes?: string;
}

export interface SmartCoachNightlyReport {
  id: string;
  date: string;
  headline: string;
  coachInsights: string[];
  tomorrowWorkoutFocus: string;
  tomorrowActionItems: string[];
  encouragement: string;
}

export interface AppState {
  profile: UserProfile;
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  dailyNutrition: Record<string, DailyNutritionLog>; // key: YYYY-MM-DD
  measurements: BodyMeasurement[];
  progressPhotos: ProgressPhoto[];
  coachPlans: CoachWorkoutPlan[];
  membership: GymMembership;
  checklists: Record<string, DailyChecklist>; // key: YYYY-MM-DD
  reminders: SmartReminder[];
  attendance: Record<string, GymAttendanceRecord>; // key: YYYY-MM-DD
  achievements: FitnessAchievement[];
  mistakes: UserMistakeItem[];
  cardioSessions: CardioSession[];
  customExercises: Exercise[];
  customFoods?: CustomFoodItem[];
  savedDietPlans?: SavedDietPlan[];
  activeDietPlanId?: string;
  workoutTemplates: WorkoutTemplate[];
  activityLogs: ActivityLog[];
  dailyRoutines: Record<string, DailyRoutineLog>; // key: YYYY-MM-DD
  nightlyReports: Record<string, SmartCoachNightlyReport>; // key: YYYY-MM-DD
  submittedReports?: Record<string, SubmittedDailyReport>; // key: YYYY-MM-DD
  submittedMonthlyReports?: Record<string, SubmittedMonthlyReport>; // key: YYYY-MM
  security: SecuritySettings;
  sync: CloudSyncState;
  cloudUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    isAnonymous?: boolean;
  } | null;
  darkMode: boolean;
}

