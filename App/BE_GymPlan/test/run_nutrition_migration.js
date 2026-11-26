require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  console.log("=== BẮT ĐẦU CHẠY MIGRATION PHÂN HỆ DINH DƯỠNG ===");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "quanlylichtapgym",
    multipleStatements: true,
  });

  try {
    // 1. Tạo bảng
    console.log("-> 1. Đang tạo các bảng CSDL Nutrition...");
    const createSql = fs.readFileSync(path.join(__dirname, "../sql/create_nutrition_tables.sql"), "utf8");
    await connection.query(createSql);
    console.log("   [✓] Tạo bảng NutritionIngredients, NutritionMealLogs, NutritionMealLogItems thành công!");

    // 2. Nạp dữ liệu seed
    console.log("-> 2. Đang nạp danh mục 60 nguyên liệu dinh dưỡng chuẩn...");
    const seedSql = fs.readFileSync(path.join(__dirname, "../sql/seed_nutrition_ingredients.sql"), "utf8");
    await connection.query(seedSql);
    console.log("   [✓] Nạp dữ liệu Master Ingredients thành công!");

    // 3. Kiểm tra số lượng và danh mục
    console.log("-> 3. Kiểm tra tính toàn vẹn dữ liệu:");
    const [countRows] = await connection.query("SELECT COUNT(*) AS total, category FROM NutritionIngredients GROUP BY category");
    console.table(countRows);

    const [totalRows] = await connection.query("SELECT COUNT(*) AS total FROM NutritionIngredients");
    console.log(`   Tổng số nguyên liệu đã nạp: ${totalRows[0].total} nguyên liệu.`);

    // 4. Test query tính macro của một bữa ăn mẫu:
    // Giả sử bữa trưa gồm: 150g Ức gà + 200g Cơm trắng + 100g Bông cải xanh
    console.log("-> 4. Thử nghiệm tính toán Macro tự động trên CSDL:");
    const sampleItems = [
      { code: "chicken_breast", grams: 150 },
      { code: "white_rice", grams: 200 },
      { code: "broccoli", grams: 100 },
    ];

    const [ingredients] = await connection.query(
      "SELECT code, nameVi, kcalPerGram, proteinPerGram, carbPerGram, fatPerGram FROM NutritionIngredients WHERE code IN (?, ?, ?)",
      sampleItems.map(i => i.code)
    );

    let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
    console.log("   Chi tiết bữa ăn mẫu (150g ức gà + 200g cơm trắng + 100g bông cải):");
    for (const item of sampleItems) {
      const ing = ingredients.find(i => i.code === item.code);
      if (ing) {
        const kcal = (item.grams * ing.kcalPerGram);
        const p = (item.grams * ing.proteinPerGram);
        const c = (item.grams * ing.carbPerGram);
        const f = (item.grams * ing.fatPerGram);
        totalKcal += kcal;
        totalP += p;
        totalC += c;
        totalF += f;
        console.log(`   - ${ing.nameVi}: ${item.grams}g -> ${kcal.toFixed(1)} kcal | P: ${p.toFixed(1)}g | C: ${c.toFixed(1)}g | F: ${f.toFixed(1)}g`);
      }
    }
    console.log(`   ==> TỔNG BỮA ĂN: ${totalKcal.toFixed(1)} Kcal | Protein: ${totalP.toFixed(1)}g | Carb: ${totalC.toFixed(1)}g | Fat: ${totalF.toFixed(1)}g`);

    console.log("\n=== [HOÀN TẤT BƯỚC 1] CƠ SỞ DỮ LIỆU ĐÃ SẴN SÀNG 100% ===");
  } catch (error) {
    console.error("Lỗi khi chạy migration:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
