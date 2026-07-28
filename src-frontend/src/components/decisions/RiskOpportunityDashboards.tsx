import React from "react";
import { ShieldAlert, TrendingUp, DollarSign, Leaf, Zap, Battery, Activity } from "lucide-react";

export const RiskOpportunityDashboards = ({ risk, opportunities }: any) => {
  if (!risk || !opportunities) return null;

  const getRiskColor = (val: number) => {
    if (val > 50) return "text-red-500 bg-red-500/10";
    if (val > 20) return "text-amber-500 bg-amber-500/10";
    return "text-emerald-500 bg-emerald-500/10";
  };

  const RiskItem = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] rounded-lg">
      <div className="flex items-center text-slate-500 dark:text-slate-400">
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-xs uppercase font-medium">{label}</span>
      </div>
      <span className={`text-sm font-bold px-2 py-0.5 rounded ${getRiskColor(value)}`}>
        {value}/100
      </span>
    </div>
  );

  const OpportunityItem = ({ label, value, unit, icon: Icon, color }: any) => (
    <div className="p-4 bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] rounded-lg">
      <div className={`w-8 h-8 rounded mb-3 flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">
        {unit === "$" ? "$" : ""}
        {value}
        {unit !== "$" ? unit : ""}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" />
          Risk Assessment
        </h4>
        <div className="space-y-2">
          <RiskItem label="Overall Risk" value={risk.overall_risk_score} icon={ShieldAlert} />
          <RiskItem label="Operational" value={risk.operational_risk} icon={Zap} />
          <RiskItem label="Financial" value={risk.financial_risk} icon={DollarSign} />
          <RiskItem label="Grid Stability" value={risk.grid_stability_risk} icon={Activity} />
          <RiskItem label="Battery Impact" value={risk.battery_risk} icon={Battery} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center mt-8">
          <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
          Projected Opportunities
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <OpportunityItem
            label="Cost Savings"
            value={opportunities.expected_cost_savings}
            unit="$"
            icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-500"
          />
          <OpportunityItem
            label="Carbon Reduction"
            value={opportunities.expected_carbon_reduction}
            unit=" tons"
            icon={Leaf}
            color="bg-green-500/10 text-green-500"
          />
          <OpportunityItem
            label="Reliability Boost"
            value={opportunities.reliability_improvement}
            unit="%"
            icon={ShieldAlert}
            color="bg-blue-500/10 text-blue-500"
          />
          <OpportunityItem
            label="Battery Opt."
            value={opportunities.battery_optimisation_potential}
            unit="%"
            icon={Battery}
            color="bg-purple-500/10 text-purple-500"
          />
        </div>
      </div>
    </div>
  );
};
