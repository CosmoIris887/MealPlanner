import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Target, 
  Dumbbell, 
  Wheat, 
  Droplet, 
  Camera, 
  MessageSquare, 
  UtensilsCrossed, 
  Plus, 
  ChevronRight,
  Clock,
  Salad
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API, { MealPlan, FoodScanResult, DailyIntakeItem } from '../services/api';
import { StatCard } from '../components/StatCard';
import { ProgressBar } from '../components/ProgressBar';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [recentScans, setRecentScans] = useState<FoodScanResult[]>([]);
  const [dailyIntakes, setDailyIntakes] = useState<DailyIntakeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Food Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickFoodName, setQuickFoodName] = useState('');
  const [quickPortion, setQuickPortion] = useState(150);
  const [quickCalories, setQuickCalories] = useState(250);
  const [quickProtein, setQuickProtein] = useState(15);
  const [quickCarbs, setQuickCarbs] = useState(30);
  const [quickFat, setQuickFat] = useState(8);
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mpRes, historyRes] = await Promise.all([
        API.get('/meal-plan').catch(() => null),
        API.get('/scan/history').catch(() => null)
      ]);

      if (mpRes && mpRes.data?.success) {
        setMealPlan(mpRes.data.meal_plan);
      }
      if (historyRes && historyRes.data?.success) {
        setRecentScans(historyRes.data.scans || []);
        setDailyIntakes(historyRes.data.daily_intake || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute total consumed stats today
  const consumedCalories = dailyIntakes.reduce((sum, item) => sum + item.calories, 0);
  const consumedProtein = Math.round(dailyIntakes.reduce((sum, item) => sum + item.protein, 0) * 10) / 10;
  const consumedCarbs = Math.round(dailyIntakes.reduce((sum, item) => sum + item.carbohydrates, 0) * 10) / 10;
  const consumedFat = Math.round(dailyIntakes.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

  const targetCal = user?.profile?.daily_calorie_target || 2000;
  const remainingCalories = Math.max(0, targetCal - consumedCalories);

  // Target macro estimates
  const targetProtein = Math.round((targetCal * 0.25) / 4);
  const targetCarbs = Math.round((targetCal * 0.50) / 4);
  const targetFat = Math.round((targetCal * 0.25) / 9);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await API.post('/scan/log-intake', {
        food_name: quickFoodName || 'Santapan Sehat',
        portion_g: quickPortion,
        calories: quickCalories,
        protein: quickProtein,
        carbohydrates: quickCarbs,
        fat: quickFat
      });
      setShowAddModal(false);
      setQuickFoodName('');
      fetchData();
    } catch (err) {
      alert('Gagal menambah makanan ke catatan harian.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Greeting Banner (Clean Health Product) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E8F5E9] text-[#2E8B57] rounded-full px-3 py-1 text-xs font-semibold mb-2.5">
            <Salad className="w-3.5 h-3.5" />
            <span>AI Health & Nutrition Companion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#243447] tracking-tight">
            Selamat Datang, {user?.name || 'Pengguna'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl">
            Pantau asupan kalori harian Anda, pindai makanan dengan AI Vision lokal, dan konsultasikan perencanaan gizi bersama asisten pintar kami.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/scan')}
            className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Makanan</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="bg-[#EAF4FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 cursor-pointer transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-[#78B7E8]" />
            <span>Tanya AI Chatbot</span>
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => navigate('/scan')}
          className="bg-white hover:bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center space-y-2 text-center transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#243447]">Scan Makanan</span>
        </button>

        <button
          onClick={() => navigate('/chat')}
          className="bg-white hover:bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center space-y-2 text-center transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] text-[#1E40AF] flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#243447]">AI Chatbot</span>
        </button>

        <button
          onClick={() => navigate('/meal-plan')}
          className="bg-white hover:bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center space-y-2 text-center transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#243447]">Meal Plan</span>
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white hover:bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center space-y-2 text-center transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#243447]">Catat Makanan</span>
        </button>
      </div>

      {/* Main Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Target Kalori Harian"
          value={`${targetCal} kcal`}
          subtitle={`TDEE Target (${user?.profile?.goal?.replace('_', ' ') || 'Maintain'})`}
          icon={Target}
          iconColor="text-[#2E8B57]"
          bgColor="bg-[#E8F5E9]"
        />
        <StatCard
          title="Kalori Terkonsumsi"
          value={`${consumedCalories} kcal`}
          subtitle={`${Math.round((consumedCalories / targetCal) * 100)}% dari target harian`}
          icon={Flame}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Sisa Kalori Aman"
          value={`${remainingCalories} kcal`}
          subtitle="Estimasi kuota kalori tersisa"
          icon={Clock}
          iconColor="text-[#1E40AF]"
          bgColor="bg-[#EAF4FF]"
        />
        <StatCard
          title="Total Protein Masuk"
          value={`${consumedProtein} g`}
          subtitle={`Target harian ~${targetProtein}g`}
          icon={Dumbbell}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
        />
      </div>

      {/* Daily Macros Breakdown Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#243447] flex items-center space-x-2">
          <Flame className="w-4 h-4 text-[#2E8B57]" />
          <span>Progress Pemenuhan Makronutrisi Hari Ini</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ProgressBar
            label="Protein"
            current={consumedProtein}
            max={targetProtein}
            color="bg-indigo-500"
          />
          <ProgressBar
            label="Karbohidrat"
            current={consumedCarbs}
            max={targetCarbs}
            color="bg-[#2E8B57]"
          />
          <ProgressBar
            label="Lemak"
            current={consumedFat}
            max={targetFat}
            color="bg-amber-500"
          />
        </div>
      </div>

      {/* Meal Plan & Scans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Recommended Meal Plan */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#243447] flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4 text-[#2E8B57]" />
              <span>Rencana Makan Hari Ini</span>
            </h2>
            <button
              onClick={() => navigate('/meal-plan')}
              className="text-xs text-[#2E8B57] hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
            >
              <span>Lihat Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {mealPlan && mealPlan.meals ? (
            <div className="space-y-2.5">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => {
                const items = (mealPlan.meals as any)[type] || [];
                return (
                  <div key={type} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#2E8B57] uppercase tracking-wider">{type}</span>
                      <p className="text-xs font-semibold text-[#243447] mt-0.5">
                        {items.length > 0 ? items.map((i: any) => i.food_name).join(' + ') : 'Menu Rekomendasi'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#243447]">
                        {items.reduce((acc: number, cur: any) => acc + cur.calories, 0)} kcal
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-[#64748B] space-y-2.5">
              <p className="text-xs">Belum ada rekomendasi meal plan untuk hari ini.</p>
              <button
                onClick={() => navigate('/meal-plan')}
                className="bg-[#2E8B57] hover:bg-[#267347] text-white text-xs font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Buat Meal Plan
              </button>
            </div>
          )}
        </div>

        {/* Recent Food Scans */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#243447] flex items-center space-x-2">
              <Camera className="w-4 h-4 text-[#2E8B57]" />
              <span>Riwayat Scan Terakhir</span>
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-[#2E8B57] hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
            >
              <span>Riwayat Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-2.5">
              {recentScans.slice(0, 4).map((scan: any) => (
                <div key={scan.id} className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] overflow-hidden shrink-0 flex items-center justify-center">
                      {scan.image_path ? (
                        <img src={scan.image_path} alt={scan.detected_food_name} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-4 h-4 text-[#94A3B8]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#243447] capitalize">{scan.detected_food_name}</p>
                      <p className="text-[10px] text-[#64748B]">{scan.weight_g}g • Match {Math.round(scan.confidence_score * 100)}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2E8B57] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                    {scan.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[#64748B] space-y-2.5">
              <p className="text-xs">Belum ada foto makanan yang dipindai.</p>
              <button
                onClick={() => navigate('/scan')}
                className="bg-[#2E8B57] hover:bg-[#267347] text-white text-xs font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Scan Makanan Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#243447]">Catat Makanan Harian</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#64748B] hover:text-[#243447] cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#243447] mb-1">Nama Makanan</label>
                <input
                  type="text"
                  required
                  value={quickFoodName}
                  onChange={(e) => setQuickFoodName(e.target.value)}
                  placeholder="Contoh: Nasi Putih + Dada Ayam"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#243447] mb-1">Berat (gram)</label>
                  <input
                    type="number"
                    required
                    value={quickPortion}
                    onChange={(e) => setQuickPortion(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#243447] mb-1">Kalori (kcal)</label>
                  <input
                    type="number"
                    required
                    value={quickCalories}
                    onChange={(e) => setQuickCalories(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#243447] focus:outline-none focus:border-[#2E8B57]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={quickProtein}
                    onChange={(e) => setQuickProtein(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Karbohidrat (g)</label>
                  <input
                    type="number"
                    value={quickCarbs}
                    onChange={(e) => setQuickCarbs(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Lemak (g)</label>
                  <input
                    type="number"
                    value={quickFat}
                    onChange={(e) => setQuickFat(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#243447] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-[#F1F5F9] text-[#243447] py-2 rounded-xl font-semibold text-xs hover:bg-[#E2E8F0] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="w-1/2 bg-[#2E8B57] hover:bg-[#267347] text-white py-2 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
                >
                  {adding ? 'Menyimpan...' : 'Simpan Makanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
