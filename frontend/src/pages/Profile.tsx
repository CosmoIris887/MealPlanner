import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, Trash2, Activity, Target, Flame, CheckCircle2, AlertCircle, Salad } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: 'male' as 'male' | 'female',
    weight: 70,
    height: 170,
    activity_level: 'moderate' as any,
    goal: 'maintain' as any,
    food_preferences: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.profile?.age || 25,
        gender: (user.profile?.gender as any) || 'male',
        weight: user.profile?.weight || 70,
        height: user.profile?.height || 170,
        activity_level: user.profile?.activity_level || 'moderate',
        goal: user.profile?.goal || 'maintain',
        food_preferences: user.profile?.food_preferences || ''
      });
    }
  }, [user]);

  // Dynamic live calculations using Mifflin-St Jeor formula
  const calculateBMR = () => {
    const w = Number(formData.weight) || 70;
    const h = Number(formData.height) || 170;
    const a = Number(formData.age) || 25;
    if (formData.gender === 'female') {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    } else {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
    }
  };

  const getActivityMultiplier = (level: string) => {
    const map: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    return map[level] || 1.375;
  };

  const calculatedBMR = calculateBMR();
  const calculatedTDEE = Math.round(calculatedBMR * getActivityMultiplier(formData.activity_level));

  const calculateTargetCalories = () => {
    switch (formData.goal) {
      case 'lose_weight':
        return Math.round(calculatedTDEE * 0.80);
      case 'gain_weight':
        return Math.round(calculatedTDEE * 1.15);
      case 'build_muscle':
        return Math.round(calculatedTDEE * 1.10);
      case 'maintain':
      default:
        return calculatedTDEE;
    }
  };

  const calculatedTargetCalories = calculateTargetCalories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile({
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        height: Number(formData.height),
        activity_level: formData.activity_level,
        goal: formData.goal,
        food_preferences: formData.food_preferences
      });
      setSuccessMsg('Profil dan target kalori berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (err) {
      alert('Gagal menghapus akun.');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 bg-[#E8F5E9] text-[#2E8B57] rounded-full px-3 py-1 text-xs font-semibold mb-2">
          <UserIcon className="w-3.5 h-3.5" />
          <span>Pengaturan Akun & Profil Fisik</span>
        </div>
        <h1 className="text-2xl font-bold text-[#243447]">Profil Pengguna</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Sesuaikan data fisik untuk perhitungan BMR, TDEE, dan target kalori berbasis formula Mifflin-St Jeor.
        </p>
      </div>

      {successMsg && (
        <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E8B57] p-3.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Calorie & BMR Calculation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase">Basal Metabolic Rate (BMR)</span>
          <p className="text-xl font-bold text-[#243447] mt-1">{calculatedBMR} <span className="text-xs font-normal text-[#64748B]">kcal/hari</span></p>
          <span className="text-[10px] text-[#94A3B8]">Formula Mifflin-St Jeor</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase">Total Daily Energy (TDEE)</span>
          <p className="text-xl font-bold text-[#1E40AF] mt-1">{calculatedTDEE} <span className="text-xs font-normal text-[#64748B]">kcal/hari</span></p>
          <span className="text-[10px] text-[#94A3B8]">Kalori Aktivitas Fisik</span>
        </div>

        <div className="bg-[#E8F5E9] rounded-xl p-4 border border-[#C8E6C9] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#2E8B57] uppercase">Target Kalori Harian</span>
          <p className="text-xl font-bold text-[#2E8B57] mt-1">{calculatedTargetCalories} <span className="text-xs font-normal text-[#2E8B57]/80">kcal/hari</span></p>
          <span className="text-[10px] text-[#2E8B57] font-medium capitalize">Goal: {formData.goal.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Alamat Email (Hanya Baca)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#64748B] cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Umur (tahun)</label>
            <input
              type="number"
              min="12"
              max="100"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Jenis Kelamin</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
            >
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Berat Badan (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tinggi Badan (cm)</label>
            <input
              type="number"
              min="100"
              max="250"
              required
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tingkat Aktivitas Fisik</label>
            <select
              value={formData.activity_level}
              onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
            >
              <option value="sedentary">Sedentary (Jarang berolahraga, 1.2x)</option>
              <option value="light">Light Active (Olahraga ringan 1-3 hari/mgg, 1.375x)</option>
              <option value="moderate">Moderate Active (Olahraga sedang 3-5 hari/mgg, 1.55x)</option>
              <option value="very_active">Very Active (Olahraga berat 6-7 hari/mgg, 1.725x)</option>
              <option value="extra_active">Extra Active (Aktivitas fisik sangat berat, 1.9x)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tujuan Nutrisi (Goal)</label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
            >
              <option value="lose_weight">Menurunkan Berat Badan (-20% Defisit Kalori)</option>
              <option value="maintain">Mempertahankan Berat Badan (Maintenance)</option>
              <option value="gain_weight">Menambah Berat Badan (+15% Surplus Kalori)</option>
              <option value="build_muscle">Membangun Massa Otot (+10% High Protein)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#243447] mb-1.5">Preferensi Makanan & Pantangan (Opsional)</label>
          <input
            type="text"
            value={formData.food_preferences}
            onChange={(e) => setFormData({ ...formData, food_preferences: e.target.value })}
            placeholder="Contoh: Vegetarian, Bebas Seafood, Rendah Garam, dsb."
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center space-x-1.5 py-2 px-3 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2.5 px-6 rounded-xl text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E2E8F0] shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#243447]">Hapus Akun Anda?</h3>
            <p className="text-xs text-[#64748B]">
              Tindakan ini permanen. Semua data profil, riwayat scan foto, meal plan, dan pesan chat akan dihapus dari sistem.
            </p>
            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 bg-[#F1F5F9] text-[#243447] py-2 rounded-xl font-semibold text-xs hover:bg-[#E2E8F0] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl font-semibold text-xs cursor-pointer shadow-xs"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
