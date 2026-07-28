import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  Layers,
  FileText,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Copy,
  Upload,
  Download,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  User,
  Activity,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface Policy {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  priority: number;
  objective: string;
  weights: Record<string, number>;
  constraints: Record<string, any>;
  expected_outcome: string;
  ai_explanation: string;
  status: string;
  updated_at: string;
}

interface PolicyVersion {
  id: number;
  version_number: number;
  changelog: string;
  weights_json: Record<string, number>;
  constraints_json: Record<string, any>;
  created_at: string;
}

export default function PolicyBuilderWorkspace() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Designer Form States
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState(1);
  const [formObjective, setFormObjective] = useState("BALANCED");
  const [formWeights, setFormWeights] = useState<Record<string, number>>({});
  const [formConstraints, setFormConstraints] = useState<Record<string, any>>({});
  const [formOutcome, setFormOutcome] = useState("");
  const [formExplanation, setFormExplanation] = useState("");
  const [formChangelog, setFormChangelog] = useState("Manual update via builder.");

  // Import JSON State
  const [importJsonText, setImportJsonText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (selectedPolicy) {
      setFormName(selectedPolicy.name);
      setFormDesc(selectedPolicy.description || "");
      setFormPriority(selectedPolicy.priority || 1);
      setFormObjective(selectedPolicy.objective || "BALANCED");
      setFormWeights(selectedPolicy.weights || {});
      setFormConstraints(selectedPolicy.constraints || {});
      setFormOutcome(selectedPolicy.expected_outcome || "");
      setFormExplanation(selectedPolicy.ai_explanation || "");
      setFormChangelog("Configuration parameters manual update.");
      fetchVersions(selectedPolicy.id);
    }
  }, [selectedPolicy]);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/policies");
      setPolicies(res.data);
      if (res.data.length > 0 && !selectedPolicy) {
        setSelectedPolicy(res.data[0]);
      }
    } catch (err: any) {
      setError("Failed to fetch policies library.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (policyId: number) => {
    try {
      const res = await api.get(`/api/v1/policies/${policyId}/versions`);
      setVersions(res.data);
    } catch (err: any) {
      console.error("Error loading version history:", err);
    }
  };

  const handleClonePolicy = async (policyId: number) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/policies/${policyId}/clone`);
      setPolicies((prev) => [...prev, res.data]);
      setSelectedPolicy(res.data);
      setSuccess(`Duplicated policy cloned successfully as draft.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Failed to clone policy parameters.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePolicyChanges = async () => {
    if (!selectedPolicy) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/policies/${selectedPolicy.id}`, {
        name: formName,
        description: formDesc,
        priority: formPriority,
        objective: formObjective,
        weights: formWeights,
        constraints: formConstraints,
        expected_outcome: formOutcome,
        ai_explanation: formExplanation,
        changelog: formChangelog,
      });
      setPolicies((prev) => prev.map((p) => (p.id === selectedPolicy.id ? res.data : p)));
      setSelectedPolicy(res.data);
      setSuccess("Custom policy changes successfully compiled and version history logged.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Validation Error: Objective weight coefficients must sum to 1.0."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Lifecycle state actions
  const handleTransitionState = async (policyId: number, transition: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/policies/${policyId}/${transition}`);
      setPolicies((prev) => prev.map((p) => (p.id === policyId ? res.data : p)));
      setSelectedPolicy(res.data);
      setSuccess(`Lifecycle state successfully moved to: ${res.data.status}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Governance authorization check failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (versionId: number) => {
    if (!selectedPolicy) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(
        `/api/v1/policies/${selectedPolicy.id}/versions/${versionId}/rollback`
      );
      setPolicies((prev) => prev.map((p) => (p.id === selectedPolicy.id ? res.data : p)));
      setSelectedPolicy(res.data);
      setSuccess(`Parameter sets successfully rolled back.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Failed to execute version rollback.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportJSON = (policy: Policy) => {
    const configString = JSON.stringify(
      {
        name: policy.name,
        description: policy.description,
        priority: policy.priority,
        objective: policy.objective,
        weights: policy.weights,
        constraints: policy.constraints,
        expected_outcome: policy.expected_outcome,
        ai_explanation: policy.ai_explanation,
      },
      null,
      2
    );

    const blob = new Blob([configString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${policy.name.replace(/\s+/g, "_").toLowerCase()}_policy_config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async () => {
    if (!importJsonText.trim()) return;
    setError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      const res = await api.post("/api/v1/policies/import", { data: parsed });
      setPolicies((prev) => [...prev, res.data]);
      setSelectedPolicy(res.data);
      setShowImportModal(false);
      setImportJsonText("");
      setSuccess("Custom policy successfully imported as draft.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "JSON Import failed. Verify weight sums and format keys."
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-0.5 bg-emerald-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase">
            active
          </span>
        );
      case "published":
        return (
          <span className="px-2 py-0.5 bg-sky-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase">
            published
          </span>
        );
      case "under_review":
        return (
          <span className="px-2 py-0.5 bg-orange-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase">
            review
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-0.5 bg-purple-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase">
            approved
          </span>
        );
      case "archived":
        return (
          <span className="px-2 py-0.5 bg-slate-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase">
            archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-mono text-[9px] font-bold rounded-[2px] uppercase">
            draft
          </span>
        );
    }
  };

  // Validator warnings client-side
  const sumWeights = Object.values(formWeights).reduce((a, b) => a + b, 0);
  const isWeightSumValid = Math.abs(sumWeights - 1.0) < 0.01;

  return (
    <div className="space-y-6 select-text font-sans">
      {/* Alert toasts logs */}
      {error && (
        <div className="p-3 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 border border-emerald-500/25 bg-emerald-500/10 rounded-[3px] text-xs text-emerald-500 font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Header section */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 gap-4 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Enterprise Policy Builder & Lifecycle
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" /> IMPORT POLICY
          </button>
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="p-1.5 rounded-[2px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* Main Grid: Policy Drawer (Left) vs Visual designer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Policy Registry Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Operational Registry
          </h3>

          <div className="space-y-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className={`p-3 border rounded-[4px] cursor-pointer transition-all flex flex-col justify-between space-y-2.5 relative ${
                  selectedPolicy?.id === policy.id
                    ? "border-orange-500 bg-orange-500/5 shadow-orange-500/5 shadow"
                    : "border-slate-200 dark:border-[#1E293B] hover:border-slate-400 bg-white dark:bg-[#07090C]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-500">
                    Rank: P-{policy.priority}
                  </span>
                  {getStatusBadge(policy.status)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    {policy.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {policy.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#2A313C]/40 flex justify-between items-center text-[10px] font-mono">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClonePolicy(policy.id);
                    }}
                    className="text-slate-400 hover:text-orange-500 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Clone
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportJSON(policy);
                    }}
                    className="text-slate-400 hover:text-orange-500 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Policy Editor & Governance */}
        {selectedPolicy && (
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Editor Form */}
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-5">
              <div className="border-b border-[#2A313C]/40 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-orange-500" /> Visual Policy Designer
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Status: {selectedPolicy.status.toUpperCase()}
                </span>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Policy Name:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Priority Rank:
                  </label>
                  <input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value))}
                    className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Description:
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Sliders for Dynamic Weights tuning */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
                  Configure Weight Vectors
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formWeights).map(([k, val]) => (
                    <div
                      key={k}
                      className="p-3 border border-[#2A313C]/40 bg-[#151A21]/20 rounded space-y-1 font-mono text-xs"
                    >
                      <div className="flex justify-between text-slate-400">
                        <span className="capitalize">{k} priority:</span>
                        <span>{Math.round(val * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={val}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          setFormWeights((prev) => ({ ...prev, [k]: parsed }));
                        }}
                        className="w-full accent-orange-500 cursor-pointer h-1"
                      />
                    </div>
                  ))}
                </div>
                {!isWeightSumValid && (
                  <p className="text-[10px] font-mono text-orange-500 bg-orange-500/10 p-2 rounded">
                    ⚠️ Validation Conflict: Sum of optimization priority coefficients must equal
                    exactly 1.0 (currently {Math.round(sumWeights * 100)}%).
                  </p>
                )}
              </div>

              {/* Configure Constraints */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
                  Configure Constraint Limits
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(formConstraints).map(([k, val]) => (
                    <div key={k} className="space-y-1 font-mono text-xs">
                      <label className="capitalize text-[10px] text-slate-500 block">
                        {k.replace("_pct", "")} Limit (%):
                      </label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          setFormConstraints((prev) => ({ ...prev, [k]: parsed }));
                        }}
                        className="w-full bg-[#151A21] border border-[#2A313C] rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Outcome Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Expected Outcome:
                  </label>
                  <textarea
                    value={formOutcome}
                    onChange={(e) => setFormOutcome(e.target.value)}
                    rows={2}
                    className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Co-pilot AI Explanation:
                  </label>
                  <textarea
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    rows={2}
                    className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none"
                  />
                </div>
              </div>

              {/* Changelog field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Change Log Notes:
                </label>
                <input
                  type="text"
                  value={formChangelog}
                  onChange={(e) => setFormChangelog(e.target.value)}
                  className="w-full bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-250 focus:outline-none"
                />
              </div>

              {/* Save Trigger */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSavePolicyChanges}
                  disabled={actionLoading || !isWeightSumValid}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs rounded-[2px] transition-colors"
                >
                  {actionLoading ? "Compiling..." : "COMPILE & SAVE POLICY"}
                </button>
              </div>
            </div>

            {/* Governance Actions Panel */}
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2">
                Policy Governance & Approval Workflows
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPolicy.status === "draft" && (
                  <button
                    onClick={() => handleTransitionState(selectedPolicy.id, "submit-review")}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-[2px]"
                  >
                    SUBMIT FOR REVIEW
                  </button>
                )}

                {selectedPolicy.status === "under_review" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTransitionState(selectedPolicy.id, "approve")}
                      className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-[2px]"
                    >
                      APPROVE POLICY
                    </button>
                    <button
                      onClick={() => handleTransitionState(selectedPolicy.id, "archive")}
                      className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px]"
                    >
                      REJECT & ARCHIVE
                    </button>
                  </div>
                )}

                {selectedPolicy.status === "approved" && (
                  <button
                    onClick={() => handleTransitionState(selectedPolicy.id, "publish")}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-[2px]"
                  >
                    PUBLISH POLICY
                  </button>
                )}

                {selectedPolicy.status === "published" && (
                  <button
                    onClick={() => handleTransitionState(selectedPolicy.id, "archive")}
                    className="px-3 py-1.5 bg-slate-650 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700"
                  >
                    ARCHIVE POLICY
                  </button>
                )}
              </div>
            </div>

            {/* Version control list & Rollback */}
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2">
                Version History (Configuration Revisions)
              </h3>

              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between items-center p-2.5 border border-[#2A313C]/45 bg-[#151A21]/20 rounded text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-350">Version v{v.version_number}</span>
                      <span className="text-[10px] text-slate-500 block">"{v.changelog}"</span>
                    </div>
                    <button
                      onClick={() => handleRollback(v.id)}
                      className="px-2.5 py-1 border border-orange-500/30 hover:bg-orange-500/10 text-orange-500 rounded font-semibold text-[10px] flex items-center gap-1 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Rollback
                    </button>
                  </div>
                ))}

                {versions.length === 0 && (
                  <p className="text-[10px] text-slate-500 font-mono text-center">
                    No registered versions logged for this policy.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full border border-[#2A313C] bg-[#151A21] p-6 rounded-[4px] space-y-4">
            <h3 className="text-xs font-bold text-orange-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Import Custom Policy Config JSON
            </h3>

            <p className="text-xs text-slate-405 leading-relaxed">
              Paste a custom GPO configuration JSON structure. Optimization priority weights must
              sum to exactly 1.0 (100%).
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`{\n  "name": "Custom Green Peak Shaving",\n  "description": "Minimize peak load costs using clean arbitrage.",\n  "priority": 5,\n  "objective": "PEAK_SHAVING",\n  "weights": {\n    "cost": 0.40,\n    "carbon": 0.30,\n    "stability": 0.20,\n    "reliability": 0.10\n  },\n  "constraints": {\n    "voltage_deviation_pct": 5.0,\n    "thermal_limit_pct": 90.0,\n    "min_soc_pct": 30.0\n  }\n}`}
              rows={12}
              className="w-full bg-[#0B0E13] border border-[#2A313C] rounded p-3 text-[10.5px] font-mono text-slate-200 focus:outline-none"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportJsonText("");
                }}
                className="px-3 py-1.5 border border-[#2A313C] hover:border-slate-550 rounded-[2px] font-semibold text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJSON}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-[2px] transition-colors"
              >
                Validate & Import Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
