import React, { useState, useEffect } from "react";
import {
  Activity, Shield, DollarSign, Leaf, Target, Zap, Clock, TrendingUp, CheckCircle2,
  AlertTriangle, Play, ChevronRight, BarChart2, Server, Globe, Scale, Lightbulb, Hexagon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import api from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DecisionIntelligenceWorkspace() {
  const [activeWorkspace, setActiveWorkspace] = useState<"policy" | "weather" | "scenario" | "tradeoff">("policy");
  const [isComparing, setIsComparing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [scores, setScores] = useState<any>(null);

  // Load backend data (mocked simulation)
  const runComparison = async () => {
    setIsComparing(true);
    await new Promise(r => setTimeout(r, 1500)); // simulate comparison latency
    
    try {
      const recRes = await api.get("/api/v1/decisions/recommendations/ranked");
      const scoreRes = await api.get("/api/v1/decisions/scores/breakdown");
      setRecommendations(recRes.data);
      setScores(scoreRes.data);
    } catch (e) {
      console.error("Failed to load decision intelligence", e);
    }
    
    setIsComparing(false);
  };

  useEffect(() => {
    runComparison();
  }, [activeWorkspace]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Radar Data (Decision Score)
  // ─────────────────────────────────────────────────────────────────────────────
  const radarData = scores ? [
    { subject: "Cost Efficiency", A: scores["Balanced Strategy"]?.cost || 85, fullMark: 100 },
    { subject: "Reliability", A: scores["Balanced Strategy"]?.reliability || 90, fullMark: 100 },
    { subject: "Sustainability", A: scores["Balanced Strategy"]?.sustainability || 85, fullMark: 100 },
    { subject: "Risk Mitigation", A: scores["Balanced Strategy"]?.risk || 80, fullMark: 100 },
    { subject: "Grid Stability", A: scores["Balanced Strategy"]?.stability || 92, fullMark: 100 }
  ] : [];

  // ─────────────────────────────────────────────────────────────────────────────
  // Sub-Workspaces
  // ─────────────────────────────────────────────────────────────────────────────

  const renderPolicyComparison = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Scale className="w-5 h-5 text-orange-500" /> Policy Comparison Matrix
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card className="p-6 lg:col-span-1 border-dashed bg-slate-50/50 dark:bg-[#0B0E13]/50">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-center">Balanced Strategy Score</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Radar name="Balanced Strategy" dataKey="A" stroke="#F97316" fill="#F97316" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <span className="text-3xl font-bold text-orange-500">{scores?.["Balanced Strategy"]?.overall || 86.6}</span>
            <span className="text-slate-500 text-sm ml-2">Overall Score</span>
          </div>
        </Card>
        
        {/* Comparison Bar */}
        <Card className="p-6 lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Multi-Policy Variance (KPIs)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { metric: "Operating Cost ($K)", "Max Reliability": 140, "Balanced Strategy": 115, "Cost Focus": 95 },
                { metric: "CO2 Emissions (T)", "Max Reliability": 850, "Balanced Strategy": 650, "Cost Focus": 900 },
                { metric: "Grid Loss (MW)", "Max Reliability": 30, "Balanced Strategy": 35, "Cost Focus": 48 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="metric" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155", color: "#F8FAFC" }} />
                <Legend />
                <Bar dataKey="Max Reliability" fill="#3B82F6" radius={[2,2,0,0]} />
                <Bar dataKey="Balanced Strategy" fill="#F97316" radius={[2,2,0,0]} />
                <Bar dataKey="Cost Focus" fill="#10B981" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-8 mb-4">
        <Lightbulb className="w-5 h-5 text-emerald-500" /> Explainable Recommendations
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <Card key={i} className={`p-6 border-l-4 ${rec.rank === 1 ? 'border-l-orange-500 bg-orange-500/5' : 'border-l-slate-400 bg-slate-50 dark:bg-[#151A21]'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${rec.rank === 1 ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  #{rec.rank}
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{rec.strategy}</h4>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                Confidence: {(rec.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed bg-white dark:bg-[#0B0E13] p-4 rounded border border-slate-200 dark:border-slate-800">
              <strong>Why Recommended:</strong> {rec.explanation}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 block">Advantages</span>
                <ul className="space-y-1">
                  {rec.advantages.map((adv: string, j: number) => (
                    <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> {adv}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">Disadvantages / Risks</span>
                <ul className="space-y-1">
                  {rec.disadvantages.map((dis: string, j: number) => (
                    <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-orange-500"/> {dis}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWeatherComparison = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Globe className="w-5 h-5 text-blue-500" /> Weather Scenario Matrix
      </h3>
      <Card className="p-6">
        <p className="text-sm text-slate-500 mb-6">Evaluating current operational plan resilience against severe meteorological phenomena.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded border border-blue-500/30 bg-blue-500/5">
            <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-4"><CheckCircle2 className="w-4 h-4"/> Normal Conditions</h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Load Variance:</span> <span>0%</span></div>
              <div className="flex justify-between"><span>Solar Yield:</span> <span>95%</span></div>
              <div className="flex justify-between"><span>Reliability Risk:</span> <Badge variant="secondary">Low</Badge></div>
            </div>
          </div>
          <div className="p-4 rounded border border-orange-500/30 bg-orange-500/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
            <h4 className="font-bold text-orange-500 flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4"/> Heatwave (+10°C)</h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Load Variance:</span> <span className="text-orange-500 font-bold">+18% (HVAC)</span></div>
              <div className="flex justify-between"><span>Solar Yield:</span> <span>88% (Heat derating)</span></div>
              <div className="flex justify-between"><span>Reliability Risk:</span> <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge></div>
            </div>
            <p className="text-xs text-orange-600 mt-4 font-medium border-t border-orange-500/20 pt-2">Requires immediate +300MW reserve allocation.</p>
          </div>
          <div className="p-4 rounded border border-slate-700 bg-slate-900">
            <h4 className="font-bold text-slate-300 flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-emerald-400"/> Heavy Storm</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between"><span>Load Variance:</span> <span>-5%</span></div>
              <div className="flex justify-between"><span>Wind Yield:</span> <span className="text-emerald-400 font-bold">120% (High gusts)</span></div>
              <div className="flex justify-between"><span>Reliability Risk:</span> <Badge variant="outline" className="text-slate-300 border-slate-600">Medium</Badge></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTradeOffDashboard = () => {
    // Scatter chart data
    const tradeOffData = [
      { name: 'Cost Focus', cost: 95000, reliability: 82, co2: 900 },
      { name: 'Reliability Focus', cost: 140000, reliability: 98, co2: 850 },
      { name: 'Carbon Focus', cost: 125000, reliability: 88, co2: 400 },
      { name: 'Balanced', cost: 115000, reliability: 90, co2: 650 },
    ];
    
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" /> Multi-Variable Trade-Off Analysis
        </h3>
        <Card className="p-6">
          <p className="text-sm text-slate-500 mb-6">Scatter plot identifying the Pareto frontier between Operational Cost and System Reliability.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" dataKey="reliability" name="Reliability Score" domain={[70, 100]} stroke="#94A3B8" />
                <YAxis type="number" dataKey="cost" name="Cost ($)" domain={[80000, 150000]} stroke="#94A3B8" />
                <ZAxis type="number" dataKey="co2" range={[100, 1000]} name="CO2 Emissions" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155", color: "#F8FAFC" }} />
                <Legend />
                <Scatter name="Evaluated Strategies" data={tradeOffData} fill="#F97316" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  };


  // ─────────────────────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-8 pb-32 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end">
        <PageHeader 
          title="Enterprise Decision Intelligence" 
          subtitle="Compare operational policies, scenarios, and optimizations to make data-driven, advisory decisions." 
        />
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        {[
          { id: "policy", name: "Policy Comparison", icon: Scale },
          { id: "tradeoff", name: "Trade-Off Analysis", icon: Activity },
          { id: "weather", name: "Weather Matrix", icon: Globe },
          { id: "scenario", name: "Scenario Vault", icon: Hexagon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveWorkspace(tab.id as any)}
            className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeWorkspace === tab.id 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {isComparing ? (
        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
          <div className="relative w-16 h-16 mb-6">
            <svg className="animate-spin w-full h-full text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Synthesizing Enterprise Comparisons...</h3>
          <p className="text-slate-500 mt-2">Correlating multi-dimensional KPIs across operational models.</p>
        </div>
      ) : (
        <>
          {activeWorkspace === "policy" && renderPolicyComparison()}
          {activeWorkspace === "tradeoff" && renderTradeOffDashboard()}
          {activeWorkspace === "weather" && renderWeatherComparison()}
          {activeWorkspace === "scenario" && (
            <Card className="p-12 text-center border-dashed flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#0B0E13]/50">
               <Hexagon className="w-12 h-12 text-slate-400 mb-4" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Scenario Comparison Matrix</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                 Historical and simulated scenario comparison tracking is active. Render views for multi-scenario tables will arrive in Phase 5.5 Enterprise Reporting.
               </p>
            </Card>
          )}
        </>
      )}

      {/* Footer Banner - Advisory Warning */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-500/10 border-t border-blue-500/20 p-3 flex justify-center backdrop-blur-md z-50">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
          <Activity className="w-4 h-4"/> <strong>Advisory Mode:</strong> The Decision Intelligence Engine does not automatically execute operational policies. All recommendations must be manually accepted by control room operators.
        </p>
      </div>
    </div>
  );
}
