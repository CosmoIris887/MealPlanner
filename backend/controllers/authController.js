const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const recommendationEngine = require('../services/recommendation/recommendationEngine');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, age, gender, weight, height, activity_level, goal } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email address is already registered.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const userResult = await db.run(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), password_hash]
      );
      const userId = userResult.lastID;

      const userAge = parseInt(age, 10) || 25;
      const userGender = (gender || 'male').toLowerCase();
      const userWeight = parseFloat(weight) || 70;
      const userHeight = parseFloat(height) || 170;
      const userActivity = activity_level || 'moderate';
      const userGoal = goal || 'maintain';

      const targetCalories = recommendationEngine.calculateTargetCalories(
        userWeight, userHeight, userAge, userGender, userActivity, userGoal
      );

      await db.run(
        `INSERT INTO user_profiles (user_id, age, gender, weight, height, activity_level, goal, daily_calorie_target)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, userAge, userGender, userWeight, userHeight, userActivity, userGoal, targetCalories]
      );

      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

      const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);
      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: { ...user, profile }
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [user.id]);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      delete user.password_hash;

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: { ...user, profile }
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully.' });
  }

  async getMe(req, res, next) {
    try {
      const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);
      res.json({
        success: true,
        user: { ...user, profile }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
