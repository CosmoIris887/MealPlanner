# 🥗 AI Meal Planner — Full-Stack Artificial Intelligence Food & Nutrition System

Aplikasi web full-stack perencanaan makanan berbasis AI yang ditenagai oleh **Google Gemini API sebagai satu-satunya mesin AI aktif** untuk seluruh fitur kecerdasan buatan:
- **AI Vision Food Recognition**: Mengenali foto makanan secara universal (lokal maupun internasional di luar batas 13 kelas, seperti sushi, ramen, steak wagyu A5, alpukat, dsb), mendeteksi bahan visual, metode memasak, dan catatan ketidakpastian visual.
- **Database & Nutrition Matching**: Menghubungkan hasil identifikasi makanan ke database nutrisi terstruktur dan USDA FoodData Central.
- **AI Nutrition Consultant Chatbot**: Konsultasi pola makan personal, rekomendasi menu berdasarkan anggaran dan bahan di rumah, serta estimasi kalori porsi.
- **Arsitektur Ramping & Siap Mobile**: Bebas dependensi Python, TensorFlow, ONNX Runtime, dan dataset lokal besar sehingga repositori ringan dan siap dibungkus menjadi APK Android.

---

## 🌟 Fitur Utama

1. **Universal AI Vision Food Recognition (`/scan`)**
   - Didukung oleh **Google Gemini Vision API** sebagai mesin inferensi visual utama.
   - Ambil foto langsung via **Kamera HP / Webcam (Live Stream)** atau Unggah foto makanan (JPG, JPEG, PNG, WebP).
   - Pengenalan makanan terbuka luas tanpa dibatasi 13 kelas dataset lokal (mampu mendeteksi sushi, ramen, steak wagyu, masakan nusantara, buah-buahan, dan hidangan internasional).
   - **Ekstraksi Bahan & Metode Pengolahan**: Menampilkan bahan visual yang teridentifikasi, taksiran metode masak (misal digoreng, direbus, mentah), serta catatan ketidakpastian visual.
   - **Proteksi Non-Makanan**: Gambar acak/noise, dokumen, kendaraan, atau hewan hidup secara otomatis ditolak dengan pesan informatif tanpa mengarang nama makanan.
   - **Kalkulasi Nutrisi Presisi**: Kalori dan makronutrisi dihitung langsung dari database makanan per 100 gram dikalikan berat porsi aktual: `(berat / 100) × kalori_per_100g`.

2. **Google Gemini AI Food Chatbot (`/chat`)**
   - Asisten percakapan cerdas context-aware bertenaga **Google Gemini API** yang terhubung dengan data profil fisik pengguna dan RAG (Retrieval-Augmented Generation) ke database makanan SQLite.
   - Mendukung konsultasi bahan di kulkas + budget (misal: *"Saya punya telur, wortel, timun budget Rp5.000"*), evaluasi kesesuaian menu (*"Apakah steak wagyu A5 cocok untuk saya?"*), rancangan meal plan harian, dan kalkulasi kalori porsi.

3. **Recommendation Engine & Meal Planner (`/meal-plan`)**
   - Kalkulasi otomatis Basal Metabolic Rate (BMR) menggunakan formula **Mifflin-St Jeor**.
   - Perhitungan Total Daily Energy Expenditure (TDEE) berbasis faktor aktivitas fisik.
   - Generasi rencana makan harian terbagi menjadi **Breakfast, Lunch, Dinner, & Snack** dengan progress indicator kalori harian dan disclaimer medis.

4. **Authentication & Profile Management (`/profile`)**
   - Register, Login, Logout, Session & Protected Routes via JWT & Password Hashing (bcrypt).
   - Edit profil fisik (Umur, Gender, Berat Badan, Tinggi Badan, Aktivitas, Target Goal) & opsi Hapus Akun.

5. **Food Database (`/foods`) & History (`/history`)**
   - Pencarian makanan dari database lokal & integrasi USDA FoodData Central API.
   - Histori catatan konsumsi harian dan riwayat analisis scan foto AI.

---

## 📁 Struktur Proyek

