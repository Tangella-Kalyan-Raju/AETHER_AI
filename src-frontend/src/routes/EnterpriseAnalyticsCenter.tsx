import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, DollarSign, Leaf, Zap, Shield, FileText,
  Calendar, Download, LayoutDashboard, Target, History, RefreshCcw, ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import api from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface KPI {
  name: string;
  current_value: number;
  previous_value: number;
  unit: string;
  trend_direction: "UP" | "DOWN" | "STABLE";
  percentage_change: number;
}

interface ExecSummary {
  title: string;
  operational_performance: string;
  financial_impact: string;
  environmental_impact: string;
  key_achievements: string[];
  major_risks: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

const KPICard = ({ kpi, icon: Icon }: { kpi: KPI, icon: any }) => {
  const isPositiveTrend = (kpi.trend_direction === "UP" && kpi.percentage_change > 0) || (kpi.trend_direction === "DOWN" && kpi.name === "Grid Loss");
  const isNeutral = kpi.trend_direction === "STABLE";
  const colorClass = isNeutral ? "text-slate-500" : (isPositiveTrend ? "text-emerald-500" : "text-orange-500");
  const TrendIcon = kpi.trend_direction === "UP" ? TrendingUp : (kpi.trend_direction === "DOWN" ? TrendingDown : Activity);

  return (
    <Card className="p-6 border-l-4 border-l-slate-700 bg-white dark:bg-[#0B0E13] hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{kpi.name}</h4>
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-slate-900 dark:text-white">
          {kpi.unit === "USD" ? "$" : ""}{kpi.current_value.toLocaleString()}{kpi.unit !== "USD" ? kpi.unit : ""}
        </span>
      </div>
      <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${colorClass}`}>
        <TrendIcon className="w-4 h-4" />
        <span>{Math.abs(kpi.percentage_change)}%</span>
        <span className="text-slate-500 ml-1 font-normal">vs previous period</span>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function EnterpriseAnalyticsCenter() {
  const [activeTab, setActiveTab] = useState<"executive" | "trends" | "comparison" | "reports">("executive");
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [summary, setSummary] = useState<ExecSummary | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [comparisons, setComparisons] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, summaryRes, trendRes, compRes] = await Promise.all([
        api.get("/api/v1/analytics/kpi"),
        api.get("/api/v1/analytics/executive-summary"),
        api.get("/api/v1/analytics/trends"),
        api.get("/api/v1/analytics/comparison")
      ]);
      setKpis(kpiRes.data);
      setSummary(summaryRes.data);
      setTrends(trendRes.data);
      setComparisons(compRes.data);
    } catch (error) {
      console.error("Failed to load analytics", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Renders
  // ─────────────────────────────────────────────────────────────────────────────

  const renderExecutiveSummary = () => {
    if (!summary) return null;
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => {
            const icons = [DollarSign, Shield, Leaf, Zap];
            return <KPICard key={kpi.name} kpi={kpi} icon={icons[idx % icons.length]} />;
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-8 lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              Executive Brief: {summary.title}
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="w-4 h-4"/> Operational Performance</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md border border-slate-100 dark:border-slate-800">
                  {summary.operational_performance}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Financial Impact</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    {summary.financial_impact}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Leaf className="w-4 h-4"/> Environmental Impact</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    {summary.environmental_impact}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 lg:col-span-1 bg-slate-50 dark:bg-[#0B0E13]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500"/> Key Achievements
            </h3>
            <ul className="space-y-4">
              {summary.key_achievements.map((ach: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{ach}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-8 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500"/> Major Risks
            </h3>
            <ul className="space-y-4">
              {summary.major_risks.map((risk: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{risk}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    if (!trends) return null;
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Cost & Emissions Trajectory</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#94A3B8" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155", color: "#F8FAFC" }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Cost" fill="#3B82F6" name="Operating Cost ($)" radius={[4,4,0,0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="CO2" stroke="#10B981" strokeWidth={3} name="CO2 Emissions (T)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Grid Reliability Index</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.data}>
                  <defs>
                    <linearGradient id="colorRel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                  <YAxis domain={[95, 100]} stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155", color: "#F8FAFC" }} />
                  <Area type="monotone" dataKey="Reliability" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRel)" name="Reliability (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!comparisons) return null;
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Before vs After Optimization</h3>
        <p className="text-slate-500">Visualizing the direct impact of the applied policy optimizations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisons.metrics.map((metric: any, idx: number) => {
            const isImprovement = metric.optimized < metric.current; // Assuming lower is better for cost/loss, maybe not for mix. Let's make a generic assumption or hardcode per metric
            const diff = metric.optimized - metric.current;
            const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
            const diffColor = (metric.name === "Renewable Mix" && diff > 0) || (metric.name !== "Renewable Mix" && diff < 0) ? "text-emerald-500" : "text-orange-500";
            
            return (
              <Card key={idx} className="p-6">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">{metric.name} ({metric.unit})</h4>
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Current State</p>
                    <p className="text-3xl font-bold text-slate-400">{metric.current.toLocaleString()}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300" />
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Optimized State</p>
                    <p className={`text-3xl font-bold text-slate-900 dark:text-white`}>{metric.optimized.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-center">
                  <span className="text-sm text-slate-500">Net Impact: </span>
                  <span className={`text-lg font-bold ${diffColor}`}>{diffStr} {metric.unit}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    return (
      <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-[#0B0E13]/50 animate-in fade-in duration-500">
        <FileText className="w-12 h-12 text-slate-400 mb-4 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Enterprise Report Generator</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          The analytics schemas are prepared for PDF and Excel generation. (Export functionality excluded as per Phase 5.5 constraints).
        </p>
        <Button disabled variant="outline" className="border-slate-300 dark:border-slate-700">
          <Download className="w-4 h-4 mr-2" /> Generate Q2 Board Report
        </Button>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Return
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="p-6 md:p-8 space-y-8 pb-32 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end">
        <PageHeader 
          title="Enterprise Analytics Center" 
          subtitle="Executive visual intelligence aggregating optimizations, forecasts, and grid decisions." 
        />
        <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        {[
          { id: "executive", name: "Executive Summary", icon: LayoutDashboard },
          { id: "trends", name: "Trend Analysis", icon: TrendingUp },
          { id: "comparison", name: "Before vs After", icon: Activity },
          { id: "reports", name: "Board Reports", icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500">Aggregating Enterprise Analytics...</p>
        </div>
      ) : (
        <>
          {activeTab === "executive" && renderExecutiveSummary()}
          {activeTab === "trends" && renderTrends()}
          {activeTab === "comparison" && renderComparison()}
          {activeTab === "reports" && renderReports()}
        </>
      )}
    </div>
  );
}
