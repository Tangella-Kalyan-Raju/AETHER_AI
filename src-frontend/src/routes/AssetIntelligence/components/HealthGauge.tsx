import React from "react";

export function HealthGauge({ score }: { score: number }) {
  const getStrokeColor = (s: number) => {
    if (s >= 85) return "#10B981"; // Emerald
    if (s >= 70) return "#F59E0B"; // Amber
    return "#EF4444"; // Rose
  };

  // Semi-circle gauge (radius 40)
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius; // 125.66
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 60">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#2A313C"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Foreground Value Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center flex flex-col items-center justify-end">
          <span className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
            {score.toFixed(0)}
          </span>
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest -mt-0.5">
            HEALTH INDEX
          </span>
        </div>
      </div>
    </div>
  );
}
