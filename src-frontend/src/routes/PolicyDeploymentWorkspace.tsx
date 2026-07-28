import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Play,
  RotateCcw,
  User,
  History,
  FileText,
  Search,
  Check,
  X,
  Send,
  Loader2,
} from "lucide-react";

interface Policy {
  id: number;
  name: string;
  category: string;
  status: string;
  is_active: boolean;
  priority: number;
}

interface DeploymentRecord {
  id: number;
  policy_id: number;
  policy_name: string;
  version: string;
  action: string;
  user_email: string;
  status: string;
  created_at: string;
  comments: string;
}

interface AuditRecord {
  id: number;
  policy_name: string;
  action: string;
  user_email: string;
  timestamp: string;
  previous_status: string;
  new_status: string;
  comments: string;
}

export default function PolicyDeploymentWorkspace() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [history, setHistory] = useState<DeploymentRecord[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter
  const [auditQuery, setAuditQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  // Workflow Dialog comment
  const [comments, setComments] = useState("");

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);
  const activePolicy = policies.find((p) => p.is_active);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pRes = await api.get("/api/v1/policies");
      const fetchedItems = pRes.data?.items || pRes.data || [];
      setPolicies(Array.isArray(fetchedItems) ? fetchedItems : []);

      if (fetchedItems.length > 0) {
        setSelectedPolicyId(fetchedItems[0].id);
      }

      const hRes = await api.get("/api/v1/policies/deployments/history");
      setHistory(hRes.data?.data || hRes.data || []);

      const aRes = await api.get("/api/v1/policies/deployments/audit");
      setAudits(aRes.data?.data || aRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to connect to grid deployment governance services.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedPolicyId) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/v1/policies/${selectedPolicyId}/request-approval`, { comments });
      setSuccess("Approval request successfully routed to control supervisors.");
      setComments("");
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to initiate approval workflow.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!selectedPolicyId) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/v1/policies/${selectedPolicyId}/approve`, { action, comments });
      setSuccess(`Policy workflow completed: ${action === "approve" ? "APPROVED" : "REJECTED"}.`);
      setComments("");
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update workflow state.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedPolicyId) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/v1/policies/${selectedPolicyId}/deploy`, { comments });
      setSuccess("Policy successfully activated and dispatched across grid transformers.");
      setComments("");
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Grid controller rejected deployment check.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/v1/policies/rollback");
      setSuccess(
        res.data?.data?.message || res.data?.message || "Rollback completed successfully."
      );
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Rollback dispatch aborted.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "deployed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "approved":
      case "ready":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "rejected":
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredAudits = audits.filter((a) => {
    const term = auditQuery.toLowerCase();
    return (
      a.policy_name?.toLowerCase().includes(term) ||
      a.action?.toLowerCase().includes(term) ||
      a.user_email?.toLowerCase().includes(term) ||
      a.comments?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 select-text font-sans">
      {/* Toast Alert logs */}
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
            Operational Governance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Grid Policy Deployment Workspace
          </h1>
        </div>

        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="p-1.5 rounded-[2px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors self-end sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </section>

      {/* Active Grid Policy Status Panel */}
      <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-slate-550 block uppercase">
            Active Grid Dispatch Profile
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase">
              {activePolicy ? activePolicy.name : "None Deployed"}
            </h2>
            <span className="px-2 py-0.5 border text-[9px] font-mono rounded-[3px] bg-emerald-500/20 text-emerald-450 border-emerald-500/30">
              DEPLOYED ACTIVE
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleRollback}
            disabled={actionLoading || !activePolicy}
            className="w-full md:w-auto px-4 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 font-mono font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 animate-spin-reverse" /> Rollback Current Policy
          </button>
        </div>
      </div>

      {/* Main Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column 2: Governance Workflows */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-5">
            <div className="border-b border-[#2A313C]/40 pb-3 flex justify-between items-center gap-2">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" /> Lifecycle & Approval governance
              </h3>

              <select
                value={selectedPolicyId || ""}
                onChange={(e) => setSelectedPolicyId(Number(e.target.value))}
                className="bg-[#151A21] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none max-w-xs font-mono"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.status.toUpperCase()}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPolicy ? (
              <div className="space-y-6">
                {/* Approval Step Workflow Visualizer */}
                <div className="p-4 border border-slate-800 bg-[#0B0E14] rounded font-mono text-xs space-y-4">
                  <span className="text-[9px] text-slate-550 uppercase tracking-widest block">
                    Approval Workflow Timeline
                  </span>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-2 border border-slate-800 bg-[#161C24]/30 rounded text-slate-300">
                      <span className="text-slate-550 block uppercase">Draft</span>
                      <span className="font-bold block mt-1">v1.0.0</span>
                    </div>
                    <div
                      className={`p-2 border rounded ${selectedPolicy.status === "pending" ? "border-yellow-500 bg-yellow-500/5 text-yellow-400" : "border-slate-800 bg-[#161C24]/30 text-slate-550"}`}
                    >
                      <span className="block uppercase">Supervisor Review</span>
                      <span className="font-bold block mt-1">Pending</span>
                    </div>
                    <div
                      className={`p-2 border rounded ${["approved", "ready"].includes(selectedPolicy.status) ? "border-purple-500 bg-purple-500/5 text-purple-400" : "border-slate-800 bg-[#161C24]/30 text-slate-555"}`}
                    >
                      <span className="block uppercase">Approved</span>
                      <span className="font-bold block mt-1">Ready</span>
                    </div>
                    <div
                      className={`p-2 border rounded ${selectedPolicy.status === "active" ? "border-emerald-500 bg-emerald-500/5 text-emerald-450" : "border-slate-800 bg-[#161C24]/30 text-slate-555"}`}
                    >
                      <span className="block uppercase">Grid Active</span>
                      <span className="font-bold block mt-1">Deployed</span>
                    </div>
                  </div>
                </div>

                {/* Selected policy info card */}
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 border border-slate-850 bg-[#161C24]/20 rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-305">{selectedPolicy.name}</span>
                      <span
                        className={`px-2 py-0.5 border text-[9px] font-bold rounded-[3px] uppercase ${getStatusColor(selectedPolicy.status)}`}
                      >
                        {selectedPolicy.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Category: {selectedPolicy.category} | Priority: P-{selectedPolicy.priority}
                    </p>
                  </div>

                  {/* Form & Comments */}
                  <div className="space-y-2">
                    <label className="block text-[9px] text-slate-550 uppercase tracking-widest">
                      Workflow Notes & Comments:
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add supervisor notes, review feedback, or dispatch codes..."
                      className="w-full h-20 bg-[#151A21] border border-[#2A313C] rounded p-2.5 text-xs text-slate-300 focus:outline-none resize-none font-mono"
                    />
                  </div>

                  {/* Action triggers based on status */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                    {/* Submit Draft */}
                    {(selectedPolicy.status === "draft" ||
                      selectedPolicy.status === "rejected") && (
                      <button
                        onClick={handleRequestApproval}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-[2px] font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Request supervisor review
                      </button>
                    )}

                    {/* Approve / Reject (Supervisor only - simulated check) */}
                    {selectedPolicy.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApproveReject("approve")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-455 border border-emerald-500/30 rounded-[2px] font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> APPROVE POLICY
                        </button>
                        <button
                          onClick={() => handleApproveReject("reject")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-[2px] font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> REJECT POLICY
                        </button>
                      </>
                    )}

                    {/* Deploy Approved policy */}
                    {(selectedPolicy.status === "approved" ||
                      selectedPolicy.status === "ready" ||
                      selectedPolicy.status === "published" ||
                      selectedPolicy.status === "active") && (
                      <button
                        onClick={handleDeploy}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-[2px] font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" /> DISPATCH TO GRID
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-mono text-xs">
                No policy items configured.
              </div>
            )}
          </div>

          {/* Audit Trail Section */}
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
            <div className="border-b border-[#2A313C]/40 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" /> Audit trail log
              </h3>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-550" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  className="w-full bg-[#151A21] border border-[#2A313C] rounded pl-8 pr-3 py-1 text-xs text-slate-300 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full border-collapse text-left font-mono text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Policy</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">User</th>
                    <th className="pb-2">Workflow states</th>
                    <th className="pb-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((a) => (
                    <tr key={a.id} className="border-b border-slate-800/40 hover:bg-slate-500/5">
                      <td className="py-2 text-slate-500">
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 text-slate-300 font-bold">{a.policy_name}</td>
                      <td className="py-2 text-purple-400">{a.action}</td>
                      <td className="py-2 text-slate-500">{a.user_email}</td>
                      <td className="py-2 text-slate-300">
                        <span className="text-slate-500">{a.previous_status}</span> ➔{" "}
                        <span className="text-slate-300 font-bold">{a.new_status}</span>
                      </td>
                      <td
                        className="py-2 text-slate-400 italic max-w-xs truncate"
                        title={a.comments}
                      >
                        {a.comments}
                      </td>
                    </tr>
                  ))}
                  {filteredAudits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500">
                        No audit records match the query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column 1: History Timeline */}
        <div className="space-y-6">
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-400" /> Deployment History Timeline
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 border border-slate-800 bg-[#0F131A]/40 rounded-[3px] space-y-2 relative font-mono text-[10.5px]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-505">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-[2px] text-[8px] font-bold uppercase">
                      {h.action}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-slate-202 block text-xs">{h.policy_name}</strong>
                    <span className="text-slate-500 block font-bold">Operator: {h.user_email}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] border-t border-[#2A313C]/30 pt-1.5">
                    <span className="text-slate-405">Version: {h.version}</span>
                    <span
                      className={`font-bold ${h.status === "success" ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {h.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  No historical records loaded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
