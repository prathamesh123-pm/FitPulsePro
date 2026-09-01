import { AuditLogEntry, AuditActionType, AuditModule, UserRole } from "../types";

export function getDeviceInfo(): { device: string; browser: string } {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (ua.indexOf("Firefox") > -1) {
    browser = "Mozilla Firefox";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browser = "Samsung Internet";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browser = "Opera";
  } else if (ua.indexOf("Trident") > -1) {
    browser = "Internet Explorer";
  } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
    browser = "Microsoft Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Google Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Apple Safari";
  }

  let device = "Desktop Workstation";
  if (/Android/i.test(ua)) {
    device = "Android Device";
  } else if (/iPhone/i.test(ua)) {
    device = "Apple iPhone";
  } else if (/iPad/i.test(ua)) {
    device = "Apple iPad";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = "MacBook / iMac (macOS)";
  } else if (/Windows/i.test(ua)) {
    device = "Windows PC";
  } else if (/Linux/i.test(ua)) {
    device = "Linux Machine";
  }

  return { device, browser };
}

export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        // Fallback default coordinates if user declines GPS prompt
        resolve({
          latitude: 18.5204,
          longitude: 73.8567,
          accuracy: 25,
        });
      },
      { timeout: 3000, maximumAge: 60000 }
    );
  });
}

export async function createAuditEntry(
  userId: string,
  userName: string,
  userRole: UserRole,
  action: AuditActionType,
  module: AuditModule,
  description: string,
  details?: Record<string, any>
): Promise<AuditLogEntry> {
  const { device } = getDeviceInfo();
  const gps = await getCurrentCoordinates();

  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    module,
    description,
    device,
    ipAddress: "192.168.1.45 (Encrypted)",
    gpsLocation: gps
      ? {
          latitude: gps.latitude,
          longitude: gps.longitude,
          address: "FitPulse HQ / Mobile Node",
          accuracy: gps.accuracy,
        }
      : undefined,
    details,
    status: action === "Approved" ? "Approved" : action === "Rejected" ? "Rejected" : "Completed",
  };

  return entry;
}
