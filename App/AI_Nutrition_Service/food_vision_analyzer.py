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
        "hsv": (15.0, 0.62, 0.85),
        "tol": (10.0, 0.20, 0.20),
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
        "hsv": (105.0, 0.55, 0.28),
        "tol": (20.0, 0.25, 0.16),
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
        "name_vi": "Cá rốt luộc",
        "category": "VEG",
        "hsv": (24.0, 0.75, 0.78),
        "tol": (10.0, 0.22, 0.20),
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
        "hsv": (64.0, 0.46, 0.72),
        "tol": (10.0, 0.18, 0.14),
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

def is_in_color_range(h: float, s: float, v: float, code: str) -> bool:
    """
    Kiểm tra xem cụm màu (h, s, v) có thực sự nằm trong khoảng dải màu (Range)
    hợp lệ của từng nguyên liệu cụ thể hay không, chống nhận diện chồng chéo.
    """
    # 1. Nhóm Thịt bò: Bắt buộc độ sáng thấp (V <= 0.46) và sắc đỏ nâu sẫm
    if code in ["beef_lean", "beef_ground"]:
        h_ok = (h >= 330.0 or h <= 26.0)
        return h_ok and (0.16 <= s <= 0.78) and (0.12 <= v <= 0.46)

    # 2. Cá hồi: Bắt buộc sắc hồng cam / cam san hô (H: 10 - 18 độ, S: 0.45 - 0.76, V >= 0.52)
    # Tuyệt đối không nhận nhầm sốt thịt bò sẫm màu (V < 0.48) hay cà rốt cam vàng (H > 18) thành cá hồi
    if code == "salmon":
        return (10.0 <= h <= 18.5) and (0.45 <= s <= 0.76) and (v >= 0.52)

    # 3. Cà rốt: Sắc cam vàng rực rỡ đặc trưng của cà rốt (H: 19 - 35 độ, V >= 0.48, S >= 0.48)
    if code == "carrot_boiled":
        return (19.0 <= h <= 35.0) and (s >= 0.48) and (v >= 0.48)

    # 4. Ức gà nướng / áp chảo: Vàng rơm / nâu vàng ấm gia cầm (V >= 0.48, Hue 28-55)
    # Không thể là thịt bò sẫm màu (V < 0.46) hay cá hồi cam (H < 28)
    if code == "chicken_breast":
        return (28.0 <= h <= 55.0) and (0.20 <= s <= 0.62) and (v >= 0.48)

    # 5. Má đùi gà: Nâu vàng sậm hơn ức gà
    if code == "chicken_thigh":
        return (24.0 <= h <= 46.0) and (0.25 <= s <= 0.68) and (0.36 <= v <= 0.78)

    # 6. Cá trắng / Cá rô phi: Trắng ngà, xám nhạt flaky, bão hòa thấp
    if code == "tilapia":
        return (22.0 <= h <= 55.0) and (0.06 <= s <= 0.28) and (v >= 0.56)

    # 7. Tôm luộc: Cam đỏ tươi xen trắng
    if code == "shrimp":
        return (8.0 <= h <= 26.0) and (s >= 0.46) and (v >= 0.58)

    # 8. Thịt heo nạc: Hồng nhạt / xám nhạt
    if code == "pork_tenderloin":
        return (12.0 <= h <= 28.0) and (0.16 <= s <= 0.40) and (v >= 0.48)

    # 9. Cơm trắng: Vùng tinh bột trắng ngà / kem, bão hòa rất thấp
    if code == "white_rice":
        return (0.04 <= s <= 0.18) and (0.70 <= v <= 0.95)

    # 10. Cơm gạo lứt: Nâu đỏ / tím than
    if code == "brown_rice":
        h_ok = (h >= 335.0 or h <= 28.0)
        return h_ok and (0.18 <= s <= 0.58) and (0.32 <= v <= 0.68)

    # 11. Bông cải xanh (Súp lơ xanh) / Rau bina: Xanh lá sẫm đậm (Forest Green), độ sáng tối đến vừa
    # Bắt buộc Hue >= 78.0 (không thể là màu vàng chanh của quả bơ H <= 74.0) và V <= 0.46
    if code in ["broccoli", "spinach"]:
        return (78.0 <= h <= 150.0) and (s >= 0.22) and (v <= 0.46)

    # 12. Quả bơ tươi (Avocado): Sắc xanh nõn chuối / vàng chanh đặc trưng (Lime / Chartreuse), độ sáng cao
    # Tuyệt đối không nhận nhầm bông cải xanh sẫm màu (H >= 78, V <= 0.46) thành quả bơ
    if code == "avocado":
        return (54.0 <= h <= 74.0) and (0.26 <= s <= 0.72) and (v >= 0.56)

    # 13. Xà lách / Dưa leo / Rau xanh tươi: Xanh tươi sáng
    if code in ["lettuce", "cucumber"]:
        return (75.0 <= h <= 150.0) and (s >= 0.18) and (v >= 0.38)

    # 13. Cà chua chín / Dưa hấu / Táo đỏ: Đỏ mọng tươi
    if code in ["tomato", "watermelon", "apple"]:
        h_ok = (h >= 340.0 or h <= 15.0)
        return h_ok and (s >= 0.45) and (v >= 0.38)

    # 14. Khoai lang ruột vàng cam:
    if code == "sweet_potato":
        return (22.0 <= h <= 48.0) and (s >= 0.42) and (v >= 0.48)

    # 15. Trứng ốp la / Trứng luộc: Lòng đỏ vàng đậm
    if code in ["egg_fried", "egg_whole"]:
        return (34.0 <= h <= 56.0) and (s >= 0.48) and (v >= 0.55)

    # 16. Yến mạch: Cháo xám ngà
    if code == "oats":
        return (22.0 <= h <= 50.0) and (0.08 <= s <= 0.32) and (0.50 <= v <= 0.82)

    # 17. Bánh mì đen / ngũ cốc:
    if code == "whole_wheat_bread":
        return (18.0 <= h <= 38.0) and (0.25 <= s <= 0.62) and (0.32 <= v <= 0.65)

    # Mặc định với các nguyên liệu khác: kiểm tra trong phạm vi dung sai 1.5 sigma
    return True

