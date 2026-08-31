import { useState, useMemo } from "react";
import { X, Trophy, Award, Sparkles, TrendingUp, Plus, Edit2, Check, Flame } from "lucide-react";
import confetti from "canvas-confetti";
import { Language } from "../utils/i18n";
import { audioCoach } from "../utils/audioCoach";

export interface PersonalRecordItem {
  id: string;
  liftName: string;
  category: "Powerlifting" | "Olympic" | "Accessory" | "Bodyweight";
  maxWeightKg: number;
  reps: number;
  estimated1RMKg: number;
  dateAchieved: string;
  notes?: string;
}

const DEFAULT_PRS: PersonalRecordItem[] = [
  {
    id: "pr-1",
    liftName: "Barbell Bench Press",
    category: "Powerlifting",
    maxWeightKg: 100,
    reps: 1,
    estimated1RMKg: 100,
    dateAchieved: "2026-08-20",
    notes: "Clean pause on chest",
  },
  {
    id: "pr-2",
    liftName: "Barbell Back Squat",
    category: "Powerlifting",
    maxWeightKg: 135,
    reps: 2,
    estimated1RMKg: 143,
    dateAchieved: "2026-08-15",
    notes: "Below parallel depth",
  },
  {
    id: "pr-3",
    liftName: "Conventional Deadlift",
    category: "Powerlifting",
    maxWeightKg: 160,
    reps: 1,
    estimated1RMKg: 160,
    dateAchieved: "2026-08-22",
    notes: "Mixed grip, no straps",
  },
  {
    id: "pr-4",
    liftName: "Overhead Barbell Press",
    category: "Powerlifting",
    maxWeightKg: 65,
    reps: 3,
    estimated1RMKg: 71,
    dateAchieved: "2026-08-18",
    notes: "Strict military press",
  },
  {
    id: "pr-5",
    liftName: "Barbell Bent-Over Row",
    category: "Accessory",
    maxWeightKg: 85,
    reps: 5,
    estimated1RMKg: 99,
    dateAchieved: "2026-08-14",
  },
  {
    id: "pr-6",
    liftName: "Weighted Pull-Ups",
    category: "Bodyweight",
    maxWeightKg: 25,
    reps: 4,
    estimated1RMKg: 28,
    dateAchieved: "2026-08-10",
    notes: "+25kg belt dip",
  },
];

interface PersonalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBodyweightKg?: number;
  lang?: Language;
}

