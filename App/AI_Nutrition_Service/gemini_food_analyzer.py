"""
gemini_food_analyzer.py
Module phân tích suất ăn đa phương thức (Multimodal Food Vision) sử dụng mô hình Google Gemini 1.5 Flash.
Hiểu sâu ngữ nghĩa hình ảnh, nhận diện chuẩn xác từng loại thịt, cá, rau củ, tinh bột và ước tính khối lượng gram.
Tự động fallback về Food Vision cục bộ nếu không có API key hoặc mất mạng.
"""

import os
import io
import json
import base64
import urllib.request
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image

# Thử nạp google.generativeai
try:
    import google.generativeai as genai
    HAS_GENAI_LIB = True
except ImportError:
    HAS_GENAI_LIB = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
ROOT_ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), "BE_GymPlan", ".env")

def get_gemini_api_key() -> str:
    """Lấy Gemini API Key từ biến môi trường hoặc các file .env"""
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if key and len(key.strip()) > 10:
        return key.strip()
        
    for p in [ENV_PATH, ROOT_ENV_PATH]:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if len(val) > 10:
                            return val
    return ""

def build_system_prompt(labels_catalog: List[Dict[str, Any]]) -> str:
    """Tạo prompt hệ thống kèm danh mục 49 nguyên liệu chuẩn GymPlan"""
    catalog_summary = "\n".join([
        f"- Code: \"{item['code']}\" | Tên: \"{item['name_vi']}\" | Danh mục: {item.get('category', 'OTHER')} | Trọng lượng gợi ý: {item.get('default_grams', 100)}g"
        for item in labels_catalog
    ])
    
    return f"""Bạn là một Chuyên gia Dinh dưỡng Thể hình & Huấn luyện viên Gym (AI Sports Nutritionist) cao cấp của ứng dụng GymPlan.
Nhiệm vụ của bạn là phân tích ảnh chụp suất ăn của người tập gym, nhận diện chính xác các nguyên liệu có trên đĩa và ước lượng khối lượng (gram) thực tế của từng món.

DANH MỤC 49 NGUYÊN LIỆU HỖ TRỢ TRONG CƠ SỞ DỮ LIỆU:
{catalog_summary}

QUY TẮC NHẬN DIỆN BẮT BUỘC:
1. KHÔNG PHẢI MÓN ĂN: Nếu ảnh chụp KHÔNG CHỨA món ăn, đồ uống hoặc suất ăn (ví dụ: chụp bàn phím, màn hình, tường nhà, sàn nhà, khuôn mặt, thú cưng, đồ vật ngẫu nhiên), bạn BẮT BUỘC phải trả về:
   {{"is_food": false, "total_detected": 0, "predictions": []}}
2. NHẬN DIỆN CHUẨN XÁC:
   - Phân biệt rõ Bông cải xanh (broccoli) và Quả bơ (avocado): Súp lơ xanh có nụ hoa sần sùi sẫm màu; Quả bơ có thịt quả mịn màu vàng chanh/xanh nõn chuối.
   - Phân biệt rõ Thịt bò (beef_lean/beef_ground), Ức gà (chicken_breast) và Cá hồi (salmon): Không gán nhầm sốt thịt bò thành cá hồi hay cà rốt.
   - Phân biệt Cơm trắng (white_rice) với Đậu phụ (tofu_firm) hay Bún/Phở (rice_noodles).
3. MÃ NGUYÊN LIỆU (code): Bắt buộc phải khớp chính xác 100% với một trong các `Code` trong danh mục trên.
4. ƯỚC LƯỢNG KHỐI LƯỢNG (estimated_grams):
   - Đánh giá theo tỷ lệ bề mặt đĩa ăn và góc chụp (ví dụ: 1 phần ức gà nướng trung bình 120g - 180g; 1 chén cơm trắng 150g - 200g; rau củ 50g - 120g).
5. ĐỊNH DẠNG ĐẦU RA: Bắt buộc trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm Markdown ```json):
{{
  "is_food": true,
  "dish_summary": "Mô tả ngắn gọn bữa ăn",
  "total_detected": 2,
  "predictions": [
    {{
      "code": "chicken_breast",
      "name_vi": "Ức gà phi lê (luộc/áp chảo)",
      "category": "PROTEIN",
      "confidence": 0.95,
      "estimated_grams": 150.0
    }}
  ]
}}"""

