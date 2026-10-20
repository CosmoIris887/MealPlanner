import React, { useState, useEffect } from 'react';
import {
  Search,
  Database,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Plus,
  Check,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Trash2,
  X
} from 'lucide-react';
import API, { FoodItem, getImageUrl } from '../services/api';

export const FoodDatabase: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<number | null>(null);

  // Single Food Modal State
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasetForm, setDatasetForm] = useState({
    food_name: '',
    category: 'General Food',
    serving_size: '100g',
    calories_per_100g: 150,
    protein_per_100g: 10,
    carbohydrates_per_100g: 20,
    fat_per_100g: 5,
    fiber_per_100g: 2
  });
  const [datasetImageFile, setDatasetImageFile] = useState<File | null>(null);
  const [datasetImagePreview, setDatasetImagePreview] = useState<string | null>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  const fetchFoods = async (query = '') => {
    try {
      setLoading(true);
      const url = query.trim() ? `/foods/search?q=${encodeURIComponent(query)}` : '/foods';
      const res = await API.get(url);
      if (res.data?.success) {
        setFoods(res.data.foods || []);
      }
    } catch (err) {
      console.error('Failed to search food database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFoods(searchQuery);
  };

  const handleLogIntake = async (food: FoodItem) => {
    setAddingId(food.id);
    try {
      await API.post('/scan/log-intake', {
        food_name: food.food_name,
        food_id: food.id,
        portion_g: 100,
        calories: food.calories_per_100g,
        protein: food.protein_per_100g,
        carbohydrates: food.carbohydrates_per_100g,
        fat: food.fat_per_100g
      });
      setAddedSuccessId(food.id);
      setTimeout(() => setAddedSuccessId(null), 2500);
    } catch (err) {
      alert('Gagal menambahkan ke intake harian.');
    } finally {
      setAddingId(null);
    }
  };

  const handleUploadDatasetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetForm.food_name.trim()) return;

    setUploadingDataset(true);
    try {
      const formData = new FormData();
      formData.append('food_name', datasetForm.food_name);
      formData.append('category', datasetForm.category);
      formData.append('serving_size', datasetForm.serving_size);
      formData.append('calories_per_100g', datasetForm.calories_per_100g.toString());
      formData.append('protein_per_100g', datasetForm.protein_per_100g.toString());
      formData.append('carbohydrates_per_100g', datasetForm.carbohydrates_per_100g.toString());
      formData.append('fat_per_100g', datasetForm.fat_per_100g.toString());
      formData.append('fiber_per_100g', datasetForm.fiber_per_100g.toString());

      if (datasetImageFile) {
        formData.append('image', datasetImageFile);
      }

      const res = await API.post('/foods/dataset-sample', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setShowDatasetModal(false);
        setDatasetImageFile(null);
        setDatasetImagePreview(null);
        fetchFoods();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan sampel dataset makanan.');
    } finally {
      setUploadingDataset(false);
    }
  };

  const handleDeleteFoodItem = async (id: number) => {
    if (!window.confirm('Hapus item makanan ini dari database?')) return;
    try {
      await API.delete(`/foods/${id}`);
      setFoods((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert('Gagal menghapus item makanan.');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E8F5E9] text-[#2E8B57] rounded-full px-3 py-1 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Kaggle & USDA Food Database</span>
          </div>
          <h1 className="text-2xl font-bold text-[#243447]">Database Makanan & Nutrisi</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Daftar lengkap makanan terdaftar dalam database dan kandungan gizi per 100 gram untuk kalkulasi nutrisi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowDatasetModal(true)}
            className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Manual</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama makanan (misal: Nasi Goreng, Ayam Goreng, Soto, Rendang)..."
            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57]"
          />
        </div>
        <button
          type="submit"
          className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shrink-0 cursor-pointer transition-colors"
        >
          Cari
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchFoods('');
            }}
            className="bg-[#F1F5F9] text-[#64748B] hover:text-[#243447] text-xs px-3 py-2.5 rounded-xl cursor-pointer"
          >
            Reset
          </button>
        )}
      </form>

      {/* Database Content Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-sm font-bold text-[#243447] flex items-center space-x-2">
            <span>Daftar Makanan Terdaftar</span>
            <span className="text-xs bg-[#E8F5E9] text-[#2E8B57] px-2 py-0.5 rounded-full font-semibold">
              {foods.length} Item
            </span>
          </h2>
          <span className="text-[11px] text-[#64748B]">Basis: 100 gram</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#64748B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2E8B57]" />
            <p className="text-xs font-semibold">Memuat database makanan...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] space-y-2">
            <Database className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-semibold text-[#243447]">Tidak ada makanan ditemukan</p>
            <p className="text-xs">Coba kata kunci pencarian lain atau tambahkan makanan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Makanan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Kalori</th>
                  <th className="py-3 px-4 text-right">Protein</th>
                  <th className="py-3 px-4 text-right">Karbo</th>
                  <th className="py-3 px-4 text-right">Lemak</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#243447]">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center space-x-3">
                        {food.image_url ? (
                          <img
                            src={getImageUrl(food.image_url)}
                            alt={food.food_name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#E2E8F0]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center text-[#78B7E8]">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="block font-bold text-[#243447]">{food.food_name}</span>
                          <span className="text-[10px] text-[#64748B] block">ID: {food.id} • {food.source || 'Dataset'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md text-[10px] font-medium border border-[#E2E8F0]">
                        {food.category || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#2E8B57]">
                      {Math.round(food.calories_per_100g)} kcal
                    </td>
                    <td className="py-3 px-4 text-right text-[#64748B]">{food.protein_per_100g}g</td>
                    <td className="py-3 px-4 text-right text-[#64748B]">{food.carbohydrates_per_100g}g</td>
                    <td className="py-3 px-4 text-right text-[#64748B]">{food.fat_per_100g}g</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleLogIntake(food)}
                          disabled={addingId === food.id}
                          className="bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E8B57] p-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          title="Catat Konsumsi Hari Ini (100g)"
                        >
                          {addedSuccessId === food.id ? (
                            <Check className="w-3.5 h-3.5 text-[#2E8B57]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {food.source === 'Kustom Pengguna' && (
                          <button
                            onClick={() => handleDeleteFoodItem(food.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg cursor-pointer transition-colors"
                            title="Hapus Makanan Kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE MANUAL ITEM MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E2E8F0] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#243447]">Tambah Item Makanan Manual</h3>
              <button
                onClick={() => setShowDatasetModal(false)}
                className="text-[#64748B] hover:text-[#243447] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDatasetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1">Nama Makanan</label>
                <input
                  type="text"
                  required
                  value={datasetForm.food_name}
                  onChange={(e) => setDatasetForm({ ...datasetForm, food_name: e.target.value })}
                  placeholder="Contoh: Alpukat (Avocado)"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1">Foto Makanan (Opsional)</label>
                <div className="relative border border-dashed border-[#CBD5E1] rounded-xl p-3 text-center bg-[#F8FAFC]">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setDatasetImageFile(file);
                        setDatasetImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {datasetImagePreview ? (
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center border border-[#E2E8F0]">
                      <img src={datasetImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-3 text-[#64748B] text-xs">
                      <Upload className="w-5 h-5 text-[#2E8B57] mx-auto mb-1" />
                      <span>Pilih gambar sampel makanan</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#243447] mb-1">Kategori</label>
                  <input
                    type="text"
                    value={datasetForm.category}
                    onChange={(e) => setDatasetForm({ ...datasetForm, category: e.target.value })}
                    placeholder="Fruits / Meat / Grains"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#243447] mb-1">Kalori / 100g (kcal)</label>
                  <input
                    type="number"
                    required
                    value={datasetForm.calories_per_100g}
                    onChange={(e) => setDatasetForm({ ...datasetForm, calories_per_100g: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datasetForm.protein_per_100g}
                    onChange={(e) => setDatasetForm({ ...datasetForm, protein_per_100g: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-1 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Karbo (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datasetForm.carbohydrates_per_100g}
                    onChange={(e) => setDatasetForm({ ...datasetForm, carbohydrates_per_100g: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-1 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Lemak (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datasetForm.fat_per_100g}
                    onChange={(e) => setDatasetForm({ ...datasetForm, fat_per_100g: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-1 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Serat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datasetForm.fiber_per_100g}
                    onChange={(e) => setDatasetForm({ ...datasetForm, fiber_per_100g: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-1 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="w-1/2 bg-[#F1F5F9] text-[#243447] py-2 rounded-xl font-semibold text-xs hover:bg-[#E2E8F0] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingDataset}
                  className="w-1/2 bg-[#2E8B57] hover:bg-[#267347] text-white py-2 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {uploadingDataset ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Simpan Makanan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { FoodDatabase as FoodDatabasePage };
