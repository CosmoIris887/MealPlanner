const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
router.put('/', (req, res, next) => profileController.updateProfile(req, res, next));
router.delete('/', (req, res, next) => profileController.deleteAccount(req, res, next));

module.exports = router;
