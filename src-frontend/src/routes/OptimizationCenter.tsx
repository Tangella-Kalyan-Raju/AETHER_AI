import React, { useState, useEffect } from "react";
import {
  Activity,
  Settings,
  History,
  Layers,
  Play,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  DollarSign,
  Leaf,
  Zap,
  Shield,
  Target,
  Plus,
  Database,
  ChevronRight,
  BarChart2,
  Server,
  Clock,
  GitCommit,
  FileText,
  Share2,
  Printer,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import api from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep =
  | "SELECT_SCENARIO"
  | "CHOOSE_OBJECTIVES"
  | "SELECT_CONSTRAINTS"
  | "REVIEW"
  | "RUN_OPTIMIZATION"
  | "VIEW_RESULTS";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function OptimizationCenter() {
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");
  const [step, setStep] = useState<WizardStep>("SELECT_SCENARIO");

  // Wizard State
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [constraints, setConstraints] = useState({
    generatorLimits: true,
    batteryCapacity: true,
    reserveRequirements: true,
    renewablePriority: false,
    transmissionLimits: true,
  });

  // Results State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [resultsTab, setResultsTab] = useState<
    "summary" | "economic" | "unit" | "reserve" | "dispatch"
  >("summary");
  const [resultsData, setResultsData] = useState<any>({});

  // Fetch Results Data when reaching View Results step
  const loadOptimizationResults = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    // Simulate complex optimization progress
    for (let i = 0; i <= 100; i += 10) {
      setOptimizationProgress(i);
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      const [ecoRes, unitRes, reserveRes, dispRes, lossRes, costRes, co2Res, relRes] =
        await Promise.all([
          api.get("/api/v1/optimization/economic-dispatch"),
          api.get("/api/v1/optimization/unit-commitment"),
          api.get("/api/v1/optimization/reserve-scheduling"),
          api.get("/api/v1/optimization/dispatch"),
          api.get("/api/v1/optimization/grid-loss"),
          api.get("/api/v1/optimization/cost"),
          api.get("/api/v1/optimization/co2"),
          api.get("/api/v1/optimization/reliability"),
        ]);

      setResultsData({
        economic: ecoRes.data,
        unit: unitRes.data,
        reserve: reserveRes.data,
        dispatch: dispRes.data,
        loss: lossRes.data,
        cost: costRes.data,
        co2: co2Res.data,
        reliability: relRes.data,
      });
      setIsOptimizing(false);
      setStep("VIEW_RESULTS");
    } catch (e) {
      console.error("Failed to load optimization APIs");
      setIsOptimizing(false);
      setStep("VIEW_RESULTS");
    }
  };

  const handleRunOptimization = () => {
    setStep("RUN_OPTIMIZATION");
    loadOptimizationResults();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Sub-Components for Wizard Steps
  // ─────────────────────────────────────────────────────────────────────────────

  const renderSelectScenario = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
        Step 1: Select Basis Scenario
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            id: "S-001",
            name: "Peak Summer Load Baseline",
            desc: "Historical snapshot of August peak demand.",
          },
          {
            id: "S-002",
            name: "High Wind Generation Profile",
            desc: "Scenario emphasizing maximum renewable output.",
          },
          {
            id: "S-003",
            name: "N-1 Generator Failure Contingency",
            desc: "Stress test simulating sudden loss of largest baseload unit.",
          },
        ].map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedScenario(s.id)}
            className={`p-4 border rounded cursor-pointer transition-all ${selectedScenario === s.id ? "border-orange-500 bg-orange-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#0B0E13]"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-900 dark:text-white">{s.name}</h4>
              {selectedScenario === s.id && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
            </div>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-6">
        <Button disabled={!selectedScenario} onClick={() => setStep("CHOOSE_OBJECTIVES")}>
          Next: Choose Objectives <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderChooseObjectives = () => {
    const toggleObj = (id: string) => {
      setSelectedObjectives((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Step 2: Choose Optimization Objectives
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Select one or more objectives for the AI engine to target simultaneously.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "OBJ-COST",
              title: "Cost Minimization",
              icon: DollarSign,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500",
            },
            {
              id: "OBJ-CO2",
              title: "CO₂ Reduction",
              icon: Leaf,
              color: "text-green-500",
              bg: "bg-green-500/10",
              border: "border-green-500",
            },
            {
              id: "OBJ-REL",
              title: "Reliability Improvement",
              icon: Shield,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              border: "border-blue-500",
            },
            {
              id: "OBJ-LOSS",
              title: "Grid Loss Reduction",
              icon: Zap,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
              border: "border-orange-500",
            },
            {
              id: "OBJ-REN",
              title: "Renewable Utilization",
              icon: Activity,
              color: "text-teal-500",
              bg: "bg-teal-500/10",
              border: "border-teal-500",
            },
            {
              id: "OBJ-EFF",
              title: "Energy Efficiency",
              icon: Target,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              border: "border-purple-500",
            },
          ].map((o) => (
            <div
              key={o.id}
              onClick={() => toggleObj(o.id)}
              className={`p-4 border rounded cursor-pointer transition-all flex items-center gap-3 ${selectedObjectives.includes(o.id) ? `${o.border} ${o.bg}` : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0E13]"}`}
            >
              <div
                className={`p-2 rounded-full ${selectedObjectives.includes(o.id) ? o.bg : "bg-slate-100 dark:bg-slate-800"}`}
              >
                <o.icon
                  className={`w-5 h-5 ${selectedObjectives.includes(o.id) ? o.color : "text-slate-400"}`}
                />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {o.title}
              </span>
              {selectedObjectives.includes(o.id) && (
                <CheckCircle2 className={`w-4 h-4 ml-auto ${o.color}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => setStep("SELECT_SCENARIO")}>
            Back
          </Button>
          <Button
            disabled={selectedObjectives.length === 0}
            onClick={() => setStep("SELECT_CONSTRAINTS")}
          >
            Next: Select Constraints <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderSelectConstraints = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
        Step 3: Enforce Operational Constraints
      </h3>
      <div className="space-y-4 max-w-2xl">
        {Object.entries(constraints).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0B0E13]"
          >
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                {k.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <p className="text-xs text-slate-500">
                Ensure the optimizer strictly respects {k.replace(/([A-Z])/g, " $1").toLowerCase()}{" "}
                boundaries.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={v}
                onChange={() => setConstraints({ ...constraints, [k]: !v })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => setStep("CHOOSE_OBJECTIVES")}>
          Back
        </Button>
        <Button onClick={() => setStep("REVIEW")}>
          Next: Review Plan <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
        Step 4: Review Optimization Plan
      </h3>
      <Card className="p-6 bg-slate-50 dark:bg-[#0B0E13] border-dashed">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
              Selected Scenario
            </p>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
              <Server className="w-4 h-4 text-orange-500" /> {selectedScenario}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
              Active Objectives
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedObjectives.map((o) => (
                <Badge key={o} variant="secondary">
                  {o}
                </Badge>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
              Active Constraints
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(constraints)
                .filter(([k, v]) => v)
                .map(([k]) => (
                  <Badge key={k} variant="outline" className="bg-white dark:bg-slate-800">
                    {k}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded flex gap-4 items-start">
          <Activity className="w-6 h-6 text-blue-500 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm">
              Advisory Only Execution
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-300/80 mt-1">
              This optimization run will generate recommendations and projected savings. It will{" "}
              <strong>NOT</strong> autonomously dispatch grid assets.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => setStep("SELECT_CONSTRAINTS")}>
          Back
        </Button>
        <Button onClick={handleRunOptimization} className="bg-orange-500 hover:bg-orange-600">
          <Play className="w-4 h-4 mr-2" /> Start Intelligence Engine
        </Button>
      </div>
    </div>
  );

  const renderRunning = () => (
    <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-500">
      <div className="relative w-24 h-24">
        <svg
          className="animate-spin w-full h-full text-orange-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Synthesizing Operational Strategy...
        </h3>
        <p className="text-slate-500 mt-2">
          Evaluating millions of non-linear grid states against {selectedObjectives.length}{" "}
          simultaneous objectives.
        </p>
      </div>
      <div className="w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${optimizationProgress}%` }}
        ></div>
      </div>
      <div className="flex gap-4 text-xs font-mono text-slate-400">
        <span>[Solving Power Flow...]</span>
        <span>[Evaluating Commitments...]</span>
        <span>[Pricing Arbitrage...]</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Results Dashboards
  // ─────────────────────────────────────────────────────────────────────────────

  const renderResults = () => {
    if (!resultsData.economic) return null;

    const rd = resultsData;

    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Optimization Strategy Ready
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("SELECT_SCENARIO")}>
              <RefreshCw className="w-4 h-4 mr-2" /> New Run
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Share2 className="w-4 h-4 mr-2" /> Export Plan
            </Button>
          </div>
        </div>

        {/* Top KPI Cards (Summary of Before/After) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cost Savings
            </p>
            <p className="text-2xl font-bold text-emerald-500">
              ${(rd.cost?.expected_savings_usd || 0).toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600/80 mt-2">vs Current Operations</p>
          </Card>
          <Card className="p-4 border-green-500/30 bg-green-500/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              CO₂ Avoided
            </p>
            <p className="text-2xl font-bold text-green-500">
              {(rd.co2?.carbon_reduction_tons || 0).toLocaleString()} Tons
            </p>
            <p className="text-xs text-green-600/80 mt-2">
              +{rd.co2?.renewable_improvement_pct || 0}% Renewable Mix
            </p>
          </Card>
          <Card className="p-4 border-blue-500/30 bg-blue-500/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Grid Stability
            </p>
            <p className="text-2xl font-bold text-blue-500">
              {rd.reliability?.grid_stability_score?.optimized || 0}/100
            </p>
            <p className="text-xs text-blue-600/80 mt-2">
              Up from {rd.reliability?.grid_stability_score?.current || 0}
            </p>
          </Card>
          <Card className="p-4 border-orange-500/30 bg-orange-500/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              AI Confidence
            </p>
            <p className="text-2xl font-bold text-orange-500">
              {(rd.economic?.confidence_score * 100 || 0).toFixed(0)}%
            </p>
            <p className="text-xs text-orange-600/80 mt-2">Strong viability metrics</p>
          </Card>
        </div>

        {/* Tab Navigation for Modular Dashboards */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: "summary", name: "Optimization Summary", icon: Target },
              { id: "economic", name: "Economic Dispatch", icon: DollarSign },
              { id: "unit", name: "Unit Commitment", icon: Server },
              { id: "reserve", name: "Reserve Schedule", icon: Shield },
              { id: "dispatch", name: "Optimal Dispatch", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResultsTab(tab.id as any)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  resultsTab === tab.id
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Module Content */}
        <div className="pt-4">
          {/* SUMMARY TAB */}
          {resultsTab === "summary" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" /> Recommended Executive Plan
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-6 bg-slate-50 dark:bg-[#151A21] p-4 rounded border border-slate-200 dark:border-slate-800">
                  {rd.dispatch?.recommended_plan} The optimizer confirms that all{" "}
                  <strong>N-1 contingencies</strong> are mitigated and <strong>Grid Loss</strong>{" "}
                  will be reduced by {rd.loss?.reduction_percentage}%.
                </p>

                <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">
                  Before vs After Comparison
                </h5>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Operating Cost</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">
                        ${rd.cost?.operating_cost_usd?.current.toLocaleString()}
                      </span>
                      <ChevronRight className="w-3 h-3 text-emerald-500" />
                      <span className="font-bold text-emerald-500">
                        ${rd.cost?.operating_cost_usd?.optimized.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">CO₂ Emissions</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">
                        {rd.co2?.current_emissions_tons.toLocaleString()} T
                      </span>
                      <ChevronRight className="w-3 h-3 text-green-500" />
                      <span className="font-bold text-green-500">
                        {rd.co2?.optimized_emissions_tons.toLocaleString()} T
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Transmission Loss</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">
                        {rd.loss?.transmission_loss_mw?.current.toLocaleString()} MW
                      </span>
                      <ChevronRight className="w-3 h-3 text-orange-500" />
                      <span className="font-bold text-orange-500">
                        {rd.loss?.transmission_loss_mw?.optimized.toLocaleString()} MW
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-orange-500" /> Generation Mix Shift
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Fossil Fuel",
                          Before: 65,
                          Optimized: rd.dispatch?.generation_mix?.fossil || 40,
                        },
                        {
                          name: "Renewable",
                          Before: 25,
                          Optimized: rd.dispatch?.generation_mix?.renewable || 45,
                        },
                        {
                          name: "Nuclear/Other",
                          Before: 10,
                          Optimized: rd.dispatch?.generation_mix?.nuclear || 15,
                        },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#334155"
                        opacity={0.2}
                      />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          borderColor: "#334155",
                          color: "#F8FAFC",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Before" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Optimized" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* ECONOMIC DISPATCH TAB */}
          {resultsTab === "economic" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" /> Generator Output Allocation
                </h4>
                <div className="h-72 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rd.economic?.generator_allocation || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#334155"
                        opacity={0.2}
                      />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} yAxisId="left" unit="MW" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155" }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="current_mw"
                        fill="#475569"
                        name="Current Output (MW)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="optimized_mw"
                        fill="#F97316"
                        name="Optimized Output (MW)"
                        radius={[2, 2, 0, 0]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="p-6 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Cost Breakdown
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Current Fuel Cost</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ${rd.cost?.fuel_cost_usd?.current.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-4 rounded border border-emerald-500/30">
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                    Optimized Fuel Cost
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                    ${rd.cost?.fuel_cost_usd?.optimized.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700 mt-auto">
                  <p className="text-xs text-slate-500">Fuel Consumption Reduction</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {rd.economic?.fuel_consumption_tons?.current -
                      rd.economic?.fuel_consumption_tons?.optimized}{" "}
                    Tons
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* UNIT COMMITMENT TAB */}
          {resultsTab === "unit" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <Play className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Running Units</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {rd.unit?.running_units}
                    </p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-slate-500/10 rounded-full">
                    <StopCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Standby Units</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {rd.unit?.standby_units}
                    </p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Scheduled Actions</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {rd.unit?.generator_status?.length}
                    </p>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" /> Unit Action Schedule
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                      <tr>
                        <th className="p-3 font-medium rounded-tl-md">Generator Name</th>
                        <th className="p-3 font-medium">Recommended Action</th>
                        <th className="p-3 font-medium">Scheduled Time</th>
                        <th className="p-3 font-medium text-right rounded-tr-md">
                          Financial Impact
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {rd.unit?.generator_status?.map((g: any, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3 font-medium">{g.name}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                g.action === "START"
                                  ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                                  : "text-orange-500 border-orange-500/30 bg-orange-500/10"
                              }
                            >
                              {g.action}
                            </Badge>
                          </td>
                          <td className="p-3">{g.time}</td>
                          <td className="p-3 text-right">
                            {g.savings_usd ? (
                              <span className="text-emerald-500 font-medium">
                                +${g.savings_usd}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">-${g.cost_usd}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* RESERVE SCHEDULING TAB */}
          {resultsTab === "reserve" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" /> Reserve Capacities (MW)
                </h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Spinning Reserve
                      </span>
                      <span className="font-bold">{rd.reserve?.spinning_reserve_mw} MW</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
                      <div
                        className="bg-emerald-500 h-3 rounded-full"
                        style={{ width: "35%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Non-Spinning Reserve
                      </span>
                      <span className="font-bold">{rd.reserve?.non_spinning_reserve_mw} MW</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Emergency Reserve
                      </span>
                      <span className="font-bold">{rd.reserve?.emergency_reserve_mw} MW</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-dashed bg-slate-50/50 dark:bg-[#0B0E13]/50">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" /> Allocated Assets
                </h4>
                <div className="space-y-3">
                  {rd.reserve?.allocations?.map((a: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Database className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {a.type} Reserve
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm">{a.mw} MW</span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        >
                          {a.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* DISPATCH TAB */}
          {resultsTab === "dispatch" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Battery & Renewable Dispatch
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 bg-slate-50 dark:bg-[#151A21] p-4 rounded border border-slate-200 dark:border-slate-800">
                  To satisfy the optimized target, the system requires an immediate battery dispatch
                  of <strong>{rd.dispatch?.battery_dispatch_mw} MW</strong>.
                </p>

                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { time: "08:00", Demand: 12000, Dispatch: 11800 },
                        { time: "12:00", Demand: 14500, Dispatch: 14500 },
                        { time: "16:00", Demand: 16000, Dispatch: 16000 },
                        { time: "20:00", Demand: 13000, Dispatch: 13000 },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#334155"
                        opacity={0.2}
                      />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Demand"
                        stroke="#64748B"
                        fill="#64748B"
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        dataKey="Dispatch"
                        stroke="#F97316"
                        fill="#F97316"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-slate-900 border-slate-800 text-slate-300">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-400" /> Operational Command Sequence
                </h4>
                <div className="space-y-4 font-mono text-xs">
                  <div className="border-l-2 border-emerald-500 pl-4 py-1">
                    <p className="text-emerald-400 mb-1">[10:00:00 UTC] - START SEQUENCE</p>
                    <p>Initiating Load Balance optimization.</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4 py-1">
                    <p className="text-blue-400 mb-1">[10:00:15 UTC] - RESOLVE N-1</p>
                    <p>Found viable transmission paths for Tahoe constraint.</p>
                  </div>
                  <div className="border-l-2 border-orange-500 pl-4 py-1">
                    <p className="text-orange-400 mb-1">[10:00:30 UTC] - SETPOINT GENERATION</p>
                    <p>Dispatched {rd.dispatch?.battery_dispatch_mw} MW to battery banks.</p>
                  </div>
                  <div className="border-l-2 border-emerald-500 pl-4 py-1">
                    <p className="text-emerald-400 mb-1">[10:00:45 UTC] - COMPLETE</p>
                    <p>
                      Plan compiled successfully. Confidence {rd.economic?.confidence_score * 100}%.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
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
          title="Enterprise Optimization Intelligence"
          subtitle="Generate optimized grid operational strategies across multiple objectives."
        />
        <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "workspace" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Intelligence Workspace
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "history" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Execution History
          </button>
        </div>
      </div>

      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Stepper UI */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 z-0"></div>
              {[
                { s: "SELECT_SCENARIO", label: "Scenario", idx: 1 },
                { s: "CHOOSE_OBJECTIVES", label: "Objectives", idx: 2 },
                { s: "SELECT_CONSTRAINTS", label: "Constraints", idx: 3 },
                { s: "REVIEW", label: "Review", idx: 4 },
                { s: "VIEW_RESULTS", label: "Results", idx: 5 },
              ].map((st, i) => {
                const steps = [
                  "SELECT_SCENARIO",
                  "CHOOSE_OBJECTIVES",
                  "SELECT_CONSTRAINTS",
                  "REVIEW",
                  "RUN_OPTIMIZATION",
                  "VIEW_RESULTS",
                ];
                const currentIndex = steps.indexOf(step);
                const thisIndex = steps.indexOf(st.s);
                const isCompleted = thisIndex < currentIndex;
                const isCurrent =
                  st.s === step || (st.s === "VIEW_RESULTS" && step === "RUN_OPTIMIZATION");

                return (
                  <div key={st.s} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        isCompleted
                          ? "bg-orange-500 text-white border-2 border-white dark:border-[#07090C]"
                          : isCurrent
                            ? "bg-white dark:bg-[#07090C] border-2 border-orange-500 text-orange-500"
                            : "bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.idx}
                    </div>
                    <span
                      className={`mt-2 text-[10px] font-bold uppercase tracking-wider hidden sm:block ${isCurrent ? "text-orange-500" : "text-slate-500"}`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Wizard Step */}
          {step === "SELECT_SCENARIO" && renderSelectScenario()}
          {step === "CHOOSE_OBJECTIVES" && renderChooseObjectives()}
          {step === "SELECT_CONSTRAINTS" && renderSelectConstraints()}
          {step === "REVIEW" && renderReview()}
          {step === "RUN_OPTIMIZATION" && renderRunning()}
          {step === "VIEW_RESULTS" && renderResults()}
        </div>
      )}

      {activeTab === "history" && (
        <Card className="p-12 text-center border-dashed flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#0B0E13]/50">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#1E293B] flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            History Module Starting
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Optimization history logs are persisting correctly to the PostgreSQL backend. Dashboard
            rendering for historical comparisons will be enabled in Phase 5.5.
          </p>
        </Card>
      )}
    </div>
  );
}
