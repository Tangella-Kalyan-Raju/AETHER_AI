import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, ShieldCheck, Leaf, DollarSign, Activity } from "lucide-react";

export const RecommendationCard = ({ decision, onSelect, isSelected }: any) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getIcon = (type: string) => {
    if (type.includes("Generation") || type.includes("Output")) return <Zap className="w-5 h-5" />;
    if (type.includes("Battery") || type.includes("Charging"))
      return <Activity className="w-5 h-5" />;
    if (type.includes("Renewable")) return <Leaf className="w-5 h-5" />;
    return <ShieldCheck className="w-5 h-5" />;
  };

  return (
    <Card
      className={`cursor-pointer transition-all border ${isSelected ? "border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-500/10" : "border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] hover:border-indigo-400 dark:hover:border-indigo-500/50"}`}
      onClick={() => onSelect(decision)}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${isSelected ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-[#161B22] text-slate-500 dark:text-slate-400"}`}
            >
              {getIcon(decision.type)}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {decision.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{decision.type}</p>
            </div>
          </div>
          <Badge variant="outline" className={getPriorityColor(decision.priority)}>
            {decision.priority} Priority
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-slate-50 dark:bg-[#161B22] p-2 rounded border border-slate-100 dark:border-[#2A313C]">
            <p className="text-[10px] text-slate-500 uppercase">Confidence</p>
            <p className="text-sm font-semibold text-emerald-500">{decision.confidence_score}%</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#161B22] p-2 rounded border border-slate-100 dark:border-[#2A313C]">
            <p className="text-[10px] text-slate-500 uppercase">Risk</p>
            <p className="text-sm font-semibold text-amber-500">
              {decision.risk?.overall_risk_score ?? "--"}/100
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-[#161B22] p-2 rounded border border-slate-100 dark:border-[#2A313C]">
            <p className="text-[10px] text-slate-500 uppercase">Savings</p>
            <p className="text-sm font-semibold text-blue-500">
              ${decision.opportunities?.expected_cost_savings ?? "--"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