export function PersonalRecordsModal({
  isOpen,
  onClose,
  userBodyweightKg = 78,
  lang = "en",
}: PersonalRecordsModalProps) {
  const [prList, setPrList] = useState<PersonalRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem("FITPULSE_PRS_V1");
      return saved ? JSON.parse(saved) : DEFAULT_PRS;
    } catch {
      return DEFAULT_PRS;
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<number>(100);
  const [editReps, setEditReps] = useState<number>(1);
  const [editNotes, setEditNotes] = useState<string>("");

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newLiftName, setNewLiftName] = useState<string>("");
  const [newWeight, setNewWeight] = useState<number>(60);
  const [newReps, setNewReps] = useState<number>(1);

  // Big 3 Total
  const big3Stats = useMemo(() => {
    const bench = prList.find((p) => p.liftName.toLowerCase().includes("bench"))?.estimated1RMKg || 0;
    const squat = prList.find((p) => p.liftName.toLowerCase().includes("squat"))?.estimated1RMKg || 0;
    const deadlift = prList.find((p) => p.liftName.toLowerCase().includes("deadlift"))?.estimated1RMKg || 0;

    const total1RM = bench + squat + deadlift;
    const strengthRatio = userBodyweightKg > 0 ? (total1RM / userBodyweightKg).toFixed(2) : "0";

    let tier = "Intermediate";
    const ratioNum = Number(strengthRatio);
    if (ratioNum >= 6.0) tier = "Elite";
    else if (ratioNum >= 4.8) tier = "Advanced";
    else if (ratioNum >= 3.5) tier = "Intermediate";
    else tier = "Novice";

    return {
      bench,
      squat,
      deadlift,
      total1RM,
      strengthRatio,
      tier,
    };
  }, [prList, userBodyweightKg]);

  if (!isOpen) return null;

  const saveList = (updated: PersonalRecordItem[]) => {
    setPrList(updated);
    try {
      localStorage.setItem("FITPULSE_PRS_V1", JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleUpdatePR = (id: string) => {
    const est1RM = Math.round(editWeight * (1 + editReps / 30));
    const updated = prList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          maxWeightKg: editWeight,
          reps: editReps,
          estimated1RMKg: est1RM,
          dateAchieved: new Date().toISOString().split("T")[0],
          notes: editNotes,
        };
      }
      return p;
    });

    saveList(updated);
    setEditingId(null);

    // Confetti celebration
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      audioCoach.playBeep(1046.5, 0.25, "triangle");
    } catch (e) {
      // ignore
    }
  };

  const handleAddPR = () => {
    if (!newLiftName.trim()) return;
    const est1RM = Math.round(newWeight * (1 + newReps / 30));
    const newItem: PersonalRecordItem = {
      id: `pr-${Date.now()}`,
      liftName: newLiftName.trim(),
      category: "Accessory",
      maxWeightKg: newWeight,
      reps: newReps,
      estimated1RMKg: est1RM,
      dateAchieved: new Date().toISOString().split("T")[0],
    };

    saveList([...prList, newItem]);
    setIsAddingNew(false);
    setNewLiftName("");

    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {lang === "mr" ? "पर्सनल रेकॉर्ड्स (PR) व स्ट्रेंथ ट्रॉफी" : "Personal Records & Strength PRs"}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                  {big3Stats.tier} Tier
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "mr"
                  ? "तुमचे सर्वोत्कृष्ट वजन, 1RM आणि ताकदीची पातळी ट्रॅक करा."
                  : "Track all-time maximum weights, 1RM estimates, and powerlifting strength benchmarks."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Big 3 Powerlifting Banner */}
        <div className="rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border border-amber-500/30 mb-5 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Squat 1RM</span>
              <span className="text-lg font-extrabold text-amber-400">{big3Stats.squat} kg</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Bench 1RM</span>
              <span className="text-lg font-extrabold text-amber-400">{big3Stats.bench} kg</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Deadlift 1RM</span>
              <span className="text-lg font-extrabold text-amber-400">{big3Stats.deadlift} kg</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-[11px] text-amber-300 block font-medium">Big 3 Total</span>
              <span className="text-lg font-black text-amber-300">{big3Stats.total1RM} kg</span>
            </div>
          </div>
        </div>

        {/* PR List Grid */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {prList.map((pr) => {
            const isEditing = editingId === pr.id;

            return (
              <div
                key={pr.id}
                className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/80 hover:border-slate-700 transition"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{pr.liftName}</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        Est 1RM: {Math.round(editWeight * (1 + editReps / 30))} kg
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={editWeight}
                          onChange={(e) => setEditWeight(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Reps Performed</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={editReps}
                          onChange={(e) => setEditReps(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Notes (e.g. form, belt, pause)..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdatePR(pr.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Save New PR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">{pr.liftName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                          {pr.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>
                          Best: <strong className="text-slate-100 font-bold">{pr.maxWeightKg} kg</strong> × {pr.reps} reps
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">
                          1RM: <strong>{pr.estimated1RMKg} kg</strong>
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">{pr.dateAchieved}</span>
                      </div>
                      {pr.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{pr.notes}"</p>}
                    </div>

                    <button
                      onClick={() => {
                        setEditingId(pr.id);
                        setEditWeight(pr.maxWeightKg);
                        setEditReps(pr.reps);
                        setEditNotes(pr.notes || "");
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
                      title="Update Record"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New PR Form Toggle */}
        {isAddingNew ? (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-700 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200">Add New Exercise Record</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Exercise Name (e.g. Incline Dumbbell Press)"
                value={newLiftName}
                onChange={(e) => setNewLiftName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
              />
              <input
                type="number"
                placeholder="Weight (kg)"
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
              />
              <input
                type="number"
                min="1"
                max="30"
                placeholder="Reps"
                value={newReps}
                onChange={(e) => setNewReps(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPR}
                className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === "mr" ? "नवीन रेकॉर्ड जोडा" : "Add Custom Lift PR"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              {lang === "mr" ? "बंद करा" : "Close"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
