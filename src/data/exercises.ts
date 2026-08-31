import { Exercise, MuscleGroup } from "../types";
import { CHEST_EXERCISES } from "./exerciseCategories/chest";
import { BACK_EXERCISES } from "./exerciseCategories/back";
import { BICEPS_EXERCISES } from "./exerciseCategories/biceps";
import { TRICEPS_EXERCISES } from "./exerciseCategories/triceps";
import { SHOULDERS_EXERCISES } from "./exerciseCategories/shoulders";
import { LEGS_EXERCISES } from "./exerciseCategories/legs";
import { THIGHS_EXERCISES } from "./exerciseCategories/thighs";
import { CALVES_EXERCISES } from "./exerciseCategories/calves";
import { FOREARMS_EXERCISES } from "./exerciseCategories/forearms";
import { ABS_EXERCISES } from "./exerciseCategories/abs";
import { CORE_EXERCISES } from "./exerciseCategories/core";
import { GLUTES_EXERCISES } from "./exerciseCategories/glutes";
import { CARDIO_EXERCISES } from "./exerciseCategories/cardio";
import { FULL_BODY_EXERCISES } from "./exerciseCategories/fullBody";

export const EXERCISE_DATABASE: Exercise[] = [
  ...CHEST_EXERCISES,
  ...BACK_EXERCISES,
  ...BICEPS_EXERCISES,
  ...TRICEPS_EXERCISES,
  ...SHOULDERS_EXERCISES,
  ...LEGS_EXERCISES,
  ...THIGHS_EXERCISES,
  ...CALVES_EXERCISES,
  ...FOREARMS_EXERCISES,
  ...ABS_EXERCISES,
  ...CORE_EXERCISES,
  ...GLUTES_EXERCISES,
  ...CARDIO_EXERCISES,
  ...FULL_BODY_EXERCISES,
];

// Curated media & safety guidelines for exercise library
const MUSCLE_MEDIA_MAP: Record<MuscleGroup, { image: string; animation: string; video: string; tips: string[] }> = {
  Chest: {
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/rT7DgCr-3pg",
    tips: ["Retract scapula into bench", "Maintain slight lumbar arch", "Control 2-second eccentric lower", "Do not flare elbows beyond 75°"],
  },
  Back: {
    image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/CAwf7n6Luuc",
    tips: ["Brace abdominal wall tightly", "Drive with elbows not biceps", "Never round lumbar under load", "Squeeze shoulder blades at peak contraction"],
  },
  Biceps: {
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/ykJmrZ5v0Oo",
    tips: ["Pin elbows to sides of torso", "Supinate wrists at top of curl", "Avoid swinging or body momentum", "Full stretch at bottom extension"],
  },
  Triceps: {
    image: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/2-LAMcpzODU",
    tips: ["Lock elbows in fixed pivot position", "Do not allow shoulders to roll forward", "Full lockout contraction without hyperextending", "Control eccentric return"],
  },
  Shoulders: {
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/qEwKCR5JCog",
    tips: ["Press in natural scapular plane (30° forward)", "Brace glutes and core to protect spine", "Keep wrists stacked directly over elbows", "Do not tilt head excessively forward"],
  },
  Legs: {
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/bEv6CCg2BC8",
    tips: ["Knees track in line with 2nd toe", "Maintain tripod foot pressure (heel, big toe, little toe)", "Reach full parallel or below if mobility allows", "Keep chest upright and eyes forward"],
  },
  Thighs: {
    image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/SW_C1A-rejs",
    tips: ["Control tempo without bouncing at bottom", "Drive equally through quad heads", "Maintain pelvic stability", "Avoid knee valgus (knees caving inward)"],
  },
  Calves: {
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/gwLzBJYoWlI",
    tips: ["Hold deep bottom stretch for 2 full seconds", "Drive through ball of foot to full plantarflexion", "Pause 1 second at top peak contraction", "Do not bounce Achilles tendon"],
  },
  Forearms: {
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/8v_5w3oGk5Q",
    tips: ["Use moderate controllable weight", "Avoid extreme hyperflexion of wrists", "Maintain stable forearm resting surface", "Warm up wrist carpal joints prior"],
  },
  Abs: {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/1919eTCoESo",
    tips: ["Curl ribcage toward pelvis", "Exhale fully at peak crunch contraction", "Do not yank or pull on cervical spine/neck", "Initiate movement with rectus abdominis not hip flexors"],
  },
  Core: {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/ASdvN_XEl_c",
    tips: ["Engage transverse abdominis 360 degrees", "Do not allow hips to sag or pike", "Maintain neutral cervical spine alignment", "Breathe rhythmically into diaphragm"],
  },
  Glutes: {
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/SEdqd1n0cvg",
    tips: ["Drive through heels", "Tuck chin slightly to maintain posterior pelvic tilt at top", "Do not hyperextend lumbar spine", "Hold 1-second maximal glute squeeze at lockout"],
  },
  Cardio: {
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/ml6cT4AZdqI",
    tips: ["Warm up progressively for 3-5 minutes", "Maintain upright posture without slouching", "Hydrate consistently during interval bouts", "Monitor heart rate zones"],
  },
  "Full Body": {
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    animation: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
    video: "https://www.youtube-nocookie.com/embed/qEwKCR5JCog",
    tips: ["Synchronize kinetic chain from ankles to shoulders", "Brace core before every concentric rep", "Master triple extension (ankle, knee, hip)", "Drop weight safely if balance is compromised"],
  },
};

// Enrich all exercises with clinical description, URLs and safety protocols
const RAW_DATABASE = EXERCISE_DATABASE;

export const ENRICHED_EXERCISES: Exercise[] = RAW_DATABASE.map((ex) => {
  const meta = MUSCLE_MEDIA_MAP[ex.muscleGroup] || MUSCLE_MEDIA_MAP["Chest"];
  return {
    ...ex,
    description: ex.description || `${ex.name} is a premier ${ex.difficulty.toLowerCase()} compound movement targeting the ${ex.muscleGroup.toLowerCase()} with high mechanical tension and hypertrophic stimulus.`,
    imageUrl: ex.imageUrl || meta.image,
    animationUrl: ex.animationUrl || meta.animation,
    videoUrl: ex.videoUrl || meta.video,
    safetyTips: ex.safetyTips && ex.safetyTips.length > 0 ? ex.safetyTips : meta.tips,
  };
});

// Re-export as primary database with fallback
export { ENRICHED_EXERCISES as EXERCISE_DATABASE_ENRICHED };

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Biceps",
  "Triceps",
  "Shoulders",
  "Legs",
  "Thighs",
  "Calves",
  "Forearms",
  "Abs",
  "Core",
  "Glutes",
  "Cardio",
  "Full Body",
];
