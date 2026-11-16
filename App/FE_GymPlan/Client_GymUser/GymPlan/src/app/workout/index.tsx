import { DataState } from "@/components/common/data-state";
import { Button, Confirm, Page, ui, useAction } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import {
  ExerciseAlternative,
  ExerciseSet,
  PerformedExercise,
  PlanExercise,
  PreviousPerformance,
  WorkoutDetail,
  formatNumber,
  userApi,
} from "@/services/user-api";
import { OfflineStatus, workoutOffline } from "@/services/workout-offline";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const timeLabel = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, "0"))
    .join(":");

const selectedExercise = (session: WorkoutDetail, exerciseId: number) =>
  session.exercises.find(
    item => (item.originalExerciseId ?? item.exerciseId) === exerciseId && item.isActive !== false
  );

const difficultyLabel = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };

// Hợp nhất dữ liệu server với các hiệp offline đang có trên máy để không bị mất hiệp
function mergeSessionWithLocal(serverSession: WorkoutDetail, localSession: WorkoutDetail | null): WorkoutDetail {
  if (!localSession) return serverSession;

  const merged: WorkoutDetail = {
    ...serverSession,
    exercises: [...serverSession.exercises.map(e => ({ ...e, sets: [...e.sets] }))],
  };

  for (const localEx of localSession.exercises) {
    const sExIndex = merged.exercises.findIndex(
      e => (e.originalExerciseId ?? e.exerciseId) === (localEx.originalExerciseId ?? localEx.exerciseId)
    );
    if (sExIndex < 0) {
      merged.exercises.push(localEx);
    } else {
      const serverEx = merged.exercises[sExIndex];
      const mergedSets = [...serverEx.sets];

      for (const localSet of localEx.sets) {
        const existingSetIndex = mergedSets.findIndex(s => s.setNumber === localSet.setNumber);
        if (existingSetIndex < 0) {
          mergedSets.push(localSet);
        }
      }
      mergedSets.sort((a, b) => a.setNumber - b.setNumber);
      merged.exercises[sExIndex] = { ...serverEx, sets: mergedSets };
    }
  }

  return merged;
}

function OfflineBanner({
  status,
  onSyncNow,
}: {
  status: OfflineStatus;
  onSyncNow: () => Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);

  const handlePressSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await onSyncNow();
    } finally {
      setSyncing(false);
    }
  };

  if (status.isSyncing || syncing) {
    return (
      <View style={[workoutStyle.banner, { backgroundColor: "#142436", borderColor: "#2563EB" }]}>
        <Text style={{ color: "#93C5FD", fontSize: 13, fontWeight: "700" }}>
          🔄 Đang đồng bộ dữ liệu buổi tập lên máy chủ…
        </Text>
      </View>
    );
  }
  if (!status.isOnline) {
    return (
      <View style={[workoutStyle.banner, { backgroundColor: "#2A1E0E", borderColor: "#D97706" }]}>
        <Text style={{ color: "#FCD34D", fontSize: 13, fontWeight: "700" }}>
          ⚠️ Đang tập ngoại tuyến (Mất kết nối mạng)
        </Text>
        <Text style={{ color: "#FEF3C7", fontSize: 12, lineHeight: 18 }}>
          Các hiệp tập vẫn được lưu an toàn trên máy.{" "}
          {status.pendingCount > 0 ? `(${status.pendingCount} thao tác chờ gửi khi có mạng)` : ""}
        </Text>
      </View>
    );
  }
  if (status.pendingCount > 0) {
    return (
      <View
        style={[
          workoutStyle.banner,
          {
            backgroundColor: "#112417",
            borderColor: "#16A34A",
            gap: 8,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: "#86EFAC", fontSize: 13, fontWeight: "700" }}>
              📶 Đã kết nối lại mạng
            </Text>
            <Text style={{ color: "#DCFCE7", fontSize: 12 }}>
              Có {status.pendingCount} thao tác cần đồng bộ lên máy chủ.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={syncing}
            onPress={() => void handlePressSync()}
            style={{
              backgroundColor: syncing ? "#4B5563" : "#8CFF2E",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#10200C", fontSize: 12, fontWeight: "800" }}>
              {syncing ? "Đang gửi…" : "Đồng bộ ngay"}
            </Text>
          </Pressable>
        </View>
        {!!status.lastError && (
          <Text style={{ color: "#FCA5A5", fontSize: 11 }}>
            Lưu ý: {status.lastError}
          </Text>
        )}
      </View>
    );
  }
  return null;
}

function WorkoutVideo({
  uri,
  height = 230,
  isOnline = true,
}: {
  uri: string;
  height?: number;
  isOnline?: boolean;
}) {
  if (!isOnline) {
    return (
      <View style={{ backgroundColor: "#1C170E", padding: 12, borderRadius: 10, gap: 4 }}>
        <Text style={{ color: "#FBBF24", fontSize: 13, fontWeight: "700" }}>
          ⚠️ Chế độ ngoại tuyến (Tắt video)
        </Text>
        <Text style={{ color: "#E6EDE5", fontSize: 12, lineHeight: 18 }}>
          Đang tắt phát video để tiết kiệm dung lượng khi mất mạng. Vui lòng xem hướng dẫn kỹ thuật dạng chữ bên dưới.
        </Text>
      </View>
    );
  }

  return <ActiveWorkoutVideo uri={uri} height={height} />;
}

function ActiveWorkoutVideo({ uri, height = 230 }: { uri: string; height?: number }) {
  const player = useVideoPlayer(uri, video => {
    video.muted = true;
    video.loop = true;
    try {
      video.play();
    } catch {
      // Bỏ qua lỗi khởi tạo
    }
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // Bỏ qua
      }
    };
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      try {
        player.play();
      } catch {
        // Bỏ qua
      }
      return () => {
        try {
          player.pause();
        } catch {
          // Bỏ qua
        }
      };
    }, [player])
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "#0D1110" }}>
        <VideoView
          player={player}
          nativeControls={false}
          playsInline
          contentFit="contain"
          accessibilityLabel="Video hướng dẫn bài tập"
          style={{ width: "100%", height }}
        />
      </View>
      {status === "loading" && <Text style={ui.muted}>Đang tải video hướng dẫn…</Text>}
      {status === "error" && (
        <View style={{ backgroundColor: "#1C170E", padding: 10, borderRadius: 8, gap: 4 }}>
          <Text style={{ color: "#FBBF24", fontSize: 12, fontWeight: "600" }}>
            ⚠️ Không tải được video khi mất mạng
          </Text>
          <Text style={{ color: "#E6EDE5", fontSize: 12 }}>
            Xem hướng dẫn thực hiện động tác chi tiết dạng chữ ở nút bên dưới.
          </Text>
        </View>
      )}
    </View>
  );
}

