import { DataState } from "@/components/common/data-state";
import { Button, Confirm, Field, Page, ui, useAction } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { CustomPlan, Level, levelLabel, userApi } from "@/services/user-api";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Text, View } from "react-native";

type DraftExercise = { exerciseId: number; name: string; sets: string; reps: string; restTime: string };
type DraftDay = { dayName: string; weekDay: number; exercises: DraftExercise[] };
export default function CreatePlanScreen() {
  const library = useApiData(userApi.library);
  const action = useAction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [weeks, setWeeks] = useState("8");
  const [days, setDays] = useState<DraftDay[]>([{ dayName: "Ngày 1", weekDay: 1, exercises: [] }]);
  const [picker, setPicker] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(false);
  const changeDay = (index: number, update: Partial<DraftDay>) => setDays(current => current.map((day, i) => i === index ? { ...day, ...update } : day));
  const changeExercise = (dayIndex: number, index: number, update: Partial<DraftExercise>) =>
    changeDay(dayIndex, { exercises: days[dayIndex].exercises.map((exercise, i) => i === index ? { ...exercise, ...update } : exercise) });
  const save = () => action.run(async () => {
    const integer = (value: string, min: number, max: number) => {
      const number = Number(value);
      if (!value.trim() || !Number.isInteger(number) || number < min || number > max) throw new Error("Số tuần, hiệp, lần lặp và thời gian nghỉ phải là số nguyên trong giới hạn.");
      return number;
    };
    if (!title.trim()) throw new Error("Vui lòng nhập tên lịch.");
    if (new Set(days.map(day => day.weekDay)).size !== days.length) throw new Error("Các ngày tập không được trùng thứ.");
    const plan: CustomPlan = { title, description, level, durationWeeks: integer(weeks, 1, 104),
      days: days.map(day => {
        if (!day.dayName.trim() || !day.exercises.length) throw new Error("Mỗi ngày cần có tên và ít nhất một bài tập.");
        return { dayName: day.dayName, weekDay: day.weekDay, exercises: day.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId, sets: integer(exercise.sets, 1, 100), reps: integer(exercise.reps, 1, 1000), restTime: integer(exercise.restTime, 0, 3600),
        })) };
      }),
    };
    await userApi.createCustomPlan(plan);
    setConfirm(false); router.replace("/plans");
  });
  return <Page title="Tạo lịch cá nhân">
    <View pointerEvents={action.busy ? "none" : "auto"} style={{ gap: 16 }}>
      <Field label="Tên chương trình" value={title} onChangeText={setTitle} maxLength={150} />
      <Field label="Mô tả" value={description} onChangeText={setDescription} multiline maxLength={5000} />
      <Field label="Số tuần (1–104)" value={weeks} onChangeText={setWeeks} keyboardType="number-pad" />
      <View style={ui.row}>{(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(value =>
        <Button key={value} title={levelLabel(value)} secondary={level !== value} onPress={() => setLevel(value)} />)}</View>
      {days.map((day, dayIndex) => <View key={dayIndex} style={ui.card}>
        <Field label={"Ngày tập " + (dayIndex + 1)} value={day.dayName} onChangeText={dayName => changeDay(dayIndex, { dayName })} maxLength={100} />
        <View style={ui.row}>{[1, 2, 3, 4, 5, 6, 7].map(weekDay =>
          <Button key={weekDay} title={weekDay === 7 ? "CN" : "T" + (weekDay + 1)} secondary={weekDay !== day.weekDay} onPress={() => changeDay(dayIndex, { weekDay })} />)}</View>
        {day.exercises.map((exercise, index) => <View key={exercise.exerciseId} style={{ gap: 10 }}>
          <Text style={ui.heading}>{index + 1}. {exercise.name}</Text>
          <View style={ui.row}>
            <Field label="Hiệp (1–100)" keyboardType="number-pad" value={exercise.sets} onChangeText={sets => changeExercise(dayIndex, index, { sets })} />
            <Field label="Lần lặp (1–1000)" keyboardType="number-pad" value={exercise.reps} onChangeText={reps => changeExercise(dayIndex, index, { reps })} />
            <Field label="Nghỉ (giây)" keyboardType="number-pad" value={exercise.restTime} onChangeText={restTime => changeExercise(dayIndex, index, { restTime })} />
          </View>
          <Button secondary title="Xóa bài tập" onPress={() => changeDay(dayIndex, { exercises: day.exercises.filter((_, i) => i !== index) })} />
        </View>)}
        <Button title="+ Thêm bài tập" secondary disabled={day.exercises.length >= 30} onPress={() => { setPicker(dayIndex); setSearch(""); }} />
        {days.length > 1 && <Button title="Xóa ngày tập" secondary onPress={() => setDays(days.filter((_, i) => i !== dayIndex))} />}
      </View>)}
      <Button title="+ Thêm ngày tập" secondary disabled={days.length >= 7} onPress={() => setDays([...days, {
        dayName: "Ngày " + (days.length + 1), weekDay: [1, 2, 3, 4, 5, 6, 7].find(value => !days.some(day => day.weekDay === value)) || 1, exercises: [],
      }])} />
      <Button title="LƯU VÀ ÁP DỤNG LỊCH" disabled={action.busy} onPress={() => { action.setError(null); setConfirm(true); }} />
    </View>
    <Confirm visible={confirm} title="Tạo và áp dụng lịch?" message="Lịch mới sẽ thay thế lịch đang hoạt động. Lịch sử các buổi tập được giữ lại."
      busy={action.busy} error={action.error} onClose={() => setConfirm(false)} onConfirm={save} />
    <Modal visible={picker != null} animationType="slide" onRequestClose={() => setPicker(null)}>
      <Page title="Chọn bài tập" onBack={() => setPicker(null)}>
        <Button title="Đóng danh sách" secondary onPress={() => setPicker(null)} />
        <Field label="Tìm bài tập" value={search} onChangeText={setSearch} />
        <DataState {...library} retry={library.refresh} empty={!library.data?.length && "Chưa có bài tập"} />
        {(library.data || []).filter(exercise => exercise.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map(exercise => {
          const selected = picker != null && days[picker]?.exercises.some(item => item.exerciseId === exercise.exerciseId);
          return <Button key={exercise.exerciseId} title={exercise.name + (selected ? " ✓" : "")} secondary disabled={!!selected} onPress={() => {
            if (picker == null) return;
            changeDay(picker, { exercises: [...days[picker].exercises, { exerciseId: exercise.exerciseId, name: exercise.name, sets: "3", reps: "10", restTime: "60" }] });
            setPicker(null);
          }} />;
        })}
      </Page>
    </Modal>
  </Page>;
}
