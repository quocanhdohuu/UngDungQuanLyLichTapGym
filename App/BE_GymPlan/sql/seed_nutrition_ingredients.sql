-- =====================================================
-- SEED DỮ LIỆU DANH MỤC 60 NGUYÊN LIỆU DINH DƯỠNG CỐT LÕI
-- (KẾT HỢP NUTRITION5K & BẢNG DINH DƯỠNG MÓN ĂN THỂ HÌNH VIỆT NAM)
-- Hệ số dinh dưỡng tính chuẩn trên 1 gram thực phẩm (Macros per gram)
-- =====================================================

USE QuanLyLichTapGym;

INSERT INTO NutritionIngredients 
(code, nameVi, nameEn, category, kcalPerGram, proteinPerGram, carbPerGram, fatPerGram, servingSizeGrams, isAiSupported)
VALUES
-- === 1. NHÓM ĐẠM / PROTEIN CAO (15 NGUYÊN LIỆU) ===
('chicken_breast', 'Ức gà phi lê (luộc/áp chảo)', 'Chicken Breast (cooked)', 'PROTEIN', 1.6500, 0.3100, 0.0000, 0.0360, 150.00, TRUE),
('chicken_thigh', 'Má đùi gà bỏ da', 'Chicken Thigh skinless (cooked)', 'PROTEIN', 2.0900, 0.2600, 0.0000, 0.1090, 150.00, TRUE),
('beef_lean', 'Thịt bò nạc (thăn/bắp áp chảo)', 'Lean Beef (cooked)', 'PROTEIN', 2.1500, 0.2800, 0.0000, 0.1100, 120.00, TRUE),
('beef_ground', 'Thịt bò xay nạc 90%', 'Ground Beef 90% lean', 'PROTEIN', 2.1700, 0.2600, 0.0000, 0.1200, 120.00, TRUE),
('pork_tenderloin', 'Thịt heo nạc thăn luộc', 'Pork Tenderloin lean (cooked)', 'PROTEIN', 1.4300, 0.2600, 0.0000, 0.0350, 120.00, TRUE),
('salmon', 'Cá hồi phi lê áp chảo', 'Salmon Fillet (cooked)', 'PROTEIN', 2.0600, 0.2200, 0.0000, 0.1230, 150.00, TRUE),
('tuna', 'Cá ngừ đại dương áp chảo', 'Tuna Steak (cooked)', 'PROTEIN', 1.3200, 0.2800, 0.0000, 0.0130, 120.00, TRUE),
('tilapia', 'Cá rô phi áp chảo', 'Tilapia Fish (cooked)', 'PROTEIN', 1.2900, 0.2600, 0.0000, 0.0270, 150.00, TRUE),
('shrimp', 'Tôm luộc/hấp bóc vỏ', 'Boiled Shrimp', 'PROTEIN', 0.9900, 0.2400, 0.0020, 0.0030, 100.00, TRUE),
('egg_whole', 'Trứng gà nguyên quả luộc (1 quả ~50g)', 'Boiled Egg (whole)', 'PROTEIN', 1.5500, 0.1260, 0.0110, 0.1060, 50.00, TRUE),
('egg_white', 'Lòng trắng trứng gà (1 quả ~33g)', 'Egg White', 'PROTEIN', 0.5200, 0.1100, 0.0070, 0.0020, 100.00, TRUE),
('egg_fried', 'Trứng gà ốp la (ít dầu)', 'Fried Egg', 'PROTEIN', 1.9600, 0.1360, 0.0080, 0.1530, 55.00, TRUE),
('tofu_firm', 'Đậu phụ trắng luộc/hấp', 'Firm Tofu', 'PROTEIN', 0.7600, 0.0800, 0.0190, 0.0480, 150.00, TRUE),
('whey_protein', 'Bột Whey Protein (1 muỗng ~30g)', 'Whey Protein Powder', 'PROTEIN', 3.9000, 0.8000, 0.0800, 0.0400, 30.00, FALSE),
('casein_protein', 'Bột Casein Protein', 'Casein Protein Powder', 'PROTEIN', 3.7000, 0.7700, 0.0700, 0.0300, 30.00, FALSE),

