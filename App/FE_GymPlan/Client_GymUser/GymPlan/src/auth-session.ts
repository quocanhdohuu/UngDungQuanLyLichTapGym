import { useSyncExternalStore } from "react";

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
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function setAuthSession(session: AuthSession) {
  currentSession = session;
  listeners.forEach((listener) => listener());
}

export function getAuthSession() {
  return currentSession;
}

export function clearAuthSession() {
  currentSession = null;
  listeners.forEach((listener) => listener());
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
