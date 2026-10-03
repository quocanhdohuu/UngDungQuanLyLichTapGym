import {
  getAuthSession,
  requireAuthSession,
  updateAuthProfile,
} from "@/auth-session";
import { apiRequest } from "./api";

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type Profile = {
  accountId: number;
  profileId: number;
  username: string;
  email: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  level: Level;
  goal: string | null;
  sessionsPerWeek: number | null;
  height: number | string | null;
  weight: number | string | null;
  bodyMetricUpdatedAt: string | null;
  accountStatus: string;
  profileStatus: string;
};
export type ProfileUpdate = Pick<
  Profile,
  "fullName" | "gender" | "level" | "goal" | "sessionsPerWeek"
> & {
  height: number | null;
  weight: number | null;
};
export type PlanExercise = {
  configId: number;
  exerciseId: number;
  exerciseName: string;
  sets: number;
  reps: number;
  restTime: number;
  primaryMuscles?: string | null;
  equipment?: string | null;
  preview?: string | null;
  media?: { mediaUrl: string; mediaType: string }[];
};
export type WorkoutDay = {
  dayId: number;
  dayName: string;
  dayOrder: number;
  weekDay?: number | null;
  exercises: PlanExercise[];
};
export type ActivePlan = {
  planId: number;
  title: string;
  description: string | null;
  level: Level;
  durationWeeks: number;
  currentWeek: number;
  totalDays: number;
  completedThisWeek: number;
  status: "ACTIVE";
  startedAt: string | null;
  days: WorkoutDay[];
};
export type TodayWorkout = {
  planId: number;
  dayId: number;
  dayName: string;
  planTitle: string;
  totalExercises: number;
  totalSets: number;
  exercises: PlanExercise[];
};
export type ProgressSummary = {
  totalSessions: number;
  totalVolumeTon: number | string;
  currentStreak: number;
};
export type PersonalRecord = {
  exerciseId: number;
  exerciseName: string;
  maxWeight: number | string | null;
  latestWorkout: string | null;
  achievedAt?: string | null;
};
export type Period = "ALL" | "WEEK" | "MONTH";
export type WorkoutHistory = {
  workoutSessionId: number;
  dayName: string | null;
  planTitle: string | null;
  startTime: string;
  endTime: string | null;
  totalDuration: number | null;
  totalExercises: number;
  totalVolume: number | string;
};
export type ExerciseAlternative = {
  exerciseId: number;
  name: string;
  alternativeId: number;
  originalExerciseId: number;
  alternativeExerciseId: number;
  exerciseName: string;
  description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  preview: string | null;
  secondaryMuscles: string | null;
  primaryMuscles: string | null;
  equipment: string | null;
  priority: number;
  note: string | null;
};
export type WorkoutDetail = {
  workoutSessionId: number;
  dayId: number | null;
  dayName: string | null;
  planTitle: string | null;
  startTime: string;
  endTime: string | null;
  totalDuration: number | null;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  prescription: PlanExercise[];
  exercises: {
    performedExerciseId: number;
    exerciseId: number;
    originalExerciseId?: number | null;
    isSubstituted?: boolean;
    isActive?: boolean;
    description?: string | null;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
    preview?: string | null;
    exerciseName: string;
    originalExerciseName?: string | null;
    primaryMuscles?: string | null;
    equipment?: string | null;
    isCompleted: boolean;
    sets: {
      setId: number;
      setNumber: number;
      weight: number | string | null;
      reps: number | null;
    }[];
  }[];
};
export type ExerciseSet = WorkoutDetail["exercises"][number]["sets"][number];
export type WorkoutSession = Omit<WorkoutDetail, "exercises" | "prescription">;
export type PerformedExercise = WorkoutDetail["exercises"][number];
export type PreviousPerformance = Pick<
  ExerciseSet,
  "setNumber" | "weight" | "reps"
>;
export type Template = Pick<
  ActivePlan,
  "planId" | "title" | "description" | "level" | "durationWeeks" | "totalDays"
>;
export type TemplateDetail = Template & {
  days: WorkoutDay[];
  isTemplate: boolean;
  creatorId: number;
};
export type CustomPlan = {
  title: string;
  description: string;
  level: Level;
  durationWeeks: number;
  days: {
    dayName: string;
    weekDay: number;
    exercises: {
      exerciseId: number;
      sets: number;
      reps: number;
      restTime: number;
    }[];
  }[];
};
export type BodyMetricItem = {
  metricId: number;
  profileId?: number;
  height: number | string;
  weight: number | string;
  recordedAt: string;
  level?: Level | null;
  goal?: string | null;
  sessionsPerWeek?: number | null;
};
export type LibraryExercise = {
  guide?: {
    steps: string[];
    mistakes: string[];
    source?: { title: string; url: string };
  } | null;
  exerciseId: number;
  name: string;
  description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  preview: string | null;
  primaryMuscles: string | null;
  secondaryMuscles: string | null;
  equipment: string | null;
  media?: { mediaUrl: string; mediaType: string }[];
};

const userPath = (path: string) =>
  `/api/user/${requireAuthSession().profileId}/${path}`;
