import { DataState } from "@/components/common/data-state";
import { Button, Confirm, Page, ui, useAction } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { levelLabel, userApi } from "@/services/user-api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApiData(signal => userApi.getTemplateDetail(Number(id), signal), id);
  const plan = state.data;
  const action = useAction();
  const [confirm, setConfirm] = useState(false);
  return <Page title={plan?.title || "Chi tiết lịch tập"}>
    <DataState {...state} retry={state.refresh} />
    {plan && <>
      <Text style={ui.accent}>{levelLabel(plan.level)} • {plan.durationWeeks} tuần • {plan.days.length} ngày tập</Text>
      <Text style={ui.text}>{plan.description || "Chưa có mô tả"}</Text>
      {plan.days.map(day => <View style={ui.card} key={day.dayId}>
        <Text style={ui.heading}>{day.dayName}</Text>
        <Text style={ui.muted}>{day.weekDay ? day.weekDay === 7 ? "Chủ nhật" : "Thứ " + (day.weekDay + 1) : "Chưa xếp thứ"} • {day.exercises.length} bài tập</Text>
        {day.exercises.map(exercise => <Pressable key={exercise.configId} onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: exercise.exerciseId } })}>
          <Text style={ui.text}>{exercise.exerciseName} ›</Text>
          <Text style={ui.muted}>{exercise.sets} hiệp × {exercise.reps} lần • Nghỉ {exercise.restTime}s</Text>
        </Pressable>)}
        {!day.exercises.length && <Text style={ui.muted}>Chưa có bài tập</Text>}
      </View>)}
      <Button title="SỬ DỤNG LỊCH NÀY" disabled={!plan.days.some(day => day.exercises.length)} onPress={() => { action.setError(null); setConfirm(true); }} />
      <Confirm visible={confirm} title="Áp dụng lịch mẫu?" confirmLabel="✓ Áp dụng lịch tập này"
        message="Lịch mẫu sẽ thay thế lịch đang áp dụng. Tiến trình và lịch sử tập luyện trước đây được giữ lại."
        details={<View style={[ui.card, { backgroundColor: "#252D28", borderRadius: 10 }]}><Text style={ui.heading}>{plan.title}</Text><Text style={ui.accent}>{levelLabel(plan.level)} • {plan.days.length} ngày / tuần • {plan.durationWeeks} tuần</Text></View>}
        busy={action.busy} error={action.error} onClose={() => setConfirm(false)} onConfirm={() => action.run(async () => {
          await userApi.applyPlan(plan.planId); setConfirm(false); router.replace("/plans");
        })} />
    </>}
  </Page>;
}