-- === 2. NHÓM TINH BỘT / CARB PHỨC & NĂNG LƯỢNG (15 NGUYÊN LIỆU) ===
('white_rice', 'Cơm trắng tẻ', 'Cooked White Rice', 'CARB', 1.3000, 0.0270, 0.2820, 0.0030, 180.00, TRUE),
('brown_rice', 'Cơm gạo lứt', 'Cooked Brown Rice', 'CARB', 1.1100, 0.0260, 0.2300, 0.0090, 180.00, TRUE),
('sweet_potato', 'Khoai lang luộc/hấp', 'Boiled Sweet Potato', 'CARB', 0.8600, 0.0160, 0.2010, 0.0010, 150.00, TRUE),
('potato_boiled', 'Khoai tây luộc', 'Boiled Potato', 'CARB', 0.8700, 0.0190, 0.2010, 0.0010, 150.00, TRUE),
('oats', 'Yến mạch nấu chín', 'Cooked Rolled Oats', 'CARB', 0.7100, 0.0250, 0.1200, 0.0150, 200.00, TRUE),
('oats_dry', 'Yến mạch khô', 'Raw Rolled Oats', 'CARB', 3.8900, 0.1690, 0.6630, 0.0690, 50.00, FALSE),
('whole_wheat_bread', 'Bánh mì ngũ cốc/đen (1 lát ~30g)', 'Whole Wheat Bread', 'CARB', 2.4700, 0.1300, 0.4100, 0.0340, 60.00, TRUE),
('white_bread', 'Bánh mì trắng (1 ổ ~80g)', 'White Bread', 'CARB', 2.6500, 0.0900, 0.4900, 0.0320, 80.00, TRUE),
('pasta_cooked', 'Mì Ý / Pasta luộc chín', 'Cooked Pasta', 'CARB', 1.5800, 0.0580, 0.3090, 0.0090, 150.00, TRUE),
('rice_noodles', 'Bún tươi / Phở tươi trần', 'Cooked Rice Noodles', 'CARB', 1.0800, 0.0180, 0.2400, 0.0020, 180.00, TRUE),
('corn_boiled', 'Bắp ngô ngọt luộc', 'Boiled Sweet Corn', 'CARB', 0.9600, 0.0340, 0.2100, 0.0150, 120.00, TRUE),
('banana', 'Chuối tiêu chín (1 quả ~100g)', 'Fresh Banana', 'CARB', 0.8900, 0.0110, 0.2280, 0.0030, 100.00, TRUE),
('apple', 'Táo tây tươi (1 quả ~150g)', 'Fresh Apple', 'CARB', 0.5200, 0.0030, 0.1380, 0.0020, 150.00, TRUE),
('watermelon', 'Dưa hấu tươi', 'Fresh Watermelon', 'CARB', 0.3000, 0.0060, 0.0760, 0.0020, 200.00, TRUE),
('quinoa_cooked', 'Hạt Diêm mạch (Quinoa) nấu chín', 'Cooked Quinoa', 'CARB', 1.2000, 0.0440, 0.2130, 0.0190, 150.00, TRUE),

-- === 3. NHÓM RAU CỦ & CHẤT XƠ (15 NGUYÊN LIỆU) ===
('broccoli', 'Bông cải xanh / Súp lơ luộc', 'Boiled Broccoli', 'VEG', 0.3500, 0.0240, 0.0720, 0.0040, 120.00, TRUE),
('cauliflower', 'Súp lơ trắng luộc', 'Boiled Cauliflower', 'VEG', 0.2500, 0.0190, 0.0500, 0.0030, 120.00, TRUE),
('spinach', 'Rau bina / Chân vịt luộc', 'Boiled Spinach', 'VEG', 0.2300, 0.0300, 0.0380, 0.0030, 100.00, TRUE),
('water_spinach', 'Rau muống luộc', 'Boiled Water Spinach', 'VEG', 0.1900, 0.0260, 0.0310, 0.0020, 120.00, TRUE),
('bok_choy', 'Cải thìa / Cải chíp luộc', 'Boiled Bok Choy', 'VEG', 0.1200, 0.0160, 0.0180, 0.0020, 120.00, TRUE),
('cabbage', 'Bắp cải trắng luộc', 'Boiled Cabbage', 'VEG', 0.2200, 0.0120, 0.0540, 0.0010, 120.00, TRUE),
('cucumber', 'Dưa leo / Dưa chuột tươi', 'Fresh Cucumber', 'VEG', 0.1500, 0.0070, 0.0360, 0.0010, 100.00, TRUE),
('tomato', 'Cà chua chín tươi', 'Fresh Tomato', 'VEG', 0.1800, 0.0090, 0.0390, 0.0020, 100.00, TRUE),
('carrot_boiled', 'Cà rốt luộc', 'Boiled Carrot', 'VEG', 0.3500, 0.0080, 0.0820, 0.0020, 80.00, TRUE),
('bell_pepper', 'Ớt chuông đỏ/vàng/xanh', 'Fresh Bell Pepper', 'VEG', 0.3100, 0.0100, 0.0600, 0.0030, 80.00, TRUE),
('asparagus', 'Măng tây hấp/áp chảo', 'Cooked Asparagus', 'VEG', 0.2200, 0.0240, 0.0410, 0.0020, 80.00, TRUE),
('green_beans', 'Đậu que / Đậu cô ve luộc', 'Boiled Green Beans', 'VEG', 0.3500, 0.0190, 0.0790, 0.0030, 100.00, TRUE),
('mushroom_button', 'Nấm mỡ xào / áp chảo', 'Cooked Button Mushroom', 'VEG', 0.2800, 0.0300, 0.0450, 0.0050, 80.00, TRUE),
('lettuce', 'Xà lách tươi ăn sống', 'Fresh Lettuce', 'VEG', 0.1400, 0.0140, 0.0280, 0.0020, 60.00, TRUE),
('onion', 'Hành tây xào/chín', 'Cooked Onion', 'VEG', 0.4400, 0.0140, 0.1010, 0.0020, 50.00, TRUE),

