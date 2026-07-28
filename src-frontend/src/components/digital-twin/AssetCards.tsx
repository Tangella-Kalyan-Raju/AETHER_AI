import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Power, TrendingUp, AlertTriangle } from "lucide-react";

export const AssetSummaryCard = ({ title, value, icon: Icon, trend }: any) => {
  return (
    <Card className="border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
            {trend && (
              <p className="text-xs text-emerald-500 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
            <Icon className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
