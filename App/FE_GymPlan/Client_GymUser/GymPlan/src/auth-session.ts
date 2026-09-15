export type AuthSession = {
  accountId: number;
  loginSessionId: number;
};

let currentSession: AuthSession | null = null;

export function setAuthSession(session: AuthSession) {
  currentSession = session;
}

export function getAuthSession() {
  return currentSession;
}

export function clearAuthSession() {
  currentSession = null;
}
