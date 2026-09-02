import { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Activity,
  HeartPulse,
  Clock,
  Check,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { UserProfile, HealthCalculations } from "../types";

interface AILabViewProps {
  profile: UserProfile;
  healthMetrics: HealthCalculations;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export function AILabView({ profile, healthMetrics }: AILabViewProps) {
  const [activeTool, setActiveTool] = useState<"chat" | "workoutGen" | "dietGen" | "predictor" | "recovery">("chat");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "ai",
      text: `Hello ${profile.fullName.split(" ")[0]}! I'm your AI Head Coach at FitPulse. I've analyzed your profile (${profile.fitnessGoal} mode, ${profile.currentWeightKg}kg current weight, aiming for ${profile.goalWeightKg}kg with a daily budget of ${healthMetrics.dailyCaloriesRequired} kcal). How can I assist your training or nutrition today?`,
      timestamp: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Workout Generator State
  const [splitDays, setSplitDays] = useState("4");
  const [splitStyle, setSplitStyle] = useState("Upper / Lower Split");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [equipmentAccess, setEquipmentAccess] = useState("Full Commercial Gym");
  const [workoutGenResult, setWorkoutGenResult] = useState<any | null>(null);
  const [isWorkoutGenLoading, setIsWorkoutGenLoading] = useState(false);

  // Diet Generator State
  const [dietGoal, setDietGoal] = useState("Weight Loss (Deficit)");
  const [dietPref, setDietPref] = useState("High Protein Omnivore");
  const [dietGenResult, setDietGenResult] = useState<any | null>(null);
  const [isDietGenLoading, setIsDietGenLoading] = useState(false);

  // Transformation Predictor State
  const [adherenceRate, setAdherenceRate] = useState(90); // %

  // Send message to Coach
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          userContext: {
            name: profile.fullName,
            goal: profile.fitnessGoal,
            currentWeight: profile.currentWeightKg,
            targetWeight: profile.targetWeightKg,
            caloriesRequired: healthMetrics.dailyCaloriesRequired,
            proteinTarget: healthMetrics.dailyProteinGrams,
            medicalConditions: profile.medicalConditions,
          },
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply || "Keep pushing with discipline, prioritizing form and progressive overload!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `For your ${profile.fitnessGoal} target, maintain your ${healthMetrics.dailyCaloriesWeightLoss} kcal deficit and ensure you reach ${healthMetrics.dailyProteinGrams}g of protein daily. Focus on compound lifts with 2-3 minutes of rest between heavy sets.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Workout Plan
  const handleGenerateWorkoutPlan = async () => {
    setIsWorkoutGenLoading(true);
    setWorkoutGenResult(null);

    try {
      const res = await fetch("/api/ai/workout-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.fitnessGoal,
          daysPerWeek: parseInt(splitDays, 10),
          splitType: splitStyle,
          experienceLevel,
          equipment: equipmentAccess,
        }),
      });
      const data = await res.json();
      const plan = data.plan || data;
      setWorkoutGenResult({
        planTitle: plan.planTitle || plan.planName || "AI Periodized Split",
        overview: plan.overview || plan.summary || "Structured hypertrophy and strength split.",
        days: (plan.days || []).map((d: any) => ({
          dayName: d.dayName || d.day || "Workout Day",
          focus: d.focus || d.day || "Main Lift Focus",
          exercises: d.exercises || [],
        })),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsWorkoutGenLoading(false);
    }
  };

  // Generate Diet Plan
  const handleGenerateDietPlan = async () => {
    setIsDietGenLoading(true);
    setDietGenResult(null);

    try {
      const res = await fetch("/api/ai/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: dietGoal,
          targetCalories: healthMetrics.dailyCaloriesRequired,
          dietaryPreference: dietPref,
        }),
      });
      const data = await res.json();
      const plan = data.plan || data;
      setDietGenResult({
        planTitle: plan.planTitle || plan.planName || `${dietGoal} Nutrition Blueprint`,
        caloriesTarget: plan.caloriesTarget || plan.targetCalories || healthMetrics.dailyCaloriesRequired,
        macros: {
          protein: typeof plan.macros?.protein === "string" ? plan.macros.protein.replace(/[^0-9]/g, "") || "160" : plan.macros?.protein || `${healthMetrics.dailyProteinGrams}`,
          carbs: typeof plan.macros?.carbs === "string" ? plan.macros.carbs.replace(/[^0-9]/g, "") || "220" : plan.macros?.carbs || `${healthMetrics.dailyCarbsGrams}`,
          fat: typeof plan.macros?.fat === "string" ? plan.macros.fat.replace(/[^0-9]/g, "") || "70" : plan.macros?.fat || `${healthMetrics.dailyFatGrams}`,
        },
        meals: (plan.meals || []).map((m: any) => ({
          mealName: m.mealName || m.name || "Scheduled Meal",
          calories: m.calories || 400,
          items: m.items || m.food || "Balanced whole foods portion",
        })),
        groceryList: plan.groceryList || ["Chicken breast", "Eggs", "Oats", "Greek yogurt", "Vegetables", "Rice"],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDietGenLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md shadow-emerald-500/20 font-black">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">AI Fitness Coaching Lab</h1>
            <p className="text-xs text-slate-400">Section 21 • Intelligent workouts, nutrition splits, and transformation forecasting</p>
          </div>
        </div>

        {/* Tool Switcher */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTool("chat")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === "chat" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            AI Coach Chat
          </button>
          <button
            onClick={() => setActiveTool("workoutGen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === "workoutGen" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            Split Generator
          </button>
          <button
            onClick={() => setActiveTool("dietGen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === "dietGen" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Diet Generator
          </button>
          <button
            onClick={() => setActiveTool("predictor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === "predictor" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Transformation
          </button>
          <button
            onClick={() => setActiveTool("recovery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === "recovery" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" />
            Soreness Advisor
          </button>
        </div>
      </div>

      {/* SUBTOOL 1: AI COACH CHAT */}
      {activeTool === "chat" && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[640px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">FitPulse AI Personal Coach</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active • Grounded in sports science & exercise physiology
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setMessages([
                  {
                    id: `init-${Date.now()}`,
                    sender: "ai",
                    text: `Chat reset! How can I help optimize your workouts or nutrition today?`,
                    timestamp: "Just now",
                  },
                ])
              }
              className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400"
                    }`}
                  >
                    {isAi ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isAi
                          ? "bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm"
                          : "bg-emerald-600 text-slate-950 font-medium"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center text-xs text-slate-400">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Analyzing physiology & crafting coaching response...
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggested Prompts */}
          <div className="p-2 border-t border-slate-800/60 bg-slate-950/30 flex gap-2 overflow-x-auto scrollbar-none">
            {[
              "How do I break through a bench press plateau?",
              "Best pre-workout meal timing for fat loss?",
              "Form cues for barbell squat knee valgus",
              "How to handle hunger during a 500 kcal deficit?",
            ].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-[11px] text-slate-300 whitespace-nowrap border border-slate-700 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask your coach anything about lifting, nutrition, macros, recovery..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isChatLoading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUBTOOL 2: AI WORKOUT PLAN GENERATOR */}
      {activeTool === "workoutGen" && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Workout Split Generator</h3>
            <p className="text-xs text-slate-400">Generate periodized multi-day splits with exercise selection and target volume</p>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Training Days / Week</label>
              <select
                value={splitDays}
                onChange={(e) => setSplitDays(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="3">3 Days (Full Body / PPL)</option>
                <option value="4">4 Days (Upper / Lower)</option>
                <option value="5">5 Days (Upper / Lower / PPL)</option>
                <option value="6">6 Days (Push / Pull / Legs 2x)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Split Structure</label>
              <select
                value={splitStyle}
                onChange={(e) => setSplitStyle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="Push / Pull / Legs">Push / Pull / Legs (PPL)</option>
                <option value="Upper / Lower Split">Upper / Lower Split</option>
                <option value="Full Body Split">Full Body 3x</option>
                <option value="Body Part Bro Split">Body Part Split (Chest, Back, Arms...)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="Beginner">Beginner (&lt; 1 yr)</option>
                <option value="Intermediate">Intermediate (1-3 yrs)</option>
                <option value="Advanced">Advanced (3+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Equipment Access</label>
              <select
                value={equipmentAccess}
                onChange={(e) => setEquipmentAccess(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="Full Commercial Gym">Full Commercial Gym (Barbells, Cables, Machines)</option>
                <option value="Dumbbells & Bench Only">Home Gym (Dumbbells & Bench)</option>
                <option value="Bodyweight & Calisthenics">Bodyweight & Pull-Up Bar</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateWorkoutPlan}
              disabled={isWorkoutGenLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isWorkoutGenLoading ? "Generating Periodized Plan..." : "Generate AI Workout Routine"}</span>
            </button>
          </div>

          {/* Generated Result */}
          {workoutGenResult && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-base font-extrabold text-slate-100">{workoutGenResult.planTitle}</h4>
                <p className="text-xs text-slate-400">{workoutGenResult.overview}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workoutGenResult.days?.map((day: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span>{day.dayName}</span>
                      <span className="text-emerald-400">{day.focus}</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {day.exercises?.map((ex: any, eIdx: number) => (
                        <div key={eIdx} className="flex justify-between text-[11px] py-1 border-b border-slate-800/60">
                          <span className="text-slate-300 font-medium">{ex.name}</span>
                          <span className="text-slate-400 font-mono">{ex.sets} sets × {ex.reps} ({ex.rest} rest)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTOOL 3: AI DIET PLAN GENERATOR */}
      {activeTool === "dietGen" && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Personalized Diet & Grocery Planner</h3>
            <p className="text-xs text-slate-400">Produces custom 9-meal structure with exact portions and an organized grocery list</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Nutrition Goal</label>
              <select
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="Weight Loss (Deficit)">Weight Loss (Caloric Deficit - Fat Shred)</option>
                <option value="Muscle Gain (Surplus)">Muscle Gain (Lean Surplus - Hypertrophy)</option>
                <option value="Body Recomposition">Body Recomposition (High Protein Maintenance)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Dietary Preference</label>
              <select
                value={dietPref}
                onChange={(e) => setDietPref(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                <option value="High Protein Omnivore">High Protein Omnivore (Chicken, Salmon, Eggs, Whey)</option>
                <option value="Vegetarian High Protein">Vegetarian High Protein (Eggs, Dairy, Tofu, Legumes)</option>
                <option value="Plant-Based Vegan">Plant-Based Vegan (Tofu, Tempeh, Seitan, Pea Protein)</option>
                <option value="Low Carb / Ketogenic">Low Carb / Ketogenic</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateDietPlan}
              disabled={isDietGenLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isDietGenLoading ? "Calculating Nutrition Breakdown..." : "Generate Meal Plan & Grocery List"}</span>
            </button>
          </div>

          {dietGenResult && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100">{dietGenResult.planTitle}</h4>
                    <p className="text-xs text-slate-400">Target Calories: {dietGenResult.caloriesTarget} kcal</p>
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-bold">
                    P: {dietGenResult.macros?.protein}g • C: {dietGenResult.macros?.carbs}g • F: {dietGenResult.macros?.fat}g
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {dietGenResult.meals?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{m.mealName}</span>
                        <span className="text-amber-400">{m.calories} kcal</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{m.items}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grocery List */}
              {dietGenResult.groceryList && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    <span>AI Generated Weekly Grocery List</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dietGenResult.groceryList.map((item: string, iIdx: number) => (
                      <span
                        key={iIdx}
                        className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTOOL 4: TRANSFORMATION PREDICTOR */}
      {activeTool === "predictor" && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Transformation Predictor</h3>
            <p className="text-xs text-slate-400">Calculates body transformation milestones and target completion date based on daily adherence rate</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Expected Plan Adherence Rate</span>
                <span className="text-emerald-400">{adherenceRate}% Consistency</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={adherenceRate}
                onChange={(e) => setAdherenceRate(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Milestones calculated */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold uppercase">4-Week Projection</span>
                <p className="text-xl font-black text-slate-100">
                  {(profile.currentWeightKg - (0.6 * 4 * (adherenceRate / 100))).toFixed(1)} kg
                </p>
                <span className="text-emerald-400 text-[11px] block">~14.5% Body Fat</span>
                <p className="text-slate-400 text-[11px] pt-1">Visible serratus anterior and sharper abdominal lines.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold uppercase">8-Week Projection</span>
                <p className="text-xl font-black text-slate-100">
                  {Math.max(profile.goalWeightKg, (profile.currentWeightKg - (0.55 * 8 * (adherenceRate / 100)))).toFixed(1)} kg
                </p>
                <span className="text-emerald-400 text-[11px] block">~13.2% Body Fat</span>
                <p className="text-slate-400 text-[11px] pt-1">Vascular forearms, defined chest shelf, full goal achievement.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold uppercase">Target Arrival Date</span>
                <p className="text-xl font-black text-emerald-400">
                  {new Date(Date.now() + (healthMetrics.estimatedWeeks * (100 / adherenceRate)) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <span className="text-slate-400 text-[11px] block">At {adherenceRate}% adherence</span>
                <p className="text-slate-400 text-[11px] pt-1">Sustainable deficit with zero metabolic adaptation or muscle atrophy.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTOOL 5: INJURY RECOVERY & SORENESS ADVISOR */}
      {activeTool === "recovery" && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Injury Recovery & Soreness Advisor</h3>
            <p className="text-xs text-slate-400">Evidence-based protocols for Delayed Onset Muscle Soreness (DOMS) and joint health</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-sm">Active Recovery & Blood Flow</h4>
              <p className="text-slate-400 leading-relaxed">
                Light Zone 1 cycling (15-20 min at &lt;110 bpm) or brisk walking promotes lymphatic drainage and clears metabolic byproducts without inducing further microtears.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-semibold">
                Recommended: 20 min incline walk today + 10 min dynamic mobility
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-sm">Right Knee Patellar Tendon Protocol</h4>
              <p className="text-slate-400 leading-relaxed">
                Based on your profile note ("Mild right knee patellar tightness"), incorporate Spanish Squats (isometric knee extension at 45° with a heavy band for 5 × 45s) prior to any squatting movement.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-semibold">
                Tendon load: Isometric holds reduce pain sensitivity through cortical inhibition
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
