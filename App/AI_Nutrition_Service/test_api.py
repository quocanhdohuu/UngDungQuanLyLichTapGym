import io
import json
import time
from PIL import Image, ImageDraw
from starlette.testclient import TestClient
from main import app

def generate_test_food_image():
    """Tạo 1 ảnh test món ăn giả lập định dạng JPEG 300x300"""
    img = Image.new("RGB", (300, 300), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Vẽ đĩa tròn
    draw.ellipse((20, 20, 280, 280), fill=(255, 255, 255), outline=(200, 200, 200), width=4)
    # Vẽ cơm trắng (vùng trắng ngà)
    draw.ellipse((50, 60, 160, 170), fill=(245, 245, 235))
    # Vẽ thịt ức gà (vùng vàng nâu)
    draw.rectangle((160, 70, 250, 160), fill=(205, 140, 80))
    # Vẽ bông cải xanh (vùng xanh lá)
    draw.ellipse((90, 180, 210, 260), fill=(40, 140, 50))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    return buf.getvalue()

def run_tests():
    print("==================================================================")
    print("  BẮT ĐẦU TEST TOÀN DIỆN FASTAPI AI NUTRITION SERVICE")
    print("==================================================================")
    
    with TestClient(app) as client:
        # 1. Test GET /health
        print("\n[+] 1. Kiểm tra Endpoint GET /health...")
        res_health = client.get("/health")
        assert res_health.status_code == 200, f"Health check thất bại: {res_health.text}"
        health_data = res_health.json()
        print(f"    Status: {health_data['status']} | Model Loaded: {health_data['model_loaded']} | Số classes: {health_data['classes_count']}")
        assert health_data["status"] == "healthy"
        assert health_data["model_loaded"] is True
        print("    [✓] GET /health PASSED")

        # 2. Test GET /labels
        print("\n[+] 2. Kiểm tra Endpoint GET /labels...")
        res_labels = client.get("/labels")
        assert res_labels.status_code == 200, f"Get labels thất bại: {res_labels.text}"
        labels_data = res_labels.json()
        print(f"    Tổng số nhãn nguyên liệu hỗ trợ: {labels_data['total']}")
        assert labels_data["total"] >= 40
        print("    [✓] GET /labels PASSED")

        # 3. Test POST /predict với file ảnh thực tế
        print("\n[+] 3. Kiểm tra Endpoint POST /predict (Gửi ảnh món ăn)...")
        image_bytes = generate_test_food_image()
        print(f"    Dung lượng ảnh test: {len(image_bytes)} bytes (~{len(image_bytes)/1024:.1f} KB)")
        
        files = {"file": ("test_dish.jpg", image_bytes, "image/jpeg")}
        
        t0 = time.time()
        res_predict = client.post("/predict?threshold=0.20&top_k=5", files=files)
        client_latency_ms = (time.time() - t0) * 1000
        
        assert res_predict.status_code == 200, f"Predict thất bại: {res_predict.text}"
        pred_data = res_predict.json()
        
        print(f"    Mã phản hồi HTTP: {res_predict.status_code}")
        print(f"    Thời gian inference AI: {pred_data['inference_time_ms']} ms")
        print(f"    Tổng thời gian phản hồi (Client Roundtrip): {client_latency_ms:.2f} ms")
        print(f"    Số lượng nguyên liệu phát hiện: {pred_data['total_detected']}")
        
        print("\n    Chi tiết các món AI dự đoán được:")
        for item in pred_data["predictions"]:
            print(f"    - [{item['category']}] {item['name_vi']} ({item['code']}): {item['estimated_grams']}g | Độ tin cậy: {item['confidence']*100:.1f}%")
            
        assert pred_data["status"] == "success"
        assert len(pred_data["predictions"]) > 0
        assert pred_data["inference_time_ms"] < 300.0, "Thời gian suy luận vượt ngưỡng 300ms!"
        print("    [✓] POST /predict PASSED")

    print("\n==================================================================")
    print("  [HOÀN TẤT BƯỚC 3] TẤT CẢ ENDPOINTS CỦA AI SERVICE ĐÃ SẴN SÀNG!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