const write = <T>(path: string, method: string, body = {}) =>
  apiRequest<T>(userPath(path), { method, body: JSON.stringify(body) });
export const userApi = {
  getTemplates: (signal?: AbortSignal) =>
    apiRequest<Template[]>("/workoutplans/templates", { signal }),
  getTemplateDetail: (id: number, signal?: AbortSignal) =>
    apiRequest<TemplateDetail>(`/workoutplans/${id}/detail`, {
      signal,
      rawResponse: true,
    }),
  exerciseDetail: (id: number, signal?: AbortSignal) =>
    apiRequest<LibraryExercise>(`/api/exercises/${id}`, {
      signal,
      rawResponse: true,
    }),
  applyPlan: (planId: number) => write("apply-plan", "POST", { planId }),
  createCustomPlan: (plan: CustomPlan) =>
    write<{ planId: number }>("plans", "POST", plan),
  activeSession: (signal?: AbortSignal) =>
    apiRequest<WorkoutDetail | null>(userPath("active-session"), { signal }),
  startSession: (dayId?: number) =>
    write<WorkoutSession>("workout-sessions", "POST", { dayId }),
  addExerciseToSession: (
    id: number,
    exerciseId: number,
    originalExerciseId?: number | null,
  ) =>
    write<{
      performedExerciseId: number;
      exerciseId: number;
      originalExerciseId?: number | null;
      isSubstituted?: boolean;
    }>(`workout-sessions/${id}/exercises`, "POST", {
      exerciseId,
      originalExerciseId: originalExerciseId ?? null,
    }),
  addSet: (
    id: number,
    setNumber: number,
    weight: number,
    reps: number,
    preValue: number | null,
  ) =>
    write<ExerciseSet>(`performed-exercises/${id}/sets`, "POST", {
      setNumber,
      weight,
      reps,
      preValue,
    }),
  updateSet: (id: number, weight: number, reps: number) =>
    write<ExerciseSet>(`exercise-sets/${id}`, "PUT", { weight, reps }),
  deleteSet: (id: number) => write(`exercise-sets/${id}`, "DELETE"),
  completeExercise: (id: number) =>
    write(`performed-exercises/${id}/complete`, "PUT"),
  completeSession: (id: number) =>
    write(`workout-sessions/${id}/complete`, "PUT"),
  cancelSession: (id: number) => write(`workout-sessions/${id}/cancel`, "PUT"),
  getPreviousPerformance: (id: number, signal?: AbortSignal) =>
    apiRequest<PreviousPerformance[]>(
      userPath(`exercises/${id}/previous-performance`),
      { signal },
    ),
  getAlternatives: (exerciseId: number, signal?: AbortSignal) =>
    apiRequest<ExerciseAlternative[]>(
      userPath(`exercises/${exerciseId}/alternatives`),
      { signal },
    ),
  bodyMetrics: (signal?: AbortSignal) =>
    apiRequest<BodyMetricItem[]>(userPath("body-metrics"), { signal }),
  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) =>
    apiRequest(
      `/api/user/profile/${requireAuthSession().accountId}/change-password`,
      {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      },
    ),
  profile: async (signal?: AbortSignal) => {
    const session = requireAuthSession();
    const profile = await apiRequest<Profile>(
      `/api/user/profile/${session.accountId}`,
      { signal },
    );
    if (
      !signal?.aborted &&
      getAuthSession()?.loginSessionId === session.loginSessionId
    )
      updateAuthProfile(profile);
    return profile;
  },
  updateProfile: async (data: ProfileUpdate) => {
    const session = requireAuthSession();
    const profile = await apiRequest<Profile>(
      `/api/user/profile/${session.profileId}`,
      { method: "PUT", body: JSON.stringify(data) },
    );
    if (getAuthSession()?.loginSessionId === session.loginSessionId)
      updateAuthProfile(profile);
    return profile;
  },
  activePlan: (signal?: AbortSignal) =>
    apiRequest<ActivePlan | null>(userPath("active-plan"), { signal }),
  todayWorkout: (signal?: AbortSignal) =>
    apiRequest<TodayWorkout | null>(userPath("today-workout"), { signal }),
  progressSummary: (signal?: AbortSignal) =>
    apiRequest<ProgressSummary | null>(userPath("progress-summary"), {
      signal,
    }),
  personalRecords: (signal?: AbortSignal) =>
    apiRequest<PersonalRecord[]>(userPath("personal-records"), { signal }),
  history: (period: Period, signal?: AbortSignal) =>
    apiRequest<WorkoutHistory[]>(userPath(`workout-history?period=${period}`), {
      signal,
    }),
  workoutDetail: (id: number, signal?: AbortSignal) =>
    apiRequest<WorkoutDetail>(userPath(`workout-history/${id}`), { signal }),
  library: (signal?: AbortSignal) =>
    apiRequest<LibraryExercise[]>("/api/exercises/summary", { signal }),
};

export const levelLabel = (level?: string) =>
  ({
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  })[level || ""] || "—";
export const formatNumber = (value: number | string | null | undefined) =>
  value == null
    ? "—"
    : Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
