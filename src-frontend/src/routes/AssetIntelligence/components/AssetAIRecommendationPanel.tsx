import React, { useState, useEffect } from "react";
import { BrainCircuit, Check, X, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { assetApi } from "../../../api/assets";

interface AIInsight {
  id: number;
  recommendation: string;
  reasoning: {
    why_health_changed: string;
    why_failure_probability_increased: string;
    operator_actions: string;
    operational_impact: string;
  };
  root_cause: string;
  failure_explanation: string;
  maintenance_suggestion: string;
  operational_advice: string;
  replacement_recommendation: string;
  spare_part_recommendation: string;
  confidence_score: number;
  priority: string;
  expected_impact: string;
}

interface AssetAIRecommendationPanelProps {
  assetId: number;
}

export function AssetAIRecommendationPanel({ assetId }: AssetAIRecommendationPanelProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      const data = await assetApi.getAIInsights(assetId);
      const hist = await assetApi.getRecommendationsHistory(assetId);
      setInsight(Object.keys(data).length > 0 ? data : null);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to load AI insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, [assetId]);

  const handleAction = async (action: "Approved" | "Dismissed") => {
    if (!insight) return;
    try {
      setSubmitting(true);
      await assetApi.submitRecommendationAction(assetId, action, notes);
      setNotes("");
      const hist = await assetApi.getRecommendationsHistory(assetId);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to submit recommendation action:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px]">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mr-2" />
        <span className="text-xs font-mono text-slate-500">Querying AI decision nodes...</span>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm text-center font-mono text-xs text-slate-500">
        No active AI recommendations recorded for this grid component.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-5 select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A313C]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            AI Recommendation & Explanations
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 border border-purple-500/20 bg-purple-500/10 text-purple-500 rounded-[4px] font-mono text-[9px] uppercase tracking-wider">
            Confidence: {(insight.confidence_score * 100).toFixed(0)}%
          </span>
          <span
            className={`px-2 py-0.5 border rounded-[4px] font-mono text-[9px] uppercase tracking-wider ${
              insight.priority.toLowerCase() === "critical"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                : insight.priority.toLowerCase() === "high"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                  : "border-slate-250 bg-slate-50 dark:bg-[#11161D] text-slate-700 dark:text-slate-350"
            }`}
          >
            {insight.priority} Priority
          </span>
        </div>
      </div>

      {/* Main Recommendation text */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-[4px] space-y-2">
        <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          RECOMMENDED ACTION
        </h4>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
          {insight.recommendation}
        </p>
      </div>

      {/* Explainable Reasoning */}
      {insight.reasoning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="border border-slate-100 dark:border-[#2A313C] rounded-[4px] p-3 space-y-1 bg-slate-50/50 dark:bg-[#1c2431]/20">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Health Score Change Drivers
            </span>
            <p className="text-slate-800 dark:text-slate-300">
              {insight.reasoning.why_health_changed}
            </p>
          </div>

          <div className="border border-slate-100 dark:border-[#2A313C] rounded-[4px] p-3 space-y-1 bg-slate-50/50 dark:bg-[#1c2431]/20">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Failure Risk Drivers
            </span>
            <p className="text-slate-800 dark:text-slate-300">
              {insight.reasoning.why_failure_probability_increased}
            </p>
          </div>

          <div className="border border-slate-100 dark:border-[#2A313C] rounded-[4px] p-3 space-y-1 bg-slate-50/50 dark:bg-[#1c2431]/20">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Operator Suggested Actions
            </span>
            <p className="text-slate-800 dark:text-slate-300">
              {insight.reasoning.operator_actions}
            </p>
          </div>

          <div className="border border-slate-100 dark:border-[#2A313C] rounded-[4px] p-3 space-y-1 bg-slate-50/50 dark:bg-[#1c2431]/20">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Expected Operational Impact
            </span>
            <p className="text-slate-800 dark:text-slate-300">
              {insight.reasoning.operational_impact}
            </p>
          </div>
        </div>
      )}

      {/* Diagnostics Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Root Cause Analysis
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">{insight.root_cause || "—"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Failure Explanation
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">
              {insight.failure_explanation || "—"}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Maintenance Suggestions
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">
              {insight.maintenance_suggestion || "—"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Operational Advice
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">
              {insight.operational_advice || "—"}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Replacement Suggestion
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">
              {insight.replacement_recommendation || "—"}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Spare Parts Recommended
            </span>
            <p className="text-slate-800 dark:text-slate-300 mt-0.5">
              {insight.spare_part_recommendation || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Operator Decision Action Center */}
      <div className="pt-4 border-t border-slate-100 dark:border-[#2A313C] space-y-3">
        <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Operator Verification Control Panel
        </h4>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Add validation notes or inspection comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleAction("Dismissed")}
              disabled={submitting}
              className="px-3 py-2 border border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-mono text-xs rounded-[4px] transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
            <button
              onClick={() => handleAction("Approved")}
              disabled={submitting}
              className="px-3 py-2 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 font-mono text-xs rounded-[4px] transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Action
            </button>
          </div>
        </div>
      </div>

      {/* Operator Verification Audit Trail */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-[#2A313C] space-y-3 font-mono text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            Decision Audit Trail History
          </h4>
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                className={`p-2.5 rounded-[4px] border ${
                  h.action_taken === "Approved"
                    ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-450"
                    : h.action_taken === "Dismissed"
                      ? "border-rose-500/10 bg-rose-500/5 text-rose-600 dark:text-rose-450"
                      : "border-slate-100 bg-slate-50 dark:bg-[#11161D] text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[10px] mb-1">
                  <span>Action: {h.action_taken}</span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{h.recommendation}</p>
                {h.operator_notes && (
                  <p className="mt-1 font-bold text-[9px] text-slate-700 dark:text-slate-300">
                    Notes: {h.operator_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
