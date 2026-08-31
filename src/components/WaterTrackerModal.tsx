import { useState } from "react";
import { X, Droplets, Plus, Minus, Check, Flame, Sparkles, Trophy, Bell, RotateCcw } from "lucide-react";
import { Language } from "../utils/i18n";
import { audioCoach } from "../utils/audioCoach";

interface WaterTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWaterMl: number;
  targetWaterMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater?: () => void;
  lang?: Language;
}

export function WaterTrackerModal({
  isOpen,
  onClose,
  currentWaterMl,
  targetWaterMl,
  onAddWater,
  onResetWater,
  lang = "en",
}: WaterTrackerModalProps) {
  const [customAmount, setCustomAmount] = useState<number>(250);
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const pct = Math.min(100, Math.round((currentWaterMl / (targetWaterMl || 3000)) * 100));
  const remainingMl = Math.max(0, (targetWaterMl || 3000) - currentWaterMl);

  const handleQuickAdd = (amount: number) => {
    onAddWater(amount);
    audioCoach.playBeep(880, 0.1, "sine");
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {lang === "mr" ? "दैनिक पाणी ट्रॅकर (Water Tracker)" : "Daily Hydration Tracker"}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                  {pct}% Goal
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "mr"
                  ? "स्नायूंची वाढ, ताकद आणि पचनासाठी पुरेसे पाणी पिणे आवश्यक आहे."
                  : "Track daily water consumption for optimal muscle hypertrophy & recovery."}
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

        {/* Visual Water Bottle & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center mb-5">
          {/* Animated Graphic */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
            {/* Water Bottle Silhouette */}
            <div className="relative w-24 h-48 rounded-3xl border-4 border-cyan-500/40 bg-slate-900/60 overflow-hidden flex flex-col justify-end shadow-lg shadow-cyan-500/10">
              {/* Bottle Cap */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-cyan-600 rounded-t-md" />

              {/* Water Liquid */}
              <div
                className="w-full bg-gradient-to-t from-cyan-600 via-cyan-500 to-teal-400 transition-all duration-700 ease-out flex items-center justify-center relative"
                style={{ height: `${pct}%` }}
              >
                {/* Surface ripple */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-pulse" />
                <span className="text-xs font-black text-slate-950">{pct}%</span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xl font-extrabold text-cyan-400">
                {(currentWaterMl / 1000).toFixed(1)} L
              </span>
              <span className="text-xs text-slate-400"> / {(targetWaterMl / 1000).toFixed(1)} L</span>
            </div>
          </div>

          {/* Quick Metrics & Remaining */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-0.5">
                {lang === "mr" ? "उर्वरित पाणी (Remaining)" : "Remaining to Target"}
              </span>
              <div className="text-2xl font-black text-slate-100">
                {remainingMl > 0 ? `${remainingMl} ml` : "Goal Achieved! 🎉"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {remainingMl > 0
                  ? lang === "mr"
                    ? `अजून अंदाजे ${Math.ceil(remainingMl / 250)} ग्लास पाणी प्यावे लागेल.`
                    : `Approx. ${Math.ceil(remainingMl / 250)} standard glasses remaining today.`
                  : lang === "mr"
                  ? "छान! तुम्ही आजचे हायड्रेशन उद्दिष्ट यशस्वीरीत्या पूर्ण केले आहे."
                  : "Great job! You have met your hydration requirement."}
              </p>
            </div>

            {/* Custom Log Input */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                {lang === "mr" ? "कस्टम पाणी जोडा (Custom Amount)" : "Custom Amount (ml)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleQuickAdd(customAmount)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tap Buttons */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-400 block mb-2">
            {lang === "mr" ? "झटपट नोंदणी (Quick Add):" : "Quick Tap Water Logs:"}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { amount: 150, label: "Cup (150ml)" },
              { amount: 250, label: "Glass (250ml)" },
              { amount: 500, label: "Shaker (500ml)" },
              { amount: 750, label: "Bottle (750ml)" },
            ].map((item) => (
              <button
                key={item.amount}
                onClick={() => handleQuickAdd(item.amount)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-slate-700/60 transition cursor-pointer group"
              >
                <Droplets className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-200 mt-1">+{item.amount}</span>
                <span className="text-[10px] text-slate-400">{item.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Message / Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {onResetWater && (
            <button
              onClick={onResetWater}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{lang === "mr" ? "रीसेट करा" : "Reset Today"}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {logSuccess && (
              <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                ✓ Logged!
              </span>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              {lang === "mr" ? "बंद करा" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
