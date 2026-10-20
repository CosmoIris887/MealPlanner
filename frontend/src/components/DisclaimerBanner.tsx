import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-xl p-3.5 mb-6 flex items-start space-x-3 text-[#92400E] text-xs">
      <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Catatan Kesehatan:</span> Rekomendasi nutrisi dan meal plan ini dirancang sebagai panduan umum gaya hidup sehat berbasis formula Mifflin-St Jeor dan data nutrisi. Untuk program medis khusus, konsultasikan dengan dokter atau ahli gizi terdaftar.
      </div>
    </div>
  );
};
