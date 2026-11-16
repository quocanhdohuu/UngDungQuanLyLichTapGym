import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { PlanExercise, PreviousPerformance, WorkoutDetail, userApi } from "./user-api";

const CACHED_SESSION_KEY = "GYMPLAN_CACHED_WORKOUT_SESSION";
const SYNC_QUEUE_KEY = "GYMPLAN_WORKOUT_SYNC_QUEUE";
const ID_MAP_KEY = "GYMPLAN_WORKOUT_ID_MAP";
const PREVIOUS_PERF_KEY = "GYMPLAN_WORKOUT_PREVIOUS_PERF";

export type SyncActionType =
  | "ADD_SET"
  | "UPDATE_SET"
  | "DELETE_SET"
  | "ADD_EXERCISE"
  | "COMPLETE_EXERCISE"
  | "COMPLETE_SESSION"
  | "CANCEL_SESSION";

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastError: string | null;
}

type StatusListener = (status: OfflineStatus) => void;

class WorkoutOfflineService {
  private listeners: Set<StatusListener> = new Set();
  private isSyncing = false;
  private isOnline = true;
  private lastError: string | null = null;
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const state = await NetInfo.fetch();
      this.isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch {
      this.isOnline = true;
    }

    NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      const becameOnline = !this.isOnline && online;
      this.isOnline = online;
      this.notifyListeners();

