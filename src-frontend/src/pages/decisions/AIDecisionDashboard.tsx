import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RecommendationCard } from "@/components/decisions/RecommendationCard";
import { ExplainableAIPanel } from "@/components/decisions/ExplainableAIPanel";
import { RiskOpportunityDashboards } from "@/components/decisions/RiskOpportunityDashboards";
import api from "@/api/axios";
import { BrainCircuit, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIDecisionDashboard() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/decision");
      setDecisions(res.data);
      if (res.data.length > 0) {
        setSelectedDecision(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load decisions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.post("/api/v1/decision/analyse");
      await loadDecisions();
    } catch (err) {
      console.error("Failed to trigger analysis", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Enterprise AI Decision Engine"
          description="Autonomous multi-domain analysis transforming forecasting intelligence into explainable operational recommendations."
        />
        <Button
          onClick={triggerAnalysis}
          disabled={analyzing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {analyzing ? "Synthesizing Forecasts..." : "Run AI Analysis"}
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="h-[300px] bg-slate-50 dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] border-dashed rounded-xl flex flex-col items-center justify-center text-slate-500">
          <BrainCircuit className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-900 dark:text-white">
            No active AI recommendations
          </p>
          <p className="text-sm mt-1">
            Run an analysis across all forecasting models to generate intelligence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: List of Decisions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Recommendations
              </h3>
              <span className="bg-indigo-500/10 text-indigo-500 text-xs font-bold px-2 py-1 rounded">
                {decisions.length} Pending
              </span>
            </div>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {decisions.map((d) => (
                <RecommendationCard
                  key={d.id}
                  decision={d}
                  isSelected={selectedDecision?.id === d.id}
                  onSelect={setSelectedDecision}
                />
              ))}
            </div>
          </div>

          {/* Middle Column: Explainable AI Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-xl shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                  <BrainCircuit className="w-4 h-4 mr-2 text-indigo-500" />
                  Explainable AI Sandbox
                </h3>
              </div>
              <div className="p-6">
                {selectedDecision ? (
                  <ExplainableAIPanel
                    explanation={selectedDecision.explanation}
                    metadata={selectedDecision.metadata}
                  />
                ) : (
                  <p className="text-slate-500 text-sm">
                    Select a recommendation to view AI reasoning.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Risk & Opportunity */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-xl shadow-sm h-full">
              <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                  Impact Analytics
                </h3>
              </div>
              <div className="p-6">
                {selectedDecision ? (
                  <RiskOpportunityDashboards
                    risk={selectedDecision.risk}
                    opportunities={selectedDecision.opportunities}
                  />
                ) : (
                  <p className="text-slate-500 text-sm">
                    Select a recommendation to view impact metrics.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
