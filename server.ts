import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client lazily if key is available
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Fitness Coach Chat
app.post("/api/ai/coach", async (req, res) => {
  const { userContext, history } = req.body;
  const message = req.body.message || req.body.prompt || "Hello Coach, give me an assessment of my fitness goals.";
  const ai = getAIClient();

  if (!ai) {
    // Algorithmic high-quality fallback if no API key is set yet
    return res.json({
      reply: `[Coach Note] Great question regarding "${message}". Based on your current profile (${userContext?.goal || userContext?.fitnessGoal || "fitness"} goal, ${userContext?.weight || userContext?.currentWeight || 75}kg), maintain a consistent progressive overload with 1.8-2.2g of protein per kg of bodyweight, prioritize 7-8 hours of deep sleep, and ensure adequate hydration (3-4 liters daily). For detailed personalized workout plans and diet adjustments, you can also use the AI Workout Planner & Diet tabs above!`,
      source: "algorithmic_coach",
    });
  }

  try {
    const systemInstruction = `You are FitPulse Master Coach, an elite certified strength & conditioning specialist (CSCS) and sports nutritionist.
You provide encouraging, scientifically accurate, and actionable guidance tailored to the user's statistics:
User Details:
- Goal: ${userContext?.goal || "General Fitness"}
- Weight: ${userContext?.weight || 75} kg, Height: ${userContext?.height || 175} cm
- Calorie Target: ${userContext?.calories || 2200} kcal, Protein: ${userContext?.protein || 150} g
- Experience: ${userContext?.activityLevel || "Moderate"}
- Health/Injuries: ${userContext?.medical || "None noted"}

Keep answers direct, motivating, structured with bullet points where appropriate, and cite biomechanical or nutritional best practices. Avoid generic fluff.`;

    const contents = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] });
      }
    }
    contents.push({ role: "user", parts: [{ text: message || "Hello Coach, give me an assessment of my fitness goals." }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I am ready to help you optimize your training and nutrition.",
      source: "gemini",
    });
  } catch (error: any) {
    console.error("AI Coach error:", error);
    res.status(500).json({
      reply: "Coach is momentarily recalibrating. Focus on hitting today's hydration target and sticking to your scheduled rest intervals between sets!",
      error: error.message,
    });
  }
});

