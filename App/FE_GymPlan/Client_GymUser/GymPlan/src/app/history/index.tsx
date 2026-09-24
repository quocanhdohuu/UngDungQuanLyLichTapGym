import { DataState } from "@/components/common/data-state";
import { Button, Page, ui } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { Period, formatDate, formatNumber, userApi } from "@/services/user-api";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function HistoryScreen() {
  const [period, setPeriod] = useState<Period>("ALL");
  const state = useApiData(signal => userApi.history(period, signal), period);
  return <Page title="Lịch sử tập luyện">
    <View style={ui.row}>{([["ALL", "Tất cả"], ["WEEK", "Tuần này"], ["MONTH", "Tháng này"]] as const).map(([value, label]) =>
      <Button key={value} title={label} secondary={period !== value} onPress={() => setPeriod(value)} />)}</View>
    <DataState {...state} retry={state.refresh} empty={!state.data?.length && "Chưa có buổi tập hoàn thành trong khoảng thời gian này"} />
    {state.data?.map(session => <View key={session.workoutSessionId} style={ui.card}>
      <Text style={ui.accent}>✓ HOÀN THÀNH • {formatDate(session.startTime)}</Text>
      <Text style={ui.heading}>{session.dayName || "Buổi tập"}</Text><Text style={ui.muted}>{session.planTitle}</Text>
      <Text style={ui.text}>{session.totalDuration ?? 0} phút • {session.totalExercises} bài • {formatNumber(Number(session.totalVolume) / 1000)} tấn</Text>
      <Button secondary title="Xem từng hiệp →" onPress={() => router.push({ pathname: "/history/[id]", params: { id: session.workoutSessionId } })} />
    </View>)}
  </Page>;
}
