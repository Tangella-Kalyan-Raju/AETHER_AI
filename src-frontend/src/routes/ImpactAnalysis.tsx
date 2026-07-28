import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Activity, Landmark, Sparkles, ShieldCheck, Database } from "lucide-react";

const ImpactAnalysis: React.FC = () => {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [simulationId, setSimulationId] = useState("");
  const [report, setReport] = useState<any>(null);

  const [sim1, setSim1] = useState("");
  const [sim2, setSim2] = useState("");
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      const res = await api.get("/api/v1/simulation/");
      setSimulations(res.data);
      if (res.data.length > 0) {
        setSimulationId(res.data[0].id);
        setSim1(res.data[0].id);
        if (res.data.length > 1) {
          setSim2(res.data[1].id);
        }
      }
    } catch (e) {
      console.error("Failed to load simulations list", e);
    }
  };

  const analyzeSimulation = async () => {
    if (!simulationId) {
      alert("Please select or enter a Simulation ID");
      return;
    }
    try {
      await api.post(`/api/v1/analysis/${simulationId}/analyze`);
      const res = await api.get(`/api/v1/analysis/${simulationId}/report`);
      setReport(res.data);
    } catch (e) {
      alert("Analysis failed.");
    }
  };

  const compareStrategies = async () => {
    if (!sim1 || !sim2) {
      alert("Please select both simulation IDs for comparison");
      return;
    }
    try {
      const res = await api.get(
        `/api/v1/analysis/compare?base_sim_id=${sim1}&candidate_sim_id=${sim2}`
      );
      setComparison(res.data);
    } catch (e) {
      alert("Comparison failed. Make sure both are analyzed first.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
          Enterprise Impact Analysis
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Evaluate simulation KPIs, compare strategies, and review AI explainability traces.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Single Simulation Analysis */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF7A1A]" />
            Analyze Completed Simulation
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Select Completed Run
              </label>
              <select
                value={simulationId}
                onChange={(e) => setSimulationId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C] rounded text-slate-900 dark:text-white focus:outline-none focus:border-[#FF7A1A]"
              >
                {simulations.length === 0 ? (
                  <option
                    value=""
                    className="bg-white text-slate-900 dark:bg-[#151A21] dark:text-white"
                  >
                    No simulation runs found — start one first
                  </option>
                ) : (
                  simulations.map((sim: any) => (
                    <option
                      key={sim.id}
                      value={sim.id}
                      className="bg-white text-slate-900 dark:bg-[#151A21] dark:text-white"
                    >
                      {sim.scenario_id} ({sim.id.substring(0, 8)}) - {sim.status}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or enter custom Simulation ID manually..."
                value={simulationId}
                onChange={(e) => setSimulationId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C] rounded text-slate-900 dark:text-white focus:outline-none focus:border-[#FF7A1A]"
              />
              <button
                onClick={analyzeSimulation}
                className="px-4 py-1.5 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white text-xs font-bold rounded transition-colors"
              >
                Analyze
              </button>
            </div>
          </div>

          {report && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#2A313C]/40">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Grid Health
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    {report.grid_health_score ?? 0}/100
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Savings (USD)
                  </span>
                  <span className="text-xl font-bold text-blue-400">
                    ${report.financial_impact?.total_estimated_savings_usd ?? 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  AI Explainability Traces
                </h3>
                {(report.ai_explanations || []).map((ai: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C]/60 text-xs"
                  >
                    <p className="font-semibold text-slate-900 dark:text-orange-400">
                      Q: {ai.question}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      A: {ai.answer}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 block mt-2">
                      Evidence: T+{ai.evidence?.sim_time ?? 0} mins
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Strategy Comparator */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-500" />
            Strategy Comparison
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Base Simulation
              </label>
              <select
                value={sim1}
                onChange={(e) => setSim1(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C] rounded text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {simulations.map((sim: any) => (
                  <option
                    key={sim.id}
                    value={sim.id}
                    className="bg-white text-slate-900 dark:bg-[#151A21] dark:text-white"
                  >
                    {sim.scenario_id} ({sim.id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Candidate Simulation
              </label>
              <select
                value={sim2}
                onChange={(e) => setSim2(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C] rounded text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {simulations.map((sim: any) => (
                  <option
                    key={sim.id}
                    value={sim.id}
                    className="bg-white text-slate-900 dark:bg-[#151A21] dark:text-white"
                  >
                    {sim.scenario_id} ({sim.id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={compareStrategies}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors"
          >
            Compare Strategies
          </button>

          {comparison && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#2A313C]/40 text-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Winner: {comparison.recommended_winner} Strategy
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C]/60">
                  <span className="text-[10px] text-slate-500 block mb-1">Cost Delta</span>
                  <span
                    className={`font-mono font-bold ${comparison.differences.cost_diff > 0 ? "text-rose-400" : "text-emerald-400"}`}
                  >
                    {comparison.differences.cost_diff > 0 ? "+" : ""}$
                    {comparison.differences.cost_diff}
                  </span>
                </div>
                <div className="p-3 rounded bg-slate-50 dark:bg-[#0B0E13] border border-slate-200 dark:border-[#2A313C]/60">
                  <span className="text-[10px] text-slate-500 block mb-1">Carbon Delta</span>
                  <span
                    className={`font-mono font-bold ${comparison.differences.carbon_diff < 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {comparison.differences.carbon_diff} Tons CO2
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactAnalysis;