SUPPORTED_GEMINI_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
]
_WORKING_MODEL: Optional[str] = "gemini-flash-lite-latest"

def call_gemini_vision_api(image_bytes: bytes, api_key: str, labels_catalog: List[Dict[str, Any]]) -> Optional[Tuple[List[Dict[str, Any]], str]]:
    """
    Gọi Gemini Vision qua Direct REST API với cơ chế tự động thử các phiên bản model mới nhất.
    """
    global _WORKING_MODEL
    system_prompt = build_system_prompt(labels_catalog)
    
    # 1. Nén ảnh vừa phải (JPEG max 768px) để gửi nhanh qua API (~0.8s)
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        pil_img.thumbnail((768, 768), Image.Resampling.BILINEAR)
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=85)
        opt_bytes = buf.getvalue()
    except Exception:
        opt_bytes = image_bytes

    b64_img = base64.b64encode(opt_bytes).decode("utf-8")
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64_img
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }
    req_data = json.dumps(payload).encode("utf-8")

    # Ưu tiên model đang hoạt động trước, sau đó là danh sách fallback
    models_to_try = [_WORKING_MODEL] if _WORKING_MODEL else []
    for m in SUPPORTED_GEMINI_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_bytes = response.read()
                resp_json = json.loads(resp_bytes.decode("utf-8"))
                
                candidates = resp_json.get("candidates", [])
                if not candidates:
                    return [], model_name
                content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                data = json.loads(content_text.strip())
                
                _WORKING_MODEL = model_name
                print(f"[Gemini-Vision] Phân tích thành công bằng model [{model_name}]: {data.get('dish_summary', 'Bữa ăn')}")
                if not data.get("is_food", True) or data.get("total_detected", 0) == 0:
                    return [], model_name
                return data.get("predictions", []), model_name
        except Exception as ex:
            print(f"[Gemini-Vision] Model [{model_name}] không khả dụng hoặc lỗi ({ex}), đang thử model tiếp theo...")

    print("[Gemini-Vision] Tất cả các model Gemini đều không khả dụng, chuyển sang local fallback...")
    return None

def analyze_meal_with_gemini_or_fallback(
    image_bytes: bytes,
    labels_catalog: List[Dict[str, Any]],
    fallback_analyzer_fn
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Chiến lược Hybrid Vision thông minh:
    1. Kiểm tra GEMINI_API_KEY. Nếu có -> Gọi Gemini Vision API.
    2. Nếu Gemini nhận diện được (kể cả trả về rỗng vì không phải đồ ăn) -> Trả về kết quả Gemini.
    3. Nếu không có Key hoặc lỗi mạng API -> Tự động Fallback sang bộ phân tích thị giác cục bộ.
    """
    api_key = get_gemini_api_key()
    
    if api_key:
        gemini_result = call_gemini_vision_api(image_bytes, api_key, labels_catalog)
        if gemini_result is not None:
            gemini_preds, model_name = gemini_result
            # Chuẩn hóa kết quả từ Gemini khớp với Pydantic schema
            valid_codes = {item["code"]: item for item in labels_catalog}
            clean_preds = []
            for p in gemini_preds:
                c = p.get("code")
                if c in valid_codes:
                    meta = valid_codes[c]
                    clean_preds.append({
                        "code": c,
                        "name_vi": p.get("name_vi", meta["name_vi"]),
                        "name_en": meta.get("name_en"),
                        "category": meta.get("category", p.get("category", "OTHER")),
                        "confidence": round(float(p.get("confidence", 0.95)), 3),
                        "estimated_grams": round(float(p.get("estimated_grams", meta.get("default_grams", 100.0))), 1)
                    })
            return clean_preds, f"gemini_vision_{model_name}"
            
    # Fallback cục bộ khi không có key hoặc offline
    local_preds = fallback_analyzer_fn(image_bytes, labels_catalog)
    return local_preds, "local_vision_fallback"
