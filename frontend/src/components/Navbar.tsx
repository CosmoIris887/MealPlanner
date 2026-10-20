import React from 'react';
import { Salad } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  const goalText = user?.profile?.goal ? user.profile.goal.replace('_', ' ') : 'Maintain Health';

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 px-4 py-2.5 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Mobile Title */}
      <div className="flex items-center space-x-2 md:hidden">
        <div className="w-8 h-8 rounded-lg bg-[#2E8B57] flex items-center justify-center text-white">
          <Salad className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-[#243447] text-sm">AI Food Planner</span>
      </div>

      {/* Desktop Header Context */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="text-xs text-[#64748B]">
          Target Kalori Harian:{' '}
          <span className="text-[#2E8B57] font-bold text-sm">
            {user?.profile?.daily_calorie_target || 2000} kcal
          </span>
        </div>
      </div>

      {/* Right User Status & Goals */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:inline-flex items-center space-x-1.5 bg-[#EAF4FF] text-[#1E40AF] border border-[#BFDBFE] rounded-full px-3 py-1 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#78B7E8]"></span>
          <span>Tujuan: <strong className="capitalize">{goalText}</strong></span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E8B57] border border-[#C8E6C9] flex items-center justify-center text-xs font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-semibold text-[#243447] hidden md:inline">
            {user?.name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};
