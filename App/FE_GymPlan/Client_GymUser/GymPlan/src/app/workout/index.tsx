import { DataState } from "@/components/common/data-state";
import { Button, Confirm, Page, ui, useAction } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { ExerciseAlternative, ExerciseSet, PlanExercise, PreviousPerformance, WorkoutDetail, formatNumber, userApi } from "@/services/user-api";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const timeLabel = (seconds: number) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
const selectedExercise = (session: WorkoutDetail, exerciseId: number) => session.exercises.find(item =>
  (item.originalExerciseId ?? item.exerciseId) === exerciseId && item.isActive !== false);
const difficultyLabel = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };

function WorkoutVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, video => {
    video.muted = true;
    video.loop = true;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  useFocusEffect(useCallback(() => {
    player.play();
    return () => player.pause();
  }, [player]));

  return <View style={{ gap: 8 }}>
    <View style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "#0D1110" }}>
      <VideoView player={player} nativeControls={false} playsInline contentFit="contain"
        accessibilityLabel="Video hướng dẫn bài tập" style={{ width: "100%", height: 230 }} />
    </View>
    {status === "loading" && <Text style={ui.muted}>Đang tải video hướng dẫn…</Text>}
    {status === "error" && <Text style={ui.error}>Không tải được video hướng dẫn.</Text>}
  </View>;
}

