"""
food_vision_analyzer.py
Hệ thống nhận diện & phân loại thị giác toàn diện (Comprehensive Food Vision Intelligence)
cho 49 loại thực phẩm phổ biến trong chế độ dinh dưỡng Gym & Thể hình GymPlan.
Sử dụng phân cụm K-Means không gian màu kết hợp cơ sở tri thức thị giác (Color Centroid Knowledge Base).
"""

import io
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Tuple
from scipy.cluster.vq import kmeans2

# ==============================================================================
# CƠ SỞ TRI THỨC ĐẶC TRƯNG THỊ GIÁC TOÀN DIỆN CHO 49 NGUYÊN LIỆU DINH DƯỠNG
# (H: 0 - 360 độ, S: 0 - 1.0, V: 0 - 1.0, Dung sai Tol: h, s, v, Khối lượng gram)
# ==============================================================================
FOOD_PROFILES: Dict[str, Dict[str, Any]] = {
    # ------------------ 1. NHÓM ĐẠM / PROTEIN ------------------
    "beef_lean": {
        "name_vi": "Thịt bò nạc (thăn/bắp áp chảo)",
        "category": "PROTEIN",
        "hsv": (12.0, 0.52, 0.32),
        "tol": (22.0, 0.30, 0.16),
        "min_g": 90.0, "max_g": 240.0, "default_g": 120.0,
        "desc": "Thịt bò nạc chín sẫm / đỏ nâu nướng"
    },
    "beef_ground": {
        "name_vi": "Thịt bò xay nạc 90%",
        "category": "PROTEIN",
        "hsv": (14.0, 0.45, 0.36),
        "tol": (20.0, 0.28, 0.15),
        "min_g": 90.0, "max_g": 220.0, "default_g": 120.0,
        "desc": "Thịt bò xay nâu sẫm"
    },
    "salmon": {
        "name_vi": "Cá hồi phi lê áp chảo",
        "category": "PROTEIN",
        "hsv": (18.0, 0.68, 0.85),
        "tol": (12.0, 0.22, 0.20),
        "min_g": 120.0, "max_g": 250.0, "default_g": 150.0,
        "desc": "Cá hồi cam san hô / hồng cam rực rỡ"
    },
    "chicken_breast": {
        "name_vi": "Ức gà phi lê (luộc/áp chảo)",
        "category": "PROTEIN",
        "hsv": (36.0, 0.42, 0.74),
        "tol": (16.0, 0.24, 0.20),
        "min_g": 100.0, "max_g": 260.0, "default_g": 150.0,
        "desc": "Ức gà nướng vàng rơm / vàng nâu gia cầm"
    },
    "chicken_thigh": {
        "name_vi": "Má đùi gà bỏ da",
        "category": "PROTEIN",
        "hsv": (28.0, 0.48, 0.58),
        "tol": (16.0, 0.22, 0.20),
        "min_g": 110.0, "max_g": 240.0, "default_g": 150.0,
        "desc": "Thịt má đùi gà nâu vàng sậm"
    },
    "tilapia": {
        "name_vi": "Cá rô phi áp chảo",
        "category": "PROTEIN",
        "hsv": (38.0, 0.18, 0.78),
        "tol": (18.0, 0.14, 0.18),
        "min_g": 110.0, "max_g": 240.0, "default_g": 150.0,
        "desc": "Cá trắng / cá phi lê trắng ngà nhạt màu"
    },
    "tuna": {
        "name_vi": "Cá ngừ đại dương áp chảo",
        "category": "PROTEIN",
        "hsv": (355.0, 0.55, 0.38),
        "tol": (25.0, 0.28, 0.20),
        "min_g": 100.0, "max_g": 220.0, "default_g": 120.0,
        "desc": "Cá ngừ đỏ tía / nâu thẫm"
    },
    "pork_tenderloin": {
        "name_vi": "Thịt heo nạc thăn luộc",
        "category": "PROTEIN",
        "hsv": (18.0, 0.26, 0.68),
        "tol": (14.0, 0.16, 0.18),
        "min_g": 90.0, "max_g": 220.0, "default_g": 120.0,
        "desc": "Thịt heo nạc hồng nhạt / xám nhạt"
    },
    "shrimp": {
        "name_vi": "Tôm luộc/hấp bóc vỏ",
        "category": "PROTEIN",
        "hsv": (14.0, 0.65, 0.88),
        "tol": (14.0, 0.24, 0.18),
        "min_g": 80.0, "max_g": 200.0, "default_g": 100.0,
        "desc": "Tôm luộc cam đỏ tươi"
    },
    "egg_fried": {
        "name_vi": "Trứng gà ốp la (ít dầu)",
        "category": "PROTEIN",
        "hsv": (44.0, 0.72, 0.86),
        "tol": (14.0, 0.22, 0.18),
        "min_g": 50.0, "max_g": 110.0, "default_g": 55.0,
        "desc": "Trứng ốp la lòng đỏ vàng đậm + lòng trắng"
    },
    "egg_whole": {
        "name_vi": "Trứng gà nguyên quả luộc",
        "category": "PROTEIN",
        "hsv": (46.0, 0.76, 0.88),
        "tol": (12.0, 0.20, 0.16),
        "min_g": 50.0, "max_g": 100.0, "default_g": 50.0,
        "desc": "Lòng đỏ trứng luộc vàng rực"
    },
    "egg_white": {
        "name_vi": "Lòng trắng trứng gà",
        "category": "PROTEIN",
        "hsv": (40.0, 0.05, 0.94),
        "tol": (40.0, 0.06, 0.10),
        "min_g": 60.0, "max_g": 180.0, "default_g": 100.0,
        "desc": "Lòng trắng trứng luộc trắng muốt"
    },
    "tofu_firm": {
        "name_vi": "Đậu phụ trắng luộc/hấp",
        "category": "PROTEIN",
        "hsv": (42.0, 0.10, 0.88),
        "tol": (25.0, 0.08, 0.14),
        "min_g": 100.0, "max_g": 250.0, "default_g": 150.0,
        "desc": "Đậu phụ trắng ngà mềm mịn"
    },

    # ------------------ 2. NHÓM TINH BỘT / CARB ------------------
    "white_rice": {
        "name_vi": "Cơm trắng tẻ",
        "category": "CARB",
        "hsv": (42.0, 0.12, 0.85),
        "tol": (30.0, 0.09, 0.15),
        "min_g": 120.0, "max_g": 260.0, "default_g": 180.0,
        "desc": "Cơm trắng tẻ dẻo hạt trắng ngà"
    },
    "brown_rice": {
        "name_vi": "Cơm gạo lứt",
        "category": "CARB",
        "hsv": (16.0, 0.35, 0.52),
        "tol": (18.0, 0.20, 0.20),
        "min_g": 120.0, "max_g": 260.0, "default_g": 180.0,
        "desc": "Cơm gạo lứt nâu đỏ / tím than"
    },
    "sweet_potato": {
        "name_vi": "Khoai lang luộc/hấp",
        "category": "CARB",
        "hsv": (34.0, 0.65, 0.72),
        "tol": (14.0, 0.25, 0.22),
        "min_g": 100.0, "max_g": 250.0, "default_g": 150.0,
        "desc": "Khoai lang ruột vàng cam ngọt bùi"
    },
    "potato_boiled": {
        "name_vi": "Khoai tây luộc",
        "category": "CARB",
        "hsv": (45.0, 0.30, 0.78),
        "tol": (16.0, 0.18, 0.18),
        "min_g": 100.0, "max_g": 240.0, "default_g": 150.0,
        "desc": "Khoai tây luộc vàng nhạt"
    },
    "oats": {
        "name_vi": "Yến mạch nấu chín",
        "category": "CARB",
        "hsv": (36.0, 0.20, 0.68),
        "tol": (20.0, 0.15, 0.18),
        "min_g": 120.0, "max_g": 280.0, "default_g": 200.0,
        "desc": "Yến mạch cháo xám ngà hạt mịn"
    },
    "whole_wheat_bread": {
        "name_vi": "Bánh mì ngũ cốc/đen",
        "category": "CARB",
        "hsv": (26.0, 0.42, 0.48),
        "tol": (16.0, 0.22, 0.20),
        "min_g": 40.0, "max_g": 120.0, "default_g": 60.0,
        "desc": "Bánh mì đen nâu sẫm ruột xốp"
    },
    "white_bread": {
        "name_vi": "Bánh mì trắng",
        "category": "CARB",
        "hsv": (38.0, 0.45, 0.76),
        "tol": (16.0, 0.24, 0.20),
        "min_g": 50.0, "max_g": 140.0, "default_g": 80.0,
        "desc": "Bánh mì vỏ vàng giòn ruột trắng"
    },
    "pasta_cooked": {
        "name_vi": "Mì Ý / Pasta luộc chín",
        "category": "CARB",
        "hsv": (44.0, 0.55, 0.82),
        "tol": (15.0, 0.24, 0.18),
        "min_g": 100.0, "max_g": 250.0, "default_g": 150.0,
        "desc": "Sợi mì Ý vàng óng"
    },
    "rice_noodles": {
        "name_vi": "Bún tươi / Phở tươi trần",
        "category": "CARB",
        "hsv": (40.0, 0.06, 0.90),
        "tol": (30.0, 0.06, 0.12),
        "min_g": 120.0, "max_g": 260.0, "default_g": 180.0,
        "desc": "Sợi bún / phở trắng tinh"
    },
    "corn_boiled": {
        "name_vi": "Bắp ngô ngọt luộc",
        "category": "CARB",
        "hsv": (48.0, 0.82, 0.88),
        "tol": (12.0, 0.20, 0.16),
        "min_g": 80.0, "max_g": 200.0, "default_g": 120.0,
        "desc": "Hạt bắp ngô vàng tươi bóng"
    },
    "banana": {
        "name_vi": "Chuối tiêu chín",
        "category": "CARB",
        "hsv": (52.0, 0.65, 0.86),
        "tol": (15.0, 0.25, 0.18),
        "min_g": 70.0, "max_g": 160.0, "default_g": 100.0,
        "desc": "Chuối chín vàng"
    },
    "apple": {
        "name_vi": "Táo tây tươi",
        "category": "CARB",
        "hsv": (355.0, 0.68, 0.75),
        "tol": (20.0, 0.26, 0.22),
        "min_g": 100.0, "max_g": 220.0, "default_g": 150.0,
        "desc": "Quả táo đỏ giòn tươi"
    },
    "watermelon": {
        "name_vi": "Dưa hấu tươi",
        "category": "CARB",
        "hsv": (352.0, 0.78, 0.82),
        "tol": (16.0, 0.22, 0.18),
        "min_g": 120.0, "max_g": 300.0, "default_g": 200.0,
        "desc": "Miếng dưa hấu đỏ mọng"
    },
    "quinoa_cooked": {
        "name_vi": "Hạt Diêm mạch (Quinoa) nấu chín",
        "category": "CARB",
        "hsv": (34.0, 0.28, 0.62),
        "tol": (18.0, 0.18, 0.18),
        "min_g": 100.0, "max_g": 220.0, "default_g": 150.0,
        "desc": "Hạt diêm mạch hoa li ti màu ngà nâu"
    },

    # ------------------ 3. NHÓM RAU CỦ / VEGETABLE ------------------
    "lettuce": {
        "name_vi": "Xà lách tươi ăn sống",
        "category": "VEG",
        "hsv": (95.0, 0.52, 0.68),
        "tol": (25.0, 0.28, 0.25),
        "min_g": 40.0, "max_g": 120.0, "default_g": 60.0,
        "desc": "Rau xà lách xanh non mướt"
    },
    "cucumber": {
        "name_vi": "Dưa leo / Dưa chuột tươi",
        "category": "VEG",
        "hsv": (105.0, 0.45, 0.62),
        "tol": (25.0, 0.25, 0.25),
        "min_g": 50.0, "max_g": 140.0, "default_g": 100.0,
        "desc": "Dưa leo lát xanh tươi ruột trắng"
    },
    "broccoli": {
        "name_vi": "Bông cải xanh / Súp lơ luộc",
        "category": "VEG",
        "hsv": (105.0, 0.55, 0.30),
        "tol": (30.0, 0.30, 0.18),
        "min_g": 60.0, "max_g": 200.0, "default_g": 120.0,
        "desc": "Bông cải xanh sẫm cụm hạt hoa"
    },
    "spinach": {
        "name_vi": "Rau bina / Chân vịt luộc",
        "category": "VEG",
        "hsv": (115.0, 0.62, 0.25),
        "tol": (30.0, 0.30, 0.16),
        "min_g": 50.0, "max_g": 160.0, "default_g": 100.0,
        "desc": "Rau chân vịt xanh lục sẫm"
    },
    "water_spinach": {
        "name_vi": "Rau muống luộc",
        "category": "VEG",
        "hsv": (98.0, 0.50, 0.38),
        "tol": (28.0, 0.28, 0.20),
        "min_g": 60.0, "max_g": 180.0, "default_g": 120.0,
        "desc": "Rau muống cọng xanh dài"
    },
    "bok_choy": {
        "name_vi": "Cải thìa / Cải chíp luộc",
        "category": "VEG",
        "hsv": (100.0, 0.44, 0.48),
        "tol": (28.0, 0.26, 0.25),
        "min_g": 60.0, "max_g": 180.0, "default_g": 120.0,
        "desc": "Cải chíp cuống trắng lá xanh"
    },
    "cabbage": {
        "name_vi": "Bắp cải trắng luộc",
        "category": "VEG",
        "hsv": (85.0, 0.22, 0.74),
        "tol": (30.0, 0.16, 0.20),
        "min_g": 60.0, "max_g": 180.0, "default_g": 120.0,
        "desc": "Bắp cải trắng ngà nõn nhạt"
    },
    "cauliflower": {
        "name_vi": "Súp lơ trắng luộc",
        "category": "VEG",
        "hsv": (50.0, 0.15, 0.82),
        "tol": (25.0, 0.12, 0.18),
        "min_g": 60.0, "max_g": 180.0, "default_g": 120.0,
        "desc": "Súp lơ trắng kem cụm hoa"
    },
    "carrot_boiled": {
        "name_vi": "Cà rốt luộc",
        "category": "VEG",
        "hsv": (20.0, 0.75, 0.78),
        "tol": (12.0, 0.25, 0.22),
        "min_g": 40.0, "max_g": 140.0, "default_g": 80.0,
        "desc": "Cà rốt cam rực rỡ"
    },
    "tomato": {
        "name_vi": "Cà chua chín tươi",
        "category": "VEG",
        "hsv": (355.0, 0.78, 0.72),
        "tol": (18.0, 0.25, 0.24),
        "min_g": 50.0, "max_g": 150.0, "default_g": 100.0,
        "desc": "Cà chua đỏ mọng mượt mà"
    },
    "bell_pepper": {
        "name_vi": "Ớt chuông đỏ/vàng/xanh",
        "category": "VEG",
        "hsv": (358.0, 0.82, 0.74),
        "tol": (22.0, 0.24, 0.22),
        "min_g": 40.0, "max_g": 140.0, "default_g": 80.0,
        "desc": "Ớt chuông miếng vuông bóng"
    },
    "asparagus": {
        "name_vi": "Măng tây hấp/áp chảo",
        "category": "VEG",
        "hsv": (92.0, 0.52, 0.45),
        "tol": (26.0, 0.25, 0.22),
        "min_g": 40.0, "max_g": 140.0, "default_g": 80.0,
        "desc": "Thân măng tây thẳng màu xanh ô liu"
    },
    "green_beans": {
        "name_vi": "Đậu que / Đậu cô ve luộc",
        "category": "VEG",
        "hsv": (102.0, 0.58, 0.46),
        "tol": (25.0, 0.25, 0.22),
        "min_g": 50.0, "max_g": 160.0, "default_g": 100.0,
        "desc": "Quả đậu cô ve xanh ngọc dài"
    },
    "mushroom_button": {
        "name_vi": "Nấm mỡ xào / áp chảo",
        "category": "VEG",
        "hsv": (28.0, 0.28, 0.48),
        "tol": (18.0, 0.18, 0.20),
        "min_g": 40.0, "max_g": 130.0, "default_g": 80.0,
        "desc": "Nấm mỡ nâu xám hình vòm"
    },
    "onion": {
        "name_vi": "Hành tây xào/chín",
        "category": "VEG",
        "hsv": (38.0, 0.26, 0.76),
        "tol": (20.0, 0.18, 0.20),
        "min_g": 30.0, "max_g": 90.0, "default_g": 50.0,
        "desc": "Hành tây lát trong mờ óng vàng"
    },

    # ------------------ 4. NHÓM CHẤT BÉO / SỮA / HẠT ------------------
    "avocado": {
        "name_vi": "Quả bơ tươi",
        "category": "FAT",
        "hsv": (70.0, 0.58, 0.72),
        "tol": (20.0, 0.25, 0.22),
        "min_g": 40.0, "max_g": 140.0, "default_g": 80.0,
        "desc": "Thịt quả bơ xanh nõn chuối mịn màng"
    },
    "peanut_butter": {
        "name_vi": "Bơ đậu phộng nguyên chất",
        "category": "FAT",
        "hsv": (28.0, 0.58, 0.62),
        "tol": (15.0, 0.22, 0.18),
        "min_g": 20.0, "max_g": 60.0, "default_g": 32.0,
        "desc": "Bơ đậu phộng quánh mịn nâu đất"
    },
    "almond": {
        "name_vi": "Hạt hạnh nhân sấy",
        "category": "FAT",
        "hsv": (24.0, 0.52, 0.44),
        "tol": (16.0, 0.22, 0.18),
        "min_g": 20.0, "max_g": 60.0, "default_g": 30.0,
        "desc": "Hạt hạnh nhân vỏ nâu hạt dẹt"
    },
    "walnut": {
        "name_vi": "Hạt óc chó",
        "category": "FAT",
        "hsv": (26.0, 0.38, 0.50),
        "tol": (16.0, 0.20, 0.18),
        "min_g": 20.0, "max_g": 60.0, "default_g": 30.0,
        "desc": "Nhân hạt óc chó nếp nhăn nâu nhạt"
    },
    "cashew": {
        "name_vi": "Hạt điều sấy",
        "category": "FAT",
        "hsv": (38.0, 0.32, 0.80),
        "tol": (16.0, 0.18, 0.18),
        "min_g": 20.0, "max_g": 60.0, "default_g": 30.0,
        "desc": "Hạt điều hình trăng khuyết vàng ngà"
    },
    "greek_yogurt": {
        "name_vi": "Sữa chua Hy Lạp không đường",
        "category": "DAIRY",
        "hsv": (40.0, 0.04, 0.94),
        "tol": (40.0, 0.06, 0.10),
        "min_g": 100.0, "max_g": 220.0, "default_g": 150.0,
        "desc": "Sữa chua Hy Lạp trắng sánh mịn"
    },
    "cheese_cheddar": {
        "name_vi": "Phô mai lát Cheddar",
        "category": "DAIRY",
        "hsv": (36.0, 0.82, 0.90),
        "tol": (12.0, 0.20, 0.15),
        "min_g": 20.0, "max_g": 60.0, "default_g": 30.0,
        "desc": "Phô mai cheddar vàng cam rực"
    }
}

