const recommendationEngine = require('../services/recommendation/recommendationEngine');
const db = require('../config/db');

class MealPlanController {
  async getMealPlan(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      let plan = await db.get(
        'SELECT * FROM meal_plans WHERE user_id = ? AND date = ?',
        [req.userId, today]
      );

      if (!plan) {
        return await this.generateMealPlan(req, res, next);
      }

      const items = await db.all(
        'SELECT * FROM meal_plan_items WHERE meal_plan_id = ? ORDER BY id ASC',
        [plan.id]
      );

      const groupedMeals = {
        Breakfast: items.filter(i => i.meal_type === 'Breakfast'),
        Lunch: items.filter(i => i.meal_type === 'Lunch'),
        Dinner: items.filter(i => i.meal_type === 'Dinner'),
        Snack: items.filter(i => i.meal_type === 'Snack')
      };

      res.json({
        success: true,
        meal_plan: {
          ...plan,
          meals: groupedMeals
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async generateMealPlan(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);

      if (!profile) {
        return res.status(400).json({ success: false, message: 'User profile not found. Please complete profile first.' });
      }

      const generated = await recommendationEngine.generateDailyMealPlan(profile);

      const existing = await db.get('SELECT id FROM meal_plans WHERE user_id = ? AND date = ?', [req.userId, today]);
      if (existing) {
        await db.run('DELETE FROM meal_plans WHERE id = ?', [existing.id]);
      }

      const planResult = await db.run(
        `INSERT INTO meal_plans (user_id, date, target_calories, total_calories, total_protein, total_carbs, total_fat)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.userId,
          today,
          generated.target_calories,
          generated.totals.calories,
          generated.totals.protein,
          generated.totals.carbohydrates,
          generated.totals.fat
        ]
      );

      const mealPlanId = planResult.lastID;

      for (const [mealType, items] of Object.entries(generated.meals)) {
        for (const item of items) {
          await db.run(
            `INSERT INTO meal_plan_items (meal_plan_id, meal_type, food_id, food_name, portion_g, calories, protein, carbohydrates, fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              mealPlanId,
              mealType,
              item.food_id || null,
              item.food_name,
              item.portion_g,
              item.calories,
              item.protein,
              item.carbohydrates,
              item.fat
            ]
          );
        }
      }

      const freshItems = await db.all('SELECT * FROM meal_plan_items WHERE meal_plan_id = ?', [mealPlanId]);
      const groupedMeals = {
        Breakfast: freshItems.filter(i => i.meal_type === 'Breakfast'),
        Lunch: freshItems.filter(i => i.meal_type === 'Lunch'),
        Dinner: freshItems.filter(i => i.meal_type === 'Dinner'),
        Snack: freshItems.filter(i => i.meal_type === 'Snack')
      };

      res.json({
        success: true,
        message: 'New daily meal plan generated!',
        meal_plan: {
          id: mealPlanId,
          user_id: req.userId,
          date: today,
          target_calories: generated.target_calories,
          total_calories: generated.totals.calories,
          total_protein: generated.totals.protein,
          total_carbs: generated.totals.carbohydrates,
          total_fat: generated.totals.fat,
          meals: groupedMeals
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteMealPlan(req, res, next) {
    try {
      const planId = req.params.id;
      await db.run('DELETE FROM meal_plans WHERE id = ? AND user_id = ?', [planId, req.userId]);
      res.json({ success: true, message: 'Meal plan deleted.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MealPlanController();