```text
Mealplanner/
├── backend/
│   ├── config/             # DB & async SQLite configuration
│   ├── controllers/        # Auth, Profile, Food, Scan, MealPlan, Chat controllers
│   ├── database/           # Table schemas (init.js), Seed data (seed.js) & database.sqlite
│   ├── middleware/         # JWT Auth, Multer File Upload, Global Error Handler
│   ├── routes/             # REST API Express Router
│   ├── services/
│   │   ├── ai/             # visionService.js & chatbotService.js (Google Gemini Integration)
│   │   ├── nutrition/      # foodDataService.js (USDA API + Cache)
│   │   └── recommendation/ # recommendationEngine.js (Mifflin-St Jeor)
│   ├── uploads/            # Temporary image storage
│   ├── server.js           # Express Server Entry Point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, BottomNav, StatCard, ProgressBar, Disclaimer
│   │   ├── context/        # AuthContext.tsx
│   │   ├── pages/          # Dashboard, FoodScanner, MealPlan, AIChat, FoodDatabase, History, Profile
│   │   ├── services/       # api.ts (Axios REST API instance)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── package.json
└── README.md
```

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Cara Install Dependency

Buka terminal pada direktori utama proyek (`Mealplanner`) dan jalankan:

```bash
# Install dependency backend dan frontend sekaligus
npm run install:all
```

Atau install secara terpisah:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

### 2. Cara Konfigurasi Google Gemini API (PENTING 🤖)

Sistem ini menggunakan **Google Gemini AI** untuk **Chatbot** dan **Computer Vision (Food Scan)**.

#### A. Langkah Mendapatkan Google Gemini API Key (GRATIS):
1. Kunjungi portal **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Login menggunakan akun Google / Gmail Anda.
3. Klik tombol **"Create API key"** (Buat API Key).
4. Salin API Key yang dihasilkan (format diawali dengan `AIzaSy...`).

#### B. Cara Pengisian file `.env` Backend:
Salin file `.env.example` di folder `backend` menjadi `.env`:

```bash
cd backend
cp .env.example .env
```

Buka file `backend/.env` dan masukkan API Key Google Gemini Anda pada variabel `GEMINI_API_KEY`:

```env
PORT=5000
JWT_SECRET=ai_meal_planner_secret_key_2026
GEMINI_API_KEY=AIzaSy_GANTI_DENGAN_GEMINI_API_KEY_ANDA
GEMINI_VISION_MODEL=gemini-flash-lite-latest
GEMINI_CHAT_MODEL=gemini-flash-lite-latest
USDA_API_KEY=DEMO_KEY
```

> 💡 **Catatan Keamanan & Fleksibilitas**: 
> - Variabel `GEMINI_API_KEY` otomatis digunakan oleh **AI Vision (`visionService.js`)** dan **Chatbot (`chatbotService.js`)**.
> - Anda dapat mengubah model AI tanpa mengubah kode dengan mengatur `GEMINI_VISION_MODEL` dan `GEMINI_CHAT_MODEL`.
> - API Key hanya disimpan di backend (`.env`) dan tidak pernah dikirim ke frontend atau dicatat di log.

---

### 3. Cara Kerja Google Gemini di Sistem Ini

#### 🤖 1. AI Vision Food Recognition (`backend/services/ai/visionService.js`)
- Saat pengguna mengunggah atau mengambil foto makanan dari kamera, backend memvalidasi tipe MIME dan ukuran file, lalu mengonversinya menjadi Base64 inline data.
- Gambar dikirimkan ke model **Google Gemini Vision** dengan instruksi terstruktur dan parameter `responseMimeType: 'application/json'`.
- Gemini menganalisis visual makanan dan mengembalikan output terstruktur:
  - `is_food`: Penentuan apakah gambar berisi makanan atau bukan. Jika bukan (misal kendaraan, dokumen, hewan, noise), sistem menolak secara aman tanpa mengarang nama makanan.
  - `items`: Daftar hidangan yang terdeteksi (`food_name`, `description`, `visible_ingredients`, `estimated_cooking_method`, `confidence`, `uncertainties`).
  - `notes`: Catatan kontekstual visual.
