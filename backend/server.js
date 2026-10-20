const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { validateEnv } = require('./config/envValidator');
validateEnv();

const initDatabase = require('./database/init');
const seedDatabase = require('./database/seed');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const foodRoutes = require('./routes/foodRoutes');
const scanRoutes = require('./routes/scanRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));


// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Meal Planner API is running smoothly!', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize Database and Start Server
async function startServer() {
  try {
    await initDatabase();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 AI Meal Planner Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
