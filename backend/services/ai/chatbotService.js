const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../../config/db');
const foodDataService = require('../nutrition/foodDataService');

// Candidate Gemini models in order of priority & stability
const DEFAULT_CANDIDATE_CHAT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

class ChatbotService {
  /**
   * Processes a user chat message with context, profile, nutrition RAG, and Gemini LLM.
   */
  async processUserMessage(userId, conversationId, userMessageText) {
    if (!userMessageText || !userMessageText.trim()) {
      throw new Error('Pesan pengguna tidak boleh kosong.');
    }

    const trimmedMessage = userMessageText.trim();

    // 1. Fetch user profile & user data from database (no fabrication)
    const userProfile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const user = await db.get('SELECT name, email FROM users WHERE id = ?', [userId]);

    // 2. Fetch past conversation history (up to last 16 messages)
    const previousMessages = await db.all(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 16',
      [conversationId]
    );

    // 3. Keyword search in database for Nutrition RAG Context
    const keywords = trimmedMessage.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let matchedFoodResults = [];
    const stopWords = [
      'kalori', 'protein', 'karbo', 'lemak', 'berapa', 'makanan', 'untuk', 'diet',
      'saya', 'dengan', 'budget', 'rekomendasi', 'menu', 'tolong', 'apa', 'saja',
      'yang', 'bisa', 'kamu', 'buatkan', 'pagi', 'siang', 'malam', 'hari', 'ini',
      'apakah', 'cocok', 'punya', 'rumah', 'gram'
    ];

    for (const word of keywords) {
      if (stopWords.includes(word)) continue;
      try {
        const found = await foodDataService.searchFood(word);
        if (found && found.length > 0) {
          matchedFoodResults = matchedFoodResults.concat(found);
        }
      } catch (err) {
        // Silently skip failed keyword searches
      }
    }

    const uniqueFoods = Array.from(new Set(matchedFoodResults.map(f => f.id)))
      .map(id => matchedFoodResults.find(f => f.id === id))
      .filter(Boolean)
      .slice(0, 10);

    let databaseContext = '';
    if (uniqueFoods.length > 0) {
      databaseContext = `\n[Database Nutrition Reference]:\n` + uniqueFoods.map(f => 
        `- ${f.food_name}: ${f.calories_per_100g} kcal/100g, Protein: ${f.protein_per_100g}g, Karbohidrat: ${f.carbohydrates_per_100g}g, Lemak: ${f.fat_per_100g}g (Sumber: ${f.source})`
      ).join('\n');
    }

    const profileContext = userProfile ? `
[Profil Pengguna]:
- Nama: ${user ? user.name : 'Pengguna'}
- Usia: ${userProfile.age || 25} tahun
- Jenis Kelamin: ${userProfile.gender === 'female' ? 'Wanita' : 'Pria'}
- Berat Badan: ${userProfile.weight || 70} kg
- Tinggi Badan: ${userProfile.height || 170} cm
- Tingkat Aktivitas: ${userProfile.activity_level || 'moderate'}
- Tujuan (Goal): ${userProfile.goal || 'maintain'}
- Target Kalori Harian: ${userProfile.daily_calorie_target || 2000} kcal/hari
- Preferensi Makanan: ${userProfile.food_preferences || 'Tidak ada pantangan khusus'}
` : '[Profil Pengguna]: Belum diatur lengkap oleh pengguna.';

    const systemInstruction = `Kamu adalah AI Meal Planner & Nutrition Consultant cerdas, ramah, dan profesional untuk aplikasi AI Food & Meal Planner.
Sistem AI kamu ditenagai oleh Google Gemini API sebagai satu-satunya mesin kecerdasan buatan aktif.

Tugas & Panduan Utama:
1. Jawab pertanyaan seputar makanan, bahan yang tersedia di dapur/kulkas, anggaran (budget), kebutuhan kalori harian, jadwal makan (sarapan, siang, malam, camilan), dan pola hidup sehat secara relevan dan komprehensif dalam bahasa Indonesia yang ramah.
2. Respons skenario khusus:
   - Bahan di rumah & Budget terbatas (misal: "Saya punya telur, wortel, dan timun dengan budget Rp5.000. Menu apa yang bisa dibuat?"): Berikan ide resep praktis, estimasi porsi, dan cara mengolahnya sesuai anggaran.
   - Kesesuaian makanan spesifik (misal: "Apakah steak wagyu A5 cocok untuk menu makan saya?"): Evaluasi berdasarkan profil kalori dan target kesehatan pengguna (misal tinggi lemak jenuh untuk diet rendah lemak vs keto).
   - Menu harian terencana (misal: "Buatkan menu harian berdasarkan kebutuhan kalori dan anggaran saya."): Rancang menu sarapan, makan siang, makan malam, dan snack yang seimbang dengan estimasi kalori dan makronutrisi.
   - Perhitungan kalori berdasarkan berat porsi (misal: "Berapa perkiraan kalori makanan ini jika beratnya 200 gram?"): Gunakan rumus: Kalori = (berat makanan dalam gram / 100) × kalori per 100 gram. Jelaskan perhitungannya dengan transparan.
3. Gunakan data nutrisi dari [Database Nutrition Reference] jika tersedia. Jika data nutrisi tidak tercatat di database, sampaikan estimasi sebagai perkiraan yang belum terverifikasi secara klinis.
4. Jangan mengarang data profil pengguna jika belum diatur; gunakan profil yang tersedia di atas.
5. Pertahankan konteks dari riwayat percakapan sebelumnya.
6. PENTING: Jangan memberikan diagnosis medis formal; selalu sertakan anjuran konsultasi dokter atau ahli gizi untuk kondisi kesehatan medis tertentu.

${profileContext}
${databaseContext}`;

    let replyText = '';
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.VISION_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_')) {
      replyText = 'Layanan Chatbot belum dapat menghubungi Google Gemini karena GEMINI_API_KEY belum dikonfigurasi di backend (.env). Harap periksa konfigurasi API Key Anda.';
    } else {
      // 4. Format chat history for Gemini SDK
      // Note: Gemini SDK requires history to start with a 'user' turn and alternate properly.
      const formattedHistory = [];
      for (const m of previousMessages) {
        const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        if (formattedHistory.length === 0 && role === 'model') {
          // Gemini requires the first turn to be 'user'
          continue;
        }
        if (!m.content || !m.content.trim()) continue;
        formattedHistory.push({
          role,
          parts: [{ text: m.content.trim() }]
        });
      }

      // 5. Call Gemini API with candidate models and graceful fallback
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const configuredModel = process.env.GEMINI_CHAT_MODEL;
      const candidateModels = Array.from(new Set([
        configuredModel,
        ...DEFAULT_CANDIDATE_CHAT_MODELS
      ].filter(Boolean)));

      let lastError = null;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95
            }
          });

          const chat = model.startChat({
            history: formattedHistory
          });

          const result = await chat.sendMessage(trimmedMessage);
          const response = await result.response;
          const candidateText = response.text();

          if (candidateText && candidateText.trim().length > 0) {
            replyText = candidateText.trim();
            break; // Success! Exit candidate loop
          }
        } catch (err) {
          lastError = err;
          console.warn(`[Gemini LLM] Model ${modelName} failed: ${err.message}. Trying next candidate model...`);
        }
      }

      if (!replyText) {
        console.error('[Gemini LLM] All candidate models failed. Last error:', lastError ? lastError.message : 'Unknown');
        replyText = `Maaf, saat ini asisten AI sedang mengalami kendala koneksi ke server Gemini (${lastError ? lastError.message : 'Gagal merespons'}). Silakan coba beberapa saat lagi.`;
      }
    }

    // 6. Persist user message and assistant reply into database
    await db.run(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [conversationId, 'user', trimmedMessage]
    );

    await db.run(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [conversationId, 'assistant', replyText]
    );

    return replyText;
  }
}

module.exports = new ChatbotService();