def compute_similarity(h: float, s: float, v: float, profile: Dict[str, Any], code: str) -> float:
    """
    Tính độ tương đồng Gaussian giữa cụm pixel (h, s, v) và hồ sơ nguyên liệu.
    Nếu màu nằm ngoài dải màu thực tế (range) của nguyên liệu đó -> Trả về 0.0.
    """
    if not is_in_color_range(h, s, v, code):
        return 0.0
        
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
    y_valid, x_valid = np.where(valid_mask)
    
    # Chuyển đổi sang tọa độ Descartes cho Hue để K-Means không bị lỗi biên 0°/360°
    h_rad = h_valid * (np.pi / 180.0)
    cos_h = np.cos(h_rad)
    sin_h = np.sin(h_rad)
    
    # Đặc trưng 4 chiều: [cos(H)*0.6, sin(H)*0.6, S*1.0, V*1.0]
    features = np.stack([cos_h * 0.6, sin_h * 0.6, s_valid * 1.0, v_valid * 1.0], axis=-1)
    
    # Lấy mẫu tối đa 3500 điểm để phân cụm K-Means tức thì (< 8ms)
    n_samples = min(len(features), 3500)
    idx_sample = np.random.choice(len(features), n_samples, replace=False)
    sampled_features = features[idx_sample]
    sampled_y = y_valid[idx_sample]
    sampled_x = x_valid[idx_sample]
    
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
        
        # 1. Đo độ sần sùi kết cấu bề mặt (Texture variance / Surface Granularity)
        cluster_pts = sampled_features[labels == c_idx]
        cluster_std_v = float(np.std(cluster_pts[:, 3])) if len(cluster_pts) > 0 else 0.05
        
        # 2. Đo tỷ lệ khung hình không gian (Morphological Aspect Ratio - Dạng sợi/dài vs Dạng khối/tròn)
        pts_y = sampled_y[labels == c_idx]
        pts_x = sampled_x[labels == c_idx]
        if len(pts_y) > 0:
            dy = float(np.ptp(pts_y) + 1)
            dx = float(np.ptp(pts_x) + 1)
            aspect_ratio = float(max(dy, dx) / max(min(dy, dx), 1.0))
        else:
            aspect_ratio = 1.0
            
        # 3. Đo độ bóng phản quang (Specular Gloss Index - Vỏ cà chua/ớt chuông bóng vs Cà rốt/khoai tây lì)
        cluster_gloss = float(np.mean((cluster_pts[:, 3] > 0.85) & (cluster_pts[:, 2] < 0.25))) if len(cluster_pts) > 0 else 0.0
        
        # Tìm nguyên liệu phù hợp nhất cho cụm này
        best_code = None
        best_score = 0.0
        
        # Kiểm tra xem đĩa thức ăn có xu hướng là bát ngũ cốc/yến mạch/sữa chua không
        is_breakfast_bowl = any(k in detected_items for k in ["oats", "greek_yogurt"])
        
        for code, profile in FOOD_PROFILES.items():
            # 1. Tính độ tương đồng màu sắc cơ bản (đã có kiểm tra hard color range)
            score = compute_similarity(c_h, c_s, c_v, profile, code)
            if score <= 0.0:
                continue

            # ==============================================================================
            # ĐỘNG CƠ PHÂN GIẢI ĐA ĐẶC TRƯNG CHỐNG NHẬN NHẦM CHO CÁC THỰC PHẨM CÙNG TÔNG MÀU
            # (Multi-Feature Disambiguation: Texture + Morphology + Specular Gloss + Context)
            # ==============================================================================

            # [Nhóm 1. THỰC PHẨM MÀU TRẮNG / NGÀ: Cơm trắng vs Đậu phụ vs Bún/Phở vs Súp lơ trắng vs Lòng trắng]
            if code == "rice_noodles" and aspect_ratio >= 2.5:
                score *= 1.35 # Dạng sợi dài mảnh liên tục -> Bún / Phở
            elif code in ["tofu_firm", "egg_white"] and aspect_ratio <= 1.8 and cluster_std_v <= 0.026:
                score *= 1.30 # Bề mặt phẳng mịn khối góc cạnh -> Đậu phụ / Lòng trắng
            elif code == "cauliflower" and cluster_std_v >= 0.038:
                score *= 1.35 # Cụm hoa súp lơ trắng sần sùi hạt li ti -> Súp lơ trắng
            elif code == "white_rice" and 0.022 <= cluster_std_v <= 0.045 and aspect_ratio <= 2.2:
                score *= 1.25 # Cụm hạt cơm dẻo kết tụ

            # [Nhóm 2. THỰC PHẨM MÀU XANH LÁ: Súp lơ xanh vs Quả bơ vs Dưa leo vs Xà lách vs Đậu que]
            if code == "broccoli" and cluster_std_v >= 0.030 and c_v <= 0.45:
                score *= 1.35 # Súp lơ xanh nụ hoa li ti sần sùi, độ sáng tối sẫm
            elif code == "avocado" and cluster_std_v <= 0.025 and c_v >= 0.58:
                score *= 1.30 # Quả bơ thịt mịn phẳng, màu vàng chanh / xanh nõn chuối sáng
            elif code in ["green_beans", "asparagus"] and aspect_ratio >= 2.6:
                score *= 1.35 # Thân cọng dài hình trụ -> Đậu que / Măng tây
            elif code == "lettuce" and c_v >= 0.40 and cluster_std_v >= 0.028:
                score *= 1.20 # Lá xà lách lượn sóng

            # [Nhóm 3. THỰC PHẨM MÀU VÀNG / CAM: Trứng ốp la vs Mì Ý vs Chuối vs Khoai lang]
            if code == "pasta_cooked" and aspect_ratio >= 2.8:
                score *= 1.35 # Sợi dài óng vàng -> Mì Ý
            elif code in ["egg_fried", "egg_whole"] and aspect_ratio <= 1.6 and c_s >= 0.55:
                score *= 1.30 # Điểm vàng đậm tròn tập trung -> Trứng gà
            elif code == "banana" and is_breakfast_bowl:
                score *= 1.40 # Lát chuối trong bữa sáng ngũ cốc

            # [Nhóm 4. THỰC PHẨM MÀU ĐỎ / CAM: Cà chua vs Cà rốt vs Cá hồi vs Tôm]
            if code in ["tomato", "bell_pepper"] and cluster_gloss >= 0.035:
                score *= 1.35 # Vỏ bóng phản quang cao -> Cà chua / Ớt chuông
            elif code == "carrot_boiled" and cluster_gloss < 0.03 and c_h >= 19.0:
                score *= 1.25 # Cà rốt luộc bề mặt lì, cam vàng
            elif code == "salmon" and c_h <= 18.5 and c_v >= 0.52:
                score *= 1.30 # Thớ cá hồi hồng cam san hô

            # [Nhóm 5. THỰC PHẨM MÀU NÂU: Thịt bò nạc vs Thịt bò xay vs Bánh mì đen]
            if code == "beef_ground" and cluster_std_v >= 0.036:
                score *= 1.25 # Thịt xay vụn nhỏ
            elif code == "beef_lean" and cluster_std_v < 0.036 and c_v <= 0.42:
                score *= 1.25 # Thịt bò miếng thăn áp chảo
            elif code == "whole_wheat_bread" and aspect_ratio <= 1.6 and 0.25 <= c_s <= 0.55:
                score *= 1.20 # Lát bánh mì đen vuông/tam giác

            cat = profile["category"]
            
            # Ngữ cảnh bữa sáng / bát yến mạch trái cây
            if is_breakfast_bowl:
                if code in ["banana", "apple", "almond", "walnut", "cashew", "peanut_butter"]:
                    score *= 1.35
                elif cat == "PROTEIN" and code not in ["greek_yogurt"]:
                    score *= 0.20 # Triệt tiêu nhầm lẫn trứng/thịt trong bát yến mạch
            
            # Ưu tiên các nguyên liệu gym phổ biến
            if code in ["chicken_breast", "beef_lean", "salmon", "white_rice", "lettuce", "broccoli", "egg_fried"]:
                score *= 1.15
            
            # Quy tắc cân bằng tự nhiên: nếu một món đã xuất hiện, cụm tiếp theo cùng màu sẽ cộng dồn
            if code in detected_items:
                score *= 1.10
                
            if score > best_score:
                best_score = score
                best_code = code
                
        # Ngưỡng tin cậy tối thiểu nghiêm ngặt (>= 0.45)
        if best_code and best_score >= 0.45:
            prof = FOOD_PROFILES[best_code]
            meta = code_to_meta.get(best_code, {})
            
            # Ước lượng số gram dựa trên diện tích vùng đĩa thức ăn
            base_g = prof["default_g"]
            min_g = prof["min_g"]
            max_g = prof["max_g"]
            scaled_g = round(base_g * (0.65 + 1.25 * frac), 1)
            final_g = float(np.clip(scaled_g, min_g, max_g))
            
            conf = min(0.96, 0.70 + best_score * 0.26)
            
            if best_code in detected_items:
                # Nếu cụm tiếp theo có cùng dải màu với món đã nhận diện -> Cộng dồn gram
                detected_items[best_code]["estimated_grams"] = min(
                    max_g, round(detected_items[best_code]["estimated_grams"] + final_g * 0.65, 1)
                )
                detected_items[best_code]["confidence"] = max(detected_items[best_code]["confidence"], conf)
            else:
                # Món mới ở dải màu khác biệt hoàn toàn -> Thêm vào danh sách các món trên đĩa
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
