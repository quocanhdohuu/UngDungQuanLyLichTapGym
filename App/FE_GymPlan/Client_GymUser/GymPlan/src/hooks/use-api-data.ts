import { useAuthSession } from "@/auth-session";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

// Each focus/filter change cancels older requests, including results from another login.
export function useApiData<T>(loader: (signal: AbortSignal) => Promise<T>, key = "", keepData = false) {
  const session = useAuthSession();
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const request = useRef<AbortController | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    if (!keepData) setData(null);
    try {
      const result = await loaderRef.current(controller.signal);
      if (!controller.signal.aborted) setData(result);
      return controller.signal.aborted ? null : result;
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Không thể tải dữ liệu.");
      return null;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [key, session?.loginSessionId, keepData]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return () => request.current?.abort();
  }, [refresh]));
  return { data, loading, error, refresh };
}
