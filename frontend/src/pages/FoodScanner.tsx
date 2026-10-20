import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, Flame, Dumbbell, Wheat, Droplet, RefreshCw, Plus, X, Video, Database, Sparkles, ChefHat, Layers, HelpCircle, Utensils } from 'lucide-react';
import API, { FoodScanResult, FoodItem, FoodScanItem } from '../services/api';

export const FoodScanner: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [customWeight, setCustomWeight] = useState<number>(150);
  const [error, setError] = useState<string>('');
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  // Live Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Database food correction / manual selection
  const [dbFoods, setDbFoods] = useState<FoodItem[]>([]);
  const [selectedFoodOverride, setSelectedFoodOverride] = useState<FoodItem | null>(null);

  useEffect(() => {
    API.get('/foods').then((res) => {
      if (res.data?.foods) setDbFoods(res.data.foods);
    }).catch(console.error);

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera. Pastikan browser memiliki izin akses kamera.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `food-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setScanResult(null);
          setLoggedSuccess(false);
          setSelectedFoodOverride(null);
          setSelectedItemIndex(0);
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setError('');
      setLoggedSuccess(false);
      setSelectedFoodOverride(null);
      setSelectedItemIndex(0);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Silakan pilih atau ambil foto makanan terlebih dahulu.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setScanResult(null);
    setLoggedSuccess(false);
    setSelectedItemIndex(0);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('weight_g', customWeight.toString());

      const res = await API.post('/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setScanResult(res.data);
        if (res.data.is_recognized && res.data.matched_food) {
          setSelectedFoodOverride(res.data.matched_food);
        } else {
          setSelectedFoodOverride(null);
        }

        // If Gemini provided estimated weight and user hadn't set custom weight
        if (res.data.estimated_weight_grams) {
          setCustomWeight(res.data.estimated_weight_grams);
        }
      } else {
        setError(res.data.message || 'Gagal memproses gambar makanan.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menganalisis gambar makanan. Pastikan format file JPG/PNG/WebP.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Current active item from Gemini items array (if multiple items present)
  const currentItem: FoodScanItem | null = scanResult?.items && scanResult.items[selectedItemIndex]
    ? scanResult.items[selectedItemIndex]
    : null;

  // Active verified food from database
  const activeFood = selectedFoodOverride || (scanResult?.is_recognized ? scanResult.matched_food : null);
  const caloriesPer100g = activeFood ? activeFood.calories_per_100g : (scanResult?.nutrition_per_100g?.calories || 0);
  const proteinPer100g = activeFood ? activeFood.protein_per_100g : (scanResult?.nutrition_per_100g?.protein || 0);
  const carbsPer100g = activeFood ? activeFood.carbohydrates_per_100g : (scanResult?.nutrition_per_100g?.carbohydrates || 0);
  const fatPer100g = activeFood ? activeFood.fat_per_100g : (scanResult?.nutrition_per_100g?.fat || 0);

  // Formula: kalori porsi = (berat porsi / 100) * kalori per 100 gram
  const ratio = customWeight / 100;
  const calculatedCalories = caloriesPer100g > 0
    ? Math.round(caloriesPer100g * ratio)
    : (scanResult?.estimated_calories || 0);
  const calculatedProtein = Math.round(proteinPer100g * ratio * 10) / 10;
  const calculatedCarbs = Math.round(carbsPer100g * ratio * 10) / 10;
  const calculatedFat = Math.round(fatPer100g * ratio * 10) / 10;

  const handleAddToDailyIntake = async () => {
    const foodTitle = activeFood?.food_name || scanResult?.detected_food_name || 'Makanan Terdeteksi';
    try {
      await API.post('/scan/log-intake', {
        food_name: foodTitle,
        food_id: activeFood ? activeFood.id : null,
        portion_g: customWeight,
        calories: calculatedCalories,
        protein: calculatedProtein,
        carbohydrates: calculatedCarbs,
        fat: calculatedFat
      });
      setLoggedSuccess(true);
    } catch (err) {
      alert('Gagal menambahkan makanan ke catatan harian.');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-24 md:pb-12">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-[#243447]">Scan & Analisis Makanan</h1>
          <span className="bg-[#E8F5E9] text-[#2E8B57] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#C8E6C9] flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Gemini Vision</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Identifikasi hidangan makanan melalui foto dengan kecerdasan visual Google Gemini, deteksi bahan masakan, dan hitung estimasi nutrisi akurat.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cameraError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Grid: Upload & Preview Card (Left) | Result Card (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Card: Upload & Preview */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          {/* Action Choice: Ambil Foto / Unggah Gambar */}
          <div className="flex space-x-2.5">
            <button
              onClick={startCamera}
              className="flex-1 bg-[#2E8B57] hover:bg-[#267347] text-white font-medium py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Ambil Foto</span>
            </button>
            <label className="flex-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#243447] border border-[#E2E8F0] font-medium py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors text-center">
              <Upload className="w-4 h-4 text-[#2E8B57]" />
              <span>Unggah Gambar</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Camera View or Upload Box */}
          {isCameraOpen ? (
            <div className="relative rounded-xl overflow-hidden bg-black border border-[#2E8B57] space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <button
                onClick={stopCamera}
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-3 bg-white flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2 px-6 rounded-full text-xs flex items-center space-x-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-[#E2E8F0] hover:border-[#2E8B57] rounded-xl p-5 text-center transition-colors bg-[#F8FAFC]">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {previewUrl ? (
                <div className="relative h-60 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center border border-[#E2E8F0]">
                  <img src={previewUrl} alt="Preview Foto Makanan" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 bg-white/90 text-[#243447] text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E2E8F0] shadow-xs">
                    Klik untuk mengganti gambar
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-2.5">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#2E8B57] mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#243447]">Pilih atau Tarik Foto Makanan</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Mendukung format JPG, PNG, atau WebP</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button: Analisis Makanan */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing || isCameraOpen}
            className="w-full bg-[#2E8B57] hover:bg-[#267347] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-xs"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menganalisis dengan Ai Vision...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisis Makanan</span>
              </>
            )}
          </button>

          {/* AI Architecture Info Box */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B] space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-[#243447]">
              <Sparkles className="w-3.5 h-3.5 text-[#2E8B57]" />
              <span>Ai Vision Aktif</span>
            </div>
            <p>
              Mengenali hidangan lokal dan internasional secara universal (sushi, ramen, steak wagyu, nasi goreng, gado-gado, buah, dsb) tanpa batasan kelas dataset.
            </p>
          </div>
        </div>

        {/* Right Card: Result Panel */}
        <div>
          {scanResult ? (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              {/* Header result */}
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Hasil Pengenalan AI</span>
                  <h2 className="text-xl font-bold text-[#243447] mt-0.5">
                    {scanResult.is_food
                      ? (currentItem?.food_name || activeFood?.food_name || scanResult.detected_food_name)
                      : 'Bukan Makanan Terdeteksi'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${scanResult.is_food
                    ? scanResult.confidence_level === 'high'
                      ? 'bg-[#E8F5E9] text-[#2E8B57] border border-[#C8E6C9]'
                      : scanResult.confidence_level === 'medium'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                    {scanResult.is_food
                      ? `Keyakinan: ${scanResult.confidence_level ? scanResult.confidence_level.toUpperCase() : 'OK'} (${scanResult.confidence_percentage}%)`
                      : 'Non-Food'}
                  </span>
                </div>
              </div>

              {/* Status Banner when unrecognized or recognized */}
              {!scanResult.is_food ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Objek pada gambar bukan merupakan makanan atau minuman.</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {scanResult.message || 'Harap unggah gambar hidangan makanan yang jelas untuk mendapatkan analisis nutrisi.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Multiple Items Selector if present */}
                  {scanResult.items && scanResult.items.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs text-[#64748B] font-medium">
                        <Layers className="w-3.5 h-3.5 text-[#2E8B57]" />
                        <span>Beberapa hidangan terdeteksi pada gambar:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.items.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedItemIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${selectedItemIndex === idx
                              ? 'bg-[#2E8B57] text-white shadow-xs'
                              : 'bg-[#F8FAFC] text-[#243447] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                              }`}
                          >
                            {item.food_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gemini Detailed Visual Analysis Card */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5 text-xs">
                    {/* Visual Description */}
                    {(currentItem?.description || scanResult.description) && (
                      <p className="text-[#475569] leading-relaxed">
                        {currentItem?.description || scanResult.description}
                      </p>
                    )}

                    {/* Visible Ingredients */}
                    {((currentItem?.visible_ingredients && currentItem.visible_ingredients.length > 0) ||
                      (scanResult.visible_ingredients && scanResult.visible_ingredients.length > 0)) && (
                        <div>
                          <span className="font-semibold text-[#243447] block mb-1">Bahan yang Terlihat:</span>
                          <div className="flex flex-wrap gap-1">
                            {(currentItem?.visible_ingredients || scanResult.visible_ingredients || []).map((ing, idx) => (
                              <span key={idx} className="bg-white border border-[#CBD5E1] text-[#243447] text-[11px] px-2 py-0.5 rounded-md">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Cooking Method */}
                    {(currentItem?.estimated_cooking_method || scanResult.estimated_cooking_method) && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-[#64748B]">
                        <ChefHat className="w-3.5 h-3.5 text-[#2E8B57]" />
                        <span><strong>Metode Pengolahan:</strong> {currentItem?.estimated_cooking_method || scanResult.estimated_cooking_method}</span>
                      </div>
                    )}

                    {/* Visual Uncertainties Warning if any */}
                    {((currentItem?.uncertainties && currentItem.uncertainties.length > 0) ||
                      (scanResult.uncertainties && scanResult.uncertainties.length > 0)) && (
                        <div className="flex items-start space-x-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Catatan Ketidakpastian Visual:</strong>{' '}
                            {(currentItem?.uncertainties || scanResult.uncertainties || []).join('; ')}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Nutrition Source Status Banner */}
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${activeFood && (activeFood.calories_per_100g !== null)
                    ? 'bg-[#E8F5E9]/70 border border-[#C8E6C9] text-[#2E8B57]'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}>
                    {activeFood && (activeFood.calories_per_100g !== null) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E8B57]" />
                        <span>{scanResult.nutrition_status_message || `Data nutrisi terverifikasi dari ${activeFood.source || 'database'}.`}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>{scanResult.nutrition_status_message || 'Data nutrisi belum ada di database. Nilai di bawah merupakan estimasi AI.'}</span>
                      </>
                    )}
                  </div>

                  {/* Manual Selection / Correction Dropdown */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#243447] flex items-center space-x-1.5">
                        <Database className="w-3.5 h-3.5 text-[#2E8B57]" />
                        <span>Cocokkan / Koreksi dengan Database Nutrisi:</span>
                      </span>
                      {activeFood?.category && (
                        <span className="text-[10px] bg-[#E8F5E9] text-[#2E8B57] px-2 py-0.5 rounded-md font-medium border border-[#C8E6C9]">
                          {activeFood.category}
                        </span>
                      )}
                    </div>

                    <select
                      value={activeFood ? activeFood.id : ''}
                      onChange={(e) => {
                        const found = dbFoods.find((f) => f.id.toString() === e.target.value);
                        if (found) setSelectedFoodOverride(found);
                      }}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
                    >
                      <option value="">-- Tetap Gunakan Hasil AI / Pilih dari Database --</option>
                      {dbFoods.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.food_name} • {f.calories_per_100g} kcal/100g ({f.category || 'Umum'}) [{f.source || 'Dataset'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Portion Weight Input & Slider */}
                  <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#243447]">Estimasi Berat Porsi:</span>
                      <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                        <input
                          type="number"
                          min="10"
                          max="2000"
                          value={customWeight}
                          onChange={(e) => setCustomWeight(Math.max(1, Number(e.target.value)))}
                          className="w-14 bg-transparent text-right font-bold text-[#2E8B57] focus:outline-none text-xs"
                        />
                        <span className="text-[#64748B] text-xs">gram</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="500"
                      step="10"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(Number(e.target.value))}
                      className="w-full accent-[#2E8B57] cursor-pointer"
                    />
                    <p className="text-[10px] text-[#64748B] italic">
                      * Rumus: Total Kalori = (Berat / 100g) × Kalori per 100g = ({customWeight} / 100) × {caloriesPer100g} = {calculatedCalories} kcal
                    </p>
                  </div>

                  {/* Calculated Nutrition Summary (4 Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center">
                      <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <span className="text-[11px] text-[#64748B]">Total Kalori</span>
                      <p className="text-base font-bold text-[#243447] mt-0.5">{calculatedCalories} kcal</p>
                    </div>

                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center">
                      <Dumbbell className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                      <span className="text-[11px] text-[#64748B]">Protein</span>
                      <p className="text-base font-bold text-[#243447] mt-0.5">{calculatedProtein} g</p>
                    </div>

                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center">
                      <Wheat className="w-4 h-4 text-[#2E8B57] mx-auto mb-1" />
                      <span className="text-[11px] text-[#64748B]">Karbohidrat</span>
                      <p className="text-base font-bold text-[#243447] mt-0.5">{calculatedCarbs} g</p>
                    </div>

                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center">
                      <Droplet className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                      <span className="text-[11px] text-[#64748B]">Lemak</span>
                      <p className="text-base font-bold text-[#243447] mt-0.5">{calculatedFat} g</p>
                    </div>
                  </div>

                  {/* Add to Daily Intake Button */}
                  {loggedSuccess ? (
                    <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E8B57] p-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Berhasil ditambahkan ke Catatan Konsumsi Harian!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToDailyIntake}
                      className="w-full bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Catat ke Konsumsi Harian</span>
                    </button>
                  )}
                </>
              )}

              {/* Attribution and Model Status Footer */}
              <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#2E8B57]" />
                  <span>Mesin AI: Gemini Vision API</span>
                </span>
                <span>Didukung oleh Google Gemini Multimodal AI</span>
              </div>
            </div>
          ) : (
            /* Empty State Panel */
            <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center text-[#64748B] space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mx-auto flex items-center justify-center text-[#94A3B8]">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#243447]">Hasil Scan Makanan</h3>
                <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                  Ambil foto langsung atau unggah gambar makanan di sebelah kiri, kemudian klik tombol "Analisis Makanan".
                </p>
              </div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] text-[#2E8B57] bg-[#E8F5E9] px-3 py-1 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pengenalan makanan universal berbasis Ai Vision</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
