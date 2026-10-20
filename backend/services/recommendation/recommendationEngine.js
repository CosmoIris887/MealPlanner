const db = require('../../config/db');

class RecommendationEngine {
  calculateBMR(weightKg, heightCm, age, gender) {
    const w = parseFloat(weightKg) || 70;
    const h = parseFloat(heightCm) || 170;
    const a = parseInt(age, 10) || 25;
    const g = (gender || 'male').toLowerCase();

    if (g === 'female') {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    } else {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
    }
  }

  getActivityMultiplier(activityLevel) {
    const levelMap = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    return levelMap[activityLevel] || 1.375;
  }

  calculateTDEE(weightKg, heightCm, age, gender, activityLevel) {
    const bmr = this.calculateBMR(weightKg, heightCm, age, gender);
    const multiplier = this.getActivityMultiplier(activityLevel);
    return Math.round(bmr * multiplier);
  }

  calculateTargetCalories(weightKg, heightCm, age, gender, activityLevel, goal) {
    const tdee = this.calculateTDEE(weightKg, heightCm, age, gender, activityLevel);
    
    switch (goal) {
      case 'lose_weight':
        return Math.round(tdee * 0.80);
      case 'gain_weight':
        return Math.round(tdee * 1.15);
      case 'build_muscle':
        return Math.round(tdee * 1.10);
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  }

  calculateTargetMacros(targetCalories, goal) {
    let proteinPct = 0.25;
    let carbPct = 0.50;
    let fatPct = 0.25;

    if (goal === 'build_muscle') {
      proteinPct = 0.35;
      carbPct = 0.45;
      fatPct = 0.20;
    } else if (goal === 'lose_weight') {
      proteinPct = 0.30;
      carbPct = 0.45;
      fatPct = 0.25;
    }

    return {
      protein_g: Math.round((targetCalories * proteinPct) / 4),
      carbs_g: Math.round((targetCalories * carbPct) / 4),
      fat_g: Math.round((targetCalories * fatPct) / 9)
    };
  }

  async generateDailyMealPlan(userProfile) {
    const { weight, height, age, gender, activity_level, goal, daily_calorie_target } = userProfile;
    
    const targetCal = daily_calorie_target || this.calculateTargetCalories(weight, height, age, gender, activity_level, goal);
    const targetMacros = this.calculateTargetMacros(targetCal, goal);

    const foods = await db.all('SELECT * FROM foods ORDER BY RANDOM()');

    const mealPlan = {
      target_calories: targetCal,
      target_macros: targetMacros,
      meals: {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: []
      },
      totals: {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0
      }
    };

    const getFoodByCategoryOrFallback = (categories) => {
      const match = foods.find(f => categories.some(cat => f.category && f.category.toLowerCase().includes(cat.toLowerCase())));
      return match || foods[Math.floor(Math.random() * foods.length)];
    };

    const bGrain = getFoodByCategoryOrFallback(['Breakfast', 'Grains', 'Bakery']);
    const bProtein = getFoodByCategoryOrFallback(['Eggs', 'Dairy', 'Fruits']);
    
    const addMealItem = (mealType, food, portionG) => {
      if (!food) return;
      const ratio = portionG / 100;
      const item = {
        food_id: food.id,
        food_name: food.food_name,
        portion_g: portionG,
        calories: Math.round((food.calories_per_100g || 0) * ratio),
        protein: Math.round((food.protein_per_100g || 0) * ratio * 10) / 10,
        carbohydrates: Math.round((food.carbohydrates_per_100g || 0) * ratio * 10) / 10,
        fat: Math.round((food.fat_per_100g || 0) * ratio * 10) / 10
      };
      mealPlan.meals[mealType].push(item);
      mealPlan.totals.calories += item.calories;
      mealPlan.totals.protein += item.protein;
      mealPlan.totals.carbohydrates += item.carbohydrates;
      mealPlan.totals.fat += item.fat;
    };

    addMealItem('Breakfast', bGrain, 120);
    addMealItem('Breakfast', bProtein, 100);

    const lGrain = getFoodByCategoryOrFallback(['Grains', 'Starch']);
    const lProtein = getFoodByCategoryOrFallback(['Meat', 'Poultry', 'Seafood', 'Plant Protein']);
    const lVeggies = getFoodByCategoryOrFallback(['Vegetables']);

    addMealItem('Lunch', lGrain, 150);
    addMealItem('Lunch', lProtein, 150);
    addMealItem('Lunch', lVeggies, 100);

    const dGrain = getFoodByCategoryOrFallback(['Grains', 'Starch']);
    const dProtein = getFoodByCategoryOrFallback(['Meat', 'Poultry', 'Seafood', 'Plant Protein']);
    const dVeggies = getFoodByCategoryOrFallback(['Vegetables']);

    addMealItem('Dinner', dGrain, 120);
    addMealItem('Dinner', dProtein, 140);
    addMealItem('Dinner', dVeggies, 120);

    const snackFood = getFoodByCategoryOrFallback(['Snacks', 'Dairy', 'Fruits', 'Nuts']);
    addMealItem('Snack', snackFood, 100);

    mealPlan.totals.protein = Math.round(mealPlan.totals.protein * 10) / 10;
    mealPlan.totals.carbohydrates = Math.round(mealPlan.totals.carbohydrates * 10) / 10;
    mealPlan.totals.fat = Math.round(mealPlan.totals.fat * 10) / 10;

    return mealPlan;
  }
}

module.exports = new RecommendationEngine();
