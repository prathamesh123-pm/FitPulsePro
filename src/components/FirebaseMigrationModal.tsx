import { useState } from "react";
import {
  X,
  Database,
  Cloud,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Server,
  RefreshCw,
  FileCode,
  Lock,
} from "lucide-react";
import {
  resolvedFirebaseConfig,
  isAIStudioStarterProject,
  savePersonalFirebaseConfig,
  getSavedPersonalFirebaseConfig,
  clearPersonalFirebaseConfig,
} from "../services/firebase";

interface FirebaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigApplied?: () => void;
}

export function FirebaseMigrationModal({
  isOpen,
  onClose,
  onConfigApplied,
}: FirebaseMigrationModalProps) {
  const [activeTab, setActiveTab] = useState<"migrate" | "instructions">("migrate");
  const [pastedJson, setPastedJson] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [databaseId, setDatabaseId] = useState("");

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasCopiedStep, setHasCopiedStep] = useState(false);

  if (!isOpen) return null;

  const currentProjectId = resolvedFirebaseConfig.projectId;
  const isStarter = isAIStudioStarterProject(currentProjectId);
  const savedPersonalConfig = getSavedPersonalFirebaseConfig();

  // Parse pasted configuration JSON or snippet
  const handleParseSnippet = () => {
    if (!pastedJson.trim()) return;
    try {
      let text = pastedJson.trim();
      // If code snippet like const firebaseConfig = { ... }; extract inside braces
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        text = match[0];
      }
      // Clean JS keys if not quoted
      const fixedJson = text
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,\s*}/g, "}");
      const parsed = JSON.parse(fixedJson);

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      if (parsed.databaseId || parsed.firestoreDatabaseId) {
        setDatabaseId(parsed.databaseId || parsed.firestoreDatabaseId);
      }

      setStatusMsg({
        type: "success",
        text: "Configuration successfully extracted from snippet!",
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: "Could not automatically parse the snippet. Please fill in the fields manually.",
      });
    }
  };

  const handleSaveAndApply = () => {
    setStatusMsg(null);
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setStatusMsg({
        type: "error",
        text: "Please provide at least the API Key, Project ID, and App ID.",
      });
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim() || "000000000000",
      appId: appId.trim(),
      firestoreDatabaseId: databaseId.trim() || "(default)",
    };

    savePersonalFirebaseConfig(config);
    setStatusMsg({
      type: "success",
      text: "Personal Firebase project credentials saved! Reloading application...",
    });

    setTimeout(() => {
      if (onConfigApplied) onConfigApplied();
      window.location.reload();
    }, 1000);
  };

  const handleResetToDefault = () => {
    clearPersonalFirebaseConfig();
    setStatusMsg({
      type: "success",
      text: "Reset to default AI Studio Starter project! Reloading...",
    });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Firebase Project &amp; Migration Center
                {isStarter ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Starter Project
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Personal Project Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Connect your personal Firebase project or use the resilient Hybrid Auth Engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Starter Project Context Notice */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-start gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Why automatic external project creation is restricted:</strong> Google Cloud and Firebase security policies require user-confirmed OAuth and billing authorization to create new GCP projects on your personal Google account. Because an AI Studio Starter project cannot modify cloud permissions without your personal credentials, FitPulse Pro includes both an <strong className="text-emerald-400">Instant Hybrid Authentication Engine</strong> (active now with zero errors) and this <strong className="text-white">1-Click Migration Wizard</strong> for your personal Firebase project.
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 pt-3 bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("migrate")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "migrate"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            1-Click Connect &amp; Migrate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("instructions")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "instructions"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Setup Guide (6 Simple Steps)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === "migrate" ? (
            <div className="space-y-4">
              {/* Paste Snippet Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    Quick Paste: Firebase SDK Config Snippet
                  </label>
                  <button
                    type="button"
                    onClick={handleParseSnippet}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition cursor-pointer border border-emerald-500/30"
                  >
                    Auto-Fill Fields
                  </button>
                </div>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-project.firebaseapp.com",\n  projectId: "my-project",\n  storageBucket: "my-project.firebasestorage.app",\n  appId: "1:..."\n};`}
                  className="w-full h-24 p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Individual Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    API Key *
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="my-personal-fitness-app"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="my-project.firebaseapp.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    App ID *
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789:web:abcdef..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="my-project.firebasestorage.app"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="123456789012"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                {savedPersonalConfig && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-rose-300 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
                  >
                    Reset to Starter Project
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndApply}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Save &amp; Connect Personal Project
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  How to create your Personal Firebase Project in 3 minutes:
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Follow these exact steps in your own Google account to get full Owner control and enable all Firebase services.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">1</span>
                    Create Project
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Firebase Console ↗</a> and click <strong>Add project</strong>. Enter a name (e.g. <em>fitpulse-pro</em>).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">2</span>
                    Enable Email/Password Sign-In
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Under <strong>Build &gt; Authentication</strong>, click <strong>Get started</strong>. In the <strong>Sign-in method</strong> tab, select <strong>Email/Password</strong> and toggle <strong>Enable</strong> to ON.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">3</span>
                    Enable Cloud Firestore
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Under <strong>Build &gt; Firestore Database</strong>, click <strong>Create database</strong>. Choose a location and start in <strong>Test mode</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">4</span>
                    Enable Firebase Storage
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Under <strong>Build &gt; Storage</strong>, click <strong>Get started</strong> and accept defaults.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">5</span>
                    Register Web App &amp; Copy Config
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Go to <strong>Project Settings (Gear Icon) &gt; General &gt; Your apps</strong>. Click the Web icon (<strong>&lt;/&gt;</strong>), name the app, and copy the <code className="text-emerald-300">firebaseConfig</code> object.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 border border-emerald-500/30">6</span>
                    Apply in FitPulse
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">
                    Paste the snippet in the <strong>1-Click Connect &amp; Migrate</strong> tab above and click <strong>Save &amp; Connect Personal Project</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
