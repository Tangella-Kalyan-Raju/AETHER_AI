import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import { 
  Activity, Zap, ShieldAlert, Cpu, CheckCircle2, TrendingUp, AlertTriangle, Wind, Sun, Battery
} from 'lucide-react';

interface IntelligenceDashboardProps {
  analyticsData: any;
  datasetName: string;
}

export default function IntelligenceDashboard({ analyticsData, datasetName }: IntelligenceDashboardProps) {
  if (!analyticsData) return null;

  const exec = analyticsData.executive_summary || {};
  const demand = analyticsData.demand_analytics || {};
  const gen = analyticsData.generation_analytics || {};
  const quality = analyticsData.data_quality || {};
  const ai = analyticsData.ai_insights || { insights: [], recommendations: [] };
  const charts = analyticsData.charts || { trend_data: [] };
  const stats = analyticsData.statistics || {};
  const regional = analyticsData.regional_analytics || {};

  return (
    <div className="space-y-6 mt-6 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          Enterprise Analytics: {datasetName}
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded transition-colors">
            Export PDF
          </button>
          <button className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard title="Total Records" value={exec.total_records?.toLocaleString()} icon={<Activity />} />
        <KPICard title="Regions" value={exec.regions_covered} icon={<Activity />} />
        <KPICard title="Avg Demand" value={`${demand.avg_demand?.toFixed(1)} MW`} icon={<Zap />} />
        <KPICard title="Avg Generation" value={`${gen.avg_generation?.toFixed(1)} MW`} icon={<Battery />} />
        <KPICard title="Data Quality" value={`${exec.data_quality_score?.toFixed(1)}%`} icon={<CheckCircle2 className="text-emerald-500"/>} />
      </div>

      {/* Main Grid: Exec Summary & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Executive Summary */}
        <div className="lg:col-span-1 rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
            Executive Summary
          </h3>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Dataset Name" value={datasetName} />
            <SummaryRow label="Time Period" value={`${new Date(exec.start_date).toLocaleDateString()} - ${new Date(exec.end_date).toLocaleDateString()}`} />
            <SummaryRow label="Total Columns" value={exec.total_columns} />
            <SummaryRow label="Missing Data" value={`${exec.missing_values_pct?.toFixed(2)}%`} color={exec.missing_values_pct > 5 ? 'text-red-400' : 'text-emerald-400'} />
            <SummaryRow label="Duplicate Rows" value={exec.duplicate_records} color={exec.duplicate_records > 0 ? 'text-yellow-400' : 'text-emerald-400'} />
            <SummaryRow label="Overall Readiness" value={`${exec.overall_health_pct?.toFixed(1)}%`} color={exec.overall_health_pct > 90 ? 'text-emerald-400' : 'text-yellow-400'} />
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-500" /> Groq AI Insights & Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase">Key Insights</h4>
              {ai.insights?.map((insight: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-300">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-orange-400">Insight {i+1}</span>
                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {insight.confidence}% Conf
                    </span>
                  </div>
                  {insight.text}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase">Recommendations</h4>
              {ai.recommendations?.map((rec: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-300">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold ${rec.priority === 'High' ? 'text-red-400' : 'text-blue-400'}`}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {rec.confidence}% Conf
                    </span>
                  </div>
                  <div className="mb-1 font-semibold">{rec.text}</div>
                  <div className="text-[10px] text-slate-500">Reason: {rec.reason}</div>
                  <div className="text-[10px] text-emerald-400/80 mt-1">Impact: {rec.expected_impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Demand vs Generation Trend (Daily)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.trend_data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="demand" stroke="#f97316" fillOpacity={1} fill="url(#colorDemand)" name="Demand (MW)" />
                <Area type="monotone" dataKey="generation" stroke="#10b981" fillOpacity={1} fill="url(#colorGen)" name="Generation (MW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Regional Generation Mix
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(regional).map(([region, data]: any) => ({ name: region, demand: data.demand, generation: data.generation }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="demand" fill="#3b82f6" name="Demand" radius={[2, 2, 0, 0]} />
                <Bar dataKey="generation" fill="#8b5cf6" name="Generation" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statistical Summary Table */}
      <div className="rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Statistical Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 font-semibold">Metric</th>
                <th className="py-2.5 font-semibold">Count</th>
                <th className="py-2.5 font-semibold">Mean</th>
                <th className="py-2.5 font-semibold">Std Dev</th>
                <th className="py-2.5 font-semibold">Min</th>
                <th className="py-2.5 font-semibold">25%</th>
                <th className="py-2.5 font-semibold">Median</th>
                <th className="py-2.5 font-semibold">75%</th>
                <th className="py-2.5 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(stats).map(([col, s]: any) => (
                <tr key={col} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-semibold text-slate-300 capitalize">{col.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.count}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.mean?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.std?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.min?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s['25%']?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.median?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s['75%']?.toFixed(2)}</td>
                  <td className="py-2.5 font-mono text-slate-400">{s.max?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function KPICard({ title, value, icon }: { title: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-slate-800 bg-[#07090C]/60 flex items-center gap-4">
      <div className="p-2 bg-slate-800/50 rounded-md text-slate-400">
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">{title}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color = "text-slate-300" }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-500 font-semibold">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
