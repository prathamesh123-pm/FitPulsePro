import React, { useState, useEffect } from "react";
import {
  Footprints,
  Flame,
  Timer,
  Navigation,
  Heart,
  Camera,
  Save,
  FileText,
  RotateCcw,
  Zap,
  Activity,
  Bike,
  Sparkles,
  Waves,
  Dumbbell,
  Check,
} from "lucide-react";
import { ActivityLog, ActivityType } from "../../types";
import {
  calculateActivityCalories,
  calculateFatBurnedGrams,
  calculateAverageSpeed,
  calculatePace,
} from "../../utils/activityAnalytics";
import { compressImageBase64 } from "../../utils/imageOptimizer";

interface ActivityLogFormProps {
  date: string;
  userWeightKg: number;
  onSaveActivity: (activity: ActivityLog) => void;
  onSaveDraft?: (draft: Partial<ActivityLog>) => void;
  draftData?: Partial<ActivityLog> | null;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; icon: any; color: string; defaultIntensity: "Low" | "Moderate" | "High" | "Vigorous" }[] = [
  { type: "Walking", label: "Walking", icon: Footprints, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", defaultIntensity: "Moderate" },
  { type: "Running", label: "Running", icon: Activity, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", defaultIntensity: "High" },
  { type: "Cycling", label: "Cycling", icon: Bike, color: "text-sky-400 bg-sky-500/10 border-sky-500/30", defaultIntensity: "Moderate" },
  { type: "Swimming", label: "Swimming", icon: Waves, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", defaultIntensity: "High" },
  { type: "Gym Workout", label: "Gym Workout", icon: Dumbbell, color: "text-purple-400 bg-purple-500/10 border-purple-500/30", defaultIntensity: "High" },
  { type: "Yoga", label: "Yoga", icon: Sparkles, color: "text-teal-400 bg-teal-500/10 border-teal-500/30", defaultIntensity: "Low" },
  { type: "Stretching", label: "Stretching", icon: Zap, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", defaultIntensity: "Low" },
  { type: "Sports", label: "Sports", icon: Activity, color: "text-rose-400 bg-rose-500/10 border-rose-500/30", defaultIntensity: "High" },
  { type: "Stair Climbing", label: "Stairs", icon: Navigation, color: "text-orange-400 bg-orange-500/10 border-orange-500/30", defaultIntensity: "Vigorous" },
  { type: "Skipping Rope", label: "Jump Rope", icon: Flame, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", defaultIntensity: "Vigorous" },
  { type: "Meditation", label: "Meditation", icon: Sparkles, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", defaultIntensity: "Low" },
  { type: "Custom Activity", label: "Custom", icon: Activity, color: "text-slate-300 bg-slate-800 border-slate-700", defaultIntensity: "Moderate" },
];

export const ActivityLogForm: React.FC<ActivityLogFormProps> = ({
  date,
  userWeightKg = 75,
  onSaveActivity,
  onSaveDraft,
  draftData,
  onNotify,
}) => {
  const [activityType, setActivityType] = useState<ActivityType>(draftData?.activityType || "Walking");
  const [customName, setCustomName] = useState(draftData?.customActivityName || "");
  const [startTime, setStartTime] = useState(draftData?.startTime || "07:00");
  const [endTime, setEndTime] = useState(draftData?.endTime || "07:45");
  const [durationMinutes, setDurationMinutes] = useState<number>(draftData?.durationMinutes || 45);
  const [distanceKm, setDistanceKm] = useState<number>(draftData?.distanceKm || 4.2);
  const [steps, setSteps] = useState<number>(draftData?.steps || 5200);
  const [heartRate, setHeartRate] = useState<number>(draftData?.heartRateBpm || 120);
  const [swimmingLaps, setSwimmingLaps] = useState<number>(draftData?.swimmingLaps || 0);
  const [intensity, setIntensity] = useState<"Low" | "Moderate" | "High" | "Vigorous">(
    draftData?.intensity || "Moderate"
  );
  const [notes, setNotes] = useState(draftData?.routeNotes || "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(draftData?.photoUrl);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isManualDuration, setIsManualDuration] = useState(false);

  // Auto-calculate duration from start & end times when not manual override
  useEffect(() => {
    if (!isManualDuration && startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60; // Next day wrap
        if (diff > 0 && diff <= 1440) {
          setDurationMinutes(diff);
        }
      }
    }
  }, [startTime, endTime, isManualDuration]);

  // Auto calculate steps from distance for walking/running
  useEffect(() => {
    if (activityType === "Walking" && distanceKm > 0 && (!steps || steps === 0)) {
      setSteps(Math.round(distanceKm * 1350));
    } else if ((activityType === "Running" || activityType === "Outdoor Running") && distanceKm > 0 && (!steps || steps === 0)) {
      setSteps(Math.round(distanceKm * 1200));
    }
  }, [distanceKm, activityType]);

  // Derived metrics
  const avgSpeed = calculateAverageSpeed(distanceKm, durationMinutes);
  const pace = calculatePace(durationMinutes, distanceKm);
  const calculatedCalories = calculateActivityCalories(activityType, durationMinutes, userWeightKg, intensity);
  const calculatedFatBurnedGrams = calculateFatBurnedGrams(calculatedCalories);

  // Photo upload with compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onNotify("Invalid file", "Please select a valid image file.", "warning");
      return;
    }

    try {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressImageBase64(rawBase64, {
          maxWidth: 900,
          maxHeight: 900,
          quality: 0.8,
        });
        setPhotoUrl(compressed);
        setIsCompressing(false);
        onNotify("Photo Attached", "Activity photo compressed and attached successfully.", "success");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsCompressing(false);
      onNotify("Photo Upload Failed", "Could not process image.", "error");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) {
      onNotify("Invalid Duration", "Please enter a positive duration in minutes.", "warning");
      return;
    }

    const newActivity: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      activityType,
      customActivityName: activityType === "Custom Activity" ? (customName || "Custom Workout") : undefined,
      startTime,
      endTime,
      durationMinutes,
      distanceKm: Number(distanceKm) || 0,
      steps: Number(steps) || 0,
      caloriesBurned: calculatedCalories,
      estimatedFatBurnedGrams: calculatedFatBurnedGrams,
      avgSpeedKmh: avgSpeed,
      paceMinPerKm: pace !== "-" ? pace : undefined,
      swimmingLaps: activityType === "Swimming" ? Number(swimmingLaps) : undefined,
      heartRateBpm: Number(heartRate) || undefined,
      intensity,
      routeNotes: notes.trim(),
      photoUrl,
      createdAt: new Date().toISOString(),
    };

    onSaveActivity(newActivity);
    onNotify("Activity Logged", `${activityType} session recorded (${calculatedCalories} kcal burned, ${calculatedFatBurnedGrams}g fat burned).`, "success");

    // Reset fields to sensible defaults
    setNotes("");
    setPhotoUrl(undefined);
  };

  const handleDraftSave = () => {
    if (onSaveDraft) {
      onSaveDraft({
        date,
        activityType,
        customActivityName: customName,
        startTime,
        endTime,
        durationMinutes,
        distanceKm,
        steps,
        intensity,
        routeNotes: notes,
        photoUrl,
      });
      onNotify("Draft Saved", "Activity draft saved successfully.", "info");
    }
  };

  const isDistanceActivity = ["Walking", "Running", "Outdoor Running", "Cycling", "Swimming", "Treadmill"].includes(activityType);

  return (
    <form onSubmit={handleSave} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Footprints className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Log Daily Fitness Activity</h3>
            <p className="text-xs text-slate-400">Date: {date} • Auto MET & Fat Burn Calculation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDraftSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Activity Type Selection Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Activity Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {ACTIVITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activityType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setActivityType(opt.type);
                  setIntensity(opt.defaultIntensity);
                  if (opt.type === "Walking") {
                    setDistanceKm(4.0);
                  } else if (opt.type === "Running") {
                    setDistanceKm(5.0);
                  } else if (opt.type === "Cycling") {
                    setDistanceKm(12.0);
                  } else if (opt.type === "Swimming") {
                    setDistanceKm(1.0);
                    setSwimmingLaps(20);
                  } else {
                    setDistanceKm(0);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-full">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom activity name if Custom Activity */}
      {activityType === "Custom Activity" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Custom Activity Name</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Badminton Match, Rock Climbing, Martial Arts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Time & Duration Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
            <Timer className="h-3.5 w-3.5 text-slate-400" /> Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
            <Timer className="h-3.5 w-3.5 text-slate-400" /> End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">Total Duration</label>
            <button
              type="button"
              onClick={() => setIsManualDuration(!isManualDuration)}
              className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
            >
              {isManualDuration ? "Auto from time" : "Manual override"}
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={720}
              value={durationMinutes}
              onChange={(e) => {
                setIsManualDuration(true);
                setDurationMinutes(Number(e.target.value));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-12 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-2 text-[11px] text-slate-400">mins</span>
          </div>
        </div>
      </div>

      {/* Distance, Steps, Speed, Pace, Swimming Laps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isDistanceActivity ? (
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
              <Navigation className="h-3.5 w-3.5 text-emerald-400" /> Distance (KM)
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              placeholder="e.g. 4.2"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
              <Footprints className="h-3.5 w-3.5 text-slate-400" /> Total Steps
            </label>
            <input
              type="number"
              min={0}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              placeholder="e.g. 2500"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {isDistanceActivity && (
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
              <Footprints className="h-3.5 w-3.5 text-slate-400" /> Steps
            </label>
            <input
              type="number"
              min={0}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              placeholder="Steps"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {activityType === "Swimming" && (
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
              <Waves className="h-3.5 w-3.5 text-cyan-400" /> Swimming Laps
            </label>
            <input
              type="number"
              min={0}
              value={swimmingLaps}
              onChange={(e) => setSwimmingLaps(Number(e.target.value))}
              placeholder="e.g. 20"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
            <Heart className="h-3.5 w-3.5 text-rose-400" /> Heart Rate (BPM)
          </label>
          <input
            type="number"
            min={40}
            max={220}
            value={heartRate}
            onChange={(e) => setHeartRate(Number(e.target.value))}
            placeholder="e.g. 135"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Intensity
          </label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Low">Low (Recovery / Light)</option>
            <option value="Moderate">Moderate (Steady State)</option>
            <option value="High">High (Cardio / Hypertrophy)</option>
            <option value="Vigorous">Vigorous (Max Output / HIIT)</option>
          </select>
        </div>
      </div>

      {/* Speed & Pace telemetry bar */}
      {isDistanceActivity && distanceKm > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400">Avg Speed</span>
            <div className="text-sm font-bold text-slate-100">{avgSpeed} km/h</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Average Pace</span>
            <div className="text-sm font-bold text-slate-100">{pace}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Calories Burned</span>
            <div className="text-sm font-bold text-amber-400">{calculatedCalories} kcal</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Estimated Fat Burned</span>
            <div className="text-sm font-bold text-emerald-400">{calculatedFatBurnedGrams} grams</div>
          </div>
        </div>
      )}

      {/* Non-distance telemetry bar */}
      {(!isDistanceActivity || distanceKm === 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400">Duration</span>
            <div className="text-sm font-bold text-slate-100">{durationMinutes} mins</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Estimated Energy Burn</span>
            <div className="text-sm font-bold text-amber-400">{calculatedCalories} kcal</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Estimated Lipid Oxidation</span>
            <div className="text-sm font-bold text-emerald-400">{calculatedFatBurnedGrams} grams</div>
          </div>
        </div>
      )}

      {/* Notes & Optional Photo Upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Notes / Route / Workout Remarks</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Park loop path, elevated incline, high energy, felt hydrated..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Attach Activity Photo (Optional)</span>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(undefined)}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                Remove photo
              </button>
            )}
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-emerald-500/60 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>{isCompressing ? "Compressing..." : photoUrl ? "Change Photo" : "Upload GPS / Gym / Route Photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </label>
            {photoUrl && (
              <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                <img src={photoUrl} alt="Activity preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save & Log Activity</span>
        </button>
      </div>
    </form>
  );
};
