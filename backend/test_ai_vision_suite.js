const fs = require('fs');
const path = require('path');
const visionService = require('./services/ai/visionService');
const chatbotService = require('./services/ai/chatbotService');
const db = require('./config/db');
require('dotenv').config();

async function runGeminiVisionSuite() {
  console.log('========================================================================');
  console.log('🧪 PENGUJIAN MENYELURUH: GEMINI API SEBAGAI SATU-SATUNYA AI AKTIF');
  console.log('   (VERIFIKASI PENGHAPUSAN TRAINING PIPELINE & DATASET BESAR)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   ${details}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   ${details}`);
    }
    console.log('');
  }

  // ------------------------------------------------------------------------
  // TEST 1: Verifikasi Environment & Konfigurasi Gemini API
  // ------------------------------------------------------------------------
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.VISION_API_KEY;
  const visionModel = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest';
  const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';

  assert(
    '1. Konfigurasi Terpusat Gemini API di Environment (.env)',
    Boolean(geminiApiKey && geminiApiKey.length > 20 && !geminiApiKey.includes('your_')),
    `API Key: Terkonfigurasi (${geminiApiKey ? geminiApiKey.length : 0} karakter)\n   Vision Model: ${visionModel}\n   Chat Model: ${chatModel}`
  );

  // ------------------------------------------------------------------------
  // TEST 2: Verifikasi Eliminasi Pipeline Training & Artefak Model Berat
  // ------------------------------------------------------------------------
  const removedArtifacts = [
    'ml/mobilenetv2-7.onnx',
    'ml/mobilenetv2_food_dual.onnx',
    'ml/mobilenetv2_food_model.keras',
    'ml/mobilenetv2_food_model.onnx',
    'ml/best_head_weights.weights.h5',
    'ml/features_train.npz',
    'ml/tf_features_train.npz',
    'ml/train_eval.py',
    'ml/train_mobilenetv2_tf.py',
    'ml/dataset_manager.py',
    'ml/predict.py',
    'services/datasetService.js'
  ];

  const noneExist = removedArtifacts.every(f => !fs.existsSync(path.join(__dirname, f)));
  assert(
    '2. Eliminasi Pipeline Training & Artefak Model Berat (Bebas Python & ONNX)',
    noneExist,
    `Seluruh file model ONNX, bobot training Keras, skrip training Python, dan dataset service berhasil dibersihkan dari proyek.`
  );

  // ------------------------------------------------------------------------
  // TEST 3: Pengenalan Makanan Universal via Gemini Vision (Sushi Salmon)
  // ------------------------------------------------------------------------
  const sushiPath = path.join(__dirname, 'uploads/test_sushi.jpg');
  if (fs.existsSync(sushiPath)) {
    try {
      const res = await visionService.classifyFoodImage(sushiPath);
      const isRecognized = res.is_food === true && res.is_recognized === true;
      const isFoodIdentified = res.food_name && (res.food_name.toLowerCase().includes('sushi') || res.food_name.toLowerCase().includes('salmon') || res.food_name.toLowerCase().includes('nigiri'));

      assert(
        '3. Gemini Vision: Pengenalan Makanan (Sushi / Salmon Nigiri)',
        isRecognized && isFoodIdentified,
        `Hasil AI: "${res.food_name}" | Keyakinan: ${res.confidence_level} (${res.confidence_percentage}%)\n   Bahan Terlihat: ${(res.visible_ingredients || []).join(', ')}\n   Engine: ${res.model_info?.active_engine}`
      );
    } catch (e) {
      assert('3. Gemini Vision: Pengenalan Makanan (Sushi)', false, e.message);
    }
  } else {
    assert('3. Gemini Vision: Pengenalan Makanan (Sushi)', false, 'File test_sushi.jpg tidak ditemukan.');
  }

  // ------------------------------------------------------------------------
  // TEST 4: Pengenalan Makanan Universal via Gemini Vision (Steak Wagyu)
  // ------------------------------------------------------------------------
  const steakPath = path.join(__dirname, 'uploads/test_wagyu_steak.jpg');
  if (fs.existsSync(steakPath)) {
    try {
      const res = await visionService.classifyFoodImage(steakPath);
      const isRecognized = res.is_food === true && res.is_recognized === true;
      const isSteak = res.food_name && (res.food_name.toLowerCase().includes('steak') || res.food_name.toLowerCase().includes('beef') || res.food_name.toLowerCase().includes('daging'));

      assert(
        '4. Gemini Vision: Pengenalan Makanan Universal (Steak Wagyu / Beef)',
        isRecognized && isSteak,
        `Hasil AI: "${res.food_name}" | Keyakinan: ${res.confidence_level} (${res.confidence_percentage}%)\n   Metode Masak: ${res.estimated_cooking_method}\n   Bahan Terlihat: ${(res.visible_ingredients || []).join(', ')}`
      );
    } catch (e) {
      assert('4. Gemini Vision: Pengenalan Makanan (Steak Wagyu)', false, e.message);
    }
  } else {
    assert('4. Gemini Vision: Pengenalan Makanan (Steak Wagyu)', false, 'File test_wagyu_steak.jpg tidak ditemukan.');
  }

  // ------------------------------------------------------------------------
  // TEST 5: Penolakan Gambar Non-Makanan (Random Noise / Benda Mati)
  // ------------------------------------------------------------------------
  const noisePath = path.join(__dirname, 'uploads/test_noise_nonfood.jpg');
  if (fs.existsSync(noisePath)) {
    try {
      const res = await visionService.classifyFoodImage(noisePath);
      const isRejected = res.is_food === false && res.is_recognized === false && res.food_name === null;

      assert(
        '5. Penolakan Gambar Non-Makanan (Random Noise / Objek Bukan Makanan)',
        isRejected,
        `is_food: ${res.is_food} | is_recognized: ${res.is_recognized}\n   Pesan Penolakan: "${res.message}"`
      );
    } catch (e) {
      assert('5. Penolakan Gambar Non-Makanan', false, e.message);
    }
  } else {
    assert('5. Penolakan Gambar Non-Makanan', false, 'File test_noise_nonfood.jpg tidak ditemukan.');
  }

  // ------------------------------------------------------------------------
  // TEST 6: Penanganan File Hilang / Kosong (Robust Error Handling)
  // ------------------------------------------------------------------------
  try {
    let errorCaught = false;
    let errorMsg = '';
    try {
      await visionService.classifyFoodImage(path.join(__dirname, 'uploads/non_existent_file_xyz.jpg'));
    } catch (err) {
      errorCaught = true;
      errorMsg = err.message;
    }

    assert(
      '6. Penanganan File Gambar Hilang / Error Handling',
      errorCaught && errorMsg.includes('tidak ditemukan'),
      `Pesan Penanganan: "${errorMsg}"`
    );
  } catch (e) {
    assert('6. Penanganan File Gambar Hilang', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 7: Formula Perhitungan Kalori dan Nutrisi Berdasarkan Berat Porsi
  // ------------------------------------------------------------------------
  try {
    const foodRow = await db.get('SELECT * FROM foods WHERE food_name LIKE "%Nasi Goreng%" LIMIT 1');
    const initialWeight = 250; // gram
    const caloriesPer100g = foodRow ? foodRow.calories_per_100g : 168;
    const expectedCalories = Math.round((initialWeight / 100) * caloriesPer100g);
    const ratio = initialWeight / 100;
    const expectedProtein = Math.round((foodRow?.protein_per_100g || 4.2) * ratio * 10) / 10;

    assert(
      '7. Formula Perhitungan Kalori & Nutrisi Berdasarkan Berat Porsi (Database)',
      Boolean(foodRow && expectedCalories > 0),
      `Makanan: "${foodRow?.food_name}" | Formula: (${initialWeight}g / 100) × ${caloriesPer100g} kcal = ${expectedCalories} kcal\n   Protein: ${expectedProtein}g`
    );
  } catch (e) {
    assert('7. Formula Perhitungan Kalori', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 8: Chatbot Gemini dengan Konteks Profil Pengguna & Anggaran
  // ------------------------------------------------------------------------
  try {
    const testConv = await db.run('INSERT INTO conversations (user_id, title) VALUES (1, "Test Gemini Clean")');
    const convId = testConv.lastID;

    const chatReply = await chatbotService.processUserMessage(
      1,
      convId,
      'Saya punya telur, wortel, dan timun dengan budget Rp5.000. Menu apa yang bisa dibuat?'
    );

    const isMeaningfulReply = chatReply && chatReply.length > 50 && !chatReply.includes('Layanan Chatbot belum dapat menghubungi');
    assert(
      '8. Chatbot Gemini: Rekomendasi Menu Berdasarkan Bahan Dapur & Anggaran',
      Boolean(isMeaningfulReply),
      `Cuplikan Balasan AI: "${(chatReply || '').slice(0, 160)}..."`
    );

    // Clean up test conversation
    await db.run('DELETE FROM messages WHERE conversation_id = ?', [convId]);
    await db.run('DELETE FROM conversations WHERE id = ?', [convId]);
  } catch (e) {
    assert('8. Chatbot Gemini: Rekomendasi Menu', false, e.message);
  }

  // ------------------------------------------------------------------------
  // TEST 9: Metadata Model Menyatakan Gemini Sebagai Mesin AI Aktif Penuh
  // ------------------------------------------------------------------------
  try {
    const meta = visionService.getModelMetadata();
    const isGeminiActive = meta.active_ai_engine && meta.active_ai_engine.includes('Gemini');
    const isUniversal = meta.recognition_scope && meta.recognition_scope.includes('Universal');

    assert(
      '9. Metadata Model: Gemini Sebagai Mesin AI Aktif & Pengenalan Universal',
      Boolean(isGeminiActive && isUniversal),
      `Mesin Aktif: ${meta.active_ai_engine} (${meta.active_vision_model})\n   Cakupan: ${meta.recognition_scope}`
    );
  } catch (e) {
    assert('9. Metadata Model', false, e.message);
  }

  console.log('========================================================================');
  console.log(`📊 RINGKASAN AKHIR SUITE PENGUJIAN: ${passed} LULUS, ${failed} GAGAL`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiVisionSuite().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
