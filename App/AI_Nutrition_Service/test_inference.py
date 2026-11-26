import os
import json
import time
import numpy as np
import onnxruntime as ort

def test_inference():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "nutrition_model.onnx")
    labels_path = os.path.join(base_dir, "data", "labels.json")
    
    with open(labels_path, "r", encoding="utf-8") as f:
        labels = json.load(f)
        
    print(f"[+] Đang khởi tạo ONNX Runtime Session với mô hình: {model_path}")
    session = ort.InferenceSession(model_path)
    
    input_name = session.get_inputs()[0].name
    output_names = [o.name for o in session.get_outputs()]
    print(f"[+] Input: {input_name} | Outputs: {output_names}")
    
    # Tạo tensor giả lập ảnh 1x3x224x224 (hoặc ảnh test)
    dummy_img = np.random.randn(1, 3, 224, 224).astype(np.float32)
    
    # Đo thời gian suy luận
    t0 = time.time()
    logits, mass_preds = session.run(output_names, {input_name: dummy_img})
    inference_time = (time.time() - t0) * 1000
    
    # Tính xác suất bằng Sigmoid
    probs = 1.0 / (1.0 + np.exp(-logits[0]))
    mass = mass_preds[0]
    
    # Top predictions
    threshold = 0.20 # Ngưỡng phát hiện
    detected = []
    
    # Lấy top các món có điểm cao nhất
    top_indices = np.argsort(probs)[::-1][:5]
    for idx in top_indices:
        prob = float(probs[idx])
        grams = round(float(mass[idx]), 1)
        # Fallback gram an toàn theo khẩu phần chuẩn nếu mô hình trả về số quá nhỏ
        default_g = labels[idx]["default_grams"]
        final_grams = grams if grams >= 15.0 else default_g
        
        detected.append({
            "code": labels[idx]["code"],
            "name_vi": labels[idx]["name_vi"],
            "name_en": labels[idx]["name_en"],
            "category": labels[idx]["category"],
            "confidence": round(prob, 4),
            "estimated_grams": final_grams
        })
        
    result = {
        "status": "success",
        "inference_time_ms": round(inference_time, 2),
        "detected_ingredients": detected
    }
    
    print("\n--- KẾT QUẢ SUY LUẬN TEST INFERENCE TRÊN ONNX MODEL ---")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result

if __name__ == "__main__":
    test_inference()
