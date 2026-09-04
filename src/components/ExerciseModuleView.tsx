import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Play,
  Clock,
  Flame,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  Upload,
  Video,
  Target,
} from "lucide-react";
import { Exercise, ExerciseCategory, AppState, MuscleGroup } from "../types";
import {
  saveExerciseToCloud,
  fetchExercisesFromCloud,
  deleteExerciseFromCloud,
} from "../services/firebase";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { readFileAndCompress } from "../utils/imageOptimizer";

interface ExerciseModuleViewProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onNotify: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "Machine Exercises",
  "Free Weight",
  "Cardio",
  "Stretching",
  "Yoga",
  "HIIT",
];

const SEED_EXERCISES: Exercise[] = [
  {
    id: "ex-lat-pulldown",
    name: "Seated Cable Lat Pulldown",
    category: "Machine Exercises",
    muscleGroup: "Back",
    targetMuscle: "Latissimus Dorsi, Biceps",
    equipment: "Machine",
    difficulty: "Beginner",
    sets: 4,
    reps: 10,
    restTimeSeconds: 60,
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
    instructions: "Grip the wide bar with palms facing away. Sit upright with thigh pads secured. Pull the bar down toward your upper chest while retracting scapulae, then slowly return under full control.",
  },
  {
    id: "ex-barbell-bench",
    name: "Barbell Flat Bench Press",
    category: "Free Weight",
    muscleGroup: "Chest",
    targetMuscle: "Pectoralis Major, Triceps, Anterior Deltoids",
    equipment: "Barbell",
    difficulty: "Intermediate",
    sets: 4,
    reps: 8,
    restTimeSeconds: 90,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
    instructions: "Lie flat with eyes under the bar. Unrack the bar with an overhand grip slightly wider than shoulder-width. Lower the bar smoothly to mid-chest, then drive powerfully upward to lockout.",
  },
  {
    id: "ex-leg-press",
    name: "45-Degree Incline Leg Press",
    category: "Machine Exercises",
    muscleGroup: "Legs",
    targetMuscle: "Quadriceps, Glutes, Hamstrings",
    equipment: "Machine",
    difficulty: "Beginner",
    sets: 4,
    reps: 12,
    restTimeSeconds: 90,
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/IZxyjW7MPJQ",
    instructions: "Place feet shoulder-width on the sled platform. Disengage safety catches. Lower weight until knees reach a 90-degree angle, then press back up without hyperextending knees.",
  },
  {
    id: "ex-treadmill-incline",
    name: "Incline Power Walk & Zone 2 Cardio",
    category: "Cardio",
    muscleGroup: "Cardio",
    targetMuscle: "Cardiovascular Endurance, Calves",
    equipment: "Cardio Equipment",
    difficulty: "Beginner",
    sets: 1,
    reps: 30, // minutes
    restTimeSeconds: 0,
    imageUrl: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/yOXnS7ZzVbM",
    instructions: "Set treadmill incline to 10-12% and speed to 4.5-5.5 km/h. Maintain upright posture with natural arm swing for 30 continuous minutes in steady aerobic heart rate Zone 2.",
  },
  {
    id: "ex-yoga-downdog",
    name: "Downward Facing Dog (Adho Mukha Svanasana)",
    category: "Yoga",
    muscleGroup: "Full Body",
    targetMuscle: "Hamstrings, Calves, Shoulders, Spine",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    sets: 3,
    reps: 5, // breaths
    restTimeSeconds: 30,
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/Wnn6FhK13Y4",
    instructions: "Start on hands and knees. Lift hips upward toward the ceiling, creating an inverted V-shape. Press firmly into fingertips, lengthen spine, and gently press heels toward the floor.",
  },
  {
    id: "ex-hiit-burpee",
    name: "Explosive Chest-to-Floor Burpees",
    category: "HIIT",
    muscleGroup: "Full Body",
    targetMuscle: "Total Body Conditioning, Core, Chest",
    equipment: "Bodyweight",
    difficulty: "Advanced",
    sets: 4,
    reps: 15,
    restTimeSeconds: 45,
    imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/dZgVxmf6jkA",
    instructions: "Drop into a squat, place hands on floor, kick feet back, drop chest to floor. Push up, jump feet forward, and explode upward into the air with arms overhead.",
  },
  {
    id: "ex-hamstring-stretch",
    name: "Standing Single Leg Hamstring Stretch",
    category: "Stretching",
    muscleGroup: "Legs",
    targetMuscle: "Biceps Femoris, Hamstring Tendons",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    sets: 3,
    reps: 30, // seconds
    restTimeSeconds: 15,
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/embed/FDwpOxA0b5I",
    instructions: "Extend one heel forward on a low bench with toes pointed upward. Hinge at the hips with flat back until you feel a gentle lengthening stretch through the back of the leg.",
  },
];

