import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2, Calendar, Flame, Dumbbell, Wheat, Droplet, Camera, Utensils } from 'lucide-react';
import API, { DailyIntakeItem, FoodScanResult, getImageUrl } from '../services/api';

export const FoodHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intake' | 'scans'>('intake');
  const [dailyIntakes, setDailyIntakes] = useState<DailyIntakeItem[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await API.get('/scan/history');
      if (res.data?.success) {
        setDailyIntakes(res.data.daily_intake || []);
        setScans(res.data.scans || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteIntake = async (id: number) => {
    if (!window.confirm('Hapus catatan makanan ini?')) return;
    try {
      await API.delete(`/scan/intake/${id}`);
      setDailyIntakes((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Gagal menghapus riwayat.');
    }
  };

  const handleDeleteScan = async (id: number) => {
    if (!window.confirm('Hapus riwayat foto scan ini?')) return;
    try {
      await API.delete(`/scan/${id}`);
      setScans((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Gagal menghapus scan.');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 bg-[#E8F5E9] text-[#2E8B57] rounded-full px-3 py-1 text-xs font-semibold mb-2">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>Riwayat Nutrisi & Pindai Foto</span>
        </div>
        <h1 className="text-2xl font-bold text-[#243447]">Histori Makanan</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Daftar konsumsi harian dan riwayat analisis foto makanan berbasis AI Vision.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('intake')}
          className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'intake'
              ? 'border-[#2E8B57] text-[#2E8B57] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#243447]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Catatan Konsumsi Harian ({dailyIntakes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scans')}
          className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'scans'
              ? 'border-[#2E8B57] text-[#2E8B57] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#243447]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Hasil Scan Foto AI ({scans.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#64748B] text-xs">Memuat riwayat makanan...</div>
      ) : activeTab === 'intake' ? (
        <div className="space-y-2.5">
          {dailyIntakes.length > 0 ? (
            dailyIntakes.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between hover:border-[#CBD5E1] transition-all">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#243447] text-xs sm:text-sm capitalize">{item.food_name}</span>
                    <span className="text-[10px] bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                      {item.portion_g}g
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[#64748B]">
                    <span className="text-[#D97706] font-semibold">{item.calories} kcal</span>
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbohydrates}g</span>
                    <span>F: {item.fat}g</span>
                    <span className="text-[#94A3B8]">{new Date(item.logged_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteIntake(item.id)}
                  title="Hapus"
                  className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#64748B] bg-white rounded-2xl p-6 border border-[#E2E8F0] text-xs">
              Belum ada catatan konsumsi makanan.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {scans.length > 0 ? (
            scans.map((scan) => (
              <div key={scan.id} className="bg-white rounded-xl p-3.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between hover:border-[#CBD5E1] transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-lg bg-[#F8FAFC] overflow-hidden shrink-0 border border-[#E2E8F0] flex items-center justify-center">
                    {scan.image_path ? (
                      <img src={getImageUrl(scan.image_path)} alt={scan.detected_food_name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-[#94A3B8]" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-[#243447] text-xs sm:text-sm capitalize">{scan.detected_food_name}</span>
                    <div className="flex items-center space-x-2 text-[11px] text-[#64748B] mt-0.5">
                      <span className="text-[#2E8B57] font-semibold">{scan.calories} kcal ({scan.weight_g}g)</span>
                      <span>• Match: {Math.round(scan.confidence_score * 100)}%</span>
                      <span className="text-[#94A3B8]">• {new Date(scan.scanned_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteScan(scan.id)}
                  title="Hapus"
                  className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#64748B] bg-white rounded-2xl p-6 border border-[#E2E8F0] text-xs">
              Belum ada riwayat foto yang dipindai.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