      if (becameOnline) {
        void this.syncNow();
      }
    });
  }

  markOffline(reason?: string) {
    this.isOnline = false;
    if (reason) this.lastError = reason;
    this.notifyListeners();
  }

  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  // --- QUẢN LÝ SESSION CỤC BỘ ---

  async saveCachedSession(session: WorkoutDetail): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Lỗi lưu session vào AsyncStorage:", e);
    }
  }

  async getCachedSession(): Promise<WorkoutDetail | null> {
    try {
      const data = await AsyncStorage.getItem(CACHED_SESSION_KEY);
      return data ? (JSON.parse(data) as WorkoutDetail) : null;
    } catch {
      return null;
    }
  }

  async clearCachedSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHED_SESSION_KEY);
      await AsyncStorage.removeItem(ID_MAP_KEY);
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      this.notifyListeners();
    } catch (e) {
      console.warn("Lỗi xóa session cache:", e);
    }
  }

  // --- QUẢN LÝ BỘ NHỚ ĐỆM THÀNH TÍCH LẦN TẬP TRƯỚC (PREVIOUS PERFORMANCE) ---

  async getCachedPreviousPerformance(exerciseId: number): Promise<PreviousPerformance[] | null> {
    try {
      const data = await AsyncStorage.getItem(PREVIOUS_PERF_KEY);
      if (!data) return null;
      const map = JSON.parse(data) as Record<string, PreviousPerformance[]>;
      return map[String(exerciseId)] || null;
    } catch {
      return null;
    }
  }

  async saveCachedPreviousPerformance(exerciseId: number, data: PreviousPerformance[]): Promise<void> {
    try {
      const currentData = await AsyncStorage.getItem(PREVIOUS_PERF_KEY);
      const map: Record<string, PreviousPerformance[]> = currentData ? JSON.parse(currentData) : {};
      map[String(exerciseId)] = data;
      await AsyncStorage.setItem(PREVIOUS_PERF_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn("Lỗi lưu cached previous performance:", e);
    }
  }

  async preloadPrescriptionPrevious(prescription: PlanExercise[]): Promise<void> {
    if (!this.isOnline || !prescription?.length) return;
    try {
      const currentData = await AsyncStorage.getItem(PREVIOUS_PERF_KEY);
      const map: Record<string, PreviousPerformance[]> = currentData ? JSON.parse(currentData) : {};
      await Promise.all(
        prescription.map(async item => {
          try {
            const data = await userApi.getPreviousPerformance(item.exerciseId);
            if (data && Array.isArray(data) && data.length > 0) {
              map[String(item.exerciseId)] = data;
            }
          } catch {
            // bỏ qua nếu bài này chưa có lịch sử
          }
        })
      );
      await AsyncStorage.setItem(PREVIOUS_PERF_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn("Lỗi preload previous performance:", e);
    }
  }

  // --- QUẢN LÝ BẢNG MAP ID TẠM SANG ID THẬT ---

  private async getIdMap(): Promise<Record<string, number>> {
    try {
      const data = await AsyncStorage.getItem(ID_MAP_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async saveIdMap(map: Record<string, number>): Promise<void> {
    try {
      await AsyncStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn("Lỗi lưu IdMap:", e);
    }
  }

  // --- QUẢN LÝ SYNC QUEUE ---

  async getSyncQueue(): Promise<SyncAction[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? (JSON.parse(data) as SyncAction[]) : [];
    } catch {
      return [];
    }
  }

  private async saveSyncQueue(queue: SyncAction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.warn("Lỗi lưu SyncQueue:", e);
    }
  }

  async enqueueAction(type: SyncActionType, payload: any): Promise<SyncAction> {
    const action: SyncAction = {
      id: "act_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      type,
      payload,
      timestamp: Date.now(),
    };

    const queue = await this.getSyncQueue();

    // Nếu xóa một hiệp tạm chưa từng đồng bộ, xóa cả lệnh ADD_SET của nó
    if (type === "DELETE_SET" && (String(payload.setId).startsWith("temp_") || Number(payload.setId) < 0)) {
      const filtered = queue.filter(
        item => !(item.type === "ADD_SET" && String(item.payload.tempSetId) === String(payload.setId))
      );
      await this.saveSyncQueue(filtered);
      return action;
    }

    queue.push(action);
    await this.saveSyncQueue(queue);
    return action;
  }

  // --- ĐỒNG BỘ TUẦN TỰ LÊN BACKEND (AUTO-SYNC ENGINE) ---

  async syncNow(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, error: "Đang đồng bộ..." };
    }

    const queue = await this.getSyncQueue();
    if (queue.length === 0) {
      this.lastError = null;
      this.notifyListeners();
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notifyListeners();

    let syncedCount = 0;
    const idMap = await this.getIdMap();
    const remainingQueue = [...queue];

    const resolveId = (id: any): number => {
      if (id == null) return 0;
      const key = String(id);
      if (idMap[key] != null) return Number(idMap[key]);
      return Number(id);
    };

    try {
      while (remainingQueue.length > 0) {
        const item = remainingQueue[0];
        let ok = false;
        let isNetworkErr = false;

        try {
          switch (item.type) {
            case "ADD_EXERCISE": {
              const res = await userApi.addExerciseToSession(
                item.payload.sessionId,
                item.payload.exerciseId,
                item.payload.originalExerciseId ?? null
              );
              if (item.payload.tempPerfId && res?.performedExerciseId) {
                idMap[String(item.payload.tempPerfId)] = res.performedExerciseId;
                await this.saveIdMap(idMap);
              }
              ok = true;
              break;
            }

            case "ADD_SET": {
              let perfId = resolveId(item.payload.performedExerciseId);

              // Nếu perfId vẫn là ID tạm chưa có trên server, tạo exercise trước
              if (perfId <= 0 && item.payload.exerciseId) {
                const sess = await this.getCachedSession();
                if (sess) {
                  const added = await userApi.addExerciseToSession(
                    sess.workoutSessionId,
                    item.payload.exerciseId,
                    item.payload.originalExerciseId ?? null
                  );
                  if (added?.performedExerciseId) {
                    perfId = added.performedExerciseId;
                    idMap[String(item.payload.performedExerciseId)] = perfId;
                    await this.saveIdMap(idMap);
                  }
                }
              }

              if (perfId > 0) {
                const res = await userApi.addSet(
                  perfId,
                  item.payload.setNumber,
                  item.payload.weight,
                  item.payload.reps,
                  item.payload.preValue ?? null
                );
                if (item.payload.tempSetId && res?.setId) {
                  idMap[String(item.payload.tempSetId)] = res.setId;
                  await this.saveIdMap(idMap);
                }
              } else {
                throw new Error("Chưa xác định được ID bài tập để lưu hiệp.");
              }
              ok = true;
              break;
            }

            case "UPDATE_SET": {
              const setId = resolveId(item.payload.setId);
              if (setId > 0) {
                await userApi.updateSet(setId, item.payload.weight, item.payload.reps);
              }
              ok = true;
              break;
            }

            case "DELETE_SET": {
              const setId = resolveId(item.payload.setId);
              if (setId > 0) {
                await userApi.deleteSet(setId);
              }
              ok = true;
              break;
            }

            case "COMPLETE_EXERCISE": {
              const perfId = resolveId(item.payload.performedExerciseId);
              if (perfId > 0) {
                await userApi.completeExercise(perfId);
              }
              ok = true;
              break;
            }

            case "COMPLETE_SESSION": {
              await userApi.completeSession(item.payload.workoutSessionId);
              await this.clearCachedSession();
              ok = true;
              break;
            }

            case "CANCEL_SESSION": {
              await userApi.cancelSession(item.payload.workoutSessionId);
              await this.clearCachedSession();
              ok = true;
              break;
            }

            default:
              ok = true;
          }
        } catch (actionErr: any) {
          const msg = String(actionErr?.message || "");
          console.warn("Lỗi khi đồng bộ mục trong queue:", item.type, msg);
          this.lastError = msg || "Lỗi đồng bộ";

          // Phân biệt lỗi mất mạng với lỗi nghiệp vụ/dữ liệu
          isNetworkErr =
            msg.includes("kết nối") ||
            msg.includes("Network") ||
            msg.includes("Failed to fetch") ||
            msg.includes("AbortError") ||
            msg.includes("timeout") ||
            msg.includes("hết thời gian") ||
            msg.includes("502") ||
            msg.includes("503") ||
            msg.includes("504") ||
            actionErr?.name === "AbortError" ||
            actionErr?.name === "TypeError";

          if (isNetworkErr) {
            this.isOnline = false;
            // Dừng đồng bộ và giữ item lại để thử lại khi có mạng
            break;
          } else {
            // Nếu là lỗi nghiệp vụ (ví dụ set đã xóa trước hoặc ID không tồn tại),
            // bỏ qua item này để không gây nghẽn toàn bộ hàng đợi
            ok = true;
          }
        }

        if (ok) {
          remainingQueue.shift();
          syncedCount++;
          await this.saveSyncQueue(remainingQueue);
        } else {
          break;
        }
      }

      await this.saveIdMap(idMap);
      return {
        success: remainingQueue.length === 0,
        syncedCount,
        error: this.lastError || undefined,
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // --- TRẠNG THÁI & LISTENERS ---

  async getStatus(): Promise<OfflineStatus> {
    const queue = await this.getSyncQueue();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      lastError: this.lastError,
    };
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    void this.getStatus().then(status => listener(status));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    void this.getStatus().then(status => {
      for (const listener of this.listeners) {
        listener(status);
      }
    });
  }
}

export const workoutOffline = new WorkoutOfflineService();
