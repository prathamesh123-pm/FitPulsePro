import { useState, useMemo } from "react";
import { X, Dumbbell, Sparkles, Plus, Minus, RotateCcw, Check, Layers } from "lucide-react";
import { Language, TRANSLATIONS } from "../utils/i18n";

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

interface PlateSpec {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  heightClass: string;
  name: string;
}

const AVAILABLE_PLATES: PlateSpec[] = [
  { weight: 25, color: "bg-red-600", borderColor: "border-red-400", textColor: "text-white", heightClass: "h-36 w-7", name: "25 kg" },
  { weight: 20, color: "bg-blue-600", borderColor: "border-blue-400", textColor: "text-white", heightClass: "h-32 w-7", name: "20 kg" },
  { weight: 15, color: "bg-amber-500", borderColor: "border-amber-300", textColor: "text-slate-950", heightClass: "h-28 w-6", name: "15 kg" },
  { weight: 10, color: "bg-emerald-600", borderColor: "border-emerald-400", textColor: "text-white", heightClass: "h-24 w-6", name: "10 kg" },
  { weight: 5, color: "bg-slate-100", borderColor: "border-slate-300", textColor: "text-slate-900", heightClass: "h-20 w-5", name: "5 kg" },
  { weight: 2.5, color: "bg-slate-900", borderColor: "border-slate-600", textColor: "text-emerald-400", heightClass: "h-16 w-5", name: "2.5 kg" },
  { weight: 1.25, color: "bg-slate-400", borderColor: "border-slate-300", textColor: "text-slate-950", heightClass: "h-12 w-4", name: "1.25 kg" },
  { weight: 0.5, color: "bg-teal-700", borderColor: "border-teal-500", textColor: "text-white", heightClass: "h-10 w-3.5", name: "0.5 kg" },
];

