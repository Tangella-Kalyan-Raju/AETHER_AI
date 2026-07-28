import React from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PredictionTimeline = ({
  currentHorizon,
  onHorizonChange,
  isPlaying,
  onPlayToggle,
}: any) => {
  const horizons = [15, 30, 60, 360, 720, 1440];
  const labels = ["+15m", "+30m", "+1h", "+6h", "+12h", "+24h"];

  const currentIndex = horizons.indexOf(currentHorizon);

  const handleNext = () => {
    if (currentIndex < horizons.length - 1) onHorizonChange(horizons[currentIndex + 1]);
  };

  const handlePrev = () => {
    if (currentIndex > 0) onHorizonChange(horizons[currentIndex - 1]);
  };

  return (
    <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant={isPlaying ? "destructive" : "default"} size="icon" onClick={onPlayToggle}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === horizons.length - 1}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 px-8 relative">
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
          <div
            className="absolute h-1.5 bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / (horizons.length - 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {labels.map((label, i) => (
            <div
              key={i}
              onClick={() => onHorizonChange(horizons[i])}
              className={`text-xs font-semibold cursor-pointer transition-colors ${i === currentIndex ? "text-indigo-500" : "text-slate-400 hover:text-slate-300"}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
