-- =====================================================
-- BẢNG PHÂN HỆ THEO DÕI DINH DƯỠNG (NUTRITION TRACKING)
-- =====================================================

USE QuanLyLichTapGym;

-- 1. BẢNG DANH MỤC NGUYÊN LIỆU VÀ HỆ SỐ DINH DƯỠNG TRÊN 1 GRAM
CREATE TABLE IF NOT EXISTS NutritionIngredients (
    ingredientId INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,                       -- Mã định danh cho AI (vd: 'chicken_breast', 'white_rice')
    nameVi VARCHAR(150) NOT NULL,                           -- Tên tiếng Việt hiển thị
    nameEn VARCHAR(150) NULL,                               -- Tên tiếng Anh (Nutrition5k)
    category ENUM('PROTEIN', 'CARB', 'FAT', 'VEG', 'FRUIT', 'DAIRY', 'BEVERAGE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    kcalPerGram DECIMAL(6,4) NOT NULL,                      -- Lượng Calo trên 1 gram thực phẩm
    proteinPerGram DECIMAL(6,4) NOT NULL,                   -- Lượng Protein (g) trên 1 gram thực phẩm
    carbPerGram DECIMAL(6,4) NOT NULL,                      -- Lượng Carb (g) trên 1 gram thực phẩm
    fatPerGram DECIMAL(6,4) NOT NULL,                       -- Lượng Fat (g) trên 1 gram thực phẩm
    servingSizeGrams DECIMAL(6,2) NOT NULL DEFAULT 100.00,  -- Khẩu phần mặc định gợi ý (g)
    isAiSupported BOOLEAN NOT NULL DEFAULT TRUE,            -- Mô hình Vision có nhận diện được món này không
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ingredient_code (code),
    INDEX idx_ingredient_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG NHẬT KÝ BỮA ĂN (TỔNG HỢP THEO LẦN NẠP)
CREATE TABLE IF NOT EXISTS NutritionMealLogs (
    mealLogId INT AUTO_INCREMENT PRIMARY KEY,
    profileId INT NOT NULL,                                 -- Tham chiếu tới GymUsers(profileId)
    mealType ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT') NOT NULL DEFAULT 'LUNCH',
    mealDate DATE NOT NULL,                                 -- Ngày ăn (YYYY-MM-DD)
    imageUrl VARCHAR(500) NULL,                             -- Đường dẫn ảnh trên Cloudinary
    totalKcal DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    totalProtein DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    totalCarb DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    totalFat DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    note VARCHAR(255) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_nutrition_meal_user
        FOREIGN KEY (profileId)
        REFERENCES GymUsers(profileId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_meal_user_date (profileId, mealDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG CHI TIẾT NGUYÊN LIỆU TRONG TỪNG BỮA ĂN (LƯU FEEDBACK AI ĐỂ PHỤC VỤ ACTIVE LEARNING)
CREATE TABLE IF NOT EXISTS NutritionMealLogItems (
    itemId INT AUTO_INCREMENT PRIMARY KEY,
    mealLogId INT NOT NULL,
    ingredientId INT NOT NULL,
    aiConfidence DECIMAL(5,4) NULL,                         -- Độ tin cậy AI dự đoán (0.0000 - 1.0000), NULL nếu user tự thêm tay
    aiEstimatedGrams DECIMAL(7,2) NULL,                     -- Số gram AI ước tính ban đầu
    userFinalGrams DECIMAL(7,2) NOT NULL,                   -- Số gram người dùng chốt lưu
    calculatedKcal DECIMAL(8,2) NOT NULL,                   -- userFinalGrams * kcalPerGram
    calculatedProtein DECIMAL(8,2) NOT NULL,                -- userFinalGrams * proteinPerGram
    calculatedCarb DECIMAL(8,2) NOT NULL,                   -- userFinalGrams * carbPerGram
    calculatedFat DECIMAL(8,2) NOT NULL,                    -- userFinalGrams * fatPerGram
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_meal_log_parent
        FOREIGN KEY (mealLogId)
        REFERENCES NutritionMealLogs(mealLogId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_meal_item_ingredient
        FOREIGN KEY (ingredientId)
        REFERENCES NutritionIngredients(ingredientId)
        ON UPDATE CASCADE,

    INDEX idx_log_item_meal (mealLogId),
    INDEX idx_log_item_ingredient (ingredientId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