function AlternativePicker({
  exercise,
  activeId,
  onChoose,
  onClose,
}: {
  exercise: PlanExercise;
  activeId: number;
  onChoose: (item: Pick<ExerciseAlternative, "exerciseId" | "name">) => void;
  onClose: () => void;
}) {
  const alternatives = useApiData(
    signal => userApi.getAlternatives(exercise.exerciseId, signal),
    String(exercise.exerciseId)
  );

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={ui.overlay}>
        <View style={[ui.card, { maxHeight: "90%", width: "100%", maxWidth: 520, alignSelf: "center" }]}>
          <Text style={ui.heading}>Đổi bài tập</Text>
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            <DataState
              {...alternatives}
              retry={alternatives.refresh}
              empty={alternatives.data?.length === 0 && "Không có bài tập thay thế phù hợp."}
            />
            {activeId !== exercise.exerciseId && (
              <Button
                title="Quay lại bài gốc"
                secondary
                onPress={() => onChoose({ exerciseId: exercise.exerciseId, name: exercise.exerciseName })}
              />
            )}
            {[...(alternatives.data || [])]
              .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
              .map(item => (
                <View style={ui.card} key={item.exerciseId}>
                  <Text style={ui.heading}>{item.name}</Text>
                  <Text style={ui.muted}>
                    Ưu tiên {item.priority} • Độ khó: {item.difficulty ? difficultyLabel[item.difficulty] : "Chưa cập nhật"}
                  </Text>
                  {!!item.videoUrl ? (
                    <WorkoutVideo key={item.exerciseId + ":" + item.videoUrl} uri={item.videoUrl} height={180} />
                  ) : !!item.preview ? (
                    <Image
                      source={{ uri: item.preview }}
                      style={{ height: 120, borderRadius: 8 }}
                      contentFit="contain"
                      accessibilityLabel={item.name}
                    />
                  ) : null}
                  <Text style={ui.text}>Nhóm cơ chính: {item.primaryMuscles || "Chưa cập nhật"}</Text>
                  {!!item.secondaryMuscles && <Text style={ui.muted}>Nhóm cơ phụ: {item.secondaryMuscles}</Text>}
                  <Text style={ui.text}>Dụng cụ: {item.equipment || "Chưa cập nhật"}</Text>
                  {!!item.note && <Text style={ui.muted}>{item.note}</Text>}
                  <Button
                    title={activeId === item.exerciseId ? "Đang chọn" : "Chọn " + item.name}
                    disabled={activeId === item.exerciseId}
                    onPress={() => onChoose(item)}
                  />
                </View>
              ))}
          </ScrollView>
          <Button title="Đóng" secondary onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function SetRow({
  number,
  saved,
  previous,
  target,
  busy,
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  onSave,
  onDelete,
}: {
  number: number;
  saved?: ExerciseSet;
  previous?: PreviousPerformance;
  target: number;
  busy: boolean;
  weight: string;
  reps: string;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onSave: (weight: number, reps: number) => void;
  onDelete: () => void;
}) {
  const kg = Number(weight.replace(",", "."));
  const count = Number(reps);
  const valid =
    !!weight.trim() &&
    Number.isFinite(kg) &&
    kg >= 0 &&
    kg <= 9999.99 &&
    !!reps.trim() &&
    Number.isInteger(count) &&
    count > 0 &&
    count <= 10000;
  const unchanged = !!saved && kg === Number(saved.weight) && count === Number(saved.reps);

  return (
    <View style={workoutStyle.set}>
      <View style={workoutStyle.columns}>
        <Text accessibilityLabel={"Hiệp " + number} style={[ui.accent, { width: 30, textAlign: "center" }]}>
          {number}
        </Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ui.text}>{target} lần</Text>
          <Text style={workoutStyle.previous}>
            {previous ? formatNumber(previous.weight) + " × " + previous.reps : "RPE: 6-8"}
          </Text>
        </View>
        <TextInput
          style={workoutStyle.input}
          accessibilityLabel={"Khối lượng hiệp " + number + " (kg)"}
          value={weight}
          onChangeText={onChangeWeight}
          keyboardType="decimal-pad"
          editable={!busy}
          placeholder="kg"
          placeholderTextColor="#ABB5AA"
        />
        <TextInput
          style={workoutStyle.input}
          accessibilityLabel={"Số lần hiệp " + number}
          value={reps}
          onChangeText={onChangeReps}
          keyboardType="number-pad"
          editable={!busy}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unchanged ? "✓ Đã lưu" : saved ? "Lưu thay đổi" : "Xác nhận hiệp"}
          disabled={busy || !valid || unchanged}
          accessibilityState={{ disabled: busy || !valid || unchanged }}
          onPress={() => onSave(kg, count)}
          style={[
            workoutStyle.tick,
            unchanged && { backgroundColor: "#8CFF2E" },
            (busy || !valid) && { opacity: 0.4 },
          ]}
        >
          <Text style={{ color: unchanged ? "#10200C" : "#8CFF2E", fontSize: 20 }}>✓</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Xóa hiệp " + number}
        disabled={busy}
        onPress={onDelete}
        style={{ alignSelf: "flex-end", minHeight: 32, justifyContent: "center" }}
      >
        <Text style={workoutStyle.previous}>Xóa hiệp</Text>
      </Pressable>
    </View>
  );
}

