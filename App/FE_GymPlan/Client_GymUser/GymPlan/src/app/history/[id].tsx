import { DataState } from "@/components/common/data-state";
import { Button, Page, ui } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { formatDate, formatNumber, userApi } from "@/services/user-api";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function WorkoutHistoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApiData(signal => userApi.workoutDetail(Number(id), signal), id);
  const session = state.data;
  const volume = session?.exercises.reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0), 0) || 0;
  return <Page title={session?.dayName || "Chi tiết buổi tập"}>
    <DataState {...state} retry={state.refresh} />
    {session && <>
      <Text style={ui.accent}>{{ COMPLETED: "✓ Hoàn thành", IN_PROGRESS: "Đang tập", CANCELLED: "Đã hủy" }[session.status]}</Text>
      <Text style={ui.text}>{session.planTitle}</Text><Text style={ui.muted}>{formatDate(session.startTime)}</Text>
      <View style={ui.card}><Text style={ui.heading}>{formatNumber(volume / 1000)} tấn • {session.totalDuration ?? 0} phút</Text><Text style={ui.muted}>{session.exercises.length} bài tập</Text></View>
      {session.exercises.map(exercise => <View style={ui.card} key={exercise.performedExerciseId}>
        <Text style={ui.heading}>{exercise.exerciseName}</Text>
        {exercise.isSubstituted && exercise.originalExerciseName && <Text style={ui.accent}>Thay thế cho: {exercise.originalExerciseName}</Text>}
        {exercise.sets.map(set => <View style={ui.row} key={set.setId}>
          <Text style={ui.muted}>Hiệp {set.setNumber}</Text><Text style={ui.text}>{formatNumber(set.weight)} kg × {set.reps ?? "—"} lần</Text>
        </View>)}
        {!exercise.sets.length && <Text style={ui.muted}>Chưa lưu hiệp tập</Text>}
      </View>)}
      {session.status === "IN_PROGRESS" && <Button title="Tiếp tục tập" onPress={() => router.replace({ pathname: "/workout", params: { sessionId: session.workoutSessionId } })} />}
      <Button title="Xem tiến trình" onPress={() => router.replace("/progress")} />
    </>}
  </Page>;
}