function AlternativePicker({ exercise, activeId, onChoose, onClose }: {
  exercise: PlanExercise; activeId: number;
  onChoose: (item: Pick<ExerciseAlternative, "exerciseId" | "name">) => void; onClose: () => void;
}) {
  const alternatives = useApiData(signal => userApi.getAlternatives(exercise.exerciseId, signal), String(exercise.exerciseId));
  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <View style={ui.overlay}><View style={[ui.card, { maxHeight: "90%", width: "100%", maxWidth: 520, alignSelf: "center" }]}>
      <Text style={ui.heading}>Đổi bài tập</Text>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <DataState {...alternatives} retry={alternatives.refresh} empty={alternatives.data?.length === 0 && "Không có bài tập thay thế phù hợp."} />
        {activeId !== exercise.exerciseId && <Button title="Quay lại bài gốc" secondary onPress={() => onChoose({ exerciseId: exercise.exerciseId, name: exercise.exerciseName })} />}
        {[...(alternatives.data || [])].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)).map(item => <View style={ui.card} key={item.exerciseId}>
          {!!item.preview && <Image source={{ uri: item.preview }} style={{ height: 120, borderRadius: 8 }} contentFit="contain" accessibilityLabel={item.name} />}
          <Text style={ui.heading}>{item.name}</Text>
          <Text style={ui.muted}>Ưu tiên {item.priority} • Độ khó: {item.difficulty ? difficultyLabel[item.difficulty] : "Chưa cập nhật"}</Text>
          <Text style={ui.text}>Nhóm cơ chính: {item.primaryMuscles || "Chưa cập nhật"}</Text>
          {!!item.secondaryMuscles && <Text style={ui.muted}>Nhóm cơ phụ: {item.secondaryMuscles}</Text>}
          <Text style={ui.text}>Dụng cụ: {item.equipment || "Chưa cập nhật"}</Text>
          {!!item.note && <Text style={ui.muted}>{item.note}</Text>}
          <Button title={activeId === item.exerciseId ? "Đang chọn" : "Chọn " + item.name} disabled={activeId === item.exerciseId} onPress={() => onChoose(item)} />
        </View>)}
      </ScrollView>
      <Button title="Đóng" secondary onPress={onClose} />
    </View></View>
  </Modal>;
}
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
        <Text style={workoutStyle.previous}>{previous ? formatNumber(previous.weight) + " × " + previous.reps : "RPE: 6-8"}</Text>
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
  const performed = selectedExercise(session, exercise.exerciseId);
  const activeExercise = performed || exercise;
  const guide = useApiData(signal => userApi.exerciseDetail(activeExercise.exerciseId, signal), String(activeExercise.exerciseId));
  const video = guide.data?.media?.find(item => ["VIDEO", "MP4", "VIDEO_URL"].includes(item.mediaType.toUpperCase()) && item.mediaUrl);
  const previous = useApiData(signal => userApi.getPreviousPerformance(activeExercise.exerciseId, signal), String(activeExercise.exerciseId));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacement, setReplacement] = useState<Pick<ExerciseAlternative, "exerciseId" | "name"> | null>(null);
  const retainedSets = session.exercises.filter(item => (item.originalExerciseId ?? item.exerciseId) === exercise.exerciseId && item.performedExerciseId !== performed?.performedExerciseId)
    .reduce((total, item) => total + item.sets.length, 0);
  const [numbers, setNumbers] = useState(() => Array.from(new Set([
    ...Array.from({ length: exercise.sets }, (_, index) => index + 1), ...(performed?.sets.map(set => set.setNumber) || []),
  ])).sort((a, b) => a - b));
  const [removed, setRemoved] = useState<number | null>(null);
  const save = (number: number, weight: number, reps: number) => run(async () => {
    const saved = performed?.sets.find(set => set.setNumber === number);
    if (saved) await userApi.updateSet(saved.setId, weight, reps);
    else {
      const id = performed?.performedExerciseId ?? (await userApi.addExerciseToSession(session.workoutSessionId, activeExercise.exerciseId, exercise.exerciseId)).performedExerciseId;
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
      <Text style={ui.heading}>{activeExercise.exerciseName}</Text>
      {performed?.isSubstituted && <Text style={ui.accent}>Thay thế cho: {performed.originalExerciseName || exercise.exerciseName}</Text>}
      <DataState {...guide} retry={guide.refresh} />
      {video ? <WorkoutVideo key={activeExercise.exerciseId + ":" + video.mediaUrl} uri={video.mediaUrl} />
        : !!performed?.preview && <Image source={{ uri: performed.preview }} style={{ height: 140, borderRadius: 8 }} contentFit="contain" accessibilityLabel={performed.exerciseName} />}
      {!!performed?.difficulty && <Text style={ui.muted}>Độ khó: {difficultyLabel[performed.difficulty]}</Text>}
      <Text style={ui.text}>Nhóm cơ: {activeExercise.primaryMuscles || "Chưa cập nhật"}</Text>
      <Text style={ui.text}>Dụng cụ: {activeExercise.equipment || "Chưa cập nhật"}</Text>
      <Text style={ui.muted}>Mục tiêu RPE: Chưa thiết lập</Text>
      <Text style={ui.muted}>{exercise.sets} hiệp × {exercise.reps} lần • Nghỉ {exercise.restTime}s</Text>
      <Button title="Xem hướng dẫn động tác" secondary disabled={busy} onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: activeExercise.exerciseId } })} />
      <Button title="Đổi bài tập" secondary disabled={busy} onPress={() => setPickerOpen(true)} />
      {retainedSets > 0 && <Text style={ui.muted}>Đã giữ lại {retainedSets} hiệp của các bài trước trong lịch sử buổi tập.</Text>}
      {performed?.isCompleted && <Text style={ui.accent}>✓ Đã hoàn thành bài</Text>}
    </View>
    <DataState {...previous} retry={previous.refresh} />
    <View style={workoutStyle.columns}>
      <Text style={[workoutStyle.label, { width: 30 }]}>HIỆP</Text><Text style={[workoutStyle.label, { flex: 1 }]}>MỤC TIÊU / PREV</Text>
      <Text style={[workoutStyle.label, { width: 56 }]}>KG</Text><Text style={[workoutStyle.label, { width: 56 }]}>REPS</Text><Text style={[workoutStyle.label, { width: 40 }]}>LƯU</Text>
    </View>
    {!previous.loading && numbers.map(number => <SetRow key={activeExercise.exerciseId + ":" + number} number={number}
      saved={performed?.sets.find(set => set.setNumber === number)} previous={previous.data?.find(set => set.setNumber === number)}
      target={exercise.reps} busy={busy} onSave={(weight, reps) => save(number, weight, reps)} onDelete={() => setRemoved(number)} />)}
    <Button title="+ Thêm hiệp" secondary disabled={busy || numbers.length >= 100} onPress={() => setNumbers(current => [...current, Math.max(0, ...current) + 1])} />
    <Button title={performed?.isCompleted ? "✓ Bài tập hoàn thành" : "Hoàn thành bài tập"} disabled={busy || !performed?.sets.length || !!performed?.isCompleted}
      onPress={() => run(async () => { if (performed) await userApi.completeExercise(performed.performedExerciseId); await reload(); })} />
    <Confirm visible={removed != null} title="Xóa hiệp tập?" message="Hiệp này sẽ được xóa khỏi buổi tập."
      busy={busy} error={error} onClose={() => setRemoved(null)} onConfirm={() => { if (removed != null) void deleteSet(removed); }} />
    {pickerOpen && <AlternativePicker exercise={exercise} activeId={activeExercise.exerciseId} onClose={() => setPickerOpen(false)}
      onChoose={item => { setPickerOpen(false); setReplacement(item); }} />}
    <Confirm visible={replacement != null} title="Đổi bài tập?"
      message={`Bạn có chắc muốn đổi sang bài tập ${replacement?.name || ""}?${performed?.sets.length ? " Các hiệp đã lưu sẽ được giữ nguyên ở bài đã tập." : ""} Thông tin hiệp chưa lưu sẽ được bỏ qua.`}
      busy={busy} error={error} onClose={() => setReplacement(null)} onConfirm={() => run(async () => {
        if (!replacement) return;
        await userApi.addExerciseToSession(session.workoutSessionId, replacement.exerciseId, exercise.exerciseId);
        await reload();
        setReplacement(null);
      })} />
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
  const completedCount = session ? prescription.filter(item => selectedExercise(session, item.exerciseId)?.isCompleted).length : 0;
  const busy = action.busy || state.loading || !!state.error;
  return <Page title={session?.dayName || "Buổi tập"} footer={rest > 0 && session?.status === "IN_PROGRESS" ?
    <View style={[ui.card, { margin: 12 }]}><Text style={ui.heading}>Thời gian nghỉ {timeLabel(rest)}</Text>
      <View style={ui.row}><Button title="+30s" secondary onPress={() => setRestUntil(value => Math.max(Date.now(), value) + 30000)} /><Button title="Bỏ qua" secondary onPress={() => setRestUntil(0)} /></View>
    </View> : undefined}>
    <DataState {...state} retry={state.refresh} empty={!session && "Chưa có buổi tập đang diễn ra"} />
    {!!action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
    {session?.status === "IN_PROGRESS" && <>
      <View style={ui.card}><Text style={ui.accent}>BÀI {prescription.length ? index + 1 : 0}/{prescription.length} • {completedCount} hoàn thành</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: prescription.length, now: completedCount }} style={{ height: 5, borderRadius: 3, backgroundColor: "#303A33", overflow: "hidden" }}><View style={{ height: 5, backgroundColor: "#8CFF2E", width: `${prescription.length ? completedCount / prescription.length * 100 : 0}%` }} /></View>
        <View style={[ui.row, { justifyContent: "space-between" }]}><View><Text style={ui.muted}>THỜI GIAN TẬP</Text><Text style={[ui.title, { color: "#8CFF2E" }]}>{timeLabel(elapsed)}</Text></View><View><Text style={ui.muted}>KHỐI LƯỢNG</Text><Text style={ui.heading}>{formatNumber(volume / 1000)} TẤN</Text></View></View>
      </View>
      {exercise && <ExercisePanel key={session.workoutSessionId + ":" + exercise.exerciseId + ":" + (selectedExercise(session, exercise.exerciseId)?.exerciseId ?? exercise.exerciseId)} exercise={exercise} session={session} busy={busy} error={action.error} run={action.run} reload={state.refresh} startRest={seconds => { const started = Date.now(); setNow(started); setRestUntil(started + seconds * 1000); }} />}
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
