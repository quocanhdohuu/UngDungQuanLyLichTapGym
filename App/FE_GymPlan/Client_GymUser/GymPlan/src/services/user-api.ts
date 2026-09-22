import { getAuthSession, requireAuthSession, updateAuthProfile } from "@/auth-session";
import { apiRequest } from "./api";

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type Profile = {
  accountId: number; profileId: number; username: string; email: string;
  fullName: string; gender: "MALE" | "FEMALE" | "OTHER" | null;
  level: Level; goal: string | null; sessionsPerWeek: number | null;
  height: number | string | null; weight: number | string | null;
  bodyMetricUpdatedAt: string | null; accountStatus: string; profileStatus: string;
};
export type ProfileUpdate = Pick<Profile, "fullName" | "gender" | "level" | "goal" | "sessionsPerWeek"> & {
  height: number | null; weight: number | null;
};
export type PlanExercise = {
  configId: number; exerciseId: number; exerciseName: string;
  sets: number; reps: number; restTime: number; preview?: string | null;
  media?: { mediaUrl: string; mediaType: string }[];
};
export type WorkoutDay = { dayId: number; dayName: string; dayOrder: number; exercises: PlanExercise[] };
export type ActivePlan = {
  planId: number; title: string; description: string | null; level: Level;
  durationWeeks: number; currentWeek: number; totalDays: number;
  completedThisWeek: number; days: WorkoutDay[];
};
export type TodayWorkout = {
  planId: number; dayId: number; dayName: string; planTitle: string;
  totalExercises: number; totalSets: number; exercises: PlanExercise[];
};
export type ProgressSummary = { totalSessions: number; totalVolumeTon: number | string; currentStreak: number };
export type PersonalRecord = { exerciseId: number; exerciseName: string; maxWeight: number | string | null; latestWorkout: string | null };
export type Period = "ALL" | "WEEK" | "MONTH";
export type WorkoutHistory = {
  workoutSessionId: number; dayName: string | null; planTitle: string | null;
  startTime: string; endTime: string | null; totalDuration: number | null;
  totalExercises: number; totalVolume: number | string;
};
export type WorkoutDetail = {
  workoutSessionId: number;
  exercises: {
    performedExerciseId: number; exerciseName: string; sets: {
      setId: number; setNumber: number; weight: number | string | null; reps: number | null;
    }[]
  }[];
};
export type LibraryExercise = {
  exerciseId: number; name: string; description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD"; preview: string | null;
  primaryMuscles: string | null; secondaryMuscles: string | null; equipment: string | null;
};

const userPath = (path: string) => `/api/user/${requireAuthSession().profileId}/${path}`;
export const userApi = {
  profile: (signal?: AbortSignal) => apiRequest<Profile>(`/api/user/profile/${requireAuthSession().accountId}`, { signal }),
  updateProfile: async (data: ProfileUpdate) => {
    const session = requireAuthSession();
    const profile = await apiRequest<Profile>(`/api/user/profile/${session.profileId}`, { method: "PUT", body: JSON.stringify(data) });
    if (getAuthSession()?.loginSessionId === session.loginSessionId) updateAuthProfile(profile);
    return profile;
  },
  activePlan: (signal?: AbortSignal) => apiRequest<ActivePlan | null>(userPath("active-plan"), { signal }),
  todayWorkout: (signal?: AbortSignal) => apiRequest<TodayWorkout | null>(userPath("today-workout"), { signal }),
  progressSummary: (signal?: AbortSignal) => apiRequest<ProgressSummary | null>(userPath("progress-summary"), { signal }),
  personalRecords: (signal?: AbortSignal) => apiRequest<PersonalRecord[]>(userPath("personal-records"), { signal }),
  history: (period: Period, signal?: AbortSignal) => apiRequest<WorkoutHistory[]>(userPath(`workout-history?period=${period}`), { signal }),
  workoutDetail: (id: number, signal?: AbortSignal) => apiRequest<WorkoutDetail>(userPath(`workout-history/${id}`), { signal }),
  library: (signal?: AbortSignal) => apiRequest<LibraryExercise[]>("/api/exercises/summary", { signal }),
};

export const levelLabel = (level?: string) => ({ BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" })[level || ""] || "—";
export const formatNumber = (value: number | string | null | undefined) => value == null ? "—" : Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export const formatDate = (value: string | null | undefined) => value ? new Date(value).toLocaleString("vi-VN") : "—";
