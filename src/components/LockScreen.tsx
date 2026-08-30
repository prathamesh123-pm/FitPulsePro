import { useState } from "react";
import { Lock, Fingerprint, ScanFace, KeyRound, ShieldAlert } from "lucide-react";
import { SecuritySettings } from "../types";

interface LockScreenProps {
  security: SecuritySettings;
  onUnlock: () => void;
}

export function LockScreen({ security, onUnlock }: LockScreenProps) {
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg("");

      if (nextPin.length === 4) {
        if (nextPin === (security.pinCode || "1234")) {
          onUnlock();
        } else {
          setErrorMsg("Incorrect PIN. Please try again.");
          setTimeout(() => setPinInput(""), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleBiometric = () => {
    setIsBiometricScanning(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsBiometricScanning(false);
      onUnlock();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-100">FitPulse Security Lock</h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your 4-digit PIN or use Biometrics to access your health data.
        </p>

        {/* PIN Indicators */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                pinInput.length > idx
                  ? "border-emerald-500 bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50"
                  : "border-slate-700 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-400">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-semibold text-slate-100 border border-slate-700/50 transition active:scale-95 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBiometric}
            disabled={isBiometricScanning}
            className="flex items-center justify-center h-14 rounded-xl bg-slate-800/50 hover:bg-slate-700/70 text-emerald-400 border border-emerald-500/20 transition active:scale-95 cursor-pointer"
            title="Biometric Sensor"
          >
            {isBiometricScanning ? (
              <span className="text-xs font-medium animate-pulse text-emerald-300">Scanning...</span>
            ) : (
              <Fingerprint className="h-6 w-6" />
            )}
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-semibold text-slate-100 border border-slate-700/50 transition active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center h-14 rounded-xl bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 border border-slate-700/50 transition active:scale-95 cursor-pointer text-xs font-semibold"
          >
            DEL
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <KeyRound className="h-3.5 w-3.5 text-slate-500" />
            Default: 1234
          </span>
          <button
            onClick={handleBiometric}
            className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
          >
            <ScanFace className="h-3.5 w-3.5" />
            Simulate Face ID
          </button>
        </div>
      </div>
    </div>
  );
}
