import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Salad, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: 25,
    gender: 'male',
    weight: 70,
    height: 170,
    activity_level: 'moderate',
    goal: 'maintain'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Harap isi nama, email, dan password Anda.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        ...formData,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height)
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran gagal. Periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-7 sm:p-8 border border-[#E2E8F0] shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2E8B57] text-white mb-3 shadow-xs">
            <Salad className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#243447] tracking-tight">Pendaftaran Akun Baru</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Langkah {step} dari 2: {step === 1 ? 'Informasi Akun' : 'Profil & Target Kalori'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2.5 mb-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-16 bg-[#2E8B57]' : 'w-8 bg-[#E2E8F0]'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-16 bg-[#2E8B57]' : 'w-8 bg-[#E2E8F0]'}`} />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs mb-5 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#243447] mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nama Lengkap Anda"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#243447] mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#243447] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-5 transition-colors"
            >
              <span>Lanjut ke Profil Nutrisi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1.5">Umur (th)</label>
                <input
                  type="number"
                  name="age"
                  min="12"
                  max="100"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1.5">Jenis Kelamin</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
                >
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1.5">Berat Badan (kg)</label>
                <input
                  type="number"
                  name="weight"
                  step="0.1"
                  min="30"
                  max="300"
                  required
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tinggi Badan (cm)</label>
                <input
                  type="number"
                  name="height"
                  min="100"
                  max="250"
                  required
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tingkat Aktivitas Fisik</label>
              <select
                name="activity_level"
                value={formData.activity_level}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
              >
                <option value="sedentary">Sedentary (Jarang / tidak olahraga)</option>
                <option value="light">Light Active (Olahraga 1-3x/minggu)</option>
                <option value="moderate">Moderate Active (Olahraga 3-5x/minggu)</option>
                <option value="very_active">Very Active (Olahraga 6-7x/minggu)</option>
                <option value="extra_active">Extra Active (Pekerja fisik / atlet)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#243447] mb-1.5">Tujuan Utama (Goal)</label>
              <select
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#243447] focus:outline-none focus:border-[#2E8B57] cursor-pointer"
              >
                <option value="lose_weight">Menurunkan Berat Badan (-20% Defisit)</option>
                <option value="maintain">Mempertahankan Berat Badan</option>
                <option value="gain_weight">Menambah Berat Badan (+15% Surplus)</option>
                <option value="build_muscle">Membangun Massa Otot (High Protein)</option>
              </select>
            </div>

            <div className="flex space-x-2.5 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#243447] font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? (
                  <span>Mendaftarkan...</span>
                ) : (
                  <span>Selesaikan Pendaftaran</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center pt-4 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#64748B]">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-[#2E8B57] font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
