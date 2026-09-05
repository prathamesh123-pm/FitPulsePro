import {
  X,
  HelpCircle,
  Shield,
  Cloud,
  ArrowLeftRight,
  Smartphone,
  Lock,
  Database,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export function HelpModal({ isOpen, onClose, lang = "en" }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {lang === "mr" ? "मदत व सपोर्ट केंद्र (Help & Support)" : "FitPulse Help & Support Center"}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "mr"
                  ? "लॉगिन, क्लाउड डेटा सिंक आणि खाते व्यवस्थापन मार्गदर्शक"
                  : "Guide to Firebase Login, Cloud Sync, and Multi-Device Support"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm">
          {/* Section 1: Authentication & Per-User Isolation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>{lang === "mr" ? "सुरक्षित खाते आणि डेटा गोपनीयता" : "Secure Account & Data Privacy"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {lang === "mr"
                ? "प्रत्येक युझरचा फिटनेस डेटा, व्यायाम नोंदी, डाएट प्लॅन्स आणि कस्टम उत्पादने फायरबेस क्लाउडमध्ये युझरच्या युनिक UID अंतर्गत सुरक्षित ठेवली जातात. इतर कोणत्याही युझरचा डेटा एकमेकांमध्ये मिक्स होत नाही."
                : "All your workouts, nutrition logs, diet plans, and store data are isolated strictly under your unique Firebase UID in Cloud Firestore. No other user can view or alter your private records."}
            </p>
          </div>

          {/* Section 2: Multi-Device Sync */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <Cloud className="w-4 h-4" />
              <span>{lang === "mr" ? "मल्टी-डिव्हाइस रिअल-टाइम सिंक" : "Multi-Device Real-Time Sync"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {lang === "mr"
                ? "तुम्ही कोणत्याही अँड्रॉइड मोबाईल, टॅबलेट किंवा कॉम्प्युटरवरून तुमच्या त्याच ईमेल आणि पासवर्डने लॉगिन केल्यास तुमचा सर्व डेटा काही सेकंदांत आपोआप रिस्टोअर होतो."
                : "Sign in with the same email and password on any Android device, tablet, or desktop. Your entire workout history and profile will automatically sync in real-time."}
            </p>
          </div>

          {/* Section 3: Switching Accounts */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <ArrowLeftRight className="w-4 h-4" />
              <span>{lang === "mr" ? "खाते कसे बदलावे (Switch Account)" : "Switching Between Accounts"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {lang === "mr"
                ? "नेव्हिगेशन मेनूमधील किंवा प्रोफाइल पानातील 'Switch Account' बटण दाबा. तुमचे सध्याचे सत्र सुरक्षितपणे बंद होऊन नवीन खात्यात लॉगिन करण्याची स्क्रीन उघडेल. तुमचा जुना डेटा सुरक्षितपणे क्लाउडमध्ये सेव्ह राहतो."
                : "Open the Navigation Drawer or Profile page and tap 'Switch Account'. This signs you out and opens the Login Screen immediately, so you can log in with a different account. All your existing cloud data remains completely safe."}
            </p>
          </div>

          {/* Section 4: Offline & Auto-Save */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>{lang === "mr" ? "ऑफलाइन मोड आणि ऑटो-सेव्ह" : "Offline Mode & Auto-Save"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {lang === "mr"
                ? "इंटरनेट नसतानाही ॲप अखंड चालते. इंटरनेट परत येताच सर्व नवीन बदल आपोआप क्लाउडमध्ये सेव्ह होतात."
                : "FitPulse continues working even when offline. As soon as connectivity returns, your latest entries are automatically committed to Cloud Firestore without data loss."}
            </p>
          </div>

          {/* Tips list */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              {lang === "mr" ? "जलद टिप्स (Quick Tips):" : "Quick Tips:"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {lang === "mr" ? "प्रोफाइल आयकॉन वर उजव्या कोपऱ्यात नेहमी उपलब्ध आहे." : "Profile icon is always located in the top-right corner."}
                </span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {lang === "mr" ? "लॉगआउट केल्यावर ॲप पुन्हा इन्स्टॉल करण्याची गरज पडत नाही." : "Signing out and switching accounts requires no app reinstallation."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            {lang === "mr" ? "समजले / बंद करा" : "Got It / Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
