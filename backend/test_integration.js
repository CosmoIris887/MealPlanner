const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { JWT_SECRET } = require('./middleware/auth');
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('==========================================================');
  console.log('🧪 MEMULAI PENGUJIAN INTEGRASI GEMINI API & ENDPOINT SYSTEM');
  console.log('==========================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function report(name, isPass, detail = '') {
    if (isPass) {
      passedCount++;
      console.log(`✅ [PASS] ${name}`);
      if (detail) console.log(`   ${detail}\n`);
    } else {
      failedCount++;
      console.error(`❌ [FAIL] ${name}`);
      if (detail) console.error(`   ${detail}\n`);
    }
  }

  // 0. Setup Auth Token
  const token = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: '1d' });
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 1. Health Check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    report('1. Health Check Endpoint', res.data.success === true, `Response: "${res.data.message}"`);
  } catch (e) {
    report('1. Health Check Endpoint', false, e.message);
  }

  // 2. Chatbot Test - Empty Input Validation
  try {
    await axios.post(`${BASE_URL}/chat`, { message: '   ' }, { headers: authHeaders });
    report('2. Chatbot Empty Input Validation (Should reject 400)', false, 'Expected 400 but got 200');
  } catch (e) {
    const isExpected = e.response && e.response.status === 400;
    report('2. Chatbot Empty Input Validation', isExpected, `Status ${e.response?.status}: ${e.response?.data?.message}`);
  }

  // 3. Chatbot Test - Question 1: "Apa manfaat telur bagi tubuh?"
  let convId = null;
  try {
    const res = await axios.post(
      `${BASE_URL}/chat`,
      { message: 'Apa manfaat telur bagi tubuh?' },
      { headers: authHeaders }
    );
    convId = res.data.conversation_id;
    const reply = res.data.reply;
    const isRealGemini = reply && reply.length > 50 && !reply.includes('Saya dapat membantu Anda dengan');
    report(
      '3. Chatbot Question: "Apa manfaat telur bagi tubuh?"',
      res.data.success && isRealGemini,
      `Conversation ID: ${convId}\n   Cuplikan Jawaban: "${reply.slice(0, 160)}..."`
    );
  } catch (e) {
    report('3. Chatbot Question: "Apa manfaat telur bagi tubuh?"', false, e.response?.data?.message || e.message);
  }

  // 4. Chatbot Test - Follow-up Question with Context
  if (convId) {
    try {
      const res = await axios.post(
        `${BASE_URL}/chat`,
        { conversation_id: convId, message: 'Berapa butir maksimal yang dianjurkan per hari?' },
        { headers: authHeaders }
      );
      const reply = res.data.reply;
      const isContextual = reply && reply.length > 30;
      report(
        '4. Chatbot Follow-up Question (Context Persistence)',
        res.data.success && isContextual,
        `Cuplikan Jawaban Kontekstual: "${reply.slice(0, 160)}..."`
      );
    } catch (e) {
      report('4. Chatbot Follow-up Question', false, e.response?.data?.message || e.message);
    }
  }

  // 5. Chatbot Test - Meal Recommendation with Budget & Nutrition Target
  try {
    const res = await axios.post(
      `${BASE_URL}/chat`,
      { message: 'Saya punya budget Rp25.000, tolong rekomendasikan menu makan siang tinggi protein.' },
      { headers: authHeaders }
    );
    const reply = res.data.reply;
    report(
      '5. Chatbot Meal & Budget Recommendation',
      res.data.success && reply && reply.length > 50,
      `Cuplikan Rekomendasi Menu: "${reply.slice(0, 180)}..."`
    );
  } catch (e) {
    report('5. Chatbot Meal & Budget Recommendation', false, e.response?.data?.message || e.message);
  }

  // 6. Vision Test - Valid Food Image (Steak Wagyu / Beef)
  const validFoodPath = path.join(__dirname, 'uploads/test_wagyu_steak.jpg');
  let scanId = null;
  if (fs.existsSync(validFoodPath)) {
    try {
      const form = new FormData();
      form.append('image', fs.createReadStream(validFoodPath));
      form.append('weight_g', '200');

      const res = await axios.post(`${BASE_URL}/scan`, form, {
        headers: { ...authHeaders, ...form.getHeaders() }
      });

      scanId = res.data.scan_id;
      const data = res.data;
      const isAccurate = data.detected_food_name && (data.detected_food_name.toLowerCase().includes('steak') || data.detected_food_name.toLowerCase().includes('beef') || data.detected_food_name.toLowerCase().includes('daging'));
      report(
        '6. Vision Test - Valid Food Image (Steak Wagyu / Beef)',
        data.success && isAccurate,
        `Makanan Terdeteksi: "${data.detected_food_name}"\n   Confidence: ${data.confidence_percentage}%\n   Kalori Total (porsi ${data.weight_g}g): ${data.calculated_nutrition?.calories} kcal\n   Protein: ${data.calculated_nutrition?.protein}g, Karbo: ${data.calculated_nutrition?.carbohydrates}g, Lemak: ${data.calculated_nutrition?.fat}g\n   Taksiran Visual: "${data.description || 'Deskripsi visual tersedia'}"\n   Disclaimer: "${data.portion_disclaimer}"`
      );
    } catch (e) {
      report('6. Vision Test - Valid Food Image', false, e.response?.data?.message || e.message);
    }
  } else {
    report('6. Vision Test - Valid Food Image', false, 'File test_wagyu_steak.jpg tidak ditemukan.');
  }

  // 6b. Vision Test - Food Outside Dataset (Sushi / Salmon Nigiri)
  const sushiPath = path.join(__dirname, 'uploads/test_sushi.jpg');
  if (fs.existsSync(sushiPath)) {
    try {
      const form = new FormData();
      form.append('image', fs.createReadStream(sushiPath));
      form.append('weight_g', '150');

      const res = await axios.post(`${BASE_URL}/scan`, form, {
        headers: { ...authHeaders, ...form.getHeaders() }
      });

      const data = res.data;
      const isSushi = data.detected_food_name && (data.detected_food_name.toLowerCase().includes('sushi') || data.detected_food_name.toLowerCase().includes('nigiri') || data.detected_food_name.toLowerCase().includes('salmon'));
      report(
        '6b. Vision Test - Food Outside Dataset (Sushi / Salmon Nigiri)',
        data.success && isSushi,
        `Makanan Terdeteksi: "${data.detected_food_name}"\n   Bahan Visual: ${(data.visible_ingredients || []).join(', ')}\n   Confidence: ${data.confidence_percentage}%`
      );
    } catch (e) {
      report('6b. Vision Test - Food Outside Dataset', false, e.response?.data?.message || e.message);
    }
  }

  // 7. Vision Test - Non-Food Image (Rejection Handling)
  const nonFoodPath = path.join(__dirname, 'uploads/test_noise_nonfood.jpg');
  if (fs.existsSync(nonFoodPath)) {
    try {
      const form = new FormData();
      form.append('image', fs.createReadStream(nonFoodPath));
      form.append('weight_g', '150');

      const res = await axios.post(`${BASE_URL}/scan`, form, {
        headers: { ...authHeaders, ...form.getHeaders() }
      });
      const isRejected = res.data && res.data.is_food === false && res.data.is_recognized === false;
      report(
        '7. Vision Test - Non-Food Image Rejection',
        isRejected,
        `is_food: ${res.data?.is_food}, is_recognized: ${res.data?.is_recognized}, Pesan: "${res.data?.message}"`
      );
    } catch (e) {
      const isRejected = e.response && (e.response.status === 400 || e.response.data?.is_food === false || e.response.data?.is_recognized === false);
      report(
        '7. Vision Test - Non-Food Image Rejection',
        isRejected,
        `Status ${e.response?.status}: "${e.response?.data?.message}"`
      );
    }
  }

  // 8. Vision Test - Invalid Format (Text File)
  try {
    const form = new FormData();
    form.append('image', Buffer.from('Bukan gambar, hanya teks biasa'), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });

    await axios.post(`${BASE_URL}/scan`, form, {
      headers: { ...authHeaders, ...form.getHeaders() }
    });
    report('8. Vision Test - Invalid File Format (Should reject 400)', false, 'Expected rejection');
  } catch (e) {
    const isRejected = e.response && e.response.status === 400;
    report(
      '8. Vision Test - Invalid File Format Rejection',
      isRejected,
      `Status ${e.response?.status}: "${e.response?.data?.message}"`
    );
  }

  // 9. Integration - Add Food Scan to Daily Intake
  try {
    const res = await axios.post(
      `${BASE_URL}/scan/log-intake`,
      {
        food_name: 'Nasi Goreng Telur Ceplok',
        food_id: null,
        portion_g: 250,
        calories: 462,
        protein: 16.2,
        carbohydrates: 60.5,
        fat: 17.5
      },
      { headers: authHeaders }
    );
    report(
      '9. Integration - Log Food to Daily Intake',
      res.data.success === true,
      `Intake ID: ${res.data.intake_id}`
    );
  } catch (e) {
    report('9. Integration - Log Food to Daily Intake', false, e.response?.data?.message || e.message);
  }

  // 10. Integration - Get Food History
  try {
    const res = await axios.get(`${BASE_URL}/scan/history`, { headers: authHeaders });
    report(
      '10. Integration - Fetch Scans & Intake History',
      res.data.success && Array.isArray(res.data.scans),
      `Total Scan Records: ${res.data.scans.length}, Total Intake Records: ${res.data.daily_intake.length}`
    );
  } catch (e) {
    report('10. Integration - Fetch Scans & Intake History', false, e.response?.data?.message || e.message);
  }

  // 11. Integration - Search Food Database & USDA
  try {
    const res = await axios.get(`${BASE_URL}/foods?search=ayam`, { headers: authHeaders });
    report(
      '11. Integration - Food Database Search',
      res.data.success && res.data.foods.length > 0,
      `Ditemukan ${res.data.foods.length} makanan dengan kata kunci "ayam"`
    );
  } catch (e) {
    report('11. Integration - Food Database Search', false, e.response?.data?.message || e.message);
  }

  // 12. Integration - User Profile
  try {
    const res = await axios.get(`${BASE_URL}/profile`, { headers: authHeaders });
    report(
      '12. Integration - User Profile & Calorie Target',
      res.data.success === true,
      `Target Kalori Harian: ${res.data.profile?.daily_calorie_target || 2000} kcal/hari (Goal: ${res.data.profile?.goal})`
    );
  } catch (e) {
    report('12. Integration - User Profile & Calorie Target', false, e.response?.data?.message || e.message);
  }

  console.log('==========================================================');
  console.log(`📊 RINGKASAN PENGUJIAN: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log('==========================================================');
}

runTests().catch(console.error);
