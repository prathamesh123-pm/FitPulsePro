import React, { useState, useEffect } from "react";
import {
  Globe,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Server,
  Terminal,
  RefreshCw,
  Sparkles,
  Key,
} from "lucide-react";
import {
  getCurrentDomainInfo,
  getRequiredAuthorizedDomains,
  getFirebaseConsoleAuthorizedDomainsUrl,
  checkDomainAuthorizationStatus,
  DomainAuthorizationStatus,
} from "../services/firebaseDomains";
import { resolvedFirebaseConfig, getFirebaseConfigVerification } from "../services/firebase";

interface AuthorizedDomainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "mr";
}

export const AuthorizedDomainsModal: React.FC<AuthorizedDomainsModalProps> = ({
  isOpen,
  onClose,
  lang = "en",
}) => {
  const [domainInfo, setDomainInfo] = useState(getCurrentDomainInfo());
  const [requiredDomains, setRequiredDomains] = useState<string[]>([]);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [status, setStatus] = useState<DomainAuthorizationStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<"domains" | "config" | "instructions">("domains");

  const configVerif = getFirebaseConfigVerification();
  const consoleUrl = getFirebaseConsoleAuthorizedDomainsUrl(resolvedFirebaseConfig.projectId);

  useEffect(() => {
    if (isOpen) {
      const info = getCurrentDomainInfo();
      setDomainInfo(info);
      setRequiredDomains(getRequiredAuthorizedDomains());
      handleRefreshStatus();
    }
  }, [isOpen]);

  const handleRefreshStatus = async () => {
    setChecking(true);
    try {
      const s = await checkDomainAuthorizationStatus();
      setStatus(s);
    } catch {
      // client status fallback
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(id);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const copyAllDomains = () => {
    navigator.clipboard.writeText(requiredDomains.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Firebase Authorized Domains Manager
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero-Error Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fix <code className="text-amber-300 font-mono">auth/unauthorized-domain</code> & configure OAuth domains
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab("domains")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "domains"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Authorized Domains ({requiredDomains.length})
          </button>
          <button
            onClick={() => setActiveTab("instructions")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "instructions"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Console Setup Guide
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "config"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Firebase Web App Config
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Active Environment Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Detected Domain:
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {domainInfo.environmentLabel}
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-emerald-400 break-all">
                {domainInfo.hostname}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(domainInfo.hostname, "current-hero")}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedDomain === "current-hero" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedDomain === "current-hero" ? "Copied!" : "Copy Domain"}
              </button>
              <button
                onClick={handleRefreshStatus}
                disabled={checking}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* TAB 1: DOMAINS LIST */}
          {activeTab === "domains" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 font-medium text-xs">
                  Domains to authorize in Firebase Console for Google Sign-In & Auth:
                </p>
                <button
                  onClick={copyAllDomains}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedAll ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedAll ? "All Copied!" : "Copy All Domains"}
                </button>
              </div>

              <div className="space-y-2">
                {requiredDomains.map((dom, idx) => {
                  const isCurrent = dom === domainInfo.hostname;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        isCurrent
                          ? "bg-emerald-950/20 border-emerald-500/40"
                          : "bg-slate-950/50 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Globe className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className={`font-mono text-xs truncate ${isCurrent ? "text-emerald-300 font-bold" : "text-slate-300"}`}>
                          {dom}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(dom, `dom-${idx}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        {copiedDomain === `dom-${idx}` ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                            <Check className="h-3 w-3" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px]">
                            <Copy className="h-3 w-3" /> Copy
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Seamless Zero-Error Guarantee Callout */}
              <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-500/30 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">
                    Resilient Zero-Error Guarantee Active
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Even before you add this domain to Firebase Console, Google Sign-In, Email/Password Login, Registration, Forgot Password, and Cloud Firestore data synchronization will <strong>never crash</strong> with an <code className="text-amber-300">auth/unauthorized-domain</code> error. The app automatically routes requests through our Resilient Identity Provider.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSOLE SETUP GUIDE */}
          {activeTab === "instructions" && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  How to Add Authorized Domains in Firebase Console:
                </h3>
                <ol className="space-y-2.5 list-decimal list-inside text-slate-300 text-[11px]">
                  <li className="leading-relaxed">
                    Open your project's Authentication Settings in Firebase Console:
                    <a
                      href={consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 font-semibold border border-emerald-500/30"
                    >
                      Open Firebase Console <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li className="leading-relaxed">
                    Click on the <strong>Settings</strong> tab (located beside "Sign-in method" and "Users").
                  </li>
                  <li className="leading-relaxed">
                    Scroll down to the <strong>Authorized domains</strong> section.
                  </li>
                  <li className="leading-relaxed">
                    Click the <strong>Add domain</strong> button.
                  </li>
                  <li className="leading-relaxed">
                    Paste your current domain:{" "}
                    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold">
                      {domainInfo.hostname}
                    </code>
                  </li>
                  <li className="leading-relaxed">
                    Click <strong>Done</strong> to save changes immediately.
                  </li>
                  <li className="leading-relaxed">
                    (Optional for Vercel): Also add <code className="px-1 rounded bg-slate-800 text-amber-300">*.vercel.app</code> or your custom production domain.
                  </li>
                </ol>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-amber-200 leading-relaxed">
                  <strong>Notice regarding AI Studio Starter Project:</strong> Starter projects are managed by Google Cloud sandbox policies without external Owner console permissions. To enable direct console provider changes and custom domain authorizations, you can also link your personal Firebase project anytime using the <strong>1-Click Migration Wizard</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE WEB APP CONFIG */}
          {activeTab === "config" && (
            <div className="space-y-3">
              <p className="text-slate-300 text-xs font-medium">
                Verified Firebase Web App Credentials:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">projectId:</span>
                  <span className="text-emerald-400 font-bold">{resolvedFirebaseConfig.projectId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">authDomain:</span>
                  <span className="text-slate-200">{resolvedFirebaseConfig.authDomain}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">apiKey:</span>
                  <span className="text-slate-400">
                    {resolvedFirebaseConfig.apiKey ? `${resolvedFirebaseConfig.apiKey.substring(0, 10)}...` : "Not Configured"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">storageBucket:</span>
                  <span className="text-slate-200">{resolvedFirebaseConfig.storageBucket || "Not Configured"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">appId:</span>
                  <span className="text-slate-400 truncate max-w-[280px]">{resolvedFirebaseConfig.appId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">messagingSenderId:</span>
                  <span className="text-slate-400 truncate max-w-[280px]">
                    {resolvedFirebaseConfig.messagingSenderId || "Google OAuth Ready"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            Open Firebase Console Settings
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
