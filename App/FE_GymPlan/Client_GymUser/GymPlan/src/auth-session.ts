import { useSyncExternalStore } from "react";
import { readSession, writeSession } from "./session-storage";

export type AuthSession = {
  accountId: number;
  profileId: number;
  loginSessionId: number;
  accessToken: string;
  username?: string;
  email?: string;
  fullName?: string;
  gender?: string | null;
  level?: string;
  goal?: string | null;
  sessionsPerWeek?: number | null;
};

let currentSession: AuthSession | null = null;
let revision = 0;
let rememberSession = true;
let writes = Promise.resolve();
let restoring: Promise<void> | null = null;
const persist = (session: AuthSession | null) => {
  const value = session ? JSON.stringify({ accountId: session.accountId, profileId: session.profileId,
    loginSessionId: session.loginSessionId, accessToken: session.accessToken, fullName: session.fullName }) : null;
  // Keep logout deletion ordered after any pending login/profile writes.
  writes = writes.then(() => writeSession(value)).catch(() => {
    // Storage may be unavailable; the in-memory session remains usable.
  });
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function setAuthSession(session: AuthSession, remember = rememberSession) {
  revision++;
  rememberSession = remember;
  currentSession = session;
  persist(remember ? session : null);
  listeners.forEach((listener) => listener());
}

export function getAuthSession() {
  return currentSession;
}

export function clearAuthSession() {
  revision++;
  currentSession = null;
  persist(null);
  listeners.forEach((listener) => listener());
}

export function restoreAuthSession() {
  if (restoring) return restoring;
  const initialRevision = revision;
  restoring = (async () => {
    try {
      const raw = await readSession();
      const saved = raw ? JSON.parse(raw) : null;
      if (revision !== initialRevision || !saved) return;
      if (![saved.accountId, saved.profileId, saved.loginSessionId].every(value => Number.isSafeInteger(value) && value > 0)
        || typeof saved.accessToken !== "string" || !saved.accessToken) {
        persist(null); return;
      }
      currentSession = saved;
      listeners.forEach(listener => listener());
    } catch { if (revision === initialRevision) persist(null); }
  })();
  return restoring;
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, getAuthSession, () => null);
}

export function requireAuthSession() {
  if (!currentSession) throw new Error("Vui lòng đăng nhập để xem dữ liệu.");
  return currentSession;
}

export function updateAuthProfile(profile: Partial<AuthSession>) {
  if (currentSession) setAuthSession({ ...currentSession, ...profile });
}

export function initials(name?: string) {
  return name?.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "—";
}
