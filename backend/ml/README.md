# 🧠 Arsitektur AI Vision & Chatbot — Google Gemini API

> **Status Sistem AI:**  
> Seluruh proses inferensi AI (pengenalan makanan multimodal dan chatbot konsultasi gizi) kini berjalan 100% menggunakan **Google Gemini API** terpusat melalui backend Node.js.  
> Pipeline training lokal MobileNetV2, script eksperimen Python, dataset gambar besar, dan artefak model offline (`.onnx`, `.npz`, `.h5`, `.joblib`) telah **dihilangkan** dari repositori aplikasi.

---

## 🚀 Mengapa Beralih Penuh ke Gemini API?

1. **Ukuran Repositori Sangat Ringan**: Menghilangkan lebih dari 100 MB artefak model biner, bobot training, dan puluhan script Python dari repositori utama.
2. **Pengenalan Makanan Universal**: Tidak lagi terbatas pada 13 kelas tertutup MobileNetV2. Gemini Vision mampu mengenali ratusan jenis makanan lokal Nusantara (gado-gado, rendang, soto, sate, nasi uduk) maupun internasional (sushi, ramen, steak wagyu, pasta, salad) dengan estimasi porsi, bahan terlihat, dan metode memasak.
3. **Deteksi Non-Makanan Otomatis**: Menolak gambar non-makanan (kendaraan, benda mati, dokumen) secara akurat tanpa memerlukan klasifikasi OOD Mahalanobis terpisah.
4. **Bebas Dependensi Python & ML Heavy**: Aplikasi backend Node.js murni berjalan tanpa memerlukan instalasi Python, TensorFlow, ONNX Runtime, scikit-learn, atau CUDA.
5. **Kesiapan Konversi APK Android**: Memudahkan pembungkusan aplikasi ke Android APK (menggunakan Capacitor) karena ukuran bundle bersih dan arsitektur client-server yang stabil.

---

## 🛠️ Alur Kerja Sistem AI Aktif

1. **Pengguna Mengambil / Mengunggah Foto**: Melalui kamera smartphone atau galeri di frontend React.
2. **Validasi Gambar di Backend**: Node.js (`multer`) memverifikasi berkas (JPG/PNG/WebP, maksimal 10MB).
3. **Analisis Multimodal via Gemini Vision**: `visionService.js` mengirim gambar terenkripsi base64 ke Google Gemini API dengan prompt JSON terstruktur.
4. **Verifikasi Respons AI**:
   - Jika bukan makanan: Sistem mengembalikan pesan penolakan yang jelas.
   - Jika makanan: Sistem mengekstrak nama hidangan, estimasi berat, bahan terlihat, dan tingkat keyakinan (*confidence*).
5. **Pencocokan Database Nutrisi (RAG)**: Backend mencocokkan nama hidangan ke database SQLite (`foods`) dan USDA FoodData Central untuk kalkulasi kalori resmi berdasarkan berat porsi.
6. **Chatbot Gizi & Meal Planner**: `chatbotService.js` memanfaatkan Gemini dengan konteks profil pengguna dan riwayat obrolan untuk menjawab konsultasi menu, anggaran, dan target kalori harian.
