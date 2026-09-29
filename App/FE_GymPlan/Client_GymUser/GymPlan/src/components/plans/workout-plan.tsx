import { router } from "expo-router";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { ActivePlan, PlanExercise, formatDate, levelLabel } from "@/services/user-api";
import { colors, styles } from "./plan-styles";

export function RoutineCard({ plan, onPress, showDetails = false }: {
  plan: ActivePlan;
  onPress?: () => void;
  showDetails?: boolean;
}) {
  const percent = plan.totalDays
    ? Math.min(100, Math.round((plan.completedThisWeek / plan.totalDays) * 100))
    : 0;
  const content = (
    <View style={styles.routineCard}>
      <View style={styles.routineTop}>
        <View style={showDetails && styles.routineCopy}>
          <Text style={styles.routineLabel}>CURRENT ROUTINE</Text>
          <Text style={styles.routineName}>{plan.title}</Text>
          <Text style={styles.routineSubtitle}>{plan.description || "—"}</Text>
          <Text style={styles.levelBadge}>{levelLabel(plan.level)}</Text>
        </View>
      </View>
      <View style={styles.routineProgressHeader}>
        <Text style={styles.weekText}>
          ♨ Tuần {plan.currentWeek} / {plan.durationWeeks}
        </Text>
        <Text style={styles.completeText}>Hoàn thành {percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      {showDetails && (
        <View style={styles.routineDetails}>
          <Text style={styles.completeText}>Trạng thái: {plan.status}</Text>
          <Text style={styles.routineSubtitle}>
            Ngày bắt đầu: {plan.startedAt ? formatDate(plan.startedAt) : "Chưa bắt đầu"}
          </Text>
          <Text style={styles.routineSubtitle}>Tổng số ngày tập: {plan.totalDays}</Text>
          <Text style={styles.routineSubtitle}>
            Tiến độ tuần này: {plan.completedThisWeek}/{plan.totalDays} buổi đã tập
          </Text>
        </View>
      )}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel="Xem chi tiết lịch đang tập" onPress={onPress}>
      {content}
    </Pressable>
  ) : content;
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (video) => { video.muted = true; });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  if (status === "error") return <Text style={styles.thumbnailIcon}>⚒</Text>;
  return (
    <>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        surfaceType="textureView"
        pointerEvents="none"
        accessibilityLabel="Video minh họa bài tập"
        style={styles.previewMedia}
      />
      {status === "loading" && (
        <ActivityIndicator size="small" color={colors.green} style={styles.previewLoading} />
      )}
    </>
  );
}

function ExerciseRow({ exercise, showVideoPreview }: { exercise: PlanExercise; showVideoPreview: boolean }) {
  const image = exercise.media?.find((item) => item.mediaType === "IMAGE");
  const video = exercise.media?.find((item) => item.mediaType === "VIDEO");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.dragHandle}>⁙</Text>
      <View style={[styles.thumbnail, { backgroundColor: "#173331" }]}>
        {image && image.mediaUrl !== failedImage ? (
          <Image
            source={{ uri: image.mediaUrl }}
            onError={() => setFailedImage(image.mediaUrl)}
            accessibilityLabel={exercise.exerciseName}
            style={styles.previewMedia}
          />
        ) : showVideoPreview && video ? (
          <VideoPreview key={video.mediaUrl} uri={video.mediaUrl} />
        ) : (
          <Text style={styles.thumbnailIcon}>⚒</Text>
        )}
      </View>
      <View style={styles.exerciseCopy}>
        <Text numberOfLines={showVideoPreview ? undefined : 1} style={styles.exerciseName}>
          {exercise.exerciseName}
        </Text>
        <View style={styles.exerciseStats}>
          <Text style={styles.sets}>
            {exercise.sets} × {exercise.reps}
          </Text>
          <Text style={styles.weight}>• {exercise.sets} sets</Text>
        </View>
        <Text style={styles.rest}>• {exercise.restTime}s nghỉ</Text>
      </View>
      <View style={styles.exerciseActions}>
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Xem bài tập ${exercise.exerciseName}`}
          onPress={() =>
            router.push({
              pathname: "/exercises/[id]",
              params: { id: exercise.exerciseId },
            })
          }
        >
          <Text style={styles.editIcon}>⌕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function WorkoutDay({
  title,
  details,
  icon,
  expanded,
  exercises,
  today,
  onPress,
  showVideoPreview = false,
}: {
  title: string;
  details: string;
  icon: string;
  expanded: boolean;
  exercises: PlanExercise[];
  today: boolean;
  onPress: () => void;
  showVideoPreview?: boolean;
}) {
  return (
    <View style={[styles.dayCard, expanded && styles.expandedDayCard]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        aria-expanded={expanded}
        style={styles.dayHeader}
      >
        <View style={[styles.dayIcon, expanded && styles.dayIconActive]}>
          <Text style={styles.dayIconText}>{icon}</Text>
        </View>
        <View style={styles.dayCopy}>
          <View style={styles.dayTitleRow}>
            <Text style={styles.dayTitle}>{title}</Text>
            {today && <Text style={styles.todayBadge}>Hôm nay</Text>}
          </View>
          <Text style={styles.dayDetails}>{details}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.exerciseList}>
          {!exercises.length && (
            <Text style={styles.dayDetails}>Chưa có bài tập</Text>
          )}
          {exercises.map((exercise) => (
            <ExerciseRow key={exercise.configId} exercise={exercise} showVideoPreview={showVideoPreview} />
          ))}
        </View>
      )}
    </View>
  );
}

