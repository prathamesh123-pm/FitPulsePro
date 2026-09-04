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
  | "cloud-sync"
  | "admin-users"
  | "products"
  | "exercises"
  | "rate-charts"
  | "forms"
  | "group-reports"
  | "workout"
  | "diet"
  | "calories"
  | "activity"
  | "lifestyle"
  | "health"
  | "calculators"
  | "coach"
  | "checklist"
  | "reports"
  | "settings"
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
  targetCalories?: number;
  targetBodyFatPct?: number;
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

export type ExerciseCategory =
  | "Machine Exercises"
  | "Free Weight"
  | "Cardio"
  | "Stretching"
  | "Yoga"
  | "HIIT";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category?: ExerciseCategory | string;
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
  sets?: number;
  reps?: number;
  restTimeSeconds?: number;
  targetMuscle?: string;
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
  | "Swimming"
  | "Gym Workout"
  | "Yoga"
  | "Stretching"
  | "Sports"
  | "Stair Climbing"
  | "Skipping Rope"
  | "Meditation"
  | "Treadmill"
  | "Outdoor Running"
  | "Elliptical"
  | "HIIT"
  | "Other Sports"
  | "Custom Activity"
  | "Other";

export interface ActivityLog {
  id: string;
  date: string;
  activityType: ActivityType;
  customActivityName?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  distanceKm: number;
  steps?: number;
  caloriesBurned: number;
  estimatedFatBurnedGrams?: number;
  avgSpeedKmh?: number;
  paceMinPerKm?: string;
  swimmingLaps?: number;
  heartRateBpm?: number;
  intensity?: "Low" | "Moderate" | "High" | "Vigorous";
  routeNotes?: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface DailyFitnessGoals {
  dailyStepsGoal: number;
  walkingDistanceKmGoal: number;
  runningDistanceKmGoal: number;
  cyclingDistanceKmGoal: number;
  swimmingDistanceKmGoal: number;
  workoutDurationMinGoal: number;
  caloriesBurnedGoal: number;
  waterIntakeMlGoal: number;
  weightLossTargetKg?: number;
  fatLossTargetPct?: number;
}

export interface HealthVitalsLog {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  bmi?: number;
  waistCm?: number;
  chestCm?: number;
  hipCm?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugarMgDl?: number;
  restingHeartRateBpm?: number;
  sleepHours?: number;
  notes?: string;
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

export type UserRole = "Admin" | "Trainer" | "User" | "Manager" | "Staff";

export interface Product {
  id: string;
  name: string;
  category: "Supplements" | "Equipment" | "Gym Gear" | "Apparel" | "Nutrition" | "Accessories" | string;
  price: number;
  description: string;
  stock: number;
  barcode: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  createdBy?: string;
}

export interface CalorieLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  caloriesRequired: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  remainingCalories: number;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  darkMode?: boolean;
  theme?: "dark" | "light";
  language?: "en" | "mr" | "hi";
  notificationsEnabled?: boolean;
  emailAlerts?: boolean;
  workoutReminders?: boolean;
  hydrationAlerts?: boolean;
  lastBackupDate?: string;
  lastSyncTimestamp?: string;
  cloudSyncIntervalMinutes?: number;
  notifications?: {
    workoutReminders?: boolean;
    mealAlerts?: boolean;
    waterReminders?: boolean;
    inventoryWarnings?: boolean;
    weeklySummary?: boolean;
  };
}

export interface GeneratedDietPlan {
  id: string;
  title: string;
  createdAt: string;
  userId?: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
  goal: "Weight Loss" | "Weight Gain" | "Maintenance";
  activityLevel: "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Extremely Active";
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterIntakeLiters: number;
  meals: {
    breakfast: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    morningSnack: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    lunch: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    eveningSnack: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    dinner: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    preWorkout: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
    postWorkout: { title: string; items: string[]; calories: number; protein: number; carbs: number; fat: number };
  };
}

export interface UserAccount {
  uid: string;
  email: string;
  mobileNumber?: string;
  displayName: string;
  photoURL?: string;
  companyName?: string;
  designation?: string;
  address?: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
  emailVerified?: boolean;
  status: "Active" | "Disabled" | "Suspended" | "Pending";
  rememberMe?: boolean;
  inactivityTimeoutMinutes?: number;
  fcmToken?: string;
}

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  targetRole: "All" | UserRole;
  priority: "Normal" | "High" | "Urgent";
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
  readBy?: string[];
}

export interface LoginHistoryRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  device: string;
  os?: string;
  appVersion?: string;
  ipAddress: string;
  location: string;
  method: "Email/Password" | "Mobile OTP" | "Google Sign-In" | "Biometric/PIN";
  status: "Success" | "Failed";
  browser: string;
}

export type AuditActionType =
  | "Created"
  | "Edited"
  | "Deleted"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Login"
  | "Logout"
  | "Synced"
  | "Exported"
  | "Draft Saved";

export type AuditModule =
  | "Rate Charts"
  | "Forms"
  | "Reports"
  | "Group Reports"
  | "Workouts"
  | "Diet"
  | "Membership"
  | "Security"
  | "User Management"
  | "Authentication"
  | "Cloud Sync"
  | "Activity Tracker";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditActionType;
  module: AuditModule;
  description: string;
  targetId?: string;
  device: string;
  ipAddress?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  details?: Record<string, any>;
  status?: "Approved" | "Rejected" | "Pending" | "Completed";
}

