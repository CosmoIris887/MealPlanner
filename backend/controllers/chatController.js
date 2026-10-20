const chatbotService = require('../services/ai/chatbotService');
const db = require('../config/db');

class ChatController {
  async sendMessage(req, res, next) {
    try {
      let { conversation_id, message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }

      let convId = conversation_id;

      if (!convId) {
        const titleSnippet = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        const convResult = await db.run(
          'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
          [req.userId, titleSnippet]
        );
        convId = convResult.lastID;
      } else {
        const conv = await db.get('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [convId, req.userId]);
        if (!conv) {
          const titleSnippet = message.slice(0, 30) + (message.length > 30 ? '...' : '');
          const convResult = await db.run(
            'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
            [req.userId, titleSnippet]
          );
          convId = convResult.lastID;
        }
      }

      const assistantReply = await chatbotService.processUserMessage(req.userId, convId, message.trim());

      const messages = await db.all(
        'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [convId]
      );

      res.json({
        success: true,
        conversation_id: convId,
        reply: assistantReply,
        messages
      });
    } catch (err) {
      next(err);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await db.all(
        `SELECT c.*, 
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
         FROM conversations c 
         WHERE c.user_id = ? 
         ORDER BY c.created_at DESC`,
        [req.userId]
      );

      res.json({ success: true, count: conversations.length, conversations });
    } catch (err) {
      next(err);
    }
  }

  async getConversationMessages(req, res, next) {
    try {
      const convId = req.params.id;
      const conversation = await db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [convId, req.userId]);
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }

      const messages = await db.all(
        'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [convId]
      );

      res.json({ success: true, conversation, messages });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const convId = req.params.id;
      await db.run('DELETE FROM conversations WHERE id = ? AND user_id = ?', [convId, req.userId]);
      res.json({ success: true, message: 'Conversation deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChatController();
