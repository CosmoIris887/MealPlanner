const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken);

router.post('/', upload.single('image'), (req, res, next) => scanController.analyzeFoodImage(req, res, next));
router.get('/model-info', (req, res, next) => scanController.getModelInfo(req, res, next));
router.post('/log-intake', (req, res, next) => scanController.logToIntake(req, res, next));
router.get('/history', (req, res, next) => scanController.getHistory(req, res, next));
router.delete('/:id', (req, res, next) => scanController.deleteScan(req, res, next));
router.delete('/intake/:id', (req, res, next) => scanController.deleteIntake(req, res, next));

module.exports = router;
