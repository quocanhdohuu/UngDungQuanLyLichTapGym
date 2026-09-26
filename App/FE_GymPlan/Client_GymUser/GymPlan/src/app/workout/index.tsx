import { DataState } from "@/components/common/data-state";
import { Button, Confirm, Page, ui, useAction } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { ExerciseSet, PlanExercise, PreviousPerformance, WorkoutDetail, formatNumber, userApi } from "@/services/user-api";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const timeLabel = (seconds: number) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
function SetRow({ number, saved, previous, target, busy, onSave, onDelete }: {
  number: number; saved?: ExerciseSet; previous?: PreviousPerformance; target: number; busy: boolean;
  onSave: (weight: number, reps: number) => void; onDelete: () => void;
}) {
  const [weight, setWeight] = useState(String(saved?.weight ?? previous?.weight ?? ""));
  const [reps, setReps] = useState(String(saved?.reps ?? target));
  useEffect(() => {
    if (saved) { setWeight(String(saved.weight ?? "")); setReps(String(saved.reps ?? target)); }
  }, [saved?.setId, saved?.weight, saved?.reps, target]);
  const kg = Number(weight.replace(",", "."));
  const count = Number(reps);
  const valid = !!weight.trim() && Number.isFinite(kg) && kg >= 0 && kg <= 9999.99 && !!reps.trim() && Number.isInteger(count) && count > 0 && count <= 10000;
  const unchanged = !!saved && kg === Number(saved.weight) && count === Number(saved.reps);
  return <View style={workoutStyle.set}>
    <View style={workoutStyle.columns}>
      <Text accessibilityLabel={"Hiệp " + number} style={[ui.accent, { width: 30, textAlign: "center" }]}>{number}</Text>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={ui.text}>{target} lần</Text>
        <Text style={workoutStyle.previous}>{previous ? formatNumber(previous.weight) + " × " + previous.reps : "Chưa có PREV"}</Text>
      </View>
      <TextInput style={workoutStyle.input} accessibilityLabel={"Khối lượng hiệp " + number + " (kg)"} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" editable={!busy} placeholder="kg" placeholderTextColor="#ABB5AA" />
      <TextInput style={workoutStyle.input} accessibilityLabel={"Số lần hiệp " + number} value={reps} onChangeText={setReps} keyboardType="number-pad" editable={!busy} />
      <Pressable accessibilityRole="button" accessibilityLabel={unchanged ? "✓ Đã lưu" : saved ? "Lưu thay đổi" : "Xác nhận hiệp"}
        disabled={busy || !valid || unchanged} accessibilityState={{ disabled: busy || !valid || unchanged }} onPress={() => onSave(kg, count)}
        style={[workoutStyle.tick, unchanged && { backgroundColor: "#8CFF2E" }, (busy || !valid) && { opacity: 0.4 }]}>
        <Text style={{ color: unchanged ? "#10200C" : "#8CFF2E", fontSize: 20 }}>✓</Text>
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={"Xóa hiệp " + number} disabled={busy} onPress={onDelete} style={{ alignSelf: "flex-end", minHeight: 32, justifyContent: "center" }}><Text style={workoutStyle.previous}>Xóa hiệp</Text></Pressable>
  </View>;
}

