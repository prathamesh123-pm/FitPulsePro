import { useState, useEffect, useRef } from "react";
import {
  Timer,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Radio,
  X,
  Music,
  Activity,
} from "lucide-react";
import { audioCoach } from "../utils/audioCoach";
import { Language } from "../utils/i18n";

interface AudioCoachHUDProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export function AudioCoachHUD({ isOpen, onClose, lang = "en" }: AudioCoachHUDProps) {
  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(60);
  const [initialRestDuration, setInitialRestDuration] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Metronome State
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(60);
  const [metronomeTick, setMetronomeTick] = useState<number>(0);

  // Ambient Noise State
  const [isAmbientActive, setIsAmbientActive] = useState<boolean>(false);
  const [ambientType, setAmbientType] = useState<"pink" | "white">("pink");

  const timerRef = useRef<number | null>(null);

  // Timer Tick Engine
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            // Finished!
            if (soundEnabled) {
              audioCoach.playRestFinishedSound();
            }
            if (voiceEnabled) {
              audioCoach.speakText(
                lang === "mr" ? "विश्रांती संपली! पुढचा सेट सुरू करा." : "Rest time up! Next set.",
                lang
              );
            }
            setIsTimerRunning(false);
            return 0;
          }

          // Countdown beeps at 3, 2, 1
          if (prev <= 4 && soundEnabled) {
            audioCoach.playCountdownBeep(prev === 2);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, soundEnabled, voiceEnabled, lang]);

  // Metronome Handler
  const toggleMetronome = () => {
    if (isMetronomeActive) {
      audioCoach.stopMetronome();
      setIsMetronomeActive(false);
    } else {
      audioCoach.startMetronome(bpm, (tick) => setMetronomeTick(tick));
      setIsMetronomeActive(true);
    }
  };

  // Ambient Sound Handler
  const toggleAmbient = () => {
    if (isAmbientActive) {
      audioCoach.stopAmbientNoise();
      setIsAmbientActive(false);
    } else {
      audioCoach.startAmbientFocusNoise(ambientType);
      setIsAmbientActive(true);
    }
  };

  const handleStartTimer = (seconds: number) => {
    setInitialRestDuration(seconds);
    setRestSecondsLeft(seconds);
    setIsTimerRunning(true);
    if (soundEnabled) {
      audioCoach.playBeep(520, 0.1);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setRestSecondsLeft(initialRestDuration);
  };

  const handleAdjustTimer = (delta: number) => {
    setRestSecondsLeft((prev) => Math.max(0, prev + delta));
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct =
    initialRestDuration > 0
      ? Math.round(((initialRestDuration - restSecondsLeft) / initialRestDuration) * 100)
      : 0;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-full max-w-sm rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-4 sm:p-5 text-slate-100 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {lang === "mr" ? "ऑडिओ कोच व रेस्ट टाइमर" : "Audio Coach & Rest Timer"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === "mr" ? "ध्वनी संकेत व लिफ्टिंग टेम्पो" : "Voice cues, beeps & lifting tempo"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Rest Timer Module */}
      <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/80 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            {lang === "mr" ? "विश्रांती कालावधी (Rest Time)" : "Rest Interval"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded-md text-xs transition cursor-pointer ${
                soundEnabled ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500"
              }`}
              title="Sound Cues / Beeps"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                voiceEnabled
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                  : "text-slate-500"
              }`}
              title="Vocal prompts"
            >
              Voice
            </button>
          </div>
        </div>

        {/* Big Digital Display */}
        <div className="flex items-center justify-between my-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAdjustTimer(-15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="px-3 py-1 text-center">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {formatTime(restSecondsLeft)}
              </span>
            </div>
            <button
              onClick={() => handleAdjustTimer(15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isTimerRunning
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
              }`}
            >
              {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isTimerRunning ? "Pause" : "Start"}</span>
            </button>
            <button
              onClick={handleResetTimer}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Preset Rest Intervals */}
        <div className="flex items-center gap-1.5 justify-between">
          {[30, 60, 90, 120, 180].map((secs) => (
            <button
              key={secs}
              onClick={() => handleStartTimer(secs)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                initialRestDuration === secs && isTimerRunning
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>
      </div>

      {/* Lifting Metronome & Gym Ambience Controls */}
      <div className="grid grid-cols-2 gap-2">
        {/* Metronome */}
        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400" />
              Metronome
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{bpm} BPM</span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <input
              type="range"
              min={40}
              max={160}
              step={5}
              value={bpm}
              onChange={(e) => {
                const newBpm = Number(e.target.value);
                setBpm(newBpm);
                if (isMetronomeActive) {
                  audioCoach.startMetronome(newBpm, (tick) => setMetronomeTick(tick));
                }
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <button
            onClick={toggleMetronome}
            className={`w-full py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
              isMetronomeActive
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            {isMetronomeActive ? `Active (${metronomeTick % 4 || 4})` : "Start Tempo"}
          </button>
        </div>

        {/* Ambient Gym Soundscape */}
        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Radio className="h-3 w-3 text-teal-400" />
              Focus Noise
            </span>
            <span className="text-[10px] font-medium text-teal-400 capitalize">{ambientType}</span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setAmbientType("pink")}
              className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                ambientType === "pink" ? "bg-teal-500/20 text-teal-300" : "text-slate-500"
              }`}
            >
              Pink
            </button>
            <button
              onClick={() => setAmbientType("white")}
              className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                ambientType === "white" ? "bg-teal-500/20 text-teal-300" : "text-slate-500"
              }`}
            >
              White
            </button>
          </div>

          <button
            onClick={toggleAmbient}
            className={`w-full py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
              isAmbientActive
                ? "bg-teal-500 text-slate-950 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            {isAmbientActive ? "Stop Noise" : "Play Noise"}
          </button>
        </div>
      </div>
    </div>
  );
}
