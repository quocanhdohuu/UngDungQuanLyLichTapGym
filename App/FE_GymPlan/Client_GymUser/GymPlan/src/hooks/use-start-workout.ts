import { router } from "expo-router";
import { useAction } from "@/components/common/flow-ui";
import { userApi } from "@/services/user-api";

export function useStartWorkout() {
  const action = useAction();
  return { ...action, start: (dayId?: number) => action.run(async () => {
    const session = await userApi.startSession(dayId);
    router.push({ pathname: "/workout", params: { sessionId: session.workoutSessionId } });
  }) };
}
