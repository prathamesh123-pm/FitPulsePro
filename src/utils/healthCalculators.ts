import { UserProfile, HealthCalculations, FitnessGoal } from "../types";

export function calculateAge(dobString: string): number {
  if (!dobString) return 25;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return isNaN(age) || age <= 0 ? 25 : age;
}

export function calculateHealthMetrics(profile: UserProfile): HealthCalculations {
  const heightM = profile.heightCm / 100;
  const weightKg = profile.currentWeightKg || 70;
  const goalWeightKg = profile.goalWeightKg || profile.targetWeightKg || weightKg;
  const age = calculateAge(profile.dateOfBirth);
  const isMale = profile.gender === "Male";

  // 1. BMI
  const bmi = heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 22;
  let bmiStatus: "Underweight" | "Normal" | "Overweight" | "Obese" = "Normal";
  if (bmi < 18.5) bmiStatus = "Underweight";
  else if (bmi < 25) bmiStatus = "Normal";
  else if (bmi < 30) bmiStatus = "Overweight";
  else bmiStatus = "Obese";

  // 2. BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * weightKg + 6.25 * profile.heightCm - 5 * age;
  if (isMale) {
    bmr += 5;
  } else if (profile.gender === "Female") {
    bmr -= 161;
  } else {
    bmr -= 78;
  }
  bmr = Math.round(bmr);

  // 3. TDEE based on activity level
  const activityMultipliers: Record<string, number> = {
    Sedentary: 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extra Active": 1.9,
  };
  const multiplier = activityMultipliers[profile.activityLevel] || 1.4;
  const tdee = Math.round(bmr * multiplier);

  // 4. Ideal Body Weight (Devine Formula)
  const heightInches = profile.heightCm / 2.54;
  const inchesOver60 = Math.max(0, heightInches - 60);
  let idealBodyWeightKg = isMale ? 50 + 2.3 * inchesOver60 : 45.5 + 2.3 * inchesOver60;
  idealBodyWeightKg = parseFloat(idealBodyWeightKg.toFixed(1));

  // 5. Healthy Weight Range (BMI 18.5 to 24.9)
  const healthyWeightMinKg = parseFloat((18.5 * heightM * heightM).toFixed(1));
  const healthyWeightMaxKg = parseFloat((24.9 * heightM * heightM).toFixed(1));

  // 6. Calorie Targets
  const dailyCaloriesWeightLoss = Math.max(isMale ? 1500 : 1200, Math.round(tdee - 500));
  const dailyCaloriesWeightGain = Math.round(tdee + 400);

  // Target calories based on current chosen goal
  let targetCalories = tdee;
  switch (profile.fitnessGoal) {
    case "Weight Loss":
      targetCalories = dailyCaloriesWeightLoss;
      break;
    case "Weight Gain":
      targetCalories = dailyCaloriesWeightGain;
      break;
    case "Muscle Gain":
      targetCalories = Math.round(tdee + 300);
      break;
    case "Body Recomposition":
      targetCalories = Math.round(tdee - 200);
      break;
    case "Maintenance":
    default:
      targetCalories = tdee;
      break;
  }

  // 7. Macronutrients
  let proteinFactor = 1.8;
  if (profile.fitnessGoal === "Weight Loss") proteinFactor = 2.2;
  else if (profile.fitnessGoal === "Muscle Gain") proteinFactor = 2.1;
  else if (profile.fitnessGoal === "Body Recomposition") proteinFactor = 2.3;

  const dailyProteinGrams = Math.round(weightKg * proteinFactor);
  const proteinCalories = dailyProteinGrams * 4;

  // Fat 25% of target calories
  const fatCalories = targetCalories * 0.25;
  const dailyFatGrams = Math.round(fatCalories / 9);

  // Carbs fill remainder
  const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const dailyCarbsGrams = Math.round(carbCalories / 4);

  // Fiber (14g per 1000 calories)
  const dailyFiberGrams = Math.round((targetCalories / 1000) * 14);

  // Water Intake (35-40 ml per kg + workout adjustment)
  const dailyWaterMl = Math.round(weightKg * 38 + 500);

  // Weight Deltas
  const weightToLoseKg = Math.max(0, parseFloat((weightKg - goalWeightKg).toFixed(1)));
  const weightToGainKg = Math.max(0, parseFloat((goalWeightKg - weightKg).toFixed(1)));

  // Estimated Weeks
  let estimatedWeeks = 0;
  if (profile.fitnessGoal === "Weight Loss" && weightToLoseKg > 0) {
    estimatedWeeks = Math.ceil(weightToLoseKg / 0.5); // ~0.5kg per week safe loss
  } else if ((profile.fitnessGoal === "Weight Gain" || profile.fitnessGoal === "Muscle Gain") && weightToGainKg > 0) {
    estimatedWeeks = Math.ceil(weightToGainKg / 0.35); // ~0.35kg lean gain per week
  }

  return {
    bmi,
    bmiStatus,
    bmr,
    tdee,
    idealBodyWeightKg,
    healthyWeightMinKg,
    healthyWeightMaxKg,
    healthyWeightRangeKg: { min: healthyWeightMinKg, max: healthyWeightMaxKg },
    dailyCaloriesRequired: targetCalories,
    dailyCaloriesWeightLoss,
    dailyCaloriesWeightGain,
    dailyCaloriesMaintenance: tdee,
    dailyCaloriesMuscleGain: Math.round(tdee + 300),
    dailyProteinGrams,
    dailyCarbsGrams,
    dailyFatGrams,
    dailyFiberGrams,
    dailyWaterMl,
    weightToLoseKg,
    weightToGainKg,
    estimatedWeeks,
  };
}

export function formatHeight(cm: number, unit: "cm" | "ft"): string {
  if (unit === "cm") return `${cm} cm`;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function formatWeight(kg: number, unit: "kg" | "lbs"): string {
  if (unit === "kg") return `${kg.toFixed(1)} kg`;
  return `${(kg * 2.20462).toFixed(1)} lbs`;
}