-- === 4. NHÓM CHẤT BÉO TỐT & SỮA (9 NGUYÊN LIỆU) ===
('avocado', 'Quả bơ tươi', 'Fresh Avocado', 'FAT', 1.6000, 0.0200, 0.0850, 0.1470, 80.00, TRUE),
('olive_oil', 'Dầu ô liu nguyên chất (1 muỗng ~14g)', 'Extra Virgin Olive Oil', 'FAT', 8.8400, 0.0000, 0.0000, 1.0000, 14.00, FALSE),
('peanut_butter', 'Bơ đậu phộng nguyên chất', 'Peanut Butter', 'FAT', 5.8800, 0.2500, 0.2000, 0.5000, 32.00, TRUE),
('almond', 'Hạt hạnh nhân sấy', 'Roasted Almonds', 'FAT', 5.7900, 0.2100, 0.2200, 0.4990, 30.00, TRUE),
('walnut', 'Hạt óc chó', 'Walnuts', 'FAT', 6.5400, 0.1520, 0.1370, 0.6520, 30.00, TRUE),
('cashew', 'Hạt điều sấy', 'Cashew Nuts', 'FAT', 5.5300, 0.1820, 0.3020, 0.4380, 30.00, TRUE),
('greek_yogurt', 'Sữa chua Hy Lạp không đường', 'Plain Greek Yogurt (0% fat)', 'DAIRY', 0.5900, 0.1000, 0.0360, 0.0040, 150.00, TRUE),
('milk_skim', 'Sữa tươi tách béo không đường', 'Skim Milk', 'DAIRY', 0.3500, 0.0340, 0.0500, 0.0010, 200.00, FALSE),
('cheese_cheddar', 'Phô mai lát Cheddar', 'Cheddar Cheese', 'DAIRY', 4.0200, 0.2500, 0.0130, 0.3300, 30.00, TRUE),

-- === 5. NHÓM ĐỒ UỐNG & GIA VỊ GYM (6 NGUYÊN LIỆU) ===
('water', 'Nước khoáng / Nước lọc', 'Drinking Water', 'BEVERAGE', 0.0000, 0.0000, 0.0000, 0.0000, 250.00, FALSE),
('black_coffee', 'Cà phê đen không đường', 'Black Coffee', 'BEVERAGE', 0.0200, 0.0030, 0.0020, 0.0000, 150.00, FALSE),
('green_tea', 'Trà xanh không đường', 'Unsweetened Green Tea', 'BEVERAGE', 0.0100, 0.0000, 0.0020, 0.0000, 200.00, FALSE),
('soy_sauce', 'Nước tương / Xì dầu', 'Soy Sauce', 'OTHER', 0.5300, 0.0800, 0.0500, 0.0010, 15.00, FALSE),
('chili_sauce', 'Tương ớt ít đường', 'Chili Sauce', 'OTHER', 0.9000, 0.0150, 0.2000, 0.0050, 20.00, FALSE),
('fish_sauce', 'Nước mắm truyền thống', 'Fish Sauce', 'OTHER', 0.5500, 0.1200, 0.0100, 0.0000, 15.00, FALSE)
ON DUPLICATE KEY UPDATE 
    nameVi = VALUES(nameVi),
    nameEn = VALUES(nameEn),
    category = VALUES(category),
    kcalPerGram = VALUES(kcalPerGram),
    proteinPerGram = VALUES(proteinPerGram),
    carbPerGram = VALUES(carbPerGram),
    fatPerGram = VALUES(fatPerGram),
    servingSizeGrams = VALUES(servingSizeGrams),
    isAiSupported = VALUES(isAiSupported);
