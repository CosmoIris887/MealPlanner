const db = require('../config/db');
const initDatabase = require('./init');

const foodDataset = [
  // Indonesian & Popular Local Foods
  { food_name: 'Nasi Putih (Steamed Rice)', category: 'Grains', serving_size: '100g', calories_per_100g: 130, protein_per_100g: 2.7, carbohydrates_per_100g: 28.2, fat_per_100g: 0.3, fiber_per_100g: 0.4, source: 'Kaggle' },
  { food_name: 'Nasi Goreng (Fried Rice)', category: 'Grains', serving_size: '100g', calories_per_100g: 168, protein_per_100g: 4.2, carbohydrates_per_100g: 24.1, fat_per_100g: 6.2, fiber_per_100g: 1.1, source: 'Kaggle' },
  { food_name: 'Ayam Goreng (Fried Chicken)', category: 'Meat & Poultry', serving_size: '100g', calories_per_100g: 246, protein_per_100g: 25.0, carbohydrates_per_100g: 0.0, fat_per_100g: 16.0, fiber_per_100g: 0.0, source: 'Kaggle' },
  { food_name: 'Ayam Bakar (Grilled Chicken)', category: 'Meat & Poultry', serving_size: '100g', calories_per_100g: 195, protein_per_100g: 28.5, carbohydrates_per_100g: 2.0, fat_per_100g: 7.8, fiber_per_100g: 0.0, source: 'Kaggle' },
  { food_name: 'Dada Ayam Rebus (Boiled Chicken Breast)', category: 'Meat & Poultry', serving_size: '100g', calories_per_100g: 165, protein_per_100g: 31.0, carbohydrates_per_100g: 0.0, fat_per_100g: 3.6, fiber_per_100g: 0.0, source: 'USDA' },
  { food_name: 'Rendang Sapi (Beef Rendang)', category: 'Meat & Poultry', serving_size: '100g', calories_per_100g: 193, protein_per_100g: 22.6, carbohydrates_per_100g: 4.5, fat_per_100g: 9.2, fiber_per_100g: 0.8, source: 'Kaggle' },
  { food_name: 'Tahu Goreng (Fried Tofu)', category: 'Vegetarian / Plant Protein', serving_size: '100g', calories_per_100g: 115, protein_per_100g: 8.1, carbohydrates_per_100g: 2.5, fat_per_100g: 8.5, fiber_per_100g: 1.2, source: 'Kaggle' },
  { food_name: 'Tempe Goreng (Fried Tempeh)', category: 'Vegetarian / Plant Protein', serving_size: '100g', calories_per_100g: 193, protein_per_100g: 19.0, carbohydrates_per_100g: 9.4, fat_per_100g: 11.0, fiber_per_100g: 1.4, source: 'Kaggle' },
  { food_name: 'Tempe Bacem', category: 'Vegetarian / Plant Protein', serving_size: '100g', calories_per_100g: 157, protein_per_100g: 12.5, carbohydrates_per_100g: 14.2, fat_per_100g: 6.8, fiber_per_100g: 2.1, source: 'Kaggle' },
  { food_name: 'Telur Dadar (Omelette)', category: 'Eggs & Dairy', serving_size: '100g', calories_per_100g: 154, protein_per_100g: 10.6, carbohydrates_per_100g: 1.2, fat_per_100g: 11.8, fiber_per_100g: 0.0, source: 'Kaggle' },
  { food_name: 'Telur Rebus (Boiled Egg)', category: 'Eggs & Dairy', serving_size: '100g', calories_per_100g: 155, protein_per_100g: 12.6, carbohydrates_per_100g: 1.1, fat_per_100g: 10.6, fiber_per_100g: 0.0, source: 'USDA' },
  { food_name: 'Gado-Gado (Indonesian Salad with Peanut Sauce)', category: 'Vegetables', serving_size: '100g', calories_per_100g: 132, protein_per_100g: 4.8, carbohydrates_per_100g: 11.5, fat_per_100g: 7.6, fiber_per_100g: 2.9, source: 'Kaggle' },
  { food_name: 'Soto Ayam (Chicken Soup)', category: 'Soups', serving_size: '100g', calories_per_100g: 78, protein_per_100g: 6.5, carbohydrates_per_100g: 4.2, fat_per_100g: 3.8, fiber_per_100g: 0.5, source: 'Kaggle' },
  { food_name: 'Sate Ayam (Chicken Satay)', category: 'Meat & Poultry', serving_size: '100g', calories_per_100g: 218, protein_per_100g: 24.2, carbohydrates_per_100g: 6.5, fat_per_100g: 11.0, fiber_per_100g: 0.8, source: 'Kaggle' },
  { food_name: 'Ikan Bakar (Grilled Fish)', category: 'Seafood', serving_size: '100g', calories_per_100g: 142, protein_per_100g: 22.0, carbohydrates_per_100g: 1.5, fat_per_100g: 5.2, fiber_per_100g: 0.0, source: 'Kaggle' },
  { food_name: 'Ikan Salmon Panggang (Grilled Salmon)', category: 'Seafood', serving_size: '100g', calories_per_100g: 206, protein_per_100g: 22.1, carbohydrates_per_100g: 0.0, fat_per_100g: 12.3, fiber_per_100g: 0.0, source: 'USDA' },
  
  // Healthy Staples & Fruits
  { food_name: 'Oatmeal Rebus (Cooked Oatmeal)', category: 'Breakfast & Grains', serving_size: '100g', calories_per_100g: 68, protein_per_100g: 2.4, carbohydrates_per_100g: 12.0, fat_per_100g: 1.4, fiber_per_100g: 1.7, source: 'USDA' },
  { food_name: 'Pisang (Banana)', category: 'Fruits', serving_size: '100g', calories_per_100g: 89, protein_per_100g: 1.1, carbohydrates_per_100g: 22.8, fat_per_100g: 0.3, fiber_per_100g: 2.6, source: 'USDA' },
  { food_name: 'Apel (Apple)', category: 'Fruits', serving_size: '100g', calories_per_100g: 52, protein_per_100g: 0.3, carbohydrates_per_100g: 13.8, fat_per_100g: 0.2, fiber_per_100g: 2.4, source: 'USDA' },
  { food_name: 'Alpukat (Avocado)', category: 'Fruits', serving_size: '100g', calories_per_100g: 160, protein_per_100g: 2.0, carbohydrates_per_100g: 8.5, fat_per_100g: 14.7, fiber_per_100g: 6.7, source: 'USDA' },
  { food_name: 'Greek Yogurt Plain', category: 'Dairy & Snacks', serving_size: '100g', calories_per_100g: 59, protein_per_100g: 10.0, carbohydrates_per_100g: 3.6, fat_per_100g: 0.4, fiber_per_100g: 0.0, source: 'USDA' },
  { food_name: 'Susu Sapi Low Fat (Low Fat Milk)', category: 'Dairy & Drinks', serving_size: '100g', calories_per_100g: 42, protein_per_100g: 3.4, carbohydrates_per_100g: 5.0, fat_per_100g: 1.0, fiber_per_100g: 0.0, source: 'USDA' },
  { food_name: 'Roti Gandum (Whole Wheat Bread)', category: 'Bakery & Grains', serving_size: '100g', calories_per_100g: 247, protein_per_100g: 13.0, carbohydrates_per_100g: 41.3, fat_per_100g: 3.4, fiber_per_100g: 6.0, source: 'USDA' },
  { food_name: 'Kentang Rebus (Boiled Potato)', category: 'Vegetables & Starch', serving_size: '100g', calories_per_100g: 87, protein_per_100g: 1.9, carbohydrates_per_100g: 20.1, fat_per_100g: 0.1, fiber_per_100g: 1.8, source: 'USDA' },
  { food_name: 'Ubi Jalar Kukus (Steamed Sweet Potato)', category: 'Vegetables & Starch', serving_size: '100g', calories_per_100g: 90, protein_per_100g: 2.0, carbohydrates_per_100g: 20.7, fat_per_100g: 0.1, fiber_per_100g: 3.3, source: 'USDA' },
  { food_name: 'Brokoli Kukus (Steamed Broccoli)', category: 'Vegetables', serving_size: '100g', calories_per_100g: 35, protein_per_100g: 2.4, carbohydrates_per_100g: 7.2, fat_per_100g: 0.4, fiber_per_100g: 3.3, source: 'USDA' },
  { food_name: 'Bayam Tumis (Sautéed Spinach)', category: 'Vegetables', serving_size: '100g', calories_per_100g: 45, protein_per_100g: 3.0, carbohydrates_per_100g: 3.8, fat_per_100g: 2.5, fiber_per_100g: 2.2, source: 'Kaggle' },
  { food_name: 'Kacang Almond (Almonds)', category: 'Nuts & Seeds', serving_size: '100g', calories_per_100g: 579, protein_per_100g: 21.2, carbohydrates_per_100g: 21.6, fat_per_100g: 49.9, fiber_per_100g: 12.5, source: 'USDA' },
  { food_name: 'Salad Sayur Segar (Fresh Garden Salad)', category: 'Vegetables', serving_size: '100g', calories_per_100g: 33, protein_per_100g: 1.5, carbohydrates_per_100g: 4.8, fat_per_100g: 1.2, fiber_per_100g: 2.1, source: 'Kaggle' }
];

async function seedDatabase() {
  await initDatabase();
  console.log('Seeding food database...');

  const countRow = await db.get('SELECT COUNT(*) as count FROM foods');
  if (countRow.count > 0) {
    console.log(`Database already has ${countRow.count} foods. Skipping seed insertion.`);
    return;
  }

  for (const food of foodDataset) {
    await db.run(
      `INSERT INTO foods (food_name, category, serving_size, calories_per_100g, protein_per_100g, carbohydrates_per_100g, fat_per_100g, fiber_per_100g, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        food.food_name,
        food.category,
        food.serving_size,
        food.calories_per_100g,
        food.protein_per_100g,
        food.carbohydrates_per_100g,
        food.fat_per_100g,
        food.fiber_per_100g,
        food.source
      ]
    );
  }

  console.log(`Successfully seeded ${foodDataset.length} foods into database!`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
