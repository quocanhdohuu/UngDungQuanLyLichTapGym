const key = "gymplan.session.v1";
export async function readSession() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
}
export async function writeSession(value: string | null) {
  if (typeof window === "undefined") return;
  if (value == null) window.sessionStorage.removeItem(key);
  else window.sessionStorage.setItem(key, value);
}
