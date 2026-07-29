import React, { useState, useEffect } from "react";
import {
  Play,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  BellRing,
  Settings,
  Edit2,
  Trash2,
} from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AIAutomationWorkspace() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Workflow State
  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfStatus, setWfStatus] = useState<string | null>(null);

  const fetchAutomationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wfRes, tRes, aRes, appRes, audRes] = await Promise.all([
        copilotApi.getWorkflows(),
        copilotApi.getTasks(),
        copilotApi.getAlerts(),
        copilotApi.getApprovals(),
        copilotApi.getAuditTrail(),
      ]);
      setWorkflows(wfRes);
      setTasks(tRes);
      setAlerts(aRes);
      setApprovals(appRes);
      setAudits(audRes);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load AI Automation registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName || !wfDesc) return;
    try {
      const res = await copilotApi.createWorkflow(wfName, wfDesc);
      setWfStatus(`Successfully initiated workflow: ${res.name} (Status: ${res.status})`);
      setWfName("");
      setWfDesc("");
      // Refresh workflows list
      const wfRes = await copilotApi.getWorkflows();
      setWorkflows(wfRes);

      // Add a new approval to the local state
      const newApproval = {
        id: `app-${Date.now()}`,
        task_id: `wf-task-${Date.now()}`,
        action_suggested: `Approve workflow: ${res.name || wfName}`,
        status: "Pending",
      };
      setApprovals((prev) => [newApproval, ...prev]);
    } catch (err) {
      console.error(err);
      setWfStatus("Failed to initiate workflow.");
    }
  };

  const handleApproval = async (taskId: string, action: string) => {
    // Optimistically update local state to reflect the approval action
    setApprovals((prev) =>
      prev.map((app) =>
        app.task_id === taskId
          ? { ...app, status: action === "Approve" ? "Approved" : "Rejected" }
          : app
      )
    );

    try {
      await copilotApi.processApproval(taskId, action, "Processed via AI Automation Center queue.");
    } catch (err) {
      console.error("API Error during approval:", err);
      // Optional: Revert state on failure if needed
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleEditWorkflow = (w: any) => {
    setWfName(w.name);
    setWfDesc(w.description || "");
    handleDeleteWorkflow(w.id);
  };

  if (loading) return <LoadingState message="Connecting to AI Automation Center..." />;
  if (error) return <ErrorState message={error} retry={fetchAutomationData} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          AI ASSISTED AUTOMATION
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Automation & Workflow Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Operator dashboard to verify recommendations, schedule maintenance stages, and monitor AI
          dispatches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workflow engine & Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Workflows */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-500" />
              Active Workflows Engine
            </h3>

            <div className="space-y-3">
              {workflows.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-255 dark:border-[#2A313C] rounded-[2px] flex justify-between items-center bg-slate-50/50 dark:bg-[#11161D]/50"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{w.name}</span>
                    <span className="text-[10px] text-slate-400">ID: {w.id}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${w.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}
                    >
                      {w.status} ({w.progress}%)
                    </span>
                    <button
                      onClick={() => handleEditWorkflow(w)}
                      className="text-slate-400 hover:text-blue-500 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(w.id)}
                      className="text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Workflow Builder Form */}
            <form
              onSubmit={handleCreateWorkflow}
              className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2A313C] space-y-3"
            >
              <span className="block font-bold">Initiate New Workflow</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Workflow Name (e.g. Sierra Insulator Wash)"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Operational description details"
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] font-bold transition"
              >
                Launch Workflow
              </button>

              {wfStatus && (
                <div className="p-3 border border-emerald-500/10 bg-emerald-500/5 text-emerald-500 rounded-[2px] text-[10px]">
                  {wfStatus}
                </div>
              )}
            </form>
          </div>

          {/* Pending Approval Queue */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              Human-in-the-Loop Approvals Queue
            </h3>

            <div className="space-y-3">
              {approvals.map((app, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 dark:border-[#2A313C] rounded-[2px] space-y-3 bg-slate-50/50 dark:bg-[#11161D]/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-[#F8FAFC]">
                        Task Ref: {app.task_id}
                      </span>
                      <span className="text-slate-500 mt-1 block font-sans">
                        {app.action_suggested}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-bold uppercase tracking-wider text-[9px]">
                      {app.status}
                    </span>
                  </div>

                  {app.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproval(app.task_id, "Approve")}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2px] font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Action
                      </button>
                      <button
                        onClick={() => handleApproval(app.task_id, "Reject")}
                        className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-[2px] font-bold transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Alerts Center & Active tasks */}
        <div className="lg:col-span-1 space-y-6">
          {/* Alerts Center */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-500" />
              Real-time Alerts Center
            </h3>

            <div className="space-y-3.5">
              {alerts.map((al, idx) => (
                <div
                  key={idx}
                  className="p-3 border-l-2 border-yellow-500 bg-yellow-500/5 rounded-[2px] space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{al.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    <strong>Recommended Action:</strong> {al.recommended_action}
                  </p>
                  <span className="text-[9px] text-slate-400 block">
                    {new Date(al.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Tasks */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-400" />
              Suggested Tasks Registry
            </h3>

            <div className="space-y-3">
              {tasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-100 dark:border-[#2A313C] rounded-[2px] bg-slate-50/20 dark:bg-[#11161D]/20"
                >
                  <span className="font-bold block">{t.title}</span>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                    <span>Team: {t.assigned_team}</span>
                    <span className="font-bold text-emerald-500">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
