const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', verifyToken, (req, res) => authController.logout(req, res));
router.get('/me', verifyToken, (req, res, next) => authController.getMe(req, res, next));

module.exports = router;