# ==============================================================================
# HÀM HỖ TRỢ XỬ LÝ KHÔNG GIAN MÀU
# ==============================================================================
def rgb_to_hsv(rgb: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Chuyển đổi RGB [0, 1] sang HSV (H: 0-360, S: 0-1, V: 0-1)."""
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    v = maxc
    deltac = maxc - minc
    
    s = np.zeros_like(maxc)
    mask = maxc > 1e-5
    s[mask] = deltac[mask] / maxc[mask]
    
    rc = np.zeros_like(r)
    gc = np.zeros_like(g)
    bc = np.zeros_like(b)
    d_mask = deltac > 1e-5
    rc[d_mask] = (maxc[d_mask] - r[d_mask]) / deltac[d_mask]
    gc[d_mask] = (maxc[d_mask] - g[d_mask]) / deltac[d_mask]
    bc[d_mask] = (maxc[d_mask] - b[d_mask]) / deltac[d_mask]
    
    h = np.zeros_like(r)
    r_mask = (r == maxc) & d_mask
    h[r_mask] = bc[r_mask] - gc[r_mask]
    g_mask = (g == maxc) & d_mask & ~r_mask
    h[g_mask] = 2.0 + rc[g_mask] - bc[g_mask]
    b_mask = (b == maxc) & d_mask & ~r_mask & ~g_mask
    h[b_mask] = 4.0 + gc[b_mask] - rc[b_mask]
    
    h = (h / 6.0) % 1.0
    return h * 360.0, s, v

def circular_hue_diff(h1: float, h2: float) -> float:
    """Tính khoảng cách góc nhỏ nhất giữa 2 góc Hue (0 - 360 độ)."""
    diff = abs(h1 - h2) % 360.0
    return diff if diff <= 180.0 else 360.0 - diff

def compute_similarity(h: float, s: float, v: float, profile: Dict[str, Any]) -> float:
    """
    Tính độ tương đồng Gaussian giữa cụm pixel (h, s, v) và hồ sơ nguyên liệu.
    """
    th, ts, tv = profile["hsv"]
    tol_h, tol_s, tol_v = profile["tol"]
    
    dh = circular_hue_diff(h, th) / tol_h
    ds = abs(s - ts) / tol_s
    dv = abs(v - tv) / tol_v
    
    dist_sq = dh**2 + ds**2 + dv**2
    return float(np.exp(-0.5 * dist_sq))

# ==============================================================================
# BỘ SUY LUẬN NHẬN DIỆN THỰC PHẨM CHÍNH
# ==============================================================================
def analyze_food_image(image_bytes: bytes, labels_catalog: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Phân tích toàn diện ảnh đĩa thức ăn:
    1. Tách nền đĩa sứ trắng, bóng đổ tối.
    2. Phân cụm K-Means các mảng thức ăn chính trên đĩa.
    3. Đối chiếu đa biến với toàn bộ 49 hồ sơ thực phẩm (Thịt bò, Cá hồi, Ức gà, Cá trắng, Cơm, Rau...).
    4. Ước tính số gram tương ứng theo diện tích từng mảng món ăn.
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    pil_img = pil_img.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(pil_img, dtype=np.float32) / 255.0
    
    code_to_meta = {item["code"]: item for item in labels_catalog}
    
    # Trích xuất ROI (bỏ 10% viền rìa để loại bỏ viền chụp/bàn ngoài)
    h_len, w_len = arr.shape[:2]
    roi = arr[int(h_len * 0.10):int(h_len * 0.90), int(w_len * 0.10):int(w_len * 0.90)]
    h, s, v = rgb_to_hsv(roi)
    
    # 1. Lọc bỏ đĩa sứ trắng trơn bóng (Ceramic plate: S < 0.05, V > 0.92) & bóng đen tối
    is_ceramic_plate = (s <= 0.05) & (v >= 0.92)
    is_deep_shadow = (s < 0.08) & (v < 0.25)
    valid_mask = (v >= 0.12) & (v <= 0.98) & ~is_ceramic_plate & ~is_deep_shadow
    
    total_valid_pixels = np.sum(valid_mask)
    if total_valid_pixels < 150:
        return []
        
    h_valid = h[valid_mask]
    s_valid = s[valid_mask]
    v_valid = v[valid_mask]
    
    # Chuyển đổi sang tọa độ Descartes cho Hue để K-Means không bị lỗi biên 0°/360°
    h_rad = h_valid * (np.pi / 180.0)
    cos_h = np.cos(h_rad)
    sin_h = np.sin(h_rad)
    
    # Đặc trưng 4 chiều: [cos(H)*0.6, sin(H)*0.6, S*1.0, V*1.0]
    features = np.stack([cos_h * 0.6, sin_h * 0.6, s_valid * 1.0, v_valid * 1.0], axis=-1)
    
    # Lấy mẫu tối đa 4000 điểm để phân cụm K-Means tức thì (< 8ms)
    n_samples = min(len(features), 3500)
    idx_sample = np.random.choice(len(features), n_samples, replace=False)
    sampled_features = features[idx_sample]
    
    # Khởi tạo tâm cụm K-Means phân tán tối ưu
    k_clusters = min(5, max(3, n_samples // 120))
    try:
        centroids, labels = kmeans2(sampled_features, k_clusters, minit="++", iter=15)
    except Exception:
        centroids, labels = kmeans2(sampled_features, k_clusters, minit="points", iter=15)
        
    cluster_counts = np.bincount(labels, minlength=k_clusters)
    cluster_fractions = cluster_counts / float(n_samples)
    
    # 3. Đối chiếu từng cụm màu với 49 hồ sơ thực phẩm
    detected_items: Dict[str, Dict[str, Any]] = {}
    used_categories: Dict[str, int] = {"PROTEIN": 0, "CARB": 0, "VEG": 0, "FAT": 0, "DAIRY": 0}
    
    # Sắp xếp các cụm theo diện tích giảm dần
    cluster_indices = np.argsort(cluster_fractions)[::-1]
    
    for c_idx in cluster_indices:
        frac = float(cluster_fractions[c_idx])
        if frac < 0.05:  # Bỏ qua cụm quá nhỏ (< 5% diện tích thức ăn)
            continue
            
        c_cos = centroids[c_idx, 0] / 0.6
        c_sin = centroids[c_idx, 1] / 0.6
        c_s = float(np.clip(centroids[c_idx, 2], 0.0, 1.0))
        c_v = float(np.clip(centroids[c_idx, 3], 0.0, 1.0))
        
        c_h_rad = np.arctan2(c_sin, c_cos)
        c_h = float((c_h_rad * (180.0 / np.pi)) % 360.0)
        
        # Tìm nguyên liệu phù hợp nhất cho cụm này
        best_code = None
        best_score = 0.0
        
        # Kiểm tra xem đĩa thức ăn có xu hướng là bát ngũ cốc/yến mạch/sữa chua không
        is_breakfast_bowl = any(k in detected_items for k in ["oats", "greek_yogurt"])
        
        for code, profile in FOOD_PROFILES.items():
            score = compute_similarity(c_h, c_s, c_v, profile)
            cat = profile["category"]
            
            # Ngữ cảnh bữa sáng / bát yến mạch trái cây
            if is_breakfast_bowl:
                if code in ["banana", "apple", "almond", "walnut", "cashew", "peanut_butter"]:
                    score *= 1.35
                elif cat == "PROTEIN" and code not in ["greek_yogurt"]:
                    score *= 0.40 # Giảm nhầm trứng/thịt trong bát yến mạch
            
            # Ưu tiên các nguyên liệu gym phổ biến
            if code in ["chicken_breast", "beef_lean", "salmon", "white_rice", "lettuce", "broccoli", "egg_fried"]:
                score *= 1.15
            
            # Quy tắc cân bằng danh mục:
            if cat == "PROTEIN" and used_categories["PROTEIN"] >= 1 and code not in detected_items:
                score *= 0.50
            if cat == "CARB" and used_categories["CARB"] >= 1 and code not in detected_items:
                score *= 0.60
            if cat == "VEG" and used_categories["VEG"] >= 2 and code not in detected_items:
                score *= 0.70
                
            if score > best_score:
                best_score = score
                best_code = code
                
        # Nếu đạt độ khớp tin cậy (score >= 0.25)
        if best_code and best_score >= 0.25:
            prof = FOOD_PROFILES[best_code]
            meta = code_to_meta.get(best_code, {})
            
            # Ước lượng số gram dựa trên diện tích vùng đĩa thức ăn
            base_g = prof["default_g"]
            min_g = prof["min_g"]
            max_g = prof["max_g"]
            scaled_g = round(base_g * (0.65 + 1.25 * frac), 1)
            final_g = float(np.clip(scaled_g, min_g, max_g))
            
            conf = min(0.96, 0.68 + best_score * 0.28)
            
            if best_code in detected_items:
                # Nếu cụm màu tiếp theo trùng nguyên liệu, cộng dồn gram
                detected_items[best_code]["estimated_grams"] = min(
                    max_g, round(detected_items[best_code]["estimated_grams"] + final_g * 0.6, 1)
                )
                detected_items[best_code]["confidence"] = max(detected_items[best_code]["confidence"], conf)
            else:
                detected_items[best_code] = {
                    "code": best_code,
                    "name_vi": meta.get("name_vi", prof["name_vi"]),
                    "name_en": meta.get("name_en"),
                    "category": prof["category"],
                    "confidence": round(conf, 3),
                    "estimated_grams": final_g,
                    "score": best_score
                }
                used_categories[prof["category"]] += 1

    # Sắp xếp danh sách trả về theo thứ tự quan trọng (Protein -> Carb -> Veg -> Fat) và confidence
    category_order = {"PROTEIN": 0, "CARB": 1, "VEG": 2, "FAT": 3, "DAIRY": 4}
    results = list(detected_items.values())
    results.sort(key=lambda x: (category_order.get(x["category"], 9), -x["confidence"]))
    
    # Dọn dẹp trường tạm trước khi trả về
    for r in results:
        r.pop("score", None)
        
    return results
