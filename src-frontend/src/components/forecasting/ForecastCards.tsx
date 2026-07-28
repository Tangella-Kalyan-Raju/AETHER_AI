import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const ForecastKpiCard = ({
  title,
  currentValue,
  forecastValue,
  unit,
  trend,
  confidence,
  lastUpdated,
}: any) => {
  return (
    <Card className="bg-white dark:bg-[#1E232B] border-slate-200 dark:border-[#2A313C]">
      <CardContent className="p-6 h-full flex flex-col justify-between space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
              {confidence}% Conf
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Current</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentValue}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider text-indigo-400">
              Forecast
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {forecastValue}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-[#2A313C]">
          <div className="flex items-center text-slate-500">
            {trend === "up" ? (
              <>
                <ArrowUpRight className="w-3 h-3 mr-1 text-red-500" />{" "}
                <span className="text-red-500 font-medium">Increasing</span>
              </>
            ) : trend === "down" ? (
              <>
                <ArrowDownRight className="w-3 h-3 mr-1 text-emerald-500" />{" "}
                <span className="text-emerald-500 font-medium">Decreasing</span>
              </>
            ) : (
              <>
                <Activity className="w-3 h-3 mr-1 text-slate-400" /> <span>Stable</span>
              </>
            )}
          </div>
          <span className="text-slate-400">Updated: {lastUpdated}</span>
        </div>
      </CardContent>
    </Card>
  );
};