export interface RateChartItem {
  id: string;
  serviceCode: string;
  name: string;
  category: "Gym Membership" | "Personal Training" | "Diet & Nutrition Consultation" | "Body Composition Scan" | "Supplement Pack" | "Recovery & Spa";
  duration: string; // e.g. "1 Month", "3 Months", "Annual", "Per Session"
  basePrice: number;
  taxPct: number;
  discountPct: number;
  finalPrice: number;
  currency: string;
  features: string[];
  isActive: boolean;
  notes?: string;
  updatedAt: string;
}

export interface EnterpriseRateChart {
  id: string;
  title: string;
  version: string;
  effectiveDate: string;
  currency: string;
  items: RateChartItem[];
  createdBy: string;
  updatedAt: string;
  approvedBy?: string;
  status: "Draft" | "Published" | "Archived";
}

export interface DynamicFormField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "date" | "radio" | "rating" | "signature";
  placeholder?: string;
  options?: string[];
  required: boolean;
  value: any;
}

export interface FormSubmissionRecord {
  id: string;
  formType: "Client Intake & PAR-Q" | "Daily Compliance Audit" | "Coach Session Evaluation" | "Fitness Assessment Review" | "Incident & Mistake Report" | "Custom Form";
  title: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  fields: DynamicFormField[];
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  signatureUrl?: string;
  gpsLocation?: string;
  autoSavedAt?: string;
  isDraft: boolean;
}

export interface GroupReportMemberProgress {
  memberId: string;
  memberName: string;
  startingWeightKg: number;
  currentWeightKg: number;
  attendancePct: number;
  dietScore: number;
  workoutsCompleted: number;
  notes: string;
  certified: boolean;
}

export interface EnterpriseGroupReport {
  id: string;
  title: string;
  cohortName: string;
  reportPeriod: string; // e.g. "August 2026", "Q3 2026"
  dateRange: {
    startDate: string;
    endDate: string;
  };
  coachName: string;
  organizationName: string;
  members: GroupReportMemberProgress[];
  averageAttendancePct: number;
  overallConsistencyPct: number;
  summaryNotes: string;
  recommendations: string;
  status: "Draft" | "Partially Completed" | "Submitted" | "Approved" | "Archived";
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  autoSavedAt?: string;
  approvedBy?: string;
}

export type GroupProgressReport = EnterpriseGroupReport;

export interface CustomerItem {
  id: string;
  name: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  totalPurchases?: number;
  balance?: number;
  createdAt: string;
}

export interface SupplierItem {
  id: string;
  name: string;
  company: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface StockRecord {
  id: string;
  productId: string;
  productName: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  remainingStock: number;
  notes?: string;
  date: string;
  timestamp: string;
}

export interface SaleItemDetail {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItemDetail[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: "Cash" | "UPI / Online" | "Card" | "Credit / Due";
  date: string;
  createdAt: string;
  billUrl?: string;
}

export interface PurchaseRecord {
  id: string;
  billNumber: string;
  supplierId?: string;
  supplierName: string;
  items: { name: string; quantity: number; cost: number; total: number }[];
  total: number;
  paymentMethod?: string;
  date: string;
  createdAt: string;
  billUrl?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  totalAmount: number;
  itemsCount: number;
  itemsSummary?: string;
  date: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: "Rent" | "Supplements" | "Equipment" | "Maintenance" | "Salaries" | "Electricity" | "Other";
  amount: number;
  paymentMethod: string;
  date: string;
  receiptUrl?: string;
  notes?: string;
}

export interface IncomeRecord {
  id: string;
  source: "Gym Membership" | "Personal Training" | "Supplements Store" | "Diet Consultation" | "Other";
  amount: number;
  paymentMethod: string;
  date: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  category: "Draft" | "Sync" | "Auth" | "Report" | "Backup" | "System";
  timestamp: string;
  read: boolean;
}

export interface AppState {
  profile: UserProfile;
  currentUserAccount?: UserAccount;
  loginHistory: LoginHistoryRecord[];
  auditLogs: AuditLogEntry[];
  rateCharts: EnterpriseRateChart[];
  forms: FormSubmissionRecord[];
  groupReports: EnterpriseGroupReport[];
  notifications: AppNotification[];
  notificationsEnabled?: boolean;
  formDrafts: Record<string, FormSubmissionRecord>;
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
  fitnessGoals?: DailyFitnessGoals;
  healthVitals?: Record<string, HealthVitalsLog>; // key: YYYY-MM-DD
  dailyRoutines: Record<string, DailyRoutineLog>; // key: YYYY-MM-DD
  nightlyReports: Record<string, SmartCoachNightlyReport>; // key: YYYY-MM-DD
  submittedReports?: Record<string, SubmittedDailyReport>; // key: YYYY-MM-DD
  submittedMonthlyReports?: Record<string, SubmittedMonthlyReport>; // key: YYYY-MM
  security: SecuritySettings;
  sync: CloudSyncState;
  announcements?: BroadcastAnnouncement[];
  cloudUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    role?: UserRole;
    isAnonymous?: boolean;
  } | null;
  darkMode: boolean;
  products?: Product[];
  calorieLogs?: CalorieLogEntry[];
  appSettings?: AppSettings;
  settings?: AppSettings;
  generatedDietPlans?: GeneratedDietPlan[];
  dietPlans?: SavedDietPlan[];
  workouts?: WorkoutSession[];
  accounts: UserAccount[];
  customers?: CustomerItem[];
  suppliers?: SupplierItem[];
  sales?: SaleRecord[];
  stockRecords?: StockRecord[];
  purchases?: PurchaseRecord[];
  orders?: OrderRecord[];
  expenses?: ExpenseRecord[];
  incomes?: IncomeRecord[];
}


