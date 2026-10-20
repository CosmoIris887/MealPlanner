const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public / Read routes
router.get('/', (req, res, next) => foodController.getFoods(req, res, next));
router.get('/search', (req, res, next) => foodController.searchFood(req, res, next));
router.get('/dataset/status', verifyToken, (req, res, next) => foodController.getDatasetStatus(req, res, next));
router.get('/:id', (req, res, next) => foodController.getFoodById(req, res, next));

// Protected routes to add/delete custom items
router.post('/custom', verifyToken, upload.single('image'), (req, res, next) => foodController.createCustomFood(req, res, next));
router.post('/dataset-sample', verifyToken, upload.single('image'), (req, res, next) => foodController.createCustomFood(req, res, next));

router.delete('/:id', verifyToken, (req, res, next) => foodController.deleteCustomFood(req, res, next));

module.exports = router;