export function PlateCalculatorModal({ isOpen, onClose, lang = "en" }: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState<number>(100);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [collarWeight, setCollarWeight] = useState<number>(0);
  const [availableDenominations, setAvailableDenominations] = useState<number[]>([25, 20, 15, 10, 5, 2.5, 1.25]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Calculate plate distribution for one side
  const calculation = useMemo(() => {
    const totalToLoad = Math.max(0, targetWeight - barWeight - (collarWeight * 2));
    const sideWeight = totalToLoad / 2;

    let remaining = sideWeight;
    const platesPerSide: { spec: PlateSpec; count: number }[] = [];

    // Sort available plates descending
    const sorted = AVAILABLE_PLATES.filter((p) => availableDenominations.includes(p.weight)).sort((a, b) => b.weight - a.weight);

    for (const plate of sorted) {
      if (remaining >= plate.weight) {
        const count = Math.floor(remaining / plate.weight);
        if (count > 0) {
          platesPerSide.push({ spec: plate, count });
          remaining = Math.round((remaining - count * plate.weight) * 1000) / 1000;
        }
      }
    }

    const actualLoadedSide = platesPerSide.reduce((acc, p) => acc + p.spec.weight * p.count, 0);
    const actualTotalWeight = barWeight + (collarWeight * 2) + (actualLoadedSide * 2);
    const unachievableWeight = Math.round((targetWeight - actualTotalWeight) * 100) / 100;

    return {
      sideWeight,
      platesPerSide,
      actualTotalWeight,
      unachievableWeight,
    };
  }, [targetWeight, barWeight, collarWeight, availableDenominations]);

  if (!isOpen) return null;

  const handleAdjustWeight = (delta: number) => {
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  const toggleDenomination = (weight: number) => {
    setAvailableDenominations((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {lang === "mr" ? "बारबेल प्लेट कॅल्क्युलेटर" : "Barbell Plate Loader"}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  Gym Visualizer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "mr"
                  ? "टार्गेट वजनासाठी बारबेलच्या प्रत्येक बाजूला कोणत्या प्लेट्स लावाव्यात ते पहा."
                  : "Calculate exact Olympic plates needed on each side of the barbell."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Weight Controls */}
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  {lang === "mr" ? "एकूण लक्ष्य वजन (Total Target Weight)" : "Total Target Weight"}
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {targetWeight}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">kg</span>
                  {calculation.unachievableWeight !== 0 && (
                    <span className="text-xs text-amber-400 font-medium">
                      ({calculation.actualTotalWeight} kg loaded)
                    </span>
                  )}
                </div>
              </div>

              {/* Increments */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => handleAdjustWeight(-10)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  -10 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(-2.5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  -2.5 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(2.5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition cursor-pointer"
                >
                  +2.5 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(10)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition cursor-pointer"
                >
                  +10 kg
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mr-1">
                {lang === "mr" ? "झटपट:" : "Presets:"}
              </span>
              {[40, 60, 80, 100, 120, 140, 160, 180, 200].map((w) => (
                <button
                  key={w}
                  onClick={() => setTargetWeight(w)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    targetWeight === w
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>
          </div>

          {/* Bar Selection & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/60">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                {lang === "mr" ? "बारचे वजन (Barbell Weight)" : "Barbell Weight"}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { w: 20, label: "20kg (Olympic)" },
                  { w: 15, label: "15kg (Women)" },
                  { w: 10, label: "10kg (Standard)" },
                  { w: 7.5, label: "7.5kg (EZ Bar)" },
                ].map((bar) => (
                  <button
                    key={bar.w}
                    onClick={() => setBarWeight(bar.w)}
                    className={`py-1.5 px-1 rounded-lg text-center text-xs font-semibold transition cursor-pointer ${
                      barWeight === bar.w
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {bar.w}kg
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/60">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                {lang === "mr" ? "उपलब्ध प्लेट्स (Available Plates)" : "Available Plates Inventory"}
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {AVAILABLE_PLATES.map((p) => {
                  const isChecked = availableDenominations.includes(p.weight);
                  return (
                    <button
                      key={p.weight}
                      onClick={() => toggleDenomination(p.weight)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        isChecked
                          ? `${p.color} ${p.textColor} shadow-sm`
                          : "bg-slate-800/40 text-slate-600 line-through"
                      }`}
                    >
                      {p.weight}kg
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Visual Barbell Graphic */}
          <div className="rounded-xl bg-slate-950 p-5 border border-slate-800 flex flex-col items-center justify-center min-h-[190px]">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-emerald-400">
                {lang === "mr" ? "प्रत्येक बाजूला लोड करा (Per Side Load):" : "Load on EACH Side:"}{" "}
                <strong className="text-slate-100 text-sm">{calculation.sideWeight} kg</strong>
              </span>
            </div>

            {/* Sleeve Graphic */}
            <div className="relative w-full max-w-lg flex items-center justify-center h-40">
              {/* Center Bar */}
              <div className="absolute h-4 w-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-sm shadow-inner" />
              {/* Bar Collar */}
              <div className="absolute left-16 h-20 w-4 bg-slate-400 rounded-sm border border-slate-300 z-10 shadow-md" />

              {/* Rendered Loaded Plates Side */}
              <div className="flex items-center gap-1 z-20 pl-24">
                {calculation.platesPerSide.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    {lang === "mr" ? "केवळ रिकामी बारबेल" : "Empty Bar Only (No extra plates needed)"}
                  </span>
                ) : (
                  calculation.platesPerSide.flatMap((p) =>
                    Array.from({ length: p.count }).map((_, idx) => (
                      <div
                        key={`${p.spec.weight}-${idx}`}
                        className={`flex flex-col items-center justify-center rounded-sm border ${p.spec.heightClass} ${p.spec.color} ${p.spec.borderColor} ${p.spec.textColor} shadow-lg transition-transform hover:scale-105 select-none`}
                        title={`${p.spec.weight} kg plate`}
                      >
                        <span className="text-[10px] font-black -rotate-90 whitespace-nowrap">
                          {p.spec.weight}
                        </span>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

            {/* Breakdown Chips */}
            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
              {calculation.platesPerSide.map((p) => (
                <div
                  key={p.spec.weight}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                >
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${p.spec.color} border border-slate-600`}
                  />
                  <span className="font-bold text-slate-200">{p.count}×</span>
                  <span className="text-slate-400">{p.spec.weight} kg plate</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {lang === "mr"
              ? `बार: ${barWeight}kg • बाजू: 2 × ${calculation.sideWeight}kg`
              : `Bar: ${barWeight}kg • Sides: 2 × ${calculation.sideWeight}kg`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            {lang === "mr" ? "पूर्ण झाले (Done)" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
