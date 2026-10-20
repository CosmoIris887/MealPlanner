const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', (req, res, next) => chatController.sendMessage(req, res, next));
router.get('/conversations', (req, res, next) => chatController.getConversations(req, res, next));
router.get('/conversations/:id', (req, res, next) => chatController.getConversationMessages(req, res, next));
router.delete('/conversations/:id', (req, res, next) => chatController.deleteConversation(req, res, next));

module.exports = router;
