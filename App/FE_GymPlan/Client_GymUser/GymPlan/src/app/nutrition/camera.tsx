import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { optimizeFoodImage } from "@/utils/image-optimizer";
import { nutritionApi, AnalyzeImageResponse } from "@/services/nutrition-api";

export default function NutritionCameraScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  /**
   * Mở Camera chụp ảnh trực tiếp
   */
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Cần quyền truy cập Camera",
          "Ứng dụng cần quyền Camera để chụp ảnh suất ăn và nhận diện dinh dưỡng."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndAnalyze(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Lỗi chụp ảnh", error.message || "Không thể mở camera.");
    }
  };

  /**
   * Chọn ảnh có sẵn từ thư viện ảnh
   */
  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Cần quyền thư viện ảnh",
          "Vui lòng cấp quyền truy cập ảnh để chọn hình suất ăn."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndAnalyze(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Lỗi chọn ảnh", error.message || "Không thể mở thư viện ảnh.");
    }
  };

  /**
   * Nén ảnh và gửi sang Backend AI phân tích
   */
  const processAndAnalyze = async (rawUri: string) => {
    setSelectedImage(rawUri);
    setIsAnalyzing(true);
    setStatusMessage("Đang tối ưu hóa dung lượng ảnh...");

    try {
      // 1. Tối ưu nén ảnh client-side
      const optimized = await optimizeFoodImage(rawUri);
      
      setStatusMessage("AI đang nhận diện món ăn & ước lượng Calo...");
      const t0 = Date.now();

      // 2. Gửi ảnh sang backend
      const result: AnalyzeImageResponse = await nutritionApi.analyzeImage(optimized.uri);
      const latency = Date.now() - t0;
      console.log(`[Nutrition] Phân tích hoàn tất sau ${latency}ms`);

      setIsAnalyzing(false);

      // 3. Chuyển tiếp sang màn hình Review khẩu phần
      router.push({
        pathname: "/nutrition/review" as any,
        params: {
          imageUri: encodeURIComponent(optimized.uri),
          analysisData: encodeURIComponent(JSON.stringify(result)),
        },
      });
    } catch (error: any) {
      setIsAnalyzing(false);
      Alert.alert(
        "Nhận diện không thành công",
        error.message || "Không thể phân tích ảnh suất ăn. Vui lòng thử lại với góc chụp rõ hơn."
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tính Calo Bữa Ăn</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Viewfinder / Khung hướng dẫn chụp */}
      <View style={styles.viewfinderContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <View style={styles.guidePlate}>
            {/* Vòng tròn định vị đĩa ăn */}
            <View style={styles.plateCircle}>
              <Text style={styles.plateIcon}>🍽️</Text>
              <Text style={styles.plateText}>Đặt đĩa ăn vào khung</Text>
            </View>
            {/* Các góc ngắm định vị */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        )}

        {/* Loading Overlay khi AI đang xử lý */}
        {isAnalyzing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingTitle}>Đang phân tích suất ăn</Text>
            <Text style={styles.loadingSubtitle}>{statusMessage}</Text>
          </View>
        )}
      </View>

      {/* Hướng dẫn chụp tốt nhất */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Mẹo chụp để AI đo chính xác nhất:</Text>
        <Text style={styles.tipItem}>• Chụp từ trên xuống góc 45° - 60° thấy trọn đĩa.</Text>
        <Text style={styles.tipItem}>• Đảm bảo đủ ánh sáng, không bị bóng tối che khuất.</Text>
        <Text style={styles.tipItem}>• Không cần lo lắng nếu món bị che: Bạn có thể chỉnh lại số gram ở bước sau!</Text>
      </View>

      {/* Các nút bấm hành động */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, isAnalyzing && styles.buttonDisabled]}
          onPress={handleTakePhoto}
          disabled={isAnalyzing}
        >
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.primaryButtonText}>Chụp ảnh bữa ăn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isAnalyzing && styles.buttonDisabled]}
          onPress={handlePickFromLibrary}
          disabled={isAnalyzing}
        >
          <Text style={styles.secondaryButtonText}>🖼️ Chọn từ thư viện ảnh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#E0E0E0",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  viewfinderContainer: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 360,
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  guidePlate: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  plateCircle: {
    width: "72%",
    height: "72%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255, 87, 34, 0.6)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 87, 34, 0.05)",
  },
  plateIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  plateText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#FF5722",
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18, 18, 18, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  loadingSubtitle: {
    color: "#B0B0B0",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  tipsBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E1E1E",
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#FF5722",
  },
  tipsTitle: {
    color: "#FF9800",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  tipItem: {
    color: "#CCCCCC",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  actionsContainer: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5722",
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252525",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  secondaryButtonText: {
    color: "#E0E0E0",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
