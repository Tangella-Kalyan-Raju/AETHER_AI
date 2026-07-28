import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Play, FileDown, Search, Plus, Layers, AlertCircle, Cpu } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  scenario_type: string;
  severity: string;
  version: number;
  events?: any[];
}

const ScenarioLibrary: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await api.get("/api/v1/scenarios/");
      setScenarios(response.data);
    } catch (error) {
      console.error("Failed to fetch scenarios", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "Medium":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClone = (scenario: Scenario) => {
    navigate("/scenario-builder", { state: { scenario } });
  };

  const handleExport = (scenario: Scenario) => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `scenario_${scenario.name.toLowerCase().replace(/\s+/g, "_")}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
          Enterprise Scenario Library
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Centralized repository of predefined grid operational events and simulation scenarios.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenarios by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A]/50 transition-colors"
          />
        </div>
        <button
          onClick={() => navigate("/scenario-builder")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white font-medium rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Custom Scenario
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm font-mono py-8 text-center">
          Loading scenarios...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] hover:border-[#FF7A1A]/40 transition-all hover:shadow-md h-full group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {scenario.name}
                  </h3>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C]/60 shrink-0">
                    v{scenario.version}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 min-h-[48px]">
                  {scenario.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    {scenario.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider ${getSeverityBadge(scenario.severity)}`}
                  >
                    {scenario.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {scenario.scenario_type}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#2A313C]/40">
                <button
                  onClick={() => handleEditClone(scenario)}
                  className="flex-1 py-1.5 text-xs font-semibold text-center rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FF7A1A]/10 hover:text-[#FF7A1A] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all"
                >
                  Edit Clone
                </button>
                <button
                  onClick={() => handleExport(scenario)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioLibrary;