export const ExerciseModuleView: React.FC<ExerciseModuleViewProps> = ({
  state,
  onUpdateState,
  onNotify,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>(state.customExercises?.length ? state.customExercises : SEED_EXERCISES);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [viewExercise, setViewExercise] = useState<Exercise | null>(null);

  // Delete
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: "",
    category: "Machine Exercises",
    targetMuscle: "",
    equipment: "Machine",
    difficulty: "Intermediate",
    sets: 3,
    reps: 10,
    restTimeSeconds: 60,
    imageUrl: "",
    videoUrl: "",
    instructions: "",
  });

  // Load from Firebase on mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const cloudExercises = await fetchExercisesFromCloud();
      if (cloudExercises && cloudExercises.length > 0) {
        setExercises(cloudExercises);
        onUpdateState((prev) => ({ ...prev, customExercises: cloudExercises }));
      } else {
        setExercises(SEED_EXERCISES);
      }
    } catch (err) {
      console.warn("Error fetching exercises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingExercise(null);
    setFormData({
      name: "",
      category: "Machine Exercises",
      targetMuscle: "Chest & Triceps",
      equipment: "Machine",
      difficulty: "Intermediate",
      sets: 4,
      reps: 10,
      restTimeSeconds: 60,
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
      videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
      instructions: "Perform with controlled cadence, keeping tension on the target muscle group.",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormData({ ...ex });
    setIsFormOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAndCompress(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      setFormData((prev) => ({ ...prev, imageUrl: base64 }));
      onNotify("Image Uploaded", "Exercise image uploaded", "info");
    } catch (err) {
      onNotify("Upload Error", "Failed to compress image", "error");
    }
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      onNotify("Validation Error", "Exercise name is required", "error");
      return;
    }

    const payload: Exercise = {
      id: editingExercise?.id || `ex-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || "Machine Exercises",
      muscleGroup: (formData.muscleGroup as MuscleGroup) || "Full Body",
      targetMuscle: formData.targetMuscle || "Major Muscle Groups",
      equipment: formData.equipment || "Machine",
      difficulty: formData.difficulty || "Intermediate",
      sets: Number(formData.sets) || 3,
      reps: Number(formData.reps) || 10,
      restTimeSeconds: Number(formData.restTimeSeconds) || 60,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
      videoUrl: formData.videoUrl || "https://www.youtube.com/embed/CAwf7n6Luuc",
      instructions: formData.instructions?.trim() || "Follow proper posture and controlled breathing.",
    };

    const updatedList = editingExercise
      ? exercises.map((item) => (item.id === editingExercise.id ? payload : item))
      : [payload, ...exercises];

    setExercises(updatedList);
    onUpdateState((prev) => ({ ...prev, customExercises: updatedList }));
    setIsFormOpen(false);

    const res = await saveExerciseToCloud(payload);
    if (res.success) {
      onNotify("Exercise Saved", `${payload.name} saved to Firebase Firestore`, "success");
    } else {
      onNotify("Offline Saved", "Saved locally in session", "info");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExercise) return;
    setIsDeleting(true);
    const targetId = deletingExercise.id;
    const updatedList = exercises.filter((ex) => ex.id !== targetId);

    setExercises(updatedList);
    onUpdateState((prev) => ({ ...prev, customExercises: updatedList }));

    const res = await deleteExerciseFromCloud(targetId);
    setIsDeleting(false);
    setDeletingExercise(null);

    if (res.success) {
      onNotify("Exercise Deleted", "Exercise removed from database", "success");
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory =
        activeCategory === "All" || ex.category === activeCategory;
      const matchesSearch =
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.targetMuscle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.equipment || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-purple-400" />
              Exercise Library & Video Coach
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Firebase Synced
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-purple-400" />
            Exercise Database
          </h1>
          <p className="text-xs text-slate-400">
            Machine Exercises • Free Weight • Cardio • Stretching • Yoga • HIIT with sets, reps, rest time & videos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={loadExercises}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh from Firebase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategory("All")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === "All"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          All Categories ({exercises.length})
        </button>
        {EXERCISE_CATEGORIES.map((cat) => {
          const count = exercises.filter((e) => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by exercise name, target muscle, or equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Exercises Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your category filter or create a new exercise for your fitness program.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
          >
            Add New Exercise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col justify-between transition-all shadow-md hover:shadow-xl"
            >
              {/* Media Preview */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={ex.imageUrl || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80"}
                  alt={ex.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-purple-300 border border-purple-500/30">
                    {ex.category || "General"}
                  </span>
                </div>
                {ex.videoUrl && (
                  <div className="absolute bottom-2.5 right-2.5">
                    <button
                      onClick={() => setViewExercise(ex)}
                      className="p-1.5 rounded-full bg-slate-950/80 text-purple-400 hover:text-white border border-slate-700 backdrop-blur-sm shadow-md"
                      title="Watch Video"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {ex.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{ex.targetMuscle || "Major Muscle Group"}</span>
                  </div>
                </div>

                {/* Sets, Reps, Rest stats */}
                <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs">
                  <div>
                    <div className="text-[9px] text-slate-400">Sets</div>
                    <div className="font-bold text-white">{ex.sets || 3}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">Reps</div>
                    <div className="font-bold text-white">{ex.reps || 10}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">Rest</div>
                    <div className="font-bold text-purple-400">{ex.restTimeSeconds || 60}s</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setViewExercise(ex)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View & Play
                  </button>
                  <button
                    onClick={() => handleOpenEdit(ex)}
                    className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                    title="Edit Exercise"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingExercise(ex)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                    title="Delete Exercise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Exercise Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white">
                  {editingExercise ? "Edit Exercise" : "Add New Exercise"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExercise} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Exercise Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incline Dumbbell Press"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                    <select
                      value={formData.category || "Machine Exercises"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      {EXERCISE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Muscle *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Upper Chest, Triceps"
                      value={formData.targetMuscle || ""}
                      onChange={(e) => setFormData({ ...formData, targetMuscle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Sets *</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={formData.sets || 3}
                      onChange={(e) => setFormData({ ...formData, sets: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Reps *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={formData.reps || 10}
                      onChange={(e) => setFormData({ ...formData, reps: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Rest Time (sec) *</label>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      required
                      value={formData.restTimeSeconds || 60}
                      onChange={(e) => setFormData({ ...formData, restTimeSeconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Video URL (YouTube embed or MP4)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={formData.videoUrl || ""}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Exercise Image</label>
                  <div className="flex items-center gap-3">
                    {formData.imageUrl && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                        <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={formData.imageUrl || ""}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload photo</span>
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Instructions *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain proper setup, form cues, breathing, and safe range of motion..."
                    value={formData.instructions || ""}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Exercise
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Exercise Details & Video Modal */}
      <AnimatePresence>
        {viewExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
            >
              {/* Media Player: Video if available, else Image */}
              <div className="relative aspect-video bg-slate-950">
                {viewExercise.videoUrl?.includes("embed") ? (
                  <iframe
                    src={viewExercise.videoUrl}
                    title={viewExercise.name}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={viewExercise.imageUrl || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80"}
                    alt={viewExercise.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => setViewExercise(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {viewExercise.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{viewExercise.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Target Muscle</div>
                    <div className="text-xs font-bold text-purple-400">{viewExercise.targetMuscle}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">Sets</div>
                    <div className="text-base font-bold text-white">{viewExercise.sets || 3}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Reps</div>
                    <div className="text-base font-bold text-white">{viewExercise.reps || 10}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Rest Time</div>
                    <div className="text-base font-bold text-purple-400">{viewExercise.restTimeSeconds || 60}s</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Exercise Instructions
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    {viewExercise.instructions}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setViewExercise(null);
                      handleOpenEdit(viewExercise);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Exercise
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation before delete */}
      <ConfirmationDialog
        isOpen={Boolean(deletingExercise)}
        title="Delete Exercise?"
        message={`Are you sure you want to permanently delete "${deletingExercise?.name}" from your Firebase exercise collection?`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingExercise(null)}
      />
    </div>
  );
};
