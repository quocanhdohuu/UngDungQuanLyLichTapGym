import { getAuthSession } from "@/auth-session";
import { Platform } from "react-native";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web" && typeof window !== "undefined"
    ? `http://${window.location.hostname}:3000`
    : "http://192.168.0.103:3000")
).replace(/\/$/, "");

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort);
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(getAuthSession()?.accessToken
          ? { Authorization: `Bearer ${getAuthSession()!.accessToken}` }
          : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        payload?.message || `Không thể tải dữ liệu (${response.status}).`,
      );
    // Existing exercise endpoints return a bare array; user endpoints use { data }.
    if (Array.isArray(payload)) return payload as T;
    if (!payload || !("data" in payload))
      throw new Error("Phản hồi API không hợp lệ.");
    return payload.data as T;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name !== "AbortError" &&
      error.message !== "Failed to fetch"
    )
      throw error;
    throw new Error(
      "Không kết nối được máy chủ hoặc yêu cầu đã hết thời gian. Vui lòng thử lại.",
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