// AI Workout Planner Generator
app.post("/api/ai/workout-plan", async (req, res) => {
  const { goal, daysPerWeek, equipment, experienceLevel, focusMuscles } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.json({
      planName: `${daysPerWeek || 4}-Day ${goal || "Hypertrophy"} Protocol`,
      summary: "Balanced split designed for progressive overload and optimal muscle protein synthesis.",
      days: [
        {
          day: "Day 1 - Push",
          exercises: [
            { name: "Flat Barbell Bench Press", sets: "4", reps: "6-8", rest: "90s", notes: "Focus on controlled eccentric" },
            { name: "Incline Dumbbell Press", sets: "3", reps: "8-10", rest: "75s", notes: "Full chest stretch at bottom" },
            { name: "Overhead Dumbbell Press", sets: "3", reps: "8-12", rest: "60s", notes: "Keep core tight" },
            { name: "Cable Rope Triceps Pushdown", sets: "3", reps: "12-15", rest: "60s", notes: "Lockout and squeeze" },
          ],
        },
        {
          day: "Day 2 - Pull",
          exercises: [
            { name: "Conventional Deadlift or Barbell Row", sets: "4", reps: "5-6", rest: "120s", notes: "Neutral spine" },
            { name: "Lat Pulldown (Wide Grip)", sets: "3", reps: "8-10", rest: "75s", notes: "Drive elbows down to hips" },
            { name: "Seated Cable Row", sets: "3", reps: "10-12", rest: "60s", notes: "Squeeze shoulder blades together" },
            { name: "Barbell Bicep Curl", sets: "3", reps: "10-12", rest: "60s", notes: "Strict form, no swinging" },
          ],
        },
        {
          day: "Day 3 - Legs & Core",
          exercises: [
            { name: "Barbell Back Squat", sets: "4", reps: "6-8", rest: "120s", notes: "Hit parallel depth safely" },
            { name: "Romanian Deadlift", sets: "3", reps: "8-10", rest: "90s", notes: "Feel stretch in hamstrings" },
            { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Pause at top contraction" },
            { name: "Hanging Leg Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Avoid swinging" },
          ],
        },
      ],
      source: "algorithmic_plan",
    });
  }

  try {
    const prompt = `Generate a structured workout split in valid JSON.
Goal: ${goal || "Muscle Gain"}
Days per week: ${daysPerWeek || 4}
Equipment: ${equipment || "Full Gym"}
Experience: ${experienceLevel || "Intermediate"}
Focus Muscles: ${focusMuscles?.join(", ") || "Balanced Full Body"}

Return strictly valid JSON with this schema:
{
  "planName": "string",
  "summary": "string",
  "days": [
    {
      "day": "string (e.g. Day 1: Upper Power)",
      "exercises": [
        {
          "name": "string",
          "sets": "string",
          "reps": "string",
          "rest": "string",
          "notes": "string"
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, source: "gemini" });
  } catch (error: any) {
    console.error("AI Workout Plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

// AI Diet & Meal Planner Generator
app.post("/api/ai/diet-plan", async (req, res) => {
  const { goal, targetCalories, dietaryPreference, allergies } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.json({
      planTitle: `${goal || "Fitness"} Nutrition Blueprint (${targetCalories || 2200} kcal)`,
      macros: { protein: "165g (30%)", carbs: "220g (40%)", fat: "73g (30%)", fiber: "35g" },
      meals: [
        { name: "Breakfast (08:00 AM)", food: "Oatmeal with whey protein, chia seeds & blueberries", calories: 520, protein: 40, carbs: 65, fat: 12 },
        { name: "Lunch (01:00 PM)", food: "Grilled chicken breast, brown rice, broccoli & olive oil", calories: 650, protein: 50, carbs: 70, fat: 18 },
        { name: "Snack (04:30 PM)", food: "Greek yogurt with almonds and a banana", calories: 330, protein: 22, carbs: 35, fat: 10 },
        { name: "Dinner (08:00 PM)", food: "Baked salmon with sweet potato and steamed asparagus", calories: 580, protein: 45, carbs: 45, fat: 22 },
        { name: "Before Sleep", food: "Casein protein or warm low-fat milk with pinch of cinnamon", calories: 120, protein: 20, carbs: 4, fat: 2 },
      ],
      groceryList: ["Chicken breast", "Eggs", "Oats", "Whey isolate", "Brown rice", "Salmon fillet", "Sweet potatoes", "Blueberries", "Almonds", "Broccoli", "Greek yogurt"],
      source: "algorithmic_diet",
    });
  }

  try {
    const prompt = `Generate a daily diet plan with exact macros in valid JSON.
Goal: ${goal || "Maintenance"}
Target Calories: ${targetCalories || 2200} kcal
Dietary Preference: ${dietaryPreference || "High Protein Omnivore"}
Allergies/Avoidances: ${allergies || "None"}

Return strictly valid JSON with this schema:
{
  "planTitle": "string",
  "macros": {
    "protein": "string",
    "carbs": "string",
    "fat": "string",
    "fiber": "string"
  },
  "meals": [
    {
      "name": "string",
      "food": "string",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "groceryList": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, source: "gemini" });
  } catch (error: any) {
    console.error("AI Diet Plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

// AI Progressive Overload & Transformation Prediction
app.post("/api/ai/progressive-overload", async (req, res) => {
  const { exerciseName, recentHistory } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.json({
      exerciseName: exerciseName || "Bench Press",
      suggestion: "Increase Weight",
      recommendedWeightDelta: "+2.5 kg",
      recommendedReps: "Keep reps at 8",
      reasoning: "You completed all prescribed sets with consistent RPE < 8. It's time to test the next weight increment while maintaining strict technique.",
      nextWorkoutTarget: "Warmup: 40kg x 10, Working: 72.5kg x 8, 8, 7",
      source: "algorithmic_overload",
    });
  }

  try {
    const prompt = `You are an AI Progressive Overload algorithm.
Exercise: ${exerciseName}
Recent Workout History: ${JSON.stringify(recentHistory || [])}

Provide an evidence-based progressive overload recommendation in valid JSON:
{
  "exerciseName": "${exerciseName}",
  "suggestion": "Increase Weight" | "Increase Repetitions" | "Increase Sets" | "Maintain Weight" | "Reduce Weight",
  "recommendedWeightDelta": "string (e.g. +2.5 kg or 0)",
  "recommendedReps": "string",
  "reasoning": "string",
  "nextWorkoutTarget": "string"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, source: "gemini" });
  } catch (error: any) {
    console.error("AI Progressive Overload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Server bootstrap with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