- Backend mencocokkan nama makanan dengan database nutrisi SQLite atau USDA FoodData Central untuk memperoleh nilai nutrisi terverifikasi per 100 gram. Jika belum ada di database, nilai diberi label transparan sebagai taksiran AI yang belum terverifikasi.

#### 💬 2. AI Chatbot Assistant (`backend/services/ai/chatbotService.js`)
- Menggunakan SDK resmi `@google/generative-ai` dengan model Gemini terkonfigurasi.
- **Context-Aware System Instruction**: Chatbot dibekali pengetahuan mengenai profil fisik pengguna (Umur, Gender, Berat Badan, Tinggi Badan, Target Kalori BMR/TDEE) serta pencarian RAG langsung ke database nutrisi makanan.
- Menjawab berbagai pertanyaan seputar kesehatan, kalori, rekomendasi diet hemat budget (misal budget Rp25.000), serta opsi vegetarian.
- Jika koneksi ke Gemini mengalami kendala, sistem memberikan pesan kegagalan yang informatif dan opsi mencoba kembali tanpa dialihkan ke model lokal lain.

---

### 4. Cara Membuat Database & Initial Seed Data

Aplikasi ini menggunakan SQLite yang secara otomatis membuat database file `backend/database/database.sqlite` ketika server backend pertama kali dijalankan.

Untuk menjalankan seed data makanan (29 makanan populer Indonesia & Internasional):

```bash
cd backend
npm run seed
```

---

### 5. Cara Mendapatkan USDA API Key (Opsional)

1. Kunjungi portal resmi **USDA FoodData Central**: [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)
2. Salin API Key tersebut dan masukkan ke dalam `backend/.env`:
   ```env
   USDA_API_KEY=API_KEY_ANDA_DI_SINI
   ```

---

### 6. Cara Menjalankan Backend Server

```bash
cd backend
npm run dev
# Atau untuk mode production:
npm start
```

Backend API akan berjalan di: `http://localhost:5000`

---

### 7. Cara Menjalankan Frontend Web Application

Buka terminal baru:

```bash
cd frontend
npm run dev
```

Aplikasi frontend React Vite akan berjalan di: `http://localhost:3000`

---

### 8. Pengujian Sistem AI & Integrasi (Automated Test Suite)

Untuk menguji seluruh sistem AI Vision Gemini, Chatbot, penolakan non-makanan, dan kalkulasi nutrisi:

```bash
cd backend

# Menjalankan comprehensive test suite Gemini API
npm run test:vision

# Menjalankan end-to-end integration test
npm run test:integration
```

Dokumentasi arsitektur AI tersedia di [backend/ml/README.md](file:///c:/xampp/htdocs/Mealplanner_yoceng/backend/ml/README.md).

---

### 9. Persiapan Build APK Android (Capacitor)

Proyek ini telah dikonfigurasi agar siap dikembangkan menjadi aplikasi mobile Android APK menggunakan **Capacitor**:

1. **Konfigurasi URL Backend untuk Android**:
   Di folder `frontend`, buat file `.env` berdasarkan `frontend/.env.example`:
   ```env
   # Ganti dengan IP komputer/laptop Anda pada WiFi yang sama, atau domain server publik:
   VITE_API_URL=http://192.168.1.100:5000/api
   ```
2. **Build Web Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Inisialisasi & Tambah Platform Android via Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npx cap sync
   ```
4. **Buka di Android Studio & Generate APK**:
   ```bash
   npx cap open android
   # Di Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```


---

## 🔒 Keamanan & Praktik Terbaik

- **Password Hashing**: Menggunakan `bcryptjs` dengan 10 salt rounds.
- **JWT Auth**: Authentication berbasis JWT token yang dikirim via Authorization header (`Bearer`).
- **Input & Upload Validation**: Validasi format gambar (JPG/PNG/WebP) dan batas ukuran file 5MB via Multer.
- **Secure API Key Handling**: Key Google Gemini disimpan di file `.env` server backend dan tidak pernah terekspos ke frontend / browser.
- **Clean UI**: UI SaaS modern dengan Tailwind CSS, glassmorphism, progress bar nutrisi, dan disclaimer medis.

