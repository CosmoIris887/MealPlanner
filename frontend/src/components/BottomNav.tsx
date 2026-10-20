import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  UtensilsCrossed, 
  MessageSquare, 
  User 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan', path: '/scan', icon: Camera },
    { label: 'Plan', path: '/meal-plan', icon: UtensilsCrossed },
    { label: 'AI Chat', path: '/chat', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50 px-2 py-1.5 shadow-md">
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'text-[#2E8B57] font-semibold' : 'text-[#64748B] hover:text-[#243447]'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
