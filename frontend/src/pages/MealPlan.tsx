import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, RefreshCw, Sparkles, Salad } from 'lucide-react';
import API, { MealPlan as MealPlanType, MealPlanItem } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../context/AuthContext';

export const MealPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState<MealPlanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const res = await API.get('/meal-plan');
      if (res.data?.success) {
        setMealPlan(res.data.meal_plan);
      }
    } catch (err) {
      console.error('Failed to fetch meal plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await API.post('/meal-plan/generate');
      if (res.data?.success) {
        setMealPlan(res.data.meal_plan);
      }
    } catch (err) {
      alert('Gagal membuat meal plan baru.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchMealPlan();
  }, []);

  const totalCal = mealPlan ? mealPlan.total_calories : 0;
  const targetCal = mealPlan ? mealPlan.target_calories : (user?.profile?.daily_calorie_target || 2000);
  const progressPct = Math.min(100, Math.round((totalCal / targetCal) * 100));

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E8F5E9] text-[#2E8B57] rounded-full px-3 py-1 text-xs font-semibold mb-2">
            <Salad className="w-3.5 h-3.5" />
            <span>Rencana Makan Personalisasi</span>
          </div>
          <h1 className="text-2xl font-bold text-[#243447]">Jadwal & Rencana Makan Harian</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Rekomendasi menu seimbang berdasarkan target kalori harian dan profil nutrisi Anda ({user?.profile?.goal?.replace('_', ' ') || 'Maintain'}).
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menyusun Menu Baru...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Buat Rencana Baru</span>
            </>
          )}
        </button>
      </div>

      {/* Health Disclaimer */}
      <DisclaimerBanner />

      {/* Daily Calories Progress Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
          <span className="text-[#243447]">Target Kalori Rencana Makan</span>
          <span className="text-[#2E8B57] font-extrabold text-sm sm:text-base">
            {totalCal.toLocaleString()} / {targetCal.toLocaleString()} kcal ({progressPct}%)
          </span>
        </div>

        <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2E8B57] transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {mealPlan && (
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-[#64748B] border-t border-[#E2E8F0]">
            <div>Protein Total: <strong className="text-[#243447]">{mealPlan.total_protein}g</strong></div>
            <div>Karbohidrat: <strong className="text-[#243447]">{mealPlan.total_carbs}g</strong></div>
            <div>Lemak: <strong className="text-[#243447]">{mealPlan.total_fat}g</strong></div>
          </div>
        )}
      </div>

      {/* Meal Category Cards (Breakfast, Lunch, Dinner, Snack) */}
      {loading ? (
        <div className="text-center py-12 text-[#64748B] text-xs">Memuat rencana makan...</div>
      ) : mealPlan && mealPlan.meals ? (
        <div className="space-y-5">
          {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((mealType) => {
            const items: MealPlanItem[] = mealPlan.meals[mealType] || [];
            const mealCalories = items.reduce((sum, item) => sum + item.calories, 0);
            const mealProtein = Math.round(items.reduce((sum, item) => sum + item.protein, 0) * 10) / 10;
            const mealCarbs = Math.round(items.reduce((sum, item) => sum + item.carbohydrates, 0) * 10) / 10;
            const mealFat = Math.round(items.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

            const mealTitleId: Record<string, string> = {
              Breakfast: 'Sarapan Pagi (Breakfast)',
              Lunch: 'Makan Siang (Lunch)',
              Dinner: 'Makan Malam (Dinner)',
              Snack: 'Camilan Sehat (Snack)'
            };

            return (
              <div key={mealType} className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center font-bold text-sm">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#243447]">{mealTitleId[mealType] || mealType}</h3>
                      <span className="text-xs text-[#64748B]">{items.length} item makanan</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[#2E8B57] bg-[#E8F5E9] px-2.5 py-1 rounded-full border border-[#C8E6C9]">
                      {mealCalories} kcal
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-[#243447] text-xs sm:text-sm">{item.food_name}</h4>
                          <span className="text-[11px] text-[#64748B]">Porsi: {item.portion_g}g</span>
                        </div>
                        <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                          {item.calories} kcal
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-[#64748B] pt-1.5 border-t border-[#E2E8F0]">
                        <span>Protein: <strong className="text-[#243447]">{item.protein}g</strong></span>
                        <span>Karbo: <strong className="text-[#243447]">{item.carbohydrates}g</strong></span>
                        <span>Lemak: <strong className="text-[#243447]">{item.fat}g</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Macro Bar */}
                <div className="flex items-center justify-between text-xs text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                  <span>Subtotal Nutrisi:</span>
                  <div className="flex space-x-3 font-medium text-[#243447]">
                    <span>Protein: <strong>{mealProtein}g</strong></span>
                    <span>Karbo: <strong>{mealCarbs}g</strong></span>
                    <span>Lemak: <strong>{mealFat}g</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-[#64748B] text-xs">Belum ada data meal plan. Klik tombol Buat Rencana Baru di atas.</div>
      )}
    </div>
  );
};
