const foodDataService = require('../services/nutrition/foodDataService');
const db = require('../config/db');

class FoodController {
  async getFoods(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const category = req.query.category;
      const search = req.query.search;

      let query = 'SELECT * FROM foods WHERE 1=1';
      const params = [];

      if (category && category !== 'All') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (food_name LIKE ? OR category LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const foods = await db.all(query, params);

      let countQuery = 'SELECT COUNT(*) as total FROM foods WHERE 1=1';
      const countParams = [];
      if (category && category !== 'All') {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (search) {
        countQuery += ' AND (food_name LIKE ? OR category LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const totalResult = await db.get(countQuery, countParams);

      res.json({
        success: true,
        page,
        limit,
        total: totalResult ? totalResult.total : 0,
        foods
      });
    } catch (err) {
      next(err);
    }
  }

  async getFoodById(req, res, next) {
    try {
      const food = await db.get('SELECT * FROM foods WHERE id = ?', [req.params.id]);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Item makanan tidak ditemukan.' });
      }
      res.json({ success: true, food });
    } catch (err) {
      next(err);
    }
  }

  async searchFood(req, res, next) {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Parameter query q diperlukan.' });
      }

      const localResults = await db.all(
        'SELECT * FROM foods WHERE food_name LIKE ? OR category LIKE ? LIMIT 10',
        [`%${query}%`, `%${query}%`]
      );

      if (localResults.length > 0) {
        return res.json({ success: true, source: 'database', foods: localResults });
      }

      const usdaResults = await foodDataService.searchFoodUSDA(query);
      res.json({ success: true, source: 'usda', foods: usdaResults });
    } catch (err) {
      next(err);
    }
  }

  async createCustomFood(req, res, next) {
    try {
      const {
        food_name,
        category,
        serving_size = '100g',
        calories_per_100g,
        protein_per_100g,
        carbohydrates_per_100g,
        fat_per_100g,
        fiber_per_100g = 0
      } = req.body;

      if (!food_name || calories_per_100g === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Nama makanan dan kalori per 100g wajib diisi.'
        });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await db.run(
        `INSERT INTO foods 
         (food_name, category, serving_size, calories_per_100g, protein_per_100g, carbohydrates_per_100g, fat_per_100g, fiber_per_100g, image_url, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          food_name,
          category || 'Kustom',
          serving_size,
          calories_per_100g,
          protein_per_100g || 0,
          carbohydrates_per_100g || 0,
          fat_per_100g || 0,
          fiber_per_100g,
          imageUrl,
          'Kustom Pengguna'
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Makanan kustom berhasil ditambahkan ke database.',
        foodId: result.lastID
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns current food database status (pure SQLite without local ML dataset dependency)
   */
  async getDatasetStatus(req, res, next) {
    try {
      const totalResult = await db.get('SELECT COUNT(*) as total FROM foods');
      const categories = await db.all('SELECT category, COUNT(*) as count FROM foods GROUP BY category');
      res.status(200).json({
        success: true,
        ai_engine: 'Google Gemini Vision & Chatbot API (Universal Recognition)',
        training_pipeline: 'none (offline training retired)',
        total_foods: totalResult ? totalResult.total : 0,
        categories: categories || []
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomFood(req, res, next) {
    try {
      const foodId = req.params.id;
      await db.run('DELETE FROM foods WHERE id = ?', [foodId]);
      res.json({ success: true, message: 'Item makanan berhasil dihapus dari database.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FoodController();
