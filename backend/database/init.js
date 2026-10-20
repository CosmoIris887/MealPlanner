const db = require('../config/db');

async function initDatabase() {
  console.log('Initializing database tables...');

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        age INTEGER,
        gender TEXT,
        weight REAL,
        height REAL,
        activity_level TEXT,
        goal TEXT,
        daily_calorie_target INTEGER,
        food_preferences TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name TEXT NOT NULL,
        category TEXT,
        serving_size TEXT,
        calories_per_100g REAL NOT NULL,
        protein_per_100g REAL DEFAULT 0,
        carbohydrates_per_100g REAL DEFAULT 0,
        fat_per_100g REAL DEFAULT 0,
        fiber_per_100g REAL DEFAULT 0,
        image_url TEXT,
        source TEXT DEFAULT 'Kaggle',
        source_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS food_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_path TEXT,
        detected_food_name TEXT NOT NULL,
        matched_food_id INTEGER,
        confidence_score REAL NOT NULL,
        weight_g REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbohydrates REAL NOT NULL,
        fat REAL NOT NULL,
        status TEXT DEFAULT 'confirmed',
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (matched_food_id) REFERENCES foods(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS meal_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        target_calories INTEGER NOT NULL,
        total_calories INTEGER DEFAULT 0,
        total_protein REAL DEFAULT 0,
        total_carbs REAL DEFAULT 0,
        total_fat REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_plan_id INTEGER NOT NULL,
        meal_type TEXT NOT NULL,
        food_id INTEGER,
        food_name TEXT NOT NULL,
        portion_g REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbohydrates REAL NOT NULL,
        fat REAL NOT NULL,
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS daily_intake (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        food_name TEXT NOT NULL,
        food_id INTEGER,
        portion_g REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbohydrates REAL NOT NULL,
        fat REAL NOT NULL,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(food_name);
      CREATE INDEX IF NOT EXISTS idx_scans_user ON food_scans(user_id);
      CREATE INDEX IF NOT EXISTS idx_intake_user_date ON daily_intake(user_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
    `);

    // Add image_url column to existing foods table if missing
    try {
      await db.exec(`ALTER TABLE foods ADD COLUMN image_url TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }

    console.log('Database tables initialized successfully!');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}

module.exports = initDatabase;
