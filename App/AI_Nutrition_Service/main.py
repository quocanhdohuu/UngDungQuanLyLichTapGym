import io
import os
import json
import time
from typing import List, Optional
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import onnxruntime as ort

# =====================================================
# CẤU HÌNH & KHỞI TẠO MÔ HÌNH TOÀN CỤC
# =====================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "nutrition_model.onnx")
LABELS_PATH = os.path.join(BASE_DIR, "data", "labels.json")

model_session: Optional[ort.InferenceSession] = None
labels_data: List[dict] = []
input_name: str = ""
output_names: List[str] = []

def load_resources():
    global model_session, labels_data, input_name, output_names
    if model_session is not None and len(labels_data) > 0:
        return
        
    print("[AI-Service] Đang tải nhãn dinh dưỡng...")
    if not os.path.exists(LABELS_PATH):
        raise FileNotFoundError(f"Không tìm thấy file nhãn tại {LABELS_PATH}")
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        labels_data = json.load(f)
    print(f"[AI-Service] Đã nạp thành công {len(labels_data)} nhãn nguyên liệu.")

    print(f"[AI-Service] Đang nạp mô hình ONNX từ {MODEL_PATH}...")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Không tìm thấy file mô hình ONNX tại {MODEL_PATH}")
    
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 2
    opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    
    model_session = ort.InferenceSession(MODEL_PATH, sess_options=opts)
    input_name = model_session.get_inputs()[0].name
    output_names = [o.name for o in model_session.get_outputs()]
    print(f"[AI-Service] Nạp mô hình thành công. Input: {input_name}, Outputs: {output_names}")

# Nạp sẵn khi import module
load_resources()

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_resources()
    yield
    print("[AI-Service] Đang giải phóng tài nguyên...")

app = FastAPI(
    title="GymPlan AI Nutrition Inference Service",
    description="Microservice suy luận nhận diện món ăn và ước lượng khối lượng (gram) từ ảnh chụp suất ăn dựa trên mô hình Multi-task ONNX",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# PYDANTIC SCHEMAS
# =====================================================
class IngredientPrediction(BaseModel):
    code: str
    name_vi: str
    name_en: Optional[str] = None
    category: str
    confidence: float
    estimated_grams: float

class PredictResponse(BaseModel):
    status: str
    inference_time_ms: float
    total_detected: int
    predictions: List[IngredientPrediction]

# =====================================================
# HÀM TIỀN XỬ LÝ ẢNH
# =====================================================
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224), Image.Resampling.BILINEAR)
        img_np = np.array(image, dtype=np.float32) / 255.0
        
        # Chuẩn hóa ImageNet
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_np = (img_np - mean) / std
        
        img_np = np.transpose(img_np, (2, 0, 1))
        img_np = np.expand_dims(img_np, axis=0)
        return img_np.astype(np.float32)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc và xử lý file ảnh: {str(e)}")

# =====================================================
# API ENDPOINTS
# =====================================================
@app.get("/health", tags=["System"])
def health_check():
    """Kiểm tra tình trạng hoạt động của AI Microservice"""
    return {
        "status": "healthy",
        "service": "AI Nutrition Inference Service",
        "model_loaded": model_session is not None,
        "classes_count": len(labels_data),
        "onnx_model_path": MODEL_PATH
    }

@app.get("/labels", tags=["Catalog"])
def get_labels():
    """Lấy danh sách các nguyên liệu AI hỗ trợ nhận diện"""
    return {
        "total": len(labels_data),
        "labels": labels_data
    }

@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_meal(
    file: UploadFile = File(..., description="File ảnh món ăn (JPEG/PNG/WEBP)"),
    threshold: float = Query(0.20, ge=0.0, le=1.0, description="Ngưỡng xác suất tối thiểu để chấp nhận nguyên liệu"),
    top_k: int = Query(5, ge=1, le=15, description="Số lượng nguyên liệu tối đa trả về")
):
    """
    Nhận diện món ăn và ước tính khối lượng gram từ ảnh chụp suất ăn:
    - Nhận file ảnh qua multipart/form-data
    - Chạy suy luận qua ONNX Runtime
    - Trả về danh sách nguyên liệu, độ tin cậy và khối lượng gram gợi ý
    """
    if model_session is None:
        raise HTTPException(status_code=500, detail="Mô hình AI chưa được nạp sẵn sàng.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File ảnh rỗng.")

    # 1. Tiền xử lý ảnh
    input_tensor = preprocess_image(contents)

    # 2. Suy luận qua ONNX Runtime
    t_start = time.perf_counter()
    logits, mass_preds = model_session.run(output_names, {input_name: input_tensor})
    t_infer_ms = (time.perf_counter() - t_start) * 1000

    # 3. Tính toán xác suất (Sigmoid) và trích xuất nguyên liệu
    probs = 1.0 / (1.0 + np.exp(-logits[0]))
    mass = mass_preds[0]

    sorted_indices = np.argsort(probs)[::-1]
    
    predictions = []
    for idx in sorted_indices:
        prob = float(probs[idx])
        if prob < threshold and len(predictions) >= 2:
            break
        if len(predictions) >= top_k:
            break
            
        label_info = labels_data[idx]
        raw_grams = round(float(mass[idx]), 1)
        default_grams = float(label_info.get("default_grams", 100.0))
        final_grams = raw_grams if raw_grams >= 15.0 else default_grams

        predictions.append(
            IngredientPrediction(
                code=label_info["code"],
                name_vi=label_info["name_vi"],
                name_en=label_info.get("name_en"),
                category=label_info.get("category", "OTHER"),
                confidence=round(prob, 4),
                estimated_grams=round(final_grams, 1)
            )
        )

    return PredictResponse(
        status="success",
        inference_time_ms=round(t_infer_ms, 2),
        total_detected=len(predictions),
        predictions=predictions
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    print(f"[AI-Service] Đang khởi động FastAPI tại http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
