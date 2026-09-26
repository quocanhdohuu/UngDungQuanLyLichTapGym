import { DataState } from "@/components/common/data-state";
import { Button, Page, ui } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { formatNumber, userApi } from "@/services/user-api";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useState } from "react";

function GuideVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  return <View style={{ gap: 8 }}>
    <View style={{ height: 230, justifyContent: "center", alignItems: "center", backgroundColor: "#1B1F20", borderRadius: 14, overflow: "hidden" }}>
      <VideoView player={player} nativeControls style={{ position: "absolute", width: "100%", height: 230 }} />
      {!isPlaying && status === "readyToPlay" && <Pressable accessibilityRole="button" accessibilityLabel="Phát video hướng dẫn" onPress={() => player.play()}
        style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#8CFF2E", justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 24, color: "#10200C" }}>▶</Text></Pressable>}
    </View>
    {status === "loading" && <Text style={ui.muted}>Đang tải video hướng dẫn…</Text>}
    {status === "error" && <Text style={ui.error}>Không tải được video hướng dẫn. Bạn có thể xem các bước bên dưới.</Text>}
  </View>;
}
export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApiData(signal => userApi.exerciseDetail(Number(id), signal), id);
  const records = useApiData(userApi.personalRecords);
  const exercise = state.data;
  const record = records.data?.find(item => item.exerciseId === Number(id));
  const video = exercise?.media?.find(item => ["VIDEO", "MP4", "VIDEO_URL"].includes(item.mediaType.toUpperCase()));
  const image = exercise?.media?.find(item => item.mediaType.toUpperCase() === "IMAGE");
  const [linkError, setLinkError] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const description = exercise?.description?.split(/(?:^|\n)(?:hướng dẫn(?: thực hiện)?|instructions):?\s*\n/i)[0].trim();
  return <Page title={exercise?.name || "Chi tiết bài tập"}>
    <DataState {...state} retry={state.refresh} />
    {exercise && <>
      <Text style={ui.accent}>FORM GUIDE • HƯỚNG DẪN ĐỘNG TÁC</Text>
      {video ? <GuideVideo key={video.mediaUrl} uri={video.mediaUrl} /> : image && image.mediaUrl !== failedImage ? <Image source={{ uri: image.mediaUrl }} onError={() => setFailedImage(image.mediaUrl)} style={{ width: "100%", height: 230, borderRadius: 14 }} resizeMode="cover" /> : <View style={ui.card}><Text style={ui.muted}>{image ? "Không tải được ảnh hướng dẫn." : "Chưa có video hoặc ảnh hướng dẫn."}</Text></View>}
      <Text style={ui.accent}>{{ EASY: "Beginner", MEDIUM: "Intermediate", HARD: "Advanced" }[exercise.difficulty]} • {exercise.equipment || "Chưa có thông tin dụng cụ"}</Text>
      <View style={ui.card}><Text style={ui.heading}>Nhóm cơ</Text><Text style={ui.text}>Chính: {exercise.primaryMuscles || "Chưa cập nhật"}</Text><Text style={ui.muted}>Phụ: {exercise.secondaryMuscles || "Chưa cập nhật"}</Text></View>
      <View style={ui.card}><Text style={ui.heading}>Kỷ lục của bạn</Text>
        <DataState {...records} retry={records.refresh} />
        {!records.loading && !records.error && <Text style={ui.accent}>{record?.maxWeight != null ? formatNumber(record.maxWeight) + " KG" : "Chưa ghi nhận PR cho bài tập này"}</Text>}
      </View>
      {!!description && <Text style={ui.text}>{description}</Text>}
      <View style={ui.card}><Text style={ui.heading}>Hướng dẫn thực hiện • 4 bước</Text>
        {exercise.guide ? exercise.guide.steps.map((step, index) => <View key={index} style={{ gap: 4 }}>
          <Text style={ui.accent}>BƯỚC {index + 1}</Text><Text style={ui.text}>{step}</Text>
        </View>) : <Text style={ui.muted}>Bài tập này chưa có hướng dẫn 4 bước.</Text>}
      </View>
      <View style={ui.card}><Text style={ui.heading}>Lỗi thường gặp</Text>
        {exercise.guide ? exercise.guide.mistakes.map((mistake, index) => <Text key={index} style={ui.text}>• {mistake}</Text>) : <Text style={ui.muted}>Chưa có nội dung lỗi thường gặp cho bài tập này.</Text>}
      </View>
      {exercise.guide?.source && <Button secondary title={"Nguồn: " + exercise.guide.source.title} onPress={async () => {
        setLinkError(false);
        try { await Linking.openURL(exercise.guide!.source!.url); } catch { setLinkError(true); }
      }} />}
      {linkError && <Text style={ui.error}>Không mở được nguồn hướng dẫn.</Text>}
    </>}
  </Page>;
}
