const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/mealPlanController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', (req, res, next) => mealPlanController.getMealPlan(req, res, next));
router.post('/generate', (req, res, next) => mealPlanController.generateMealPlan(req, res, next));
router.delete('/:id', (req, res, next) => mealPlanController.deleteMealPlan(req, res, next));

module.exports = router;
