import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  Activity,
  Zap,
  Leaf,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Play,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Download,
} from "lucide-react";

interface Policy {
  id: number;
  name: string;
  objective: string;
  status: string;
}

interface SimResult {
  policy_name: string;
  scenario: string;
  operating_cost_usd: number;
  renewable_penetration_pct: number;
  stability_score: number;
  reliability_score: number;
  voltage_deviation_pct: number;
  frequency_deviation_hz: number;
  reserve_margin_mw: number;
  overall_score: number;
}

interface ComparisonResult {
  scenario: string;
  policy_a: SimResult;
  policy_b: SimResult;
  deltas: {
    operating_cost_usd: number;
    renewable_penetration_pct: number;
    stability_score: number;
    reliability_score: number;
    overall_score: number;
  };
}

interface AIEvaluation {
  recommended_strategy: string;
  confidence_score: number;
  reasoning: string;
  operational_trade_offs: string;
  alternatives: string[];
}

export default function PolicySimulationWorkspace() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [scenario, setScenario] = useState("Storm Weather");
  const [policyIdA, setPolicyIdA] = useState<number | null>(null);
  const [policyIdB, setPolicyIdB] = useState<number | null>(null);

  // Simulation Running State
  const [simulating, setSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Results State
  const [compResult, setCompResult] = useState<ComparisonResult | null>(null);
  const [aiEval, setAiEval] = useState<AIEvaluation | null>(null);
  const [riskA, setRiskA] = useState<{ risk_level: string; mitigations: string[] } | null>(null);
  const [riskB, setRiskB] = useState<{ risk_level: string; mitigations: string[] } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived simulation metrics
  const costA = compResult ? compResult.policy_a.operating_cost_usd / 10 : 0;
  const costB = compResult ? compResult.policy_b.operating_cost_usd / 10 : 0;
  const costDelta = costB - costA;

  const co2A = compResult ? 800 - compResult.policy_a.renewable_penetration_pct * 7 : 0;
  const co2B = compResult ? 800 - compResult.policy_b.renewable_penetration_pct * 7 : 0;
  const co2Delta = co2B - co2A;

  const renewA = compResult ? compResult.policy_a.renewable_penetration_pct : 0;
  const renewB = compResult ? compResult.policy_b.renewable_penetration_pct : 0;
  const renewDelta = renewB - renewA;

  const relA = compResult ? compResult.policy_a.reliability_score : 0;
  const relB = compResult ? compResult.policy_b.reliability_score : 0;
  const relDelta = relB - relA;

  const riskAVal = compResult
    ? 100 - (compResult.policy_a.stability_score + compResult.policy_a.reliability_score) / 2
    : 0;
  const riskBVal = compResult
    ? 100 - (compResult.policy_b.stability_score + compResult.policy_b.reliability_score) / 2
    : 0;
  const riskDelta = riskBVal - riskAVal;

  const stabA = compResult ? compResult.policy_a.stability_score : 0;
  const stabB = compResult ? compResult.policy_b.stability_score : 0;
  const stabDelta = stabB - stabA;

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/policies");
      setPolicies(res.data);
      if (res.data.length > 0) {
        setPolicyIdA(res.data[0].id);
        if (res.data.length > 1) {
          setPolicyIdB(res.data[1].id);
        } else {
          setPolicyIdB(res.data[0].id);
        }
      }
    } catch (err: any) {
      setError("Failed to load policy list.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = () => {
    if (!policyIdA || !policyIdB) return;
    setError(null);
    setSimulating(true);
    setProgress(0);
    setCompleted(false);

    // Fast-forward animation simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          executeComparison();
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const executeComparison = async () => {
    try {
      // 1. Compare Simulation
      const compareRes = await api.post("/api/v1/policies/simulation/compare", {
        policy_id_a: policyIdA,
        policy_id_b: policyIdB,
        scenario_type: scenario,
      });
      setCompResult(compareRes.data.comparison);
      setAiEval(compareRes.data.ai_evaluation);

      // 2. Risk Assessment A
      const riskARes = await api.post("/api/v1/policies/simulation/run", {
        policy_id: policyIdA,
        scenario_type: scenario,
      });
      setRiskA(riskARes.data.risk_assessment);

      // 3. Risk Assessment B
      const riskBRes = await api.post("/api/v1/policies/simulation/run", {
        policy_id: policyIdB,
        scenario_type: scenario,
      });
      setRiskB(riskBRes.data.risk_assessment);

      setCompleted(true);
    } catch (err: any) {
      setError("Policy simulation run failed. Verify parameters.");
    } finally {
      setSimulating(false);
    }
  };

  const handleDownloadReport = async (policyId: number) => {
    try {
      const res = await api.get(
        `/api/v1/policies/simulation/reports/${policyId}?scenario_type=${scenario}`
      );
      const dataStr =
        "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `policy_${policyId}_sim_report.json`);
      a.click();
    } catch (err) {
      alert("Failed to export simulation report.");
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical":
      case "High":
        return "text-red-500 bg-red-500/10 border border-red-500/25";
      case "Moderate":
        return "text-yellow-500 bg-yellow-500/10 border border-yellow-500/25";
      default:
        return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/25";
    }
  };

  const handleResetSimulation = () => {
    setCompleted(false);
    setCompResult(null);
    setAiEval(null);
    setRiskA(null);
    setRiskB(null);
  };

  const getDeltaBadge = (delta: number, lowerIsBetter = false) => {
    if (delta === 0) return <span className="text-slate-500">0</span>;
    const isPositive = delta > 0;
    const isGood = lowerIsBetter ? !isPositive : isPositive;
    return (
      <span className={`font-bold ${isGood ? "text-emerald-500" : "text-red-500"}`}>
        {isPositive ? "+" : ""}
        {delta}
      </span>
    );
  };

  return (
    <div className="space-y-6 select-text font-sans">
      {/* Toast Alert logs */}
      {error && (
        <div className="p-3 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header section */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 gap-4 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Operating Policy Simulations & Evaluation
          </h1>
        </div>
      </section>

      {/* Settings bar */}
      <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-400 uppercase">
            Select Scenario Type:
          </label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="Storm Weather">Storm Weather Alert</option>
            <option value="Peak Demand">Peak Demand shaving</option>
            <option value="High Renewable">High Renewable yield</option>
            <option value="Battery Degradation">Battery Degradation margins</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-400 uppercase">
            Policy A (Baseline):
          </label>
          <select
            value={policyIdA || ""}
            onChange={(e) => setPolicyIdA(parseInt(e.target.value))}
            className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-400 uppercase">
            Policy B (Simulated):
          </label>
          <select
            value={policyIdB || ""}
            onChange={(e) => setPolicyIdB(parseInt(e.target.value))}
            className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> RUN SIMULATION MATCH
          </button>
          {(completed || simulating) && (
            <button
              onClick={handleResetSimulation}
              className="px-3 py-2 bg-slate-500/20 hover:bg-slate-500/35 text-slate-300 font-mono font-bold text-xs rounded-[2px] transition-colors border border-slate-700/50"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Progress loop */}
      {simulating && (
        <div className="p-4 border border-[#2A313C] bg-[#151A21] rounded-[4px] space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Iterating GPO MILP optimizer steps...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Deck */}
      {completed && compResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left Column 2: Comparisons table & Deltas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
              <div className="border-b border-[#2A313C]/40 pb-2 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-500" /> Comparison Analysis matrix
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="pb-2">Performance KPI</th>
                      <th className="pb-2">{compResult.policy_a.policy_name}</th>
                      <th className="pb-2">{compResult.policy_b.policy_name}</th>
                      <th className="pb-2 text-right">Comparative Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">Expected Cost (£/hr)</td>
                      <td
                        className={`py-2.5 ${costA < costB ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        £
                        {costA.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        /hr
                      </td>
                      <td
                        className={`py-2.5 ${costB < costA ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        £
                        {costB.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        /hr
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {getDeltaBadge(Number(costDelta.toFixed(2)), true)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">CO₂ Emissions (g CO₂/kWh)</td>
                      <td
                        className={`py-2.5 ${co2A < co2B ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {co2A.toFixed(1)} g/kWh
                      </td>
                      <td
                        className={`py-2.5 ${co2B < co2A ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {co2B.toFixed(1)} g/kWh
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {getDeltaBadge(Number(co2Delta.toFixed(1)), true)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">Renewable Energy (%)</td>
                      <td
                        className={`py-2.5 ${renewA > renewB ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {renewA}%
                      </td>
                      <td
                        className={`py-2.5 ${renewB > renewA ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {renewB}%
                      </td>
                      <td className="py-2.5 text-right font-mono">{getDeltaBadge(renewDelta)}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">Reliability Score</td>
                      <td
                        className={`py-2.5 ${relA > relB ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {relA}/100
                      </td>
                      <td
                        className={`py-2.5 ${relB > relA ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {relB}/100
                      </td>
                      <td className="py-2.5 text-right font-mono">{getDeltaBadge(relDelta)}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">Risk Score</td>
                      <td
                        className={`py-2.5 ${riskAVal < riskBVal ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {riskAVal.toFixed(1)}/100
                      </td>
                      <td
                        className={`py-2.5 ${riskBVal < riskAVal ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {riskBVal.toFixed(1)}/100
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {getDeltaBadge(Number(riskDelta.toFixed(1)), true)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <td className="py-2.5 text-slate-350">Grid Stability Score</td>
                      <td
                        className={`py-2.5 ${stabA > stabB ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {stabA}/100
                      </td>
                      <td
                        className={`py-2.5 ${stabB > stabA ? "text-emerald-500 font-bold" : "text-slate-300"}`}
                      >
                        {stabB}/100
                      </td>
                      <td className="py-2.5 text-right font-mono">{getDeltaBadge(stabDelta)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  onClick={() => policyIdA && handleDownloadReport(policyIdA)}
                  className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:text-white font-bold text-[10.5px] rounded-[2px] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> EXPORT REPORT A
                </button>
                <button
                  onClick={() => policyIdB && handleDownloadReport(policyIdB)}
                  className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:text-white font-bold text-[10.5px] rounded-[2px] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> EXPORT REPORT B
                </button>
              </div>
            </div>

            {/* Risk Assessment panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk A */}
              {riskA && (
                <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-3">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">
                    {compResult.policy_a.policy_name} Risk Profile
                  </span>
                  <div
                    className={`px-2.5 py-1 rounded font-mono text-xs font-bold w-fit ${getRiskColor(riskA.risk_level)}`}
                  >
                    {riskA.risk_level.toUpperCase()} RISK
                  </div>
                  <ul className="list-disc pl-4 text-[11px] text-slate-500 font-mono space-y-1">
                    {riskA.mitigations.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                    {riskA.mitigations.length === 0 && <li>No mitigations required.</li>}
                  </ul>
                </div>
              )}

              {/* Risk B */}
              {riskB && (
                <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-3">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">
                    {compResult.policy_b.policy_name} Risk Profile
                  </span>
                  <div
                    className={`px-2.5 py-1 rounded font-mono text-xs font-bold w-fit ${getRiskColor(riskB.risk_level)}`}
                  >
                    {riskB.risk_level.toUpperCase()} RISK
                  </div>
                  <ul className="list-disc pl-4 text-[11px] text-slate-500 font-mono space-y-1">
                    {riskB.mitigations.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                    {riskB.mitigations.length === 0 && <li>No mitigations required.</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column 1: AI Evaluation Strategy */}
          {aiEval && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" /> AI Strategy Evaluation
              </h3>

              <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-[#07090C] rounded-[4px] space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">
                    Recommended deployment policy:
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />{" "}
                    {aiEval.recommended_strategy}
                  </h4>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">
                    Confidence Index:
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-500">
                    {Math.round(aiEval.confidence_score * 100)}%
                  </span>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-500/5 border border-slate-700/40 rounded text-xs">
                  <span className="font-mono text-[9px] text-slate-405 uppercase block">
                    AI Analysis & Evidence:
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    "{aiEval.reasoning}"
                  </p>
                </div>

                <div className="text-[11px] space-y-2">
                  <div className="text-slate-500">
                    <strong>Operational Trade-offs:</strong> {aiEval.operational_trade_offs}
                  </div>
                  <div className="text-slate-500">
                    <strong>Alternative Recommendations:</strong> {aiEval.alternatives.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