function ExercisePanel({ exercise, session, busy, error, run, reload, startRest }: {
  exercise: PlanExercise; session: WorkoutDetail; busy: boolean;
  error: string | null;
  run: (action: () => Promise<unknown>) => Promise<void>;
  reload: () => Promise<unknown>; startRest: (seconds: number) => void;
}) {
  const performed = session.exercises.find(item => item.exerciseId === exercise.exerciseId);
  const previous = useApiData(signal => userApi.getPreviousPerformance(exercise.exerciseId, signal), String(exercise.exerciseId));
  const [numbers, setNumbers] = useState(() => Array.from(new Set([
    ...Array.from({ length: exercise.sets }, (_, index) => index + 1), ...(performed?.sets.map(set => set.setNumber) || []),
  ])).sort((a, b) => a - b));
  const [removed, setRemoved] = useState<number | null>(null);
  const save = (number: number, weight: number, reps: number) => run(async () => {
    const saved = performed?.sets.find(set => set.setNumber === number);
    if (saved) await userApi.updateSet(saved.setId, weight, reps);
    else {
      const id = performed?.performedExerciseId ?? (await userApi.addExerciseToSession(session.workoutSessionId, exercise.exerciseId)).performedExerciseId;
      const prior = previous.data?.find(set => set.setNumber === number);
      await userApi.addSet(id, number, weight, reps, prior?.weight == null ? null : Number(prior.weight));
    }
    startRest(exercise.restTime);
    await reload();
  });
  const deleteSet = (number: number) => run(async () => {
    const saved = performed?.sets.find(set => set.setNumber === number);
    if (saved) await userApi.deleteSet(saved.setId);
    setNumbers(current => current.filter(value => value !== number));
    setRemoved(null);
    await reload();
  });
  return <View style={{ gap: 12 }}>
    <View style={ui.card}>
      <Text style={ui.heading}>{exercise.exerciseName}</Text>
      <Text style={ui.text}>Nhóm cơ: {exercise.primaryMuscles || "Chưa cập nhật"}</Text>
      <Text style={ui.text}>Dụng cụ: {exercise.equipment || "Chưa cập nhật"}</Text>
      <Text style={ui.muted}>Mục tiêu RPE: Chưa thiết lập</Text>
      <Text style={ui.muted}>{exercise.sets} hiệp × {exercise.reps} lần • Nghỉ {exercise.restTime}s</Text>
      <Button title="Xem hướng dẫn động tác" secondary disabled={busy} onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: exercise.exerciseId } })} />
      {performed?.isCompleted && <Text style={ui.accent}>✓ Đã hoàn thành bài</Text>}
    </View>
    <DataState {...previous} retry={previous.refresh} />
    <View style={workoutStyle.columns}>
      <Text style={[workoutStyle.label, { width: 30 }]}>HIỆP</Text><Text style={[workoutStyle.label, { flex: 1 }]}>MỤC TIÊU / PREV</Text>
      <Text style={[workoutStyle.label, { width: 56 }]}>KG</Text><Text style={[workoutStyle.label, { width: 56 }]}>REPS</Text><Text style={[workoutStyle.label, { width: 40 }]}>LƯU</Text>
    </View>
    {!previous.loading && numbers.map(number => <SetRow key={number} number={number}
      saved={performed?.sets.find(set => set.setNumber === number)} previous={previous.data?.find(set => set.setNumber === number)}
      target={exercise.reps} busy={busy} onSave={(weight, reps) => save(number, weight, reps)} onDelete={() => setRemoved(number)} />)}
    <Button title="+ Thêm hiệp" secondary disabled={busy || numbers.length >= 100} onPress={() => setNumbers(current => [...current, Math.max(0, ...current) + 1])} />
    <Button title={performed?.isCompleted ? "✓ Bài tập hoàn thành" : "Hoàn thành bài tập"} disabled={busy || !performed?.sets.length || !!performed?.isCompleted}
      onPress={() => run(async () => { if (performed) await userApi.completeExercise(performed.performedExerciseId); await reload(); })} />
    <Confirm visible={removed != null} title="Xóa hiệp tập?" message="Hiệp này sẽ được xóa khỏi buổi tập."
      busy={busy} error={error} onClose={() => setRemoved(null)} onConfirm={() => { if (removed != null) void deleteSet(removed); }} />
  </View>;
}

