import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  bgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#2E8B57]',
  bgColor = 'bg-[#E8F5E9]'
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#243447] tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-[#64748B] mt-1 font-medium">{subtitle}</p>}
    </div>
  );
};
