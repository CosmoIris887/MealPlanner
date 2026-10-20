const db = require('../../config/db');
const axios = require('axios');

class FoodDataService {
  async searchFood(query) {
    if (!query || query.trim() === '') {
      return await db.all('SELECT * FROM foods ORDER BY food_name ASC LIMIT 50');
    }

    const cleanQuery = query.trim().toLowerCase();
    
    // 1. Local Database Search
    const localResults = await db.all(
      `SELECT * FROM foods WHERE LOWER(food_name) LIKE ? OR LOWER(category) LIKE ? ORDER BY food_name ASC`,
      [`%${cleanQuery}%`, `%${cleanQuery}%`]
    );

    if (localResults.length > 0) {
      return localResults;
    }

    // 2. USDA FoodData Central API Fallback if key available
    const apiKey = process.env.USDA_API_KEY;
    if (apiKey && apiKey !== 'DEMO_KEY' && apiKey.trim() !== '') {
      try {
        const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
          params: {
            api_key: apiKey,
            query: cleanQuery,
            pageSize: 5
          },
          timeout: 4000
        });

        if (response.data && response.data.foods) {
          const usdaFoods = [];
          for (const item of response.data.foods) {
            const nutrients = item.foodNutrients || [];
            
            const getNutrient = (nameOrId) => {
              const found = nutrients.find(n => 
                (n.nutrientName && n.nutrientName.toLowerCase().includes(nameOrId)) ||
                (n.nutrientId && n.nutrientId.toString() === nameOrId)
              );
              return found ? parseFloat(found.value || found.amount || 0) : 0;
            };

            const calories = getNutrient('energy') || getNutrient('1008');
            const protein = getNutrient('protein') || getNutrient('1003');
            const carbs = getNutrient('carbohydrate') || getNutrient('1005');
            const fat = getNutrient('total lipid') || getNutrient('1004');
            const fiber = getNutrient('fiber') || getNutrient('1079');

            const fdcIdStr = item.fdcId ? item.fdcId.toString() : null;
            let existingFood = null;
            if (fdcIdStr) {
              existingFood = await db.get('SELECT * FROM foods WHERE source_id = ?', [fdcIdStr]);
            }
            if (!existingFood) {
              existingFood = await db.get('SELECT * FROM foods WHERE LOWER(food_name) = ?', [item.description.toLowerCase()]);
            }

            if (existingFood) {
              usdaFoods.push(existingFood);
              continue;
            }

            const insertResult = await db.run(
              `INSERT INTO foods (food_name, category, serving_size, calories_per_100g, protein_per_100g, carbohydrates_per_100g, fat_per_100g, fiber_per_100g, source, source_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.description,
                item.foodCategory || 'USDA Food',
                '100g',
                calories,
                protein,
                carbs,
                fat,
                fiber,
                'USDA FoodData Central',
                fdcIdStr
              ]
            );

            const newlyInserted = await db.get('SELECT * FROM foods WHERE id = ?', [insertResult.lastID]);
            if (newlyInserted) {
              usdaFoods.push(newlyInserted);
            }
          }

          if (usdaFoods.length > 0) {
            return usdaFoods;
          }
        }
      } catch (err) {
        console.warn('USDA API search failed or timed out:', err.message);
      }
    }

    return [];
  }

  async getFoodById(id) {
    return await db.get('SELECT * FROM foods WHERE id = ?', [id]);
  }

  calculateNutrition(food, weightGram) {
    if (!food) return null;
    const ratio = Math.max(0, parseFloat(weightGram) || 100) / 100;
    
    return {
      food_id: food.id,
      food_name: food.food_name,
      category: food.category,
      weight_g: Math.round(weightGram),
      calories: Math.round((food.calories_per_100g || 0) * ratio * 10) / 10,
      protein: Math.round((food.protein_per_100g || 0) * ratio * 10) / 10,
      carbohydrates: Math.round((food.carbohydrates_per_100g || 0) * ratio * 10) / 10,
      fat: Math.round((food.fat_per_100g || 0) * ratio * 10) / 10,
      fiber: Math.round((food.fiber_per_100g || 0) * ratio * 10) / 10
    };
  }
}

module.exports = new FoodDataService();