export default function WorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const state = useApiData(signal => sessionId ? userApi.workoutDetail(Number(sessionId), signal) : userApi.activeSession(signal), sessionId || "active", true);
  const action = useAction();
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [restUntil, setRestUntil] = useState(0);
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const session = state.data;
  const prescription = session?.prescription || [];
  const exercise = prescription[Math.min(index, Math.max(0, prescription.length - 1))];
  const elapsed = session ? Math.max(0, Math.floor((now - new Date(session.startTime).getTime()) / 1000)) : 0;
  const rest = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const volume = session?.exercises.reduce((total, item) => total + item.sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0), 0) || 0;
  const hasSets = session?.exercises.some(item => item.sets.length);
  const busy = action.busy || state.loading;
  return <Page title={session?.dayName || "Buổi tập"} footer={rest > 0 && session?.status === "IN_PROGRESS" ?
    <View style={[ui.card, { margin: 12 }]}><Text style={ui.heading}>Thời gian nghỉ {timeLabel(rest)}</Text>
      <View style={ui.row}><Button title="+30s" secondary onPress={() => setRestUntil(value => Math.max(Date.now(), value) + 30000)} /><Button title="Bỏ qua" secondary onPress={() => setRestUntil(0)} /></View>
    </View> : undefined}>
    <DataState {...state} retry={state.refresh} empty={!session && "Chưa có buổi tập đang diễn ra"} />
    {!!action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {session?.status === "IN_PROGRESS" && <>
      <View style={ui.card}><Text style={ui.accent}>BÀI {prescription.length ? index + 1 : 0}/{prescription.length} • {session.exercises.filter(item => item.isCompleted).length} hoàn thành</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: prescription.length, now: session.exercises.filter(item => item.isCompleted).length }} style={{ height: 5, borderRadius: 3, backgroundColor: "#303A33", overflow: "hidden" }}><View style={{ height: 5, backgroundColor: "#8CFF2E", width: `${prescription.length ? Math.min(100, session.exercises.filter(item => item.isCompleted).length / prescription.length * 100) : 0}%` }} /></View>
        <View style={[ui.row, { justifyContent: "space-between" }]}><View><Text style={ui.muted}>THỜI GIAN TẬP</Text><Text style={[ui.title, { color: "#8CFF2E" }]}>{timeLabel(elapsed)}</Text></View><View><Text style={ui.muted}>KHỐI LƯỢNG</Text><Text style={ui.heading}>{formatNumber(volume / 1000)} TẤN</Text></View></View>
      </View>
      {exercise && <ExercisePanel key={session.workoutSessionId + ":" + exercise.exerciseId} exercise={exercise} session={session} busy={busy} error={action.error} run={action.run} reload={state.refresh} startRest={seconds => { const started = Date.now(); setNow(started); setRestUntil(started + seconds * 1000); }} />}
      <View style={ui.row}>
        <Button title="‹ Bài trước" secondary disabled={busy || index <= 0} onPress={() => setIndex(value => value - 1)} />
        <Button title="Bài tiếp ›" secondary disabled={busy || index >= prescription.length - 1} onPress={() => setIndex(value => value + 1)} />
      </View>
      <Button title="KẾT THÚC BUỔI TẬP" danger disabled={busy || !hasSets} onPress={() => { action.setError(null); setConfirm("complete"); }} />
      <Button title="Hủy buổi tập" secondary disabled={busy} onPress={() => { action.setError(null); setConfirm("cancel"); }} />
      <Text style={ui.muted}>Nhấn xác nhận từng hiệp để lưu. Bạn có thể rời màn hình và tiếp tục các hiệp đã lưu từ Trang chủ.</Text>
      <Confirm visible={confirm != null} title={confirm === "complete" ? "Kết thúc buổi tập?" : "Hủy buổi tập?"}
        message={confirm === "complete" ? "Các hiệp đã lưu sẽ được tính vào lịch sử và tiến trình. Thông tin chưa xác nhận sẽ không được lưu." : "Buổi tập bị hủy sẽ không được tính vào tiến trình."}
        busy={action.busy} error={action.error} onClose={() => setConfirm(null)} onConfirm={() => action.run(async () => {
          if (confirm === "complete") {
            await userApi.completeSession(session.workoutSessionId); setConfirm(null);
            router.replace({ pathname: "/history/[id]", params: { id: session.workoutSessionId } });
          } else { await userApi.cancelSession(session.workoutSessionId); setConfirm(null); router.replace("/home"); }
        })} />
    </>}
    {session && session.status !== "IN_PROGRESS" && <Button title="Xem kết quả buổi tập" onPress={() => router.replace({ pathname: "/history/[id]", params: { id: session.workoutSessionId } })} />}
  </Page>;
}

const workoutStyle = StyleSheet.create({
  columns: { flexDirection: "row", alignItems: "center", gap: 6 },
  set: { backgroundColor: "#1B1F20", borderBottomWidth: 1, borderColor: "#303A33", paddingTop: 8, paddingHorizontal: 2 },
  input: { width: 56, minHeight: 44, paddingHorizontal: 4, textAlign: "center", color: "#EEF0ED", backgroundColor: "#252D28", borderRadius: 8, fontSize: 14 },
  tick: { width: 40, minHeight: 44, borderRadius: 22, backgroundColor: "#283129", alignItems: "center", justifyContent: "center" },
  label: { color: "#ABB5AA", fontSize: 9, fontWeight: "700", textAlign: "center" },
  previous: { color: "#ABB5AA", fontSize: 10, lineHeight: 16 },
});
