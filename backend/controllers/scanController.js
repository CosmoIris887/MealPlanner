const visionService = require('../services/ai/visionService');
const foodDataService = require('../services/nutrition/foodDataService');
const db = require('../config/db');
const path = require('path');

class ScanController {
  async analyzeFoodImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          is_food: false,
          is_recognized: false,
          food_name: null,
          confidence: 0,
          confidence_percentage: 0,
          model_version: 'gemini-api',
          nutrition: null,
          error: 'Silakan unggah atau ambil foto makanan yang valid (JPG, PNG, WebP).',
          message: 'Silakan unggah atau ambil foto makanan yang valid (JPG, PNG, WebP).' 
        });
      }

      const filePath = req.file.path;
      const userSuppliedWeight = req.body.weight_g !== undefined && req.body.weight_g !== null && !isNaN(parseFloat(req.body.weight_g));
      const webImagePath = `/uploads/${path.basename(filePath)}`;

      // 1. Send image to Google Gemini Vision as the sole active vision engine
      const visionResult = await visionService.classifyFoodImage(filePath);

      // 2. Handle Non-Food or Unrecognized Image
      if (!visionResult.is_food || !visionResult.is_recognized) {
        return res.json({
          success: true,
          status: visionResult.status || 'non_food',
          is_food: false,
          is_recognized: false,
          food_name: null,
          detected_food_name: null,
          confidence: 0,
          confidence_percentage: 0,
          confidence_level: 'none',
          description: visionResult.description || 'Bukan makanan.',
          visible_ingredients: [],
          estimated_cooking_method: null,
          estimated_weight_grams: null,
          estimated_calories: null,
          uncertainties: [],
          items: [],
          notes: visionResult.notes || [],
          image_url: webImagePath,
          nutrition: null,
          matched_food: null,
          model_version: visionResult.model_version || 'gemini-api',
          model_info: visionResult.model_info,
          message: visionResult.message || 'Objek pada gambar bukan merupakan makanan. Silakan ambil atau unggah foto makanan yang jelas.',
          error: null
        });
      }

      // 3. Food recognized by Gemini - Match with Nutrition Database
      const foodName = visionResult.food_name || visionResult.detected_food_name;
      const cleanName = foodName.trim();
      const initialWeight = userSuppliedWeight
        ? Math.max(1, parseFloat(req.body.weight_g))
        : (visionResult.estimated_weight_grams || 150);

      let matchedFood = null;

      // Strategy A: Exact name match
      matchedFood = await db.get(
        'SELECT * FROM foods WHERE LOWER(food_name) = ? LIMIT 1',
        [cleanName.toLowerCase()]
      );

      // Strategy B: If DB food name is contained inside Gemini's name (e.g. "Nasi Goreng" inside "Nasi Goreng Telur Mata Sapi")
      if (!matchedFood) {
        matchedFood = await db.get(
          'SELECT * FROM foods WHERE ? LIKE \'%\' || LOWER(food_name) || \'%\' AND LENGTH(food_name) >= 3 ORDER BY LENGTH(food_name) DESC LIMIT 1',
          [cleanName.toLowerCase()]
        );
      }

      // Strategy C: Partial LIKE match
      if (!matchedFood) {
        matchedFood = await db.get(
          'SELECT * FROM foods WHERE LOWER(food_name) LIKE ? ORDER BY id ASC LIMIT 1',
          [`%${cleanName.toLowerCase()}%`]
        );
      }

      // Strategy D: Search keyword tokens in DB
      if (!matchedFood) {
        const words = cleanName.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
        for (const w of words) {
          matchedFood = await db.get(
            'SELECT * FROM foods WHERE LOWER(food_name) LIKE ? LIMIT 1',
            [`%${w}%`]
          );
          if (matchedFood) break;
        }
      }

      // Strategy E: Fallback search via USDA FoodData Central if configured
      if (!matchedFood) {
        try {
          const usdaResults = await foodDataService.searchFood(cleanName);
          if (usdaResults && usdaResults.length > 0) {
            matchedFood = usdaResults[0];
          }
        } catch (usdaErr) {
          // Continue gracefully if USDA search fails
        }
      }

      const nutritionAvailable = Boolean(matchedFood && matchedFood.calories_per_100g !== null && matchedFood.calories_per_100g !== undefined);

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let calories_100g = null;
      let protein_100g = null;
      let carbs_100g = null;
      let fat_100g = null;

      let portionDisclaimer = '';

      if (nutritionAvailable) {
        calories_100g = parseFloat(matchedFood.calories_per_100g);
        protein_100g = parseFloat(matchedFood.protein_per_100g || 0);
        carbs_100g = parseFloat(matchedFood.carbohydrates_per_100g || 0);
        fat_100g = parseFloat(matchedFood.fat_per_100g || 0);

        // Formula: kalori porsi = kalori per 100 gram × berat porsi dalam gram ÷ 100
        const ratio = initialWeight / 100;
        totalCalories = Math.round(calories_100g * ratio);
        totalProtein = Math.round(protein_100g * ratio * 10) / 10;
        totalCarbs = Math.round(carbs_100g * ratio * 10) / 10;
        totalFat = Math.round(fat_100g * ratio * 10) / 10;

        portionDisclaimer = userSuppliedWeight
          ? `Nutrisi terverifikasi dari ${matchedFood.source || 'database'} dihitung berdasarkan berat porsi ${initialWeight} gram yang Anda tentukan.`
          : `Estimasi kalori menggunakan asumsi porsi ${initialWeight} gram (${matchedFood.source || 'database nutrisi'}). Sesuaikan gramatur porsi untuk presisi nutrisi.`;
      } else {
        // Makanan di luar database (misal sushi, steak wagyu A5, dsb jika belum ada di database)
        // Gunakan perkiraan visual Gemini jika ada, namun beri label jelas belum terverifikasi
        totalCalories = visionResult.estimated_calories || 0;
        portionDisclaimer = `Data nutrisi resmi untuk "${foodName}" belum ditemukan di database lokal/USDA. Angka yang ditampilkan merupakan taksiran awal AI yang belum diverifikasi.`;
      }

      // Record scan in database if userId exists
      let scanId = null;
      if (req.userId) {
        try {
          const scanResult = await db.run(
            `INSERT INTO food_scans 
             (user_id, image_path, detected_food_name, matched_food_id, confidence_score, weight_g, calories, protein, carbohydrates, fat, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.userId,
              webImagePath,
              foodName,
              matchedFood ? matchedFood.id : null,
              visionResult.confidence,
              initialWeight,
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFat,
              nutritionAvailable ? 'confirmed' : 'unverified'
            ]
          );
          scanId = scanResult.lastID;
        } catch (dbErr) {
          console.warn('[ScanController] Failed to record scan history:', dbErr.message);
        }
      }

      const nutritionData = {
        weight_g: initialWeight,
        is_user_weight: userSuppliedWeight,
        nutrition_available: nutritionAvailable,
        nutrition_source: nutritionAvailable ? (matchedFood.source || 'Database Nutrisi') : 'Belum Terverifikasi (Estimasi AI)',
        calories: totalCalories,
        protein: totalProtein,
        carbohydrates: totalCarbs,
        fat: totalFat,
        nutrition_per_100g: nutritionAvailable ? {
          calories: calories_100g,
          protein: protein_100g,
          carbohydrates: carbs_100g,
          fat: fat_100g
        } : null,
        portion_disclaimer: portionDisclaimer
      };

      res.json({
        success: true,
        status: visionResult.status || 'recognized',
        is_food: true,
        is_recognized: true,
        food_name: foodName,
        detected_food_name: foodName,
        confidence: visionResult.confidence,
        confidence_percentage: visionResult.confidence_percentage,
        confidence_level: visionResult.confidence_level,
        description: visionResult.description,
        visible_ingredients: visionResult.visible_ingredients,
        estimated_cooking_method: visionResult.estimated_cooking_method,
        estimated_weight_grams: visionResult.estimated_weight_grams,
        estimated_calories: visionResult.estimated_calories,
        uncertainties: visionResult.uncertainties,
        items: visionResult.items,
        notes: visionResult.notes,
        model_version: visionResult.model_version || 'gemini-api',
        model_info: visionResult.model_info,
        nutrition: nutritionData,
        error: null,
        // Backward compatibility fields for frontend
        scan_id: scanId,
        image_url: webImagePath,
        matched_food_id: matchedFood ? matchedFood.id : null,
        confidence_score: visionResult.confidence,
        nutrition_available: nutritionAvailable,
        nutrition_status_message: nutritionAvailable
          ? `Data nutrisi terverifikasi dari ${matchedFood.source || 'database'}.`
          : `Data nutrisi resmi belum tercatat di database untuk "${foodName}".`,
        weight_g: initialWeight,
        portion_disclaimer: portionDisclaimer,
        nutrition_per_100g: nutritionData.nutrition_per_100g,
        calculated_nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          carbohydrates: totalCarbs,
          fat: totalFat
        },
        matched_food: matchedFood,
        message: visionResult.message
      });
    } catch (err) {
      console.error('[ScanController Error]:', err.message);
      res.status(500).json({
        success: false,
        is_food: false,
        is_recognized: false,
        food_name: null,
        confidence: 0,
        model_version: 'gemini-api',
        nutrition: null,
        error: err.message || 'Terjadi kesalahan pada sistem saat memproses pemindaian makanan.',
        message: err.message || 'Terjadi kesalahan pada sistem saat memproses pemindaian makanan.'
      });
    }
  }

  async getModelInfo(req, res, next) {
    try {
      const meta = visionService.getModelMetadata();
      res.json({
        success: true,
        model_info: meta
      });
    } catch (err) {
      next(err);
    }
  }

  async logToIntake(req, res, next) {
    try {
      const { food_name, food_id, portion_g, calories, protein, carbohydrates, fat } = req.body;

      if (!food_name || calories === undefined) {
        return res.status(400).json({ success: false, message: 'Nama makanan dan kalori diperlukan.' });
      }

      const intakeResult = await db.run(
        `INSERT INTO daily_intake (user_id, food_name, food_id, portion_g, calories, protein, carbohydrates, fat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.userId,
          food_name,
          food_id || null,
          parseFloat(portion_g) || 100,
          parseFloat(calories) || 0,
          parseFloat(protein) || 0,
          parseFloat(carbohydrates) || 0,
          parseFloat(fat) || 0
        ]
      );

      res.json({
        success: true,
        message: 'Makanan berhasil dicatat ke konsumsi harian!',
        intake_id: intakeResult.lastID
      });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const scans = await db.all(
        `SELECT fs.*, f.category, f.source 
         FROM food_scans fs 
         LEFT JOIN foods f ON fs.matched_food_id = f.id
         WHERE fs.user_id = ? 
         ORDER BY fs.scanned_at DESC LIMIT 50`,
        [req.userId]
      );

      const intakeHistory = await db.all(
        `SELECT * FROM daily_intake WHERE user_id = ? ORDER BY logged_at DESC LIMIT 50`,
        [req.userId]
      );

      res.json({
        success: true,
        scans,
        daily_intake: intakeHistory
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteScan(req, res, next) {
    try {
      const scanId = req.params.id;
      await db.run('DELETE FROM food_scans WHERE id = ? AND user_id = ?', [scanId, req.userId]);
      res.json({ success: true, message: 'Riwayat scan berhasil dihapus.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteIntake(req, res, next) {
    try {
      const intakeId = req.params.id;
      await db.run('DELETE FROM daily_intake WHERE id = ? AND user_id = ?', [intakeId, req.userId]);
      res.json({ success: true, message: 'Catatan konsumsi harian berhasil dihapus.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ScanController();
