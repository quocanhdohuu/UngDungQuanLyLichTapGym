const db = require("../common/db");

const NutritionModel = {
  /**
   * Tìm kiếm nguyên liệu theo từ khóa hoặc danh mục
   */
  searchIngredients: async (keyword = "", category = null) => {
    let sql = `
      SELECT ingredientId, code, nameVi, nameEn, category, 
             kcalPerGram, proteinPerGram, carbPerGram, fatPerGram, 
             servingSizeGrams, isAiSupported
      FROM NutritionIngredients
      WHERE 1=1
    `;
    const params = [];

    if (keyword && keyword.trim()) {
      sql += " AND (nameVi LIKE ? OR nameEn LIKE ? OR code LIKE ?)";
      const pattern = `%${keyword.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (category && category !== "ALL") {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY isAiSupported DESC, nameVi ASC";

    const [rows] = await db.promise().query(sql, params);
    return rows;
  },

  /**
   * Lấy danh sách nguyên liệu theo mảng các codes (phục vụ mapping sau khi AI trả về)
   */
  getIngredientsByCodes: async (codes = []) => {
    if (!codes.length) return [];
    const placeholders = codes.map(() => "?").join(", ");
    const sql = `
      SELECT ingredientId, code, nameVi, nameEn, category, 
             kcalPerGram, proteinPerGram, carbPerGram, fatPerGram, 
             servingSizeGrams, isAiSupported
      FROM NutritionIngredients
      WHERE code IN (${placeholders})
    `;
    const [rows] = await db.promise().query(sql, codes);
    return rows;
  },

  /**
   * Lấy chi tiết nguyên liệu theo mảng IDs
   */
  getIngredientsByIds: async (ids = []) => {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `
      SELECT ingredientId, code, nameVi, nameEn, category, 
             kcalPerGram, proteinPerGram, carbPerGram, fatPerGram, 
             servingSizeGrams
      FROM NutritionIngredients
      WHERE ingredientId IN (${placeholders})
    `;
    const [rows] = await db.promise().query(sql, ids);
    return rows;
  },

  /**
   * Lưu nhật ký bữa ăn kèm danh sách thành phần chi tiết (Transaction)
   */
  createMealLog: async ({ profileId, mealType, mealDate, imageUrl, note, items = [] }) => {
    if (!profileId || !items.length) {
      throw new Error("Dữ liệu bữa ăn không hợp lệ: Thiếu profileId hoặc danh sách món ăn.");
    }

    // 1. Lấy thông tin dinh dưỡng chuẩn từ DB cho tất cả ingredientId
    const ingredientIds = items.map(item => item.ingredientId);
    const ingredients = await NutritionModel.getIngredientsByIds(ingredientIds);
    const ingMap = new Map(ingredients.map(ing => [ing.ingredientId, ing]));

    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;

    // 2. Tính toán dinh dưỡng cho từng món theo số gram chốt (userFinalGrams)
    const calculatedItems = items.map(item => {
      const ing = ingMap.get(item.ingredientId);
      if (!ing) {
        throw new Error(`Nguyên liệu có ID ${item.ingredientId} không tồn tại trong hệ thống.`);
      }

      const finalGrams = Number(item.userFinalGrams) || Number(ing.servingSizeGrams) || 100;
      const kcal = Number((finalGrams * Number(ing.kcalPerGram)).toFixed(2));
      const protein = Number((finalGrams * Number(ing.proteinPerGram)).toFixed(2));
      const carb = Number((finalGrams * Number(ing.carbPerGram)).toFixed(2));
      const fat = Number((finalGrams * Number(ing.fatPerGram)).toFixed(2));

      totalKcal += kcal;
      totalProtein += protein;
      totalCarb += carb;
      totalFat += fat;

      return {
        ingredientId: item.ingredientId,
        aiConfidence: item.aiConfidence !== undefined && item.aiConfidence !== null ? Number(item.aiConfidence) : null,
        aiEstimatedGrams: item.aiEstimatedGrams !== undefined && item.aiEstimatedGrams !== null ? Number(item.aiEstimatedGrams) : null,
        userFinalGrams: finalGrams,
        calculatedKcal: kcal,
        calculatedProtein: protein,
        calculatedCarb: carb,
        calculatedFat: fat,
        nameVi: ing.nameVi,
        category: ing.category,
      };
    });

    totalKcal = Number(totalKcal.toFixed(2));
    totalProtein = Number(totalProtein.toFixed(2));
    totalCarb = Number(totalCarb.toFixed(2));
    totalFat = Number(totalFat.toFixed(2));

    // 3. Thực thi Transaction lưu vào MySQL
    const conn = await db.promise().getConnection();
    try {
      await conn.beginTransaction();

      const insertMealSql = `
        INSERT INTO NutritionMealLogs 
        (profileId, mealType, mealDate, imageUrl, totalKcal, totalProtein, totalCarb, totalFat, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [mealResult] = await conn.query(insertMealSql, [
        profileId,
        mealType || "LUNCH",
        mealDate || new Date().toISOString().slice(0, 10),
        imageUrl || null,
        totalKcal,
        totalProtein,
        totalCarb,
        totalFat,
        note || null,
      ]);

      const mealLogId = mealResult.insertId;

      const insertItemSql = `
        INSERT INTO NutritionMealLogItems
        (mealLogId, ingredientId, aiConfidence, aiEstimatedGrams, userFinalGrams, 
         calculatedKcal, calculatedProtein, calculatedCarb, calculatedFat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const item of calculatedItems) {
        await conn.query(insertItemSql, [
          mealLogId,
          item.ingredientId,
          item.aiConfidence,
          item.aiEstimatedGrams,
          item.userFinalGrams,
          item.calculatedKcal,
          item.calculatedProtein,
          item.calculatedCarb,
          item.calculatedFat,
        ]);
      }

      await conn.commit();

      return {
        mealLogId,
        profileId,
        mealType: mealType || "LUNCH",
        mealDate: mealDate || new Date().toISOString().slice(0, 10),
        imageUrl: imageUrl || null,
        totalKcal,
        totalProtein,
        totalCarb,
        totalFat,
        note: note || null,
        items: calculatedItems,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Lấy tổng hợp dinh dưỡng trong ngày của người dùng
   */
  getDailySummary: async (profileId, dateStr) => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);

    // 1. Tổng calo & macros trong ngày
    const summarySql = `
      SELECT 
        COALESCE(SUM(totalKcal), 0) AS totalKcal,
        COALESCE(SUM(totalProtein), 0) AS totalProtein,
        COALESCE(SUM(totalCarb), 0) AS totalCarb,
        COALESCE(SUM(totalFat), 0) AS totalFat,
        COUNT(mealLogId) AS totalMeals
      FROM NutritionMealLogs
      WHERE profileId = ? AND mealDate = ?
    `;
    const [summaryRows] = await db.promise().query(summarySql, [profileId, targetDate]);
    const summary = summaryRows[0];

    // 2. Danh sách các bữa ăn trong ngày
    const mealsSql = `
      SELECT mealLogId, profileId, mealType, mealDate, imageUrl, 
             totalKcal, totalProtein, totalCarb, totalFat, note, createdAt
      FROM NutritionMealLogs
      WHERE profileId = ? AND mealDate = ?
      ORDER BY createdAt ASC
    `;
    const [meals] = await db.promise().query(mealsSql, [profileId, targetDate]);

    // 3. Lấy chi tiết items của từng bữa
    for (const meal of meals) {
      const itemsSql = `
        SELECT i.itemId, i.mealLogId, i.ingredientId, i.aiConfidence, 
               i.aiEstimatedGrams, i.userFinalGrams, i.calculatedKcal, 
               i.calculatedProtein, i.calculatedCarb, i.calculatedFat,
               ing.code, ing.nameVi, ing.category
        FROM NutritionMealLogItems i
        JOIN NutritionIngredients ing ON ing.ingredientId = i.ingredientId
        WHERE i.mealLogId = ?
      `;
      const [items] = await db.promise().query(itemsSql, [meal.mealLogId]);
      meal.items = items;
    }

    return {
      date: targetDate,
      summary: {
        totalKcal: Number(Number(summary.totalKcal).toFixed(1)),
        totalProtein: Number(Number(summary.totalProtein).toFixed(1)),
        totalCarb: Number(Number(summary.totalCarb).toFixed(1)),
        totalFat: Number(Number(summary.totalFat).toFixed(1)),
        totalMeals: Number(summary.totalMeals),
      },
      meals,
    };
  },

  /**
   * Lấy chi tiết một bữa ăn
   */
  getMealDetail: async (mealLogId, profileId) => {
    const mealSql = `
      SELECT mealLogId, profileId, mealType, mealDate, imageUrl, 
             totalKcal, totalProtein, totalCarb, totalFat, note, createdAt
      FROM NutritionMealLogs
      WHERE mealLogId = ? AND profileId = ?
    `;
    const [mealRows] = await db.promise().query(mealSql, [mealLogId, profileId]);
    if (!mealRows.length) return null;

    const meal = mealRows[0];
    const itemsSql = `
      SELECT i.itemId, i.mealLogId, i.ingredientId, i.aiConfidence, 
             i.aiEstimatedGrams, i.userFinalGrams, i.calculatedKcal, 
             i.calculatedProtein, i.calculatedCarb, i.calculatedFat,
             ing.code, ing.nameVi, ing.category
      FROM NutritionMealLogItems i
      JOIN NutritionIngredients ing ON ing.ingredientId = i.ingredientId
      WHERE i.mealLogId = ?
    `;
    const [items] = await db.promise().query(itemsSql, [mealLogId]);
    meal.items = items;
    return meal;
  },

  /**
   * Xóa bữa ăn
   */
  deleteMealLog: async (mealLogId, profileId) => {
    const deleteSql = `DELETE FROM NutritionMealLogs WHERE mealLogId = ? AND profileId = ?`;
    const [result] = await db.promise().query(deleteSql, [mealLogId, profileId]);
    return result.affectedRows > 0;
  },
};

module.exports = NutritionModel;
