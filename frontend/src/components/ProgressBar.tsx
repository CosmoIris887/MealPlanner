import React from 'react';

interface ProgressBarProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  current,
  max,
  unit = 'g',
  color = 'bg-[#2E8B57]'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((current / (max || 1)) * 100)));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-[#243447]">{label}</span>
        <span className="text-[#64748B]">
          <strong className="text-[#243447]">{current}</strong> / {max} {unit} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
