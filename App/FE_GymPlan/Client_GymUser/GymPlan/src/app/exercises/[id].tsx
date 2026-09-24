import { DataState } from "@/components/common/data-state";
import { Page, ui } from "@/components/common/flow-ui";
import { useApiData } from "@/hooks/use-api-data";
import { formatNumber, userApi } from "@/services/user-api";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image, Text, View } from "react-native";

function GuideVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} nativeControls style={{ width: "100%", height: 230, borderRadius: 14 }} />;
}
export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApiData(signal => userApi.exerciseDetail(Number(id), signal), id);
  const records = useApiData(userApi.personalRecords);
  const exercise = state.data;
  const record = records.data?.find(item => item.exerciseId === Number(id));
  const video = exercise?.media?.find(item => item.mediaType === "VIDEO");
  const image = exercise?.media?.find(item => item.mediaType === "IMAGE");
  return <Page title={exercise?.name || "Chi tiết bài tập"}>
    <DataState {...state} retry={state.refresh} />
    {exercise && <>
      {video ? <GuideVideo uri={video.mediaUrl} /> : image ? <Image source={{ uri: image.mediaUrl }} style={{ width: "100%", height: 230, borderRadius: 14 }} resizeMode="cover" /> : <View style={ui.card}><Text style={ui.muted}>Chưa có video hoặc ảnh hướng dẫn.</Text></View>}
      <Text style={ui.accent}>{{ EASY: "Beginner", MEDIUM: "Intermediate", HARD: "Advanced" }[exercise.difficulty]} • {exercise.equipment || "Chưa có thông tin dụng cụ"}</Text>
      <View style={ui.card}><Text style={ui.heading}>Nhóm cơ</Text><Text style={ui.text}>Chính: {exercise.primaryMuscles || "Chưa cập nhật"}</Text><Text style={ui.muted}>Phụ: {exercise.secondaryMuscles || "Chưa cập nhật"}</Text></View>
      <View style={ui.card}><Text style={ui.heading}>Kỷ lục của bạn</Text>
        <DataState {...records} retry={records.refresh} />
        {!records.loading && !records.error && <Text style={ui.accent}>{record?.maxWeight != null ? formatNumber(record.maxWeight) + " KG" : "Chưa ghi nhận PR cho bài tập này"}</Text>}
      </View>
      <View style={ui.card}><Text style={ui.heading}>Hướng dẫn thực hiện</Text><Text style={ui.text}>{exercise.description || "Chưa có hướng dẫn trong thư viện."}</Text></View>
    </>}
  </Page>;
}
