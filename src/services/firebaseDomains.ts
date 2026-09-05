/**
 * Firebase Authentication Authorized Domains Manager
 * Detects, validates, and manages authorized domains for Firebase Authentication.
 * Prevents and resolves "auth/unauthorized-domain" errors for Google Sign-In and OAuth workflows.
 */

import { resolvedFirebaseConfig } from "./firebase";

export interface DomainInfo {
  hostname: string;
  port: string;
  protocol: string;
  fullOrigin: string;
  isLocalhost: boolean;
  isCloudRunPreview: boolean;
  isVercel: boolean;
  isFirebaseDefault: boolean;
  isCustomDomain: boolean;
  environmentLabel: string;
}

export interface DomainAuthorizationStatus {
  currentDomain: string;
  projectId: string;
  authDomain: string;
  requiredDomains: string[];
  consoleUrl: string;
  isKnownDefaultDomain: boolean;
  autoAuthorizationAttempted: boolean;
  autoAuthorizationSuccess: boolean;
  instructions: {
    title: string;
    steps: string[];
    note: string;
  };
}

/**
 * Known default domains authorized by Firebase upon project creation
 */
export const DEFAULT_FIREBASE_AUTHORIZED_DOMAINS = [
  "localhost",
  "127.0.0.1",
];

/**
 * Inspect the current runtime environment domain
 */
export function getCurrentDomainInfo(): DomainInfo {
  if (typeof window === "undefined") {
    return {
      hostname: "localhost",
      port: "3000",
      protocol: "http:",
      fullOrigin: "http://localhost:3000",
      isLocalhost: true,
      isCloudRunPreview: false,
      isVercel: false,
      isFirebaseDefault: false,
      isCustomDomain: false,
      environmentLabel: "Server (SSR)",
    };
  }

  const hostname = window.location.hostname || "localhost";
  const port = window.location.port || "";
  const protocol = window.location.protocol || "http:";
  const fullOrigin = window.location.origin || `${protocol}//${hostname}${port ? `:${port}` : ""}`;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost");

  const isCloudRunPreview =
    hostname.includes(".run.app") ||
    hostname.startsWith("ais-dev-") ||
    hostname.startsWith("ais-pre-");

  const isVercel = hostname.includes(".vercel.app");

  const isFirebaseDefault =
    hostname.endsWith(".firebaseapp.com") ||
    hostname.endsWith(".web.app");

  const isCustomDomain = !isLocalhost && !isCloudRunPreview && !isVercel && !isFirebaseDefault;

  let environmentLabel = "Local Development";
  if (isCloudRunPreview) environmentLabel = "AI Studio Cloud Run Preview";
  else if (isVercel) environmentLabel = "Vercel Cloud Deployment";
  else if (isFirebaseDefault) environmentLabel = "Firebase Hosting";
  else if (isCustomDomain) environmentLabel = "Custom Production Domain";

  return {
    hostname,
    port,
    protocol,
    fullOrigin,
    isLocalhost,
    isCloudRunPreview,
    isVercel,
    isFirebaseDefault,
    isCustomDomain,
    environmentLabel,
  };
}

/**
 * Return all domains that must be authorized in Firebase Authentication
 */
export function getRequiredAuthorizedDomains(): string[] {
  const current = getCurrentDomainInfo();
  const projectId = resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1";

  const domains = new Set<string>([
    "localhost",
    "127.0.0.1",
    `${projectId}.firebaseapp.com`,
    `${projectId}.web.app`,
  ]);

  if (current.hostname) {
    domains.add(current.hostname);
  }

  // Add AI Studio Dev and Preview domains
  domains.add("ais-dev-oc4b4hbvcplakxj75vjnyr-613459494878.asia-east1.run.app");
  domains.add("ais-pre-oc4b4hbvcplakxj75vjnyr-613459494878.asia-east1.run.app");

  // Include Vercel pattern wildcard / example
  domains.add("*.vercel.app");

  return Array.from(domains);
}

/**
 * Construct the direct Firebase Console link to the Authorized Domains settings tab
 */
export function getFirebaseConsoleAuthorizedDomainsUrl(projectId?: string): string {
  const pid = projectId || resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1";
  return `https://console.firebase.google.com/project/${pid}/authentication/settings`;
}

/**
 * Check if an error is the Firebase auth/unauthorized-domain error
 */
export function isUnauthorizedDomainError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || error || "").toLowerCase();

  return (
    code === "auth/unauthorized-domain" ||
    code.includes("unauthorized-domain") ||
    message.includes("auth/unauthorized-domain") ||
    message.includes("unauthorized-domain") ||
    message.includes("unauthorized domain") ||
    message.includes("this domain is not authorized")
  );
}

/**
 * Check Domain Authorization status and query backend helper
 */
export async function checkDomainAuthorizationStatus(): Promise<DomainAuthorizationStatus> {
  const current = getCurrentDomainInfo();
  const projectId = resolvedFirebaseConfig.projectId || "emergent-horizon-ct3g1";
  const authDomain = resolvedFirebaseConfig.authDomain || `${projectId}.firebaseapp.com`;
  const consoleUrl = getFirebaseConsoleAuthorizedDomainsUrl(projectId);
  const requiredDomains = getRequiredAuthorizedDomains();

  const isKnownDefaultDomain =
    current.isLocalhost ||
    current.hostname === `${projectId}.firebaseapp.com` ||
    current.hostname === `${projectId}.web.app`;

  // Query server-side domain verification if available
  let autoAuthorizationSuccess = false;
  let autoAuthorizationAttempted = false;

  try {
    const res = await fetch("/api/firebase/authorized-domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentDomain: current.hostname,
        requiredDomains,
        projectId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      autoAuthorizationAttempted = true;
      autoAuthorizationSuccess = Boolean(data.autoAuthorized);
    }
  } catch {
    // If backend is restarting or unreachable, continue with client evaluation
  }

  return {
    currentDomain: current.hostname,
    projectId,
    authDomain,
    requiredDomains,
    consoleUrl,
    isKnownDefaultDomain,
    autoAuthorizationAttempted,
    autoAuthorizationSuccess,
    instructions: {
      title: "Firebase Console Domain Authorization Steps",
      steps: [
        `Navigate to the Firebase Console: Authentication > Settings > Authorized domains`,
        `Click the "Add domain" button in the Authorized domains table`,
        `Paste your current domain: "${current.hostname}"`,
        `Click "Done" / "Save" to apply immediately`,
        `For Vercel deployments, also add "*.vercel.app" or your custom production domain`,
      ],
      note: "Note: In Google Cloud managed sandbox starter projects, domain additions must be registered in the project console or managed via your personal Firebase project.",
    },
  };
}
