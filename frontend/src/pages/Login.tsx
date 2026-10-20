import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Salad, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal masuk. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-7 sm:p-8 border border-[#E2E8F0] shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2E8B57] text-white mb-3 shadow-xs">
            <Salad className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#243447] tracking-tight">Selamat Datang Kembali</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">Masuk ke akun AI Food & Meal Planner Anda</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs mb-5 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#243447] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#64748B]">
          Belum memiliki akun?{' '}
          <Link to="/register" className="text-[#2E8B57] font-semibold hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};
