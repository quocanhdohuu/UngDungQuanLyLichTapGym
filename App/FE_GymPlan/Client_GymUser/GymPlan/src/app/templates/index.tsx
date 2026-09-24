import { DataState } from "@/components/common/data-state";
import { Button, Page, ui } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { Level, levelLabel, userApi } from "@/services/user-api";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function TemplatesScreen() {
  const state = useApiData(userApi.getTemplates);
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const plans = state.data?.filter(plan => level === "ALL" || plan.level === level) || [];
  return <Page title="Lịch tập mẫu">
    <Text style={ui.muted}>Chọn chương trình phù hợp và xem cấu trúc từng ngày trước khi áp dụng.</Text>
    <View style={ui.row}>{(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(value =>
      <Button key={value} title={value === "ALL" ? "Tất cả" : levelLabel(value)} secondary={level !== value} onPress={() => setLevel(value)} />)}</View>
    <DataState {...state} retry={state.refresh} empty={!plans.length && "Chưa có lịch mẫu phù hợp"} />
    {plans.map(plan => <View key={plan.planId} style={ui.card}>
      <Text style={ui.accent}>{levelLabel(plan.level)} • {plan.durationWeeks} tuần</Text>
      <Text style={ui.heading}>{plan.title}</Text><Text style={ui.text}>{plan.description || "Chưa có mô tả"}</Text>
      <Text style={ui.muted}>{plan.totalDays} ngày tập / tuần</Text>
      <Button title="Xem chi tiết →" onPress={() => router.push({ pathname: "/templates/[id]", params: { id: plan.planId } })} />
    </View>)}
  </Page>;
}
