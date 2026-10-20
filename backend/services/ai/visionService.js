const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Candidate Gemini vision models in order of priority & stability
const DEFAULT_CANDIDATE_VISION_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

class VisionService {
  constructor() {
    // Google Gemini API is the sole active AI vision engine
  }

  /**
   * Helper to clean JSON string from possible markdown code fences
   */
  cleanJsonText(text) {
    if (!text) return '';
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/```\s*$/, '');
    }
    return cleaned.trim();
  }

  /**
   * Classifies and analyzes an uploaded food image using Google Gemini Vision API.
   * Universal food recognition without closed dataset limitations.
   */
  async classifyFoodImage(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('Berkas gambar tidak ditemukan di server.');
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('Berkas gambar kosong (0 bytes). Unggah gambar yang valid.');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };

    const mimeType = mimeMap[ext];
    if (!mimeType) {
      throw new Error('Format gambar tidak didukung. Harap gunakan JPG, PNG, atau WebP.');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VISION_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_')) {
      throw new Error('Layanan AI Vision belum dapat menghubungi Google Gemini karena GEMINI_API_KEY belum dikonfigurasi di backend (.env).');
    }

    const base64Data = fs.readFileSync(filePath).toString('base64');
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Configure candidate models
    const configuredModel = process.env.GEMINI_VISION_MODEL;
    const candidateModels = Array.from(new Set([
      configuredModel,
      ...DEFAULT_CANDIDATE_VISION_MODELS
    ].filter(Boolean)));

    const visionPrompt = `Anda adalah sistem AI Vision ahli pengenalan makanan, bahan makanan, dan analisis kuliner.
Periksa gambar ini secara seksama dan berikan respon HANYA dalam format JSON valid sesuai schema berikut:

{
  "is_food": true,
  "items": [
    {
      "food_name": "Nama Makanan Spesifik",
      "description": "Deskripsi singkat tampilan visual makanan",
      "visible_ingredients": ["bahan visual 1", "bahan visual 2"],
      "estimated_cooking_method": "metode memasak yang terlihat atau diperkirakan",
      "estimated_weight_grams": 250,
      "estimated_calories": 400,
      "confidence": "high",
      "uncertainties": [
        "hal yang belum pasti secara visual, misal bumbu tersembunyi atau kedalaman mangkuk"
      ]
    }
  ],
  "notes": ["catatan ringkas jika ada"]
}

Aturan ketat:
1. Jika gambar BUKAN makanan/minuman (misalnya kendaraan, dokumen, hewan hidup, benda mati, artefak noise acak, manusia tanpa makanan):
   - Set "is_food": false
   - Set "items": []
   - Tulis penjelasan di "notes" bahwa objek dalam gambar bukan makanan. JANGAN PERNAH mengarang nama makanan untuk gambar non-makanan.
2. Jika gambar berisi makanan:
   - Set "is_food": true
   - Identifikasi setiap makanan yang terlihat (misalnya sushi, ramen, wagyu steak, gado-gado, sate, salad, buah, dsb). Jangan membatasi pada dataset tertentu.
   - Jika ada beberapa jenis makanan terpisah pada gambar, sertakan setiap item di array "items".
   - Field "confidence" harus deskriptif berupa salah satu dari: "high", "medium", atau "low".
   - Jika gambar buram, objek tertutup, atau ragu, pilih confidence "low" dan jelaskan ketidakpastian di "uncertainties".
   - Jika berat tidak dapat diperkirakan secara masuk akal, isi "estimated_weight_grams" dengan null.
   - JANGAN menyimpulkan bahan tersembunyi yang tidak memiliki bukti visual.`;

    let parsedResult = null;
    let activeModelUsed = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            responseMimeType: 'application/json'
          }
        });

        const apiResponse = await model.generateContent([
          visionPrompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]);

        const rawText = (await apiResponse.response).text();
        const cleanedText = this.cleanJsonText(rawText);
        parsedResult = JSON.parse(cleanedText);
        activeModelUsed = modelName;
        break; // Successfully obtained and parsed response
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Vision] Model ${modelName} failed: ${err.message}. Trying next candidate model...`);
      }
    }

    if (!parsedResult) {
      console.error('[Gemini Vision] All candidate models failed. Last error:', lastError ? lastError.message : 'Unknown');
      throw new Error(`Gagal menganalisis gambar dengan Gemini Vision API (${lastError ? lastError.message : 'Koneksi gagal'}). Silakan coba beberapa saat lagi.`);
    }

    // Validate and normalize Gemini response
    const isFood = Boolean(parsedResult.is_food);
    const items = Array.isArray(parsedResult.items) ? parsedResult.items : [];
    const notes = Array.isArray(parsedResult.notes) ? parsedResult.notes : [];

    // Case 1: Image is NOT food
    if (!isFood || items.length === 0) {
      const rejectNote = notes.length > 0 ? notes.join('. ') : 'Gambar tidak terdeteksi sebagai makanan atau minuman yang dapat dikonsumsi.';
      return {
        is_food: false,
        is_recognized: false,
        status: 'non_food',
        detected_food_name: null,
        food_name: null,
        confidence: 0,
        confidence_percentage: 0,
        confidence_level: 'none',
        description: rejectNote,
        visible_ingredients: [],
        estimated_cooking_method: null,
        estimated_weight_grams: null,
        estimated_calories: null,
        uncertainties: [],
        items: [],
        notes: notes,
        model_version: 'gemini-api',
        model_info: {
          active_engine: 'Google Gemini Vision API',
          model_name: activeModelUsed,
          provider: 'Google AI Studio / Vertex AI'
        },
        message: `Objek pada gambar bukan merupakan makanan (${rejectNote}). Silakan unggah foto makanan yang jelas.`
      };
    }

    // Case 2: Image contains food
    const primaryItem = items[0] || {};
    const foodName = (primaryItem.food_name || 'Makanan Tidak Dikenal').trim();
    const confLevel = (primaryItem.confidence || 'medium').toLowerCase();

    // Map descriptive confidence to percentage score for compatibility
    let confidenceScore = 0.70;
    let confidencePct = 70;
    if (confLevel === 'high') {
      confidenceScore = 0.92;
      confidencePct = 92;
    } else if (confLevel === 'low') {
      confidenceScore = 0.40;
      confidencePct = 40;
    }

    const description = primaryItem.description || '';
    const visibleIngredients = Array.isArray(primaryItem.visible_ingredients) ? primaryItem.visible_ingredients : [];
    const cookingMethod = primaryItem.estimated_cooking_method || 'Tidak dapat dipastikan hanya dari gambar';
    const uncertainties = Array.isArray(primaryItem.uncertainties) ? primaryItem.uncertainties : [];
    const estimatedWeight = typeof primaryItem.estimated_weight_grams === 'number' ? primaryItem.estimated_weight_grams : null;
    const estimatedCalories = typeof primaryItem.estimated_calories === 'number' ? primaryItem.estimated_calories : null;

    let message = `Makanan berhasil diidentifikasi sebagai "${foodName}" menggunakan Gemini Vision API.`;
    if (confLevel === 'low') {
      message = `AI mendeteksi kemungkinan "${foodName}", namun tingkat keyakinan rendah. Harap periksa atau konfirmasi nama makanan.`;
    }

    return {
      is_food: true,
      is_recognized: true,
      status: confLevel === 'low' ? 'uncertain' : 'recognized',
      detected_food_name: foodName,
      food_name: foodName,
      confidence: confidenceScore,
      confidence_percentage: confidencePct,
      confidence_level: confLevel,
      description: description,
      visible_ingredients: visibleIngredients,
      estimated_cooking_method: cookingMethod,
      estimated_weight_grams: estimatedWeight,
      estimated_calories: estimatedCalories,
      uncertainties: uncertainties,
      items: items,
      notes: notes,
      model_version: 'gemini-api',
      model_info: {
        active_engine: 'Google Gemini Vision API',
        model_name: activeModelUsed,
        capabilities: 'Universal Multimodal Food & Dish Recognition, Ingredient Extraction & Visual Estimation'
      },
      portion_disclaimer: 'Estimasi kalori resmi dihitung dari database nutrisi per 100 gram dikalikan berat porsi. Gunakan timbangan makanan untuk presisi kalori.',
      message: message
    };
  }

  /**
   * Returns metadata explaining the active Gemini Vision engine.
   */
  getModelMetadata() {
    return {
      active_ai_engine: 'Google Gemini Vision API (Multimodal)',
      active_vision_model: process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest',
      active_chat_model: process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest',
      recognition_scope: 'Universal (Semua makanan lokal & internasional tanpa batasan dataset tertutup)',
      features: [
        'Universal food recognition beyond closed dataset classes (Sushi, Ramen, Steak Wagyu, Salad, Masakan Nusantara & Internasional)',
        'Visible ingredients extraction',
        'Cooking method inference',
        'Descriptive visual uncertainty reporting',
        'Automatic non-food rejection',
        'RAG integration with SQLite database & USDA FoodData Central'
      ]
    };
  }
}

module.exports = new VisionService();
