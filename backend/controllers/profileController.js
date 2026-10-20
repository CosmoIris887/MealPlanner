const db = require('../config/db');
const recommendationEngine = require('../services/recommendation/recommendationEngine');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]);
      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);
      
      res.json({
        success: true,
        user,
        profile
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, age, gender, weight, height, activity_level, goal, food_preferences } = req.body;

      if (name && name.trim()) {
        await db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name.trim(), req.userId]);
      }

      const existingProfile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);

      const updatedAge = age !== undefined ? parseInt(age, 10) : (existingProfile ? existingProfile.age : 25);
      const updatedGender = gender !== undefined ? gender : (existingProfile ? existingProfile.gender : 'male');
      const updatedWeight = weight !== undefined ? parseFloat(weight) : (existingProfile ? existingProfile.weight : 70);
      const updatedHeight = height !== undefined ? parseFloat(height) : (existingProfile ? existingProfile.height : 170);
      const updatedActivity = activity_level !== undefined ? activity_level : (existingProfile ? existingProfile.activity_level : 'moderate');
      const updatedGoal = goal !== undefined ? goal : (existingProfile ? existingProfile.goal : 'maintain');
      const updatedPrefs = food_preferences !== undefined ? food_preferences : (existingProfile ? existingProfile.food_preferences : '');

      const newCalorieTarget = recommendationEngine.calculateTargetCalories(
        updatedWeight, updatedHeight, updatedAge, updatedGender, updatedActivity, updatedGoal
      );

      if (existingProfile) {
        await db.run(
          `UPDATE user_profiles 
           SET age = ?, gender = ?, weight = ?, height = ?, activity_level = ?, goal = ?, daily_calorie_target = ?, food_preferences = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [updatedAge, updatedGender, updatedWeight, updatedHeight, updatedActivity, updatedGoal, newCalorieTarget, updatedPrefs, req.userId]
        );
      } else {
        await db.run(
          `INSERT INTO user_profiles (user_id, age, gender, weight, height, activity_level, goal, daily_calorie_target, food_preferences)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.userId, updatedAge, updatedGender, updatedWeight, updatedHeight, updatedActivity, updatedGoal, newCalorieTarget, updatedPrefs]
        );
      }

      const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [req.userId]);
      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);

      res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: { ...user, profile }
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      await db.run('DELETE FROM users WHERE id = ?', [req.userId]);
      res.json({ success: true, message: 'Account and associated data deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
