import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  UtensilsCrossed, 
  Database, 
  MessageSquare, 
  History, 
  User, 
  LogOut, 
  Salad
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan Food', path: '/scan', icon: Camera },
    { label: 'Meal Plan', path: '/meal-plan', icon: UtensilsCrossed },
    { label: 'Food Database', path: '/foods', icon: Database },
    { label: 'AI Chatbot', path: '/chat', icon: MessageSquare },
    { label: 'History', path: '/history', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-3 py-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#2E8B57] flex items-center justify-center text-white shadow-sm shadow-[#2E8B57]/20">
          <Salad className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-[#243447] leading-tight">AI Food Planner</h1>
          <p className="text-[11px] text-[#2E8B57] font-semibold">Nutrition & Health</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#E8F5E9] text-[#2E8B57] font-semibold'
                    : 'text-[#64748B] hover:text-[#243447] hover:bg-[#F8FAFC]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="pt-3 border-t border-[#E2E8F0] mt-auto">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E8B57] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C8E6C9]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#243447] truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-[#64748B] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
