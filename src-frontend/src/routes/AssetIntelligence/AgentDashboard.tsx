import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Brain,
  Cpu,
  Clock,
  Send,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Activity,
} from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AgentDashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [dash, setDash] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat/Planner state
  const [query, setQuery] = useState("");
  const [chatResult, setChatResult] = useState<any | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAgentWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agRes, tRes, hRes, mRes, dRes] = await Promise.all([
        copilotApi.getAgents(),
        copilotApi.getAgentTasks(),
        copilotApi.getAgentsHistory(),
        copilotApi.getAgentsMonitoring(),
        copilotApi.getAgentsDashboard(),
      ]);
      setAgents(agRes);
      setTasks(tRes);
      setHistory(hRes);
      setMetrics(mRes);
      setDash(dRes);
    } catch (err: any) {
      console.error(err);
      setError("Failed to initialize Autonomous Multi-Agent Workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentWorkspaceData();
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    try {
      setChatLoading(true);
      setChatResult(null);
      const res = await copilotApi.runAgentChat(query);
      setChatResult(res);
      setQuery("");
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      await copilotApi.approveAgentTask(taskId);
      fetchAgentWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingState message="Instantiating Specialized Autonomous Agents..." />;
  if (error || !dash) return <ErrorState message={error || ""} retry={fetchAgentWorkspaceData} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          MULTI-AGENT INTELLIGENCE
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Autonomous Agents Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Coordinate specialized operational agents, trace planner breakdowns, and audit consensus
          recommendations.
        </p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((ag, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{ag.name}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                {ag.role}
              </p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#2A313C]">
              <span className="text-[9px] text-slate-400">ID: {ag.id}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[9px] uppercase tracking-wider">
                {ag.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Planner chat and task queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Planner Chat Box */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-500" />
              Multi-Agent Planner Console
            </h3>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask planner to compile a task (e.g. Audit West region loads)..."
                className="flex-1 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Query Planner
              </button>
            </form>

            {chatLoading && (
              <div className="text-center p-6 text-slate-450">
                <Activity className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                Planner is decomposing task targets and coordinating consensus...
              </div>
            )}

            {chatResult && (
              <div className="p-4 border border-slate-255 dark:border-[#2A313C] bg-slate-50/50 dark:bg-[#11161D]/50 rounded-[2px] space-y-3.5">
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Assigned Subtasks & Steps
                  </span>
                  <div className="mt-2 space-y-2">
                    {chatResult.planner_decision.subtasks.map((st: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px]">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-450" />
                        <span className="font-bold">{st.agent}:</span>
                        <span className="text-slate-500 dark:text-slate-400">{st.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-255 dark:border-[#2A313C]">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Consensus Finding
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {chatResult.planner_decision.consensus_findings}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-255 dark:border-[#2A313C]">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Final Consensus Recommendation
                  </span>
                  <p className="text-emerald-500 mt-1 font-sans font-bold">
                    {chatResult.final_recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Agent Running Tasks approvals */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Human Oversight Verification Queue
            </h3>

            <div className="space-y-3">
              {tasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-255 dark:border-[#2A313C] rounded-[2px] flex justify-between items-center bg-slate-50/50 dark:bg-[#11161D]/50"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      {t.task}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Agent: {t.assigned_agent}
                    </span>
                  </div>
                  {t.status === "Working" ? (
                    <button
                      onClick={() => handleApprove(t.id)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2px] font-bold transition flex items-center gap-1 text-[10px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[9px]">
                      {t.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live metrics, collaboration logs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Monitoring card */}
          {metrics && (
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" />
                Live Agent Performance metrics
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Planner Runs</span>
                  <span className="font-bold">{metrics.total_planner_runs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tokens Consumed</span>
                  <span className="font-bold">
                    {metrics.total_tokens_consumed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Success Rate</span>
                  <span className="font-bold text-emerald-500">{dash.success_rate_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manager Queue Status</span>
                  <span className="font-bold text-emerald-500">{dash.queue_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Collaboration logs
            </h3>
            <div className="space-y-3">
              {history.map((h, idx) => (
                <div
                  key={idx}
                  className="relative pl-4 border-l border-slate-200 dark:border-[#2A313C] py-0.5"
                >
                  <span className="text-[9px] text-slate-400 block">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold block text-slate-900 dark:text-white">{h.agent}</span>
                  <p className="text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    {h.activity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