function ExercisePanel({
  exercise,
  session,
  isOnline,
  busy,
  onSaveSet,
  onDeleteSet,
  onCompleteExercise,
  onSwitchExercise,
  startRest,
  saveDraftsRef,
}: {
  exercise: PlanExercise;
  session: WorkoutDetail;
  isOnline: boolean;
  busy: boolean;
  onSaveSet: (exerciseId: number, setNumber: number, weight: number, reps: number) => Promise<void>;
  onDeleteSet: (exerciseId: number, setNumber: number) => Promise<void>;
  onCompleteExercise: (exerciseId: number) => Promise<void>;
  onSwitchExercise: (replacement: Pick<ExerciseAlternative, "exerciseId" | "name">) => Promise<void>;
  startRest: (seconds: number) => void;
  saveDraftsRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}) {
  const performed = selectedExercise(session, exercise.exerciseId);
  const activeExercise = performed || exercise;
  const guide = useApiData(
    signal => userApi.exerciseDetail(activeExercise.exerciseId, signal),
    String(activeExercise.exerciseId)
  );
  const video = guide.data?.media?.find(
    item => ["VIDEO", "MP4", "VIDEO_URL"].includes(item.mediaType.toUpperCase()) && item.mediaUrl
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacement, setReplacement] = useState<Pick<ExerciseAlternative, "exerciseId" | "name"> | null>(null);
  const retainedSets = session.exercises
    .filter(
      item =>
        (item.originalExerciseId ?? item.exerciseId) === exercise.exerciseId &&
        item.performedExerciseId !== performed?.performedExerciseId
    )
    .reduce((total, item) => total + item.sets.length, 0);

  const [numbers, setNumbers] = useState(() =>
    Array.from(
      new Set([
        ...Array.from({ length: exercise.sets }, (_, index) => index + 1),
        ...(performed?.sets.map(set => set.setNumber) || []),
      ])
    ).sort((a, b) => a - b)
  );
  const [removed, setRemoved] = useState<number | null>(null);

  const [drafts, setDrafts] = useState<Record<number, { weight: string; reps: string }>>({});
  const [prevPerf, setPrevPerf] = useState<PreviousPerformance[] | null>(null);

  // Nạp thành tích trước đó: từ cache offline (0ms) và từ API (khi có mạng)
  useEffect(() => {
    let active = true;

    // 1. Đọc ngay từ bộ nhớ đệm (hoạt động kể cả khi offline)
    workoutOffline.getCachedPreviousPerformance(activeExercise.exerciseId).then(cached => {
      if (active && cached && cached.length > 0) {
        setPrevPerf(cached);
      }
    });

    // 2. Nếu có kết nối, gọi API tải mới nhất và cập nhật vào cache
    userApi
      .getPreviousPerformance(activeExercise.exerciseId)
      .then(latest => {
        if (active && latest && Array.isArray(latest) && latest.length > 0) {
          setPrevPerf(latest);
          void workoutOffline.saveCachedPreviousPerformance(activeExercise.exerciseId, latest);
        }
      })
      .catch(() => {
        // Mất mạng: giữ nguyên dữ liệu từ cache offline
      });

    return () => {
      active = false;
    };
  }, [activeExercise.exerciseId]);

  useEffect(() => {
    if (performed?.sets?.length) {
      setNumbers(current =>
        Array.from(new Set([...current, ...performed.sets.map(s => s.setNumber)])).sort((a, b) => a - b)
      );
    }
  }, [performed?.sets]);

  // Đồng bộ draft values từ saved sets hoặc previous performance
  useEffect(() => {
    setDrafts(current => {
      const next = { ...current };
      for (const num of numbers) {
        const saved = performed?.sets.find(s => s.setNumber === num);
        const prev = prevPerf?.find(s => s.setNumber === num) || prevPerf?.[0];

        if (saved) {
          next[num] = {
            weight: String(saved.weight != null ? Number(saved.weight) : ""),
            reps: String(saved.reps ?? exercise.reps),
          };
        } else {
          const currentWeight = current[num]?.weight;
          const currentReps = current[num]?.reps;
          const prevWeight = prev?.weight != null ? String(Number(prev.weight)) : "";
          const prevReps = prev?.reps != null ? String(prev.reps) : String(exercise.reps);

          next[num] = {
            weight: currentWeight && currentWeight.trim() ? currentWeight : prevWeight,
            reps: currentReps && currentReps.trim() ? currentReps : prevReps,
          };
        }
      }
      return next;
    });
  }, [performed?.sets, prevPerf, numbers, exercise.reps]);

  const handleChangeWeight = (num: number, val: string) => {
    setDrafts(current => {
      const next = { ...current, [num]: { ...(current[num] || { reps: String(exercise.reps) }), weight: val } };
      // Nếu nhập hiệp 1, tự động điền sẵn cân nặng cho các hiệp sau nếu chúng đang để trống
      if (num === 1 && val.trim()) {
        for (const n of numbers) {
          if (n > 1) {
            const existing = current[n]?.weight;
            if (!existing || !existing.trim()) {
              next[n] = {
                weight: val,
                reps: current[n]?.reps || String(exercise.reps),
              };
            }
          }
        }
      }
      return next;
    });
  };

  const handleChangeReps = (num: number, val: string) => {
    setDrafts(current => ({
      ...current,
      [num]: { ...(current[num] || { weight: "" }), reps: val },
    }));
  };

  const save = async (number: number, weight: number, reps: number) => {
    startRest(exercise.restTime);
    await onSaveSet(activeExercise.exerciseId, number, weight, reps);
  };

  const autoSaveAllDrafts = useCallback(async () => {
    for (const num of numbers) {
      const d = drafts[num];
      if (!d) continue;
      const kg = Number(d.weight.replace(",", "."));
      const count = Number(d.reps);
      const valid =
        !!d.weight.trim() &&
        Number.isFinite(kg) &&
        kg >= 0 &&
        kg <= 9999.99 &&
        !!d.reps.trim() &&
        Number.isInteger(count) &&
        count > 0 &&
        count <= 10000;

      if (!valid) continue;

      const saved = performed?.sets.find(s => s.setNumber === num);
      const isUnchanged = saved != null && Number(saved.weight) === kg && saved.reps === count;

      if (!isUnchanged) {
        await onSaveSet(activeExercise.exerciseId, num, kg, count);
      }
    }
  }, [drafts, numbers, performed?.sets, activeExercise.exerciseId, onSaveSet]);

  useEffect(() => {
    if (saveDraftsRef) {
      saveDraftsRef.current = autoSaveAllDrafts;
    }
  }, [saveDraftsRef, autoSaveAllDrafts]);

  const deleteSet = async (number: number) => {
    await onDeleteSet(activeExercise.exerciseId, number);
    setNumbers(current => current.filter(value => value !== number));
    setRemoved(null);
  };

  const handleComplete = async () => {
    await autoSaveAllDrafts();
    await onCompleteExercise(activeExercise.exerciseId);
  };

  const hasAnySaved = !!performed?.sets.length;
  const hasAnyValidDraft = numbers.some(num => {
    const d = drafts[num];
    if (!d || !d.weight.trim() || !d.reps.trim()) return false;
    const kg = Number(d.weight.replace(",", "."));
    const count = Number(d.reps);
    return Number.isFinite(kg) && kg >= 0 && Number.isInteger(count) && count > 0;
  });

  const [showTechnique, setShowTechnique] = useState(false);
  const instructions = guide.data?.instructions || activeExercise.instructions || exercise.instructions;
  const cautions = guide.data?.cautions || activeExercise.cautions || exercise.cautions;
  const steps =
    guide.data?.guide?.steps ||
    (instructions
      ? instructions
          .split("\n")
          .map(s => s.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean)
      : []);
  const mistakes =
    guide.data?.guide?.mistakes ||
    (cautions
      ? cautions
          .split("\n")
          .map(s => s.replace(/^[•\-\*]\s*/, "").trim())
          .filter(Boolean)
      : []);

  return (
    <View style={{ gap: 12 }}>
      <View style={ui.card}>
        <Text style={ui.heading}>{activeExercise.exerciseName}</Text>
        {performed?.isSubstituted && (
          <Text style={ui.accent}>Thay thế cho: {performed.originalExerciseName || exercise.exerciseName}</Text>
        )}
        {isOnline && <DataState {...guide} retry={guide.refresh} />}
        {video ? (
          <WorkoutVideo key={activeExercise.exerciseId + ":" + video.mediaUrl} uri={video.mediaUrl} isOnline={isOnline} />
        ) : !!performed?.preview ? (
          <Image
            source={{ uri: performed.preview }}
            style={{ height: 140, borderRadius: 8 }}
            contentFit="contain"
            accessibilityLabel={performed.exerciseName}
          />
        ) : null}
        {!!performed?.difficulty && <Text style={ui.muted}>Độ khó: {difficultyLabel[performed.difficulty]}</Text>}
        <Text style={ui.text}>Nhóm cơ: {activeExercise.primaryMuscles || "Chưa cập nhật"}</Text>
        <Text style={ui.text}>Dụng cụ: {activeExercise.equipment || "Chưa cập nhật"}</Text>
        <Text style={ui.muted}>
          {exercise.sets} hiệp × {exercise.reps} lần • Nghỉ {exercise.restTime}s
        </Text>

        {/* Cảnh báo an toàn & Lưu ý quan trọng */}
        {mistakes.length > 0 && (
          <View
            style={{
              backgroundColor: "#1C170E",
              borderColor: "#D97706",
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              gap: 6,
            }}
          >
            <Text style={[ui.heading, { color: "#FBBF24", fontSize: 13 }]}>⚠️ Lưu ý an toàn & Cảnh báo</Text>
            {mistakes.map((mistake, i) => (
              <Text key={i} style={[ui.text, { color: "#FEF3C7", fontSize: 13, lineHeight: 18 }]}>
                • {mistake}
              </Text>
            ))}
          </View>
        )}

        {/* Hướng dẫn kỹ thuật chuẩn */}
        <Button
          title={
            showTechnique
              ? "▲ Thu gọn hướng dẫn kỹ thuật"
              : "📋 Xem hướng dẫn thực hiện động tác (" +
                (steps.length ? steps.length + " bước" : "kỹ thuật") +
                ")"
          }
          secondary
          disabled={busy}
          onPress={() => setShowTechnique(v => !v)}
        />

        {showTechnique && (
          <View
            style={{
              backgroundColor: "#141A16",
              borderColor: "#243328",
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              gap: 10,
            }}
          >
            <Text style={[ui.accent, { fontSize: 13 }]}>📋 CÁC BƯỚC THỰC HIỆN CHUẨN</Text>
            {steps.length > 0 ? (
              steps.map((step, i) => (
                <View key={i} style={{ gap: 2 }}>
                  <Text style={[ui.accent, { fontSize: 11 }]}>BƯỚC {i + 1}</Text>
                  <Text style={[ui.text, { fontSize: 13, lineHeight: 19 }]}>{step}</Text>
                </View>
              ))
            ) : instructions ? (
              <Text style={[ui.text, { fontSize: 13, lineHeight: 19 }]}>{instructions}</Text>
            ) : (
              <Text style={ui.muted}>Đang cập nhật hướng dẫn cho bài tập này.</Text>
            )}
          </View>
        )}

        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="Xem chi tiết bài tập ›"
              secondary
              disabled={busy}
              onPress={() => router.push({ pathname: "/exercises/[id]", params: { id: activeExercise.exerciseId } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Đổi bài tập" secondary disabled={busy} onPress={() => setPickerOpen(true)} />
          </View>
        </View>

        {retainedSets > 0 && (
          <Text style={ui.muted}>Đã giữ lại {retainedSets} hiệp của các bài trước trong lịch sử buổi tập.</Text>
        )}
        {performed?.isCompleted && <Text style={ui.accent}>✓ Đã hoàn thành bài</Text>}
      </View>

      <View style={workoutStyle.columns}>
        <Text style={[workoutStyle.label, { width: 30 }]}>HIỆP</Text>
        <Text style={[workoutStyle.label, { flex: 1 }]}>MỤC TIÊU / PREV</Text>
        <Text style={[workoutStyle.label, { width: 56 }]}>KG</Text>
        <Text style={[workoutStyle.label, { width: 56 }]}>REPS</Text>
        <Text style={[workoutStyle.label, { width: 40 }]}>LƯU</Text>
      </View>

      {/* Hiển thị danh sách các hiệp LUÔN LUÔN hiển thị, không bị ẩn khi mất mạng! */}
      {numbers.map(number => {
        const prev = prevPerf?.find(s => s.setNumber === number) || prevPerf?.[0];
        const saved = performed?.sets.find(set => set.setNumber === number);
        const fallbackWeight = prev?.weight != null ? String(Number(prev.weight)) : "";
        const fallbackReps = prev?.reps != null ? String(prev.reps) : String(exercise.reps);

        return (
          <SetRow
            key={activeExercise.exerciseId + ":" + number}
            number={number}
            saved={saved}
            previous={prev}
            target={exercise.reps}
            busy={busy}
            weight={
              drafts[number]?.weight ??
              (saved?.weight != null ? String(Number(saved.weight)) : fallbackWeight)
            }
            reps={
              drafts[number]?.reps ??
              (saved?.reps != null ? String(saved.reps) : fallbackReps)
            }
            onChangeWeight={val => handleChangeWeight(number, val)}
            onChangeReps={val => handleChangeReps(number, val)}
            onSave={(weight, reps) => void save(number, weight, reps)}
            onDelete={() => setRemoved(number)}
          />
        );
      })}

      <Button
        title="+ Thêm hiệp"
        secondary
        disabled={busy || numbers.length >= 100}
        onPress={() => setNumbers(current => [...current, Math.max(0, ...current) + 1])}
      />

      <Button
        title={performed?.isCompleted ? "✓ Bài tập hoàn thành" : "Hoàn thành bài tập"}
        disabled={busy || (!hasAnySaved && !hasAnyValidDraft) || !!performed?.isCompleted}
        onPress={() => void handleComplete()}
      />

      <Confirm
        visible={removed != null}
        title="Xóa hiệp tập?"
        message="Hiệp này sẽ được xóa khỏi buổi tập."
        busy={busy}
        onClose={() => setRemoved(null)}
        onConfirm={() => {
          if (removed != null) void deleteSet(removed);
        }}
      />

      {pickerOpen && (
        <AlternativePicker
          exercise={exercise}
          activeId={activeExercise.exerciseId}
          onClose={() => setPickerOpen(false)}
          onChoose={item => {
            setPickerOpen(false);
            setReplacement(item);
          }}
        />
      )}

      <Confirm
        visible={replacement != null}
        title="Đổi bài tập?"
        message={`Bạn có chắc muốn đổi sang bài tập ${replacement?.name || ""}?${
          performed?.sets.length ? " Các hiệp đã lưu sẽ được giữ nguyên ở bài đã tập." : ""
        } Thông tin hiệp chưa lưu sẽ được bỏ qua.`}
        busy={busy}
        onClose={() => setReplacement(null)}
        onConfirm={() => {
          if (replacement) {
            void onSwitchExercise(replacement);
            setReplacement(null);
          }
        }}
      />
    </View>
  );
}

export default function WorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const state = useApiData(
    signal => (sessionId ? userApi.workoutDetail(Number(sessionId), signal) : userApi.activeSession(signal)),
    sessionId || "active",
    true
  );
  const action = useAction();

  const [session, setSession] = useState<WorkoutDetail | null>(null);
  const sessionRef = useRef<WorkoutDetail | null>(null);
  const saveDraftsRef = useRef<(() => Promise<void>) | null>(null);

  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastError: null,
  });

  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [restUntil, setRestUntil] = useState(0);
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);

  // Đăng ký trạng thái mạng và sync
  useEffect(() => {
    const unsub = workoutOffline.subscribe(status => {
      setOfflineStatus(status);
    });
    return unsub;
  }, []);

  // Khởi tạo từ cache local để phục hồi nếu mất mạng
  useEffect(() => {
    let active = true;
    workoutOffline.getCachedSession().then(cached => {
      if (active && cached && (!sessionId || cached.workoutSessionId === Number(sessionId))) {
        sessionRef.current = cached;
        setSession(current => current ?? cached);
      }
    });
    return () => {
      active = false;
    };
  }, [sessionId]);

  // Hợp nhất dữ liệu khi API tải thành công (tránh làm mất hiệp offline chưa sync xong)
  useEffect(() => {
    if (state.data) {
      const merged = mergeSessionWithLocal(state.data, sessionRef.current);
      sessionRef.current = merged;
      setSession(merged);
      void workoutOffline.saveCachedSession(merged);
    }
  }, [state.data]);

  // Tải trước và lưu cache lịch sử tập cho toàn bộ các bài trong buổi tập
  useEffect(() => {
    if (session?.prescription?.length && offlineStatus.isOnline) {
      void workoutOffline.preloadPrescriptionPrevious(session.prescription);
    }
  }, [session?.workoutSessionId, session?.prescription, offlineStatus.isOnline]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Optimistic Save Set
  const handleSaveSet = async (exerciseId: number, setNumber: number, weight: number, reps: number) => {
    const baseSession = sessionRef.current || session;
    if (!baseSession) return;

    const currentSession: WorkoutDetail = {
      ...baseSession,
      exercises: baseSession.exercises.map(e => ({
        ...e,
        sets: [...e.sets],
      })),
    };

    let performed = selectedExercise(currentSession, exerciseId);
    let isNewPerf = false;
    let tempPerfId = 0;

    if (!performed) {
      isNewPerf = true;
      tempPerfId = -Date.now() - Math.floor(Math.random() * 1000);
      const planEx = currentSession.prescription.find(p => p.exerciseId === exerciseId);
      performed = {
        performedExerciseId: tempPerfId,
        exerciseId,
        originalExerciseId: planEx?.exerciseId ?? null,
        exerciseName: planEx?.exerciseName || "Bài tập",
        isCompleted: false,
        sets: [],
      };
      currentSession.exercises.push(performed);
    }

    const existingIndex = performed.sets.findIndex(s => s.setNumber === setNumber);
    const tempSetId = -Date.now() - Math.floor(Math.random() * 1000);
    let targetSetId = tempSetId;

    if (existingIndex >= 0) {
      targetSetId = performed.sets[existingIndex].setId;
      performed.sets[existingIndex] = {
        ...performed.sets[existingIndex],
        weight,
        reps,
      };
    } else {
      performed.sets.push({
        setId: tempSetId,
        setNumber,
        weight,
        reps,
      });
    }

    // Cập nhật đồng bộ vào Ref & State & AsyncStorage ngay lập tức
    sessionRef.current = currentSession;
    setSession(currentSession);
    await workoutOffline.saveCachedSession(currentSession);

    // Gửi sync hoặc đưa vào queue
    try {
      const isOnline = workoutOffline.isCurrentlyOnline();
      const status = await workoutOffline.getStatus();

      if (!isOnline || status.pendingCount > 0) {
        if (existingIndex >= 0) {
          await workoutOffline.enqueueAction("UPDATE_SET", { setId: targetSetId, weight, reps });
        } else {
          if (isNewPerf) {
            await workoutOffline.enqueueAction("ADD_EXERCISE", {
              tempPerfId,
              sessionId: currentSession.workoutSessionId,
              exerciseId,
              originalExerciseId: performed.originalExerciseId,
            });
          }
          await workoutOffline.enqueueAction("ADD_SET", {
            tempSetId,
            performedExerciseId: isNewPerf ? tempPerfId : performed.performedExerciseId,
            setNumber,
            weight,
            reps,
            preValue: null,
            exerciseId,
          });
        }
      } else {
        if (existingIndex >= 0) {
          await userApi.updateSet(targetSetId, weight, reps);
        } else {
          let perfId = performed.performedExerciseId;
          if (isNewPerf || perfId < 0) {
            const added = await userApi.addExerciseToSession(
              currentSession.workoutSessionId,
              exerciseId,
              performed.originalExerciseId
            );
            perfId = added.performedExerciseId;
            performed.performedExerciseId = perfId;
          }
          const created = await userApi.addSet(perfId, setNumber, weight, reps, null);
          if (created?.setId) {
            const sIndex = performed.sets.findIndex(s => s.setNumber === setNumber);
            if (sIndex >= 0) {
              performed.sets[sIndex].setId = created.setId;
              sessionRef.current = { ...currentSession };
              setSession({ ...currentSession });
              await workoutOffline.saveCachedSession(currentSession);
            }
          }
        }
      }
    } catch (err: any) {
      // Đánh dấu offline ngay khi request mạng thất bại
      workoutOffline.markOffline(err?.message);
      if (existingIndex >= 0) {
        await workoutOffline.enqueueAction("UPDATE_SET", { setId: targetSetId, weight, reps });
      } else {
        if (isNewPerf) {
          await workoutOffline.enqueueAction("ADD_EXERCISE", {
            tempPerfId,
            sessionId: currentSession.workoutSessionId,
            exerciseId,
            originalExerciseId: performed.originalExerciseId,
          });
        }
        await workoutOffline.enqueueAction("ADD_SET", {
          tempSetId,
          performedExerciseId: isNewPerf ? tempPerfId : performed.performedExerciseId,
          setNumber,
          weight,
          reps,
          preValue: null,
          exerciseId,
        });
      }
    }
  };

  // Optimistic Delete Set
  const handleDeleteSet = async (exerciseId: number, setNumber: number) => {
    const baseSession = sessionRef.current || session;
    if (!baseSession) return;
    const currentSession: WorkoutDetail = {
      ...baseSession,
      exercises: baseSession.exercises.map(e => ({ ...e, sets: [...e.sets] })),
    };
    const performed = selectedExercise(currentSession, exerciseId);
    if (!performed) return;

    const target = performed.sets.find(s => s.setNumber === setNumber);
    if (!target) return;

    performed.sets = performed.sets.filter(s => s.setNumber !== setNumber);
    sessionRef.current = currentSession;
    setSession(currentSession);
    await workoutOffline.saveCachedSession(currentSession);

    try {
      const isOnline = workoutOffline.isCurrentlyOnline();
      const status = await workoutOffline.getStatus();
      if (!isOnline || status.pendingCount > 0 || target.setId < 0) {
        await workoutOffline.enqueueAction("DELETE_SET", { setId: target.setId });
      } else {
        await userApi.deleteSet(target.setId);
      }
    } catch (err: any) {
      workoutOffline.markOffline(err?.message);
      await workoutOffline.enqueueAction("DELETE_SET", { setId: target.setId });
    }
  };

  // Optimistic Complete Exercise
  const handleCompleteExercise = async (exerciseId: number) => {
    const baseSession = sessionRef.current || session;
    if (!baseSession) return;
    const currentSession: WorkoutDetail = {
      ...baseSession,
      exercises: baseSession.exercises.map(e => ({ ...e, sets: [...e.sets] })),
    };
    const performed = selectedExercise(currentSession, exerciseId);
    if (!performed) return;

    performed.isCompleted = true;
    sessionRef.current = currentSession;
    setSession(currentSession);
    await workoutOffline.saveCachedSession(currentSession);

    try {
      const isOnline = workoutOffline.isCurrentlyOnline();
      const status = await workoutOffline.getStatus();
      if (!isOnline || status.pendingCount > 0 || performed.performedExerciseId < 0) {
        await workoutOffline.enqueueAction("COMPLETE_EXERCISE", {
          performedExerciseId: performed.performedExerciseId,
        });
      } else {
        await userApi.completeExercise(performed.performedExerciseId);
      }
    } catch (err: any) {
      workoutOffline.markOffline(err?.message);
      await workoutOffline.enqueueAction("COMPLETE_EXERCISE", {
        performedExerciseId: performed.performedExerciseId,
      });
    }
  };

  // Optimistic Switch Exercise
  const handleSwitchExercise = async (replacement: Pick<ExerciseAlternative, "exerciseId" | "name">) => {
    const baseSession = sessionRef.current || session;
    if (!baseSession || !exercise) return;
    const currentSession: WorkoutDetail = {
      ...baseSession,
      exercises: baseSession.exercises.map(e => ({ ...e, sets: [...e.sets] })),
    };
    const tempPerfId = -Date.now();

    const newPerformed: PerformedExercise = {
      performedExerciseId: tempPerfId,
      exerciseId: replacement.exerciseId,
      originalExerciseId: exercise.exerciseId,
      exerciseName: replacement.name,
      isSubstituted: true,
      isCompleted: false,
      sets: [],
    };
    currentSession.exercises.push(newPerformed);
    sessionRef.current = currentSession;
    setSession(currentSession);
    await workoutOffline.saveCachedSession(currentSession);

    try {
      const isOnline = workoutOffline.isCurrentlyOnline();
      const status = await workoutOffline.getStatus();
      if (!isOnline || status.pendingCount > 0) {
        await workoutOffline.enqueueAction("ADD_EXERCISE", {
          tempPerfId,
          sessionId: currentSession.workoutSessionId,
          exerciseId: replacement.exerciseId,
          originalExerciseId: exercise.exerciseId,
        });
      } else {
        const added = await userApi.addExerciseToSession(
          currentSession.workoutSessionId,
          replacement.exerciseId,
          exercise.exerciseId
        );
        if (added?.performedExerciseId) {
          newPerformed.performedExerciseId = added.performedExerciseId;
          sessionRef.current = { ...currentSession };
          setSession({ ...currentSession });
          await workoutOffline.saveCachedSession(currentSession);
        }
      }
    } catch (err: any) {
      workoutOffline.markOffline(err?.message);
      await workoutOffline.enqueueAction("ADD_EXERCISE", {
        tempPerfId,
        sessionId: currentSession.workoutSessionId,
        exerciseId: replacement.exerciseId,
        originalExerciseId: exercise.exerciseId,
      });
    }
  };

  const prescription = session?.prescription || [];
  const exercise = prescription[Math.min(index, Math.max(0, prescription.length - 1))];
  const elapsed = session ? Math.max(0, Math.floor((now - new Date(session.startTime).getTime()) / 1000)) : 0;
  const rest = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const volume =
    session?.exercises.reduce(
      (total, item) => total + item.sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0),
      0
    ) || 0;
  const hasSets = Boolean(session?.exercises.some(item => item.sets.length) || saveDraftsRef.current);
  const completedCount = session ? prescription.filter(item => selectedExercise(session, item.exerciseId)?.isCompleted).length : 0;

  const busy = action.busy || (!session && state.loading);

  return (
    <Page
      title={session?.dayName || "Buổi tập"}
      footer={
        rest > 0 && session?.status === "IN_PROGRESS" ? (
          <View style={[ui.card, { margin: 12 }]}>
            <Text style={ui.heading}>Thời gian nghỉ {timeLabel(rest)}</Text>
            <View style={ui.row}>
              <Button title="+30s" secondary onPress={() => setRestUntil(value => Math.max(Date.now(), value) + 30000)} />
              <Button title="Bỏ qua" secondary onPress={() => setRestUntil(0)} />
            </View>
          </View>
        ) : undefined
      }
    >
      <OfflineBanner
        status={offlineStatus}
        onSyncNow={async () => {
          const res = await workoutOffline.syncNow();
          if (res.success) {
            await state.refresh();
            Alert.alert("Đồng bộ thành công", `Đã đồng bộ ${res.syncedCount} thao tác lên máy chủ!`);
          } else if (res.error) {
            Alert.alert("Không thể đồng bộ", res.error);
          }
        }}
      />

      {!session && <DataState {...state} retry={state.refresh} empty={!session && "Chưa có buổi tập đang diễn ra"} />}

      {!!action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}

      {session?.status === "IN_PROGRESS" && (
        <>
          <View style={ui.card}>
            <Text style={ui.accent}>
              BÀI {prescription.length ? index + 1 : 0}/{prescription.length} • {completedCount} hoàn thành
            </Text>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: prescription.length, now: completedCount }}
              style={{ height: 5, borderRadius: 3, backgroundColor: "#303A33", overflow: "hidden" }}
            >
              <View
                style={{
                  height: 5,
                  backgroundColor: "#8CFF2E",
                  width: `${prescription.length ? (completedCount / prescription.length) * 100 : 0}%`,
                }}
              />
            </View>
            <View style={[ui.row, { justifyContent: "space-between" }]}>
              <View>
                <Text style={ui.muted}>THỜI GIAN TẬP</Text>
                <Text style={[ui.title, { color: "#8CFF2E" }]}>{timeLabel(elapsed)}</Text>
              </View>
              <View>
                <Text style={ui.muted}>KHỐI LƯỢNG</Text>
                <Text style={ui.heading}>{formatNumber(volume / 1000)} TẤN</Text>
              </View>
            </View>
          </View>

          {exercise && (
            <ExercisePanel
              key={
                session.workoutSessionId +
                ":" +
                exercise.exerciseId +
                ":" +
                (selectedExercise(session, exercise.exerciseId)?.exerciseId ?? exercise.exerciseId)
              }
              exercise={exercise}
              session={session}
              isOnline={offlineStatus.isOnline}
              busy={busy}
              onSaveSet={handleSaveSet}
              onDeleteSet={handleDeleteSet}
              onCompleteExercise={handleCompleteExercise}
              onSwitchExercise={handleSwitchExercise}
              saveDraftsRef={saveDraftsRef}
              startRest={seconds => {
                const started = Date.now();
                setNow(started);
                setRestUntil(started + seconds * 1000);
              }}
            />
          )}

          <View style={ui.row}>
            <Button
              title="‹ Bài trước"
              secondary
              disabled={busy || index <= 0}
              onPress={async () => {
                if (saveDraftsRef.current) await saveDraftsRef.current();
                setIndex(value => value - 1);
              }}
            />
            <Button
              title="Bài tiếp ›"
              secondary
              disabled={busy || index >= prescription.length - 1}
              onPress={async () => {
                if (saveDraftsRef.current) await saveDraftsRef.current();
                setIndex(value => value + 1);
              }}
            />
          </View>

          <Button
            title="KẾT THÚC BUỔI TẬP"
            danger
            disabled={busy || !hasSets}
            onPress={() => {
              action.setError(null);
              setConfirm("complete");
            }}
          />
          <Button
            title="Hủy buổi tập"
            secondary
            disabled={busy}
            onPress={() => {
              action.setError(null);
              setConfirm("cancel");
            }}
          />
          <Text style={ui.muted}>
            Nhấn xác nhận từng hiệp để lưu. Mọi hiệp đều được lưu ngoại tuyến ngay lập tức kể cả khi mất kết nối mạng.
          </Text>

          <Confirm
            visible={confirm != null}
            title={confirm === "complete" ? "Kết thúc buổi tập?" : "Hủy buổi tập?"}
            message={
              confirm === "complete"
                ? "Các hiệp đã lưu sẽ được tính vào lịch sử và tiến trình. Nếu đang mất mạng, dữ liệu sẽ tự động đồng bộ khi có mạng."
                : "Buổi tập bị hủy sẽ không được tính vào tiến trình."
            }
            busy={action.busy}
            error={action.error}
            onClose={() => setConfirm(null)}
            onConfirm={() =>
              action.run(async () => {
                if (confirm === "complete") {
                  if (saveDraftsRef.current) {
                    await saveDraftsRef.current();
                  }
                  const status = await workoutOffline.getStatus();
                  if (!status.isOnline || status.pendingCount > 0 || status.isSyncing) {
                    await workoutOffline.enqueueAction("COMPLETE_SESSION", {
                      workoutSessionId: session.workoutSessionId,
                    });
                    setConfirm(null);
                    router.replace("/home");
                  } else {
                    try {
                      await userApi.completeSession(session.workoutSessionId);
                      await workoutOffline.clearCachedSession();
                      setConfirm(null);
                      router.replace({ pathname: "/history/[id]", params: { id: session.workoutSessionId } });
                    } catch {
                      await workoutOffline.enqueueAction("COMPLETE_SESSION", {
                        workoutSessionId: session.workoutSessionId,
                      });
                      setConfirm(null);
                      router.replace("/home");
                    }
                  }
                } else {
                  const status = await workoutOffline.getStatus();
                  if (!status.isOnline) {
                    await workoutOffline.enqueueAction("CANCEL_SESSION", {
                      workoutSessionId: session.workoutSessionId,
                    });
                  } else {
                    try {
                      await userApi.cancelSession(session.workoutSessionId);
                    } catch {
                      await workoutOffline.enqueueAction("CANCEL_SESSION", {
                        workoutSessionId: session.workoutSessionId,
                      });
                    }
                  }
                  await workoutOffline.clearCachedSession();
                  setConfirm(null);
                  router.replace("/home");
                }
              })
            }
          />
        </>
      )}

      {session && session.status !== "IN_PROGRESS" && (
        <Button
          title="Xem kết quả buổi tập"
          onPress={() => router.replace({ pathname: "/history/[id]", params: { id: session.workoutSessionId } })}
        />
      )}
    </Page>
  );
}

const workoutStyle = StyleSheet.create({
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  columns: { flexDirection: "row", alignItems: "center", gap: 6 },
  set: {
    backgroundColor: "#1B1F20",
    borderBottomWidth: 1,
    borderColor: "#303A33",
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  input: {
    width: 56,
    minHeight: 44,
    paddingHorizontal: 4,
    textAlign: "center",
    color: "#EEF0ED",
    backgroundColor: "#252D28",
    borderRadius: 8,
    fontSize: 14,
  },
  tick: {
    width: 40,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#283129",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: "#ABB5AA", fontSize: 9, fontWeight: "700", textAlign: "center" },
  previous: { color: "#ABB5AA", fontSize: 10, lineHeight: 16 },
});
