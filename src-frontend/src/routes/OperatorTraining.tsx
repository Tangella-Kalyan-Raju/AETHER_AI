import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Play,
  Pause,
  FastForward,
  Rewind,
  HelpCircle,
  Send,
  Award,
  Activity,
  Download,
  RefreshCw,
  Save,
  Copy,
  Share2,
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ShieldAlert,
  Cpu,
  Sparkles,
  Database,
  FileText,
} from "lucide-react";
import api from "../api/axios";

const OperatorTraining: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "training" | "replay" | "tutorials" | "analytics" | "certificates" | "team"
  >("training");

  // Training Sandbox States
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [isCertMode, setIsCertMode] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [simTime, setSimTime] = useState(0);
  const [hint, setHint] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your AI Mentor. Let me know if you have any questions about the current grid state or need recommendations.",
    },
  ]);

  // Replay States
  const [historicalIncidents, setHistoricalIncidents] = useState<any[]>([]);
  const [selectedReplayId, setSelectedReplayId] = useState("");
  const [replayState, setReplayState] = useState<"idle" | "playing" | "paused">("idle");
  const [replayTime, setReplayTime] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [replayCommentary, setReplayCommentary] = useState<string[]>([]);

  // Tutorials States
  const [selectedTutorial, setSelectedTutorial] = useState<string>("digital_twin");
  const [tutorialStep, setTutorialStep] = useState(1);
  const [tutorialChecked, setTutorialChecked] = useState<Record<string, boolean>>({});

  // Analytics States
  const [analytics, setAnalytics] = useState<any>(null);
  const [exportType, setExportType] = useState("individual");
  const [exportFormat, setExportFormat] = useState("csv");

  // Certificates States
  const [certifications, setCertifications] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Team States
  const [teamCode, setTeamCode] = useState("TEAM-GPO-409");
  const [teamMembers, setTeamMembers] = useState([
    { name: "trainee_john", role: "Active Power Dispatcher", status: "Online", score: 88 },
    { name: "trainee_mary", role: "Reactive Power controller", status: "Online", score: 92 },
    { name: "trainee_steve", role: "Safety Compliance Officer", status: "Offline", score: 85 },
  ]);

  // Node state variables to mock digital twin response
  const [gridVoltage, setGridVoltage] = useState(0.99);
  const [gridFrequency, setGridFrequency] = useState(59.98);
  const [gridActivePower, setGridActivePower] = useState(1420);
  const [gridRenewableShare, setGridRenewableShare] = useState(48);

  // Fetch scenarios and metadata
  useEffect(() => {
    fetchScenarios();
    fetchAnalytics();
    fetchCertifications();
  }, []);

  // Simulates passing of time during active training sessions
  useEffect(() => {
    let interval: any;
    if (session && session.status === "ACTIVE") {
      interval = setInterval(() => {
        setSimTime((prev) => {
          const next = prev + 5;
          if (next >= 120) {
            clearInterval(interval);
            return 120;
          }
          // Dynamically fluctuate grid values based on simulated time and actions
          const netOffset = actions.length * 0.08;
          setGridFrequency(Math.max(58.5, Math.min(60.1, 59.98 - next * 0.015 + netOffset)));
          setGridVoltage(Math.max(0.9, Math.min(1.05, 0.99 - next * 0.001 + netOffset * 0.1)));
          setGridActivePower((prevPower) => prevPower + (Math.random() > 0.5 ? 10 : -10));
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [session, actions]);

  // Simulates timeline progression for Replay Engine
  useEffect(() => {
    let interval: any;
    if (replayState === "playing") {
      interval = setInterval(() => {
        setReplayTime((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            setReplayState("paused");
            return 100;
          }
          // Add commentary points
          if (next === 10) {
            addCommentary("Notice: Initial demand surge triggering thermal limit alerts.");
          } else if (next === 25) {
            addCommentary("Outage Event: Breaker B1-4 tripped due to bus over-current protection.");
          } else if (next === 50) {
            addCommentary(
              "AI Action: Economic dispatch executed. Ramped solar storage and battery response."
            );
          } else if (next === 75) {
            addCommentary("Stability: Active power restored. Grid voltage stabilization achieved.");
          }
          return next;
        });
      }, 2000 / replaySpeed);
    }
    return () => clearInterval(interval);
  }, [replayState, replaySpeed]);

  const fetchScenarios = async () => {
    try {
      const res = await api.get("/api/v1/scenarios/");
      setScenarios(res.data);
      if (res.data.length > 0) {
        setSelectedScenarioId(res.data[0].id);
        const incidents = res.data.filter((s: any) => s.name.includes("Historical"));
        setHistoricalIncidents(incidents.length > 0 ? incidents : res.data);
        if (incidents.length > 0) setSelectedReplayId(incidents[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/api/v1/training/analytics");
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCertifications = async () => {
    try {
      const res = await api.get("/api/v1/training/certifications");
      setCertifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const startSession = async () => {
    if (!selectedScenarioId) return;
    try {
      // Find or start simulation run corresponding to scenario
      const simRes = await api.post("/api/v1/simulation/start", {
        scenario_id: selectedScenarioId,
        speed_multiplier: 1.0,
      });
      const simId = simRes.data.id;

      const res = await api.post("/api/v1/training/sessions/start", {
        simulation_id: simId,
        difficulty_level: difficulty,
        is_certification_mode: isCertMode,
      });
      setSession(res.data);
      setSimTime(0);
      setActions([]);
      setAssessment(null);
      setGridVoltage(0.99);
      setGridFrequency(59.98);
      setGridActivePower(1420);
      setGridRenewableShare(48);
      setChatHistory([
        {
          sender: "ai",
          text: `You have loaded a ${difficulty} training session. Monitor the grid variables on the left. Let me know if you need any operational recommendations.`,
        },
      ]);
    } catch (e) {
      alert("Failed to start session. Check Simulation engine.");
    }
  };

  const saveSession = async () => {
    if (!session) return;
    try {
      await api.post(`/api/v1/training/sessions/${session.session_id}/save`, {
        saved_state: {
          simTime,
          gridVoltage,
          gridFrequency,
          actions,
          gridActivePower,
          gridRenewableShare,
        },
      });
      alert("Session state saved successfully.");
      setSession({ ...session, status: "SAVED" });
    } catch (e) {
      alert("Failed to save session.");
    }
  };

  const resumeSession = async () => {
    if (!session) return;
    try {
      const res = await api.post(`/api/v1/training/sessions/${session.session_id}/resume`);
      setSession({ ...session, status: "ACTIVE" });
      if (res.data.saved_state) {
        const state = res.data.saved_state;
        setSimTime(state.simTime || 0);
        setGridVoltage(state.gridVoltage || 0.99);
        setGridFrequency(state.gridFrequency || 59.98);
        setActions(state.actions || []);
      }
      alert("Resumed saved training session.");
    } catch (e) {
      alert("Failed to resume session.");
    }
  };

  const cloneSession = async () => {
    if (!session) return;
    try {
      const res = await api.post(`/api/v1/training/sessions/${session.session_id}/clone`);
      setSession({ ...session, session_id: res.data.session_id, status: "ACTIVE" });
      setAssessment(null);
      alert("Session cloned. A new active instance has been created.");
    } catch (e) {
      alert("Failed to clone session.");
    }
  };

  const requestHint = async () => {
    if (!session) return;
    try {
      const res = await api.get(
        `/api/v1/training/sessions/${session.session_id}/mentor?current_time=${simTime}`
      );
      setHint(res.data.hint);
      setChatHistory((prev) => [...prev, { sender: "ai", text: res.data.hint }]);
    } catch (e) {
      console.error(e);
    }
  };

  const submitCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !session) return;
    const userQ = chatQuestion;
    setChatHistory((prev) => [...prev, { sender: "user", text: userQ }]);
    setChatQuestion("");

    try {
      const res = await api.post(`/api/v1/training/sessions/${session.session_id}/mentor/ask`, {
        question: userQ,
        current_time: simTime,
      });
      setChatHistory((prev) => [...prev, { sender: "ai", text: res.data.answer }]);
    } catch (err) {
      console.error(err);
    }
  };

  const executeAction = (actionType: string, asset: string) => {
    if (!session || session.status === "GRADED") return;
    setActions((prev) => [
      ...prev,
      {
        action_type: actionType,
        target_asset: asset,
        parameters: {},
        sim_time: simTime,
      },
    ]);

    // Simulate instantaneous response of executing action
    if (actionType === "Deploy Reserve") {
      setGridFrequency((prev) => Math.min(60.0, prev + 0.05));
      setGridVoltage((prev) => Math.min(1.0, prev + 0.01));
    } else if (actionType === "Curtail Renewable") {
      setGridRenewableShare((prev) => Math.max(10, prev - 15));
    }
  };

  const submitForGrading = async () => {
    if (!session) return;
    try {
      const res = await api.post(`/api/v1/training/sessions/${session.session_id}/submit`, {
        actions_taken: actions,
      });
      setAssessment(res.data);
      setSession({ ...session, status: "GRADED" });
      fetchAnalytics();
      fetchCertifications();
    } catch (e) {
      alert("Grading failed.");
    }
  };

  // Replay Control Functions
  const startReplay = () => {
    if (!selectedReplayId) return;
    setReplayState("playing");
    setReplayTime(0);
    setReplayCommentary(["Timeline Playback Started: Loading grid parameters..."]);
  };

  const addCommentary = (text: string) => {
    setReplayCommentary((prev) => [text, ...prev]);
  };

  const handleExport = () => {
    const url = `${api.defaults.baseURL}/api/v1/training/reports/export?report_type=${exportType}&format=${exportFormat}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 select-text max-w-7xl mx-auto py-2">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2A313C] pb-5">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Training & Replay Module
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orange-500" />
            Operator Training Sandbox
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Practice real-world contingency mitigation, replay historical incident timelines,
            consult the AI Training Assistant, and earn digital operator credentials in a fully
            isolated sandbox.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-[#151A21] p-1 rounded border border-slate-200 dark:border-[#2A313C]">
          {(["training", "replay", "tutorials", "analytics", "certificates", "team"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F8FAFC]"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {/* --- Tab 1: Training Sandbox --- */}
        {activeTab === "training" && (
          <div className="space-y-6">
            {!session ? (
              <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-6 max-w-xl mx-auto shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Configure Training Session
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      Scenario Module
                    </label>
                    <select
                      value={selectedScenarioId}
                      onChange={(e) => setSelectedScenarioId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-2 text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:border-orange-500"
                    >
                      {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                        Difficulty Level
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-2 text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:border-orange-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isCertMode}
                          onChange={(e) => setIsCertMode(e.target.checked)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        Certification Assessment
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex justify-end">
                    <button
                      onClick={startSession}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-5 py-2.5 rounded shadow transition duration-200 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Launch Sandbox
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Columns - Grid Status & Decision controls */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Active Header controls */}
                  <div className="bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono border border-orange-500/30 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded font-medium">
                        ACTIVE RUN: {difficulty}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC] mt-1.5">
                        Simulation Reference: {session.simulation_id.substring(0, 8)}...
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-slate-200 dark:bg-[#0B0E13] px-3 py-1 rounded text-slate-700 dark:text-slate-300">
                        Time T+{simTime} mins
                      </span>

                      <button
                        onClick={saveSession}
                        title="Save session state"
                        className="bg-slate-200 dark:bg-[#0B0E13] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] p-2 rounded transition"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={resumeSession}
                        title="Resume saved state"
                        className="bg-slate-200 dark:bg-[#0B0E13] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] p-2 rounded transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cloneSession}
                        title="Clone session"
                        className="bg-slate-200 dark:bg-[#0B0E13] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] p-2 rounded transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Simulated Digital Twin Grid Status */}
                  <div className="bg-[#0B0E13] border border-[#2A313C] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4 border-b border-[#2A313C] pb-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-orange-500" />
                        Simulated Digital Twin Telemetry
                      </span>
                      {gridFrequency < 59.8 ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 uppercase tracking-widest animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Freq Warning
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                          System Stable
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-[#151A21] border border-[#1E293B] p-3 rounded">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">
                          Voltage
                        </span>
                        <span className="block text-xl font-mono font-bold text-slate-200 mt-1">
                          {gridVoltage.toFixed(3)} pu
                        </span>
                      </div>

                      <div className="bg-[#151A21] border border-[#1E293B] p-3 rounded">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">
                          Frequency
                        </span>
                        <span
                          className={`block text-xl font-mono font-bold mt-1 ${gridFrequency < 59.8 ? "text-red-400" : "text-slate-200"}`}
                        >
                          {gridFrequency.toFixed(2)} Hz
                        </span>
                      </div>

                      <div className="bg-[#151A21] border border-[#1E293B] p-3 rounded">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">
                          Active Power
                        </span>
                        <span className="block text-xl font-mono font-bold text-slate-200 mt-1">
                          {gridActivePower} MW
                        </span>
                      </div>

                      <div className="bg-[#151A21] border border-[#1E293B] p-3 rounded">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">
                          Renewable Share
                        </span>
                        <span className="block text-xl font-mono font-bold text-slate-200 mt-1">
                          {gridRenewableShare}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Decision Panel */}
                  <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-orange-500" />
                      Decision Control Panel
                    </h4>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => executeAction("Deploy Reserve", "Battery_Substation_A")}
                        disabled={session.status === "GRADED"}
                        className="bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition"
                      >
                        Deploy Fast Battery Reserve (FFR)
                      </button>
                      <button
                        onClick={() => executeAction("Curtail Renewable", "Wind_Farm_North")}
                        disabled={session.status === "GRADED"}
                        className="bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E293B] px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition"
                      >
                        Curtail Wind Curtailment Target
                      </button>
                      <button
                        onClick={() => executeAction("Isolate Asset", "Line_400KV_TRUNK")}
                        disabled={session.status === "GRADED"}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition"
                      >
                        Open Breakers (Isolate Trunk Outage)
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#1E293B] pt-4">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                        Actions Logged ({actions.length})
                      </label>
                      {actions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No contingency actions dispatched yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {actions.map((act, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs bg-slate-50 dark:bg-[#151A21] px-2.5 py-1.5 rounded border border-slate-100 dark:border-[#1E293B]"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {act.action_type}
                              </span>
                              <span className="font-mono text-slate-500">
                                Target: {act.target_asset} (T+{act.sim_time}m)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {actions.length > 0 && session.status !== "GRADED" && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex justify-end">
                        <button
                          onClick={submitForGrading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded shadow transition"
                        >
                          Submit Session for Grading
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - AI Mentor Chat & Assessment Card */}
                <div className="space-y-6">
                  {/* AI Mentor Chat Interface */}
                  <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5 flex flex-col h-[320px]">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1E293B] pb-3 mb-3">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                          AI Training Mentor
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">Status: Connected</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
                      {chatHistory.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded max-w-[85%] leading-relaxed ${
                            msg.sender === "user"
                              ? "ml-auto bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400"
                              : "bg-slate-50 dark:bg-[#151A21] border border-slate-100 dark:border-[#1E293B] text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {msg.text}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={submitCustomQuestion} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask explanation or recommendation..."
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded shadow transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    <button
                      onClick={requestHint}
                      className="mt-2 text-center text-[10px] font-mono text-orange-500 hover:underline"
                    >
                      Request Hint for T+{simTime}
                    </button>
                  </div>

                  {/* Assessment Card */}
                  {assessment ? (
                    <div
                      className={`border rounded-lg p-5 ${
                        assessment.passed
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mb-3 flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-orange-500" />
                        Grading Complete
                      </h4>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase">
                            Final Grade
                          </span>
                          <span className="block text-2xl font-bold font-mono text-orange-500 mt-1">
                            {assessment.final_grade}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase">
                            Assessment Status
                          </span>
                          <span
                            className={`block text-xs font-semibold mt-2.5 ${assessment.passed ? "text-emerald-500" : "text-red-500"}`}
                          >
                            {assessment.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-[#1E293B] pt-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Scenario score:</span>
                          <span className="font-mono font-medium text-slate-200">
                            {assessment.scenario_score}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Decision score:</span>
                          <span className="font-mono font-medium text-slate-200">
                            {assessment.decision_score}/100
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
                        <p className="text-[11px] leading-relaxed italic text-slate-500 dark:text-slate-400">
                          {assessment.ai_feedback}
                        </p>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setSession(null)}
                          className="bg-slate-200 dark:bg-[#151A21] hover:bg-slate-300 dark:hover:bg-[#1E293B] text-slate-800 dark:text-slate-300 font-semibold text-xs px-3 py-1.5 rounded transition"
                        >
                          Configure New Session
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/50 dark:bg-[#151A21]/30 border border-dashed border-slate-200 dark:border-[#2A313C] rounded-lg p-8 text-center text-xs text-slate-400 italic">
                      Start session and submit actions for assessment.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tab 2: Historical Incident Replay --- */}
        {activeTab === "replay" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Select Historical Incident Replay
              </h3>

              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <select
                  value={selectedReplayId}
                  onChange={(e) => setSelectedReplayId(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-2 text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
                >
                  {historicalIncidents.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={startReplay}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-5 py-2.5 rounded transition"
                >
                  Load Replay Timeline
                </button>
              </div>

              {replayState !== "idle" && (
                <div className="space-y-6 border-t border-slate-100 dark:border-[#1E293B] pt-5">
                  {/* Timeline Control bar (VCR style) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-[#151A21] p-4 rounded border border-slate-200 dark:border-[#2A313C]">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setReplayState(replayState === "playing" ? "paused" : "playing")
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition shadow-sm"
                      >
                        {replayState === "playing" ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                      <button
                        onClick={() => setReplayTime(0)}
                        title="Rewind to start"
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-2 rounded transition"
                      >
                        <Rewind className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReplayTime((t) => Math.min(100, t + 10))}
                        title="Fast forward 10 steps"
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-2 rounded transition"
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 mx-2 sm:mx-6 flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400">00:00</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={replayTime}
                        onChange={(e) => setReplayTime(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-[#2A313C] rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="text-[10px] font-mono text-slate-400">T+{replayTime}m</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase text-slate-400">
                        Replay Speed
                      </span>
                      <select
                        value={replaySpeed}
                        onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                        className="bg-[#0B0E13] border border-[#2A313C] rounded text-xs px-2 py-1 text-slate-300 focus:outline-none"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="1">1.0x</option>
                        <option value="2">2.0x</option>
                        <option value="5">5.0x</option>
                      </select>
                    </div>
                  </div>

                  {/* Highlights Timeline & AI Commentary logs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0B0E13] border border-[#2A313C] rounded p-4">
                      <span className="block text-[10px] font-mono text-slate-500 uppercase mb-3">
                        Replay Event Markers
                      </span>

                      <div className="space-y-3">
                        <div
                          className={`flex items-start gap-2.5 text-xs p-2 rounded ${replayTime >= 10 ? "border border-[#2A313C] bg-[#151A21]/50 text-slate-300" : "opacity-40 text-slate-500"}`}
                        >
                          <span className="font-mono text-orange-500 font-semibold">[T+10]</span>
                          <div>
                            <span className="block font-medium">Initial Peak Demand Spike</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Voltage levels drop below 0.95pu on Substation C bus.
                            </span>
                          </div>
                        </div>

                        <div
                          className={`flex items-start gap-2.5 text-xs p-2 rounded ${replayTime >= 25 ? "border border-[#2A313C] bg-[#151A21]/50 text-slate-300" : "opacity-40 text-slate-500"}`}
                        >
                          <span className="font-mono text-orange-500 font-semibold">[T+25]</span>
                          <div>
                            <span className="block font-medium">
                              Line Trip Outage (LINE_400KV_TRUNK)
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Lightning arrestor fault triggers secondary protective relaying.
                            </span>
                          </div>
                        </div>

                        <div
                          className={`flex items-start gap-2.5 text-xs p-2 rounded ${replayTime >= 50 ? "border border-[#2A313C] bg-[#151A21]/50 text-slate-300" : "opacity-40 text-slate-500"}`}
                        >
                          <span className="font-mono text-orange-500 font-semibold">[T+50]</span>
                          <div>
                            <span className="block font-medium">
                              Economic Dispatch Optimization
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Optimization algorithm reroutes 240MW via battery discharge.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded p-4 flex flex-col h-[280px]">
                      <span className="block text-[10px] font-mono text-slate-500 uppercase mb-3 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        AI Replay commentary
                      </span>

                      <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                        {replayCommentary.length === 0 ? (
                          <p className="text-slate-400 italic font-mono text-[10px]">
                            No active timeline entries.
                          </p>
                        ) : (
                          replayCommentary.map((comm, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-[#0B0E13] p-2.5 rounded border border-slate-100 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 leading-relaxed font-mono text-[11px]"
                            >
                              {comm}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Tab 3: Interactive Tutorials --- */}
        {activeTab === "tutorials" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Tutorials list */}
            <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-4 space-y-2">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2 mb-2">
                Tutorial Modules
              </span>
              {[
                { id: "digital_twin", label: "1. Digital Twin Navigation" },
                { id: "forecast", label: "2. Forecast Interpretation" },
                { id: "opt_dispatch", label: "3. Optimization Analysis" },
                { id: "carbon", label: "4. Carbon Optimization" },
                { id: "emergency", label: "5. Emergency Operations" },
              ].map((tut) => (
                <button
                  key={tut.id}
                  onClick={() => {
                    setSelectedTutorial(tut.id);
                    setTutorialStep(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                    selectedTutorial === tut.id
                      ? "bg-orange-500/10 text-orange-500 border-l-4 border-orange-500"
                      : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#151A21]"
                  }`}
                >
                  {tut.label}
                </button>
              ))}
            </div>

            {/* Steps & Interactive Checklists */}
            <div className="md:col-span-3 bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-6">
              {selectedTutorial === "digital_twin" && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    Module 1: Digital Twin Navigation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Learn how to inspect substation bus loads, monitor transmission line thermal
                    ratings, and check active switch breaker states in the node explorer.
                  </p>

                  <div className="space-y-2 border-t border-slate-100 dark:border-[#1E293B] pt-4">
                    {[
                      {
                        step: 1,
                        text: "Click on the Topology Explorer in the sidebar navigation.",
                      },
                      { step: 2, text: "Zoom in on Bus 4 at Hyderabad Central Substation." },
                      {
                        step: 3,
                        text: "Inspect the telemetry parameter panel for active active-power load levels.",
                      },
                      {
                        step: 4,
                        text: "Observe the visual indicator color change when breaker B1 goes offline.",
                      },
                    ].map((st) => (
                      <label
                        key={st.step}
                        className={`flex items-start gap-3 p-3 rounded border text-xs cursor-pointer select-none transition ${
                          tutorialStep >= st.step
                            ? "bg-emerald-500/5 border-emerald-500/20 text-slate-700 dark:text-slate-300"
                            : "opacity-50 text-slate-500 border-slate-100 dark:border-[#1E293B]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!tutorialChecked[`dt_${st.step}`]}
                          onChange={(e) => {
                            setTutorialChecked((prev) => ({
                              ...prev,
                              [`dt_${st.step}`]: e.target.checked,
                            }));
                            if (e.target.checked && tutorialStep === st.step) {
                              setTutorialStep(st.step + 1);
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 mt-0.5"
                        />
                        <div>
                          <span className="block font-semibold">Step {st.step}</span>
                          <span className="block text-[11px] mt-0.5">{st.text}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {tutorialStep > 4 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded text-xs text-center text-emerald-500 font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-5 h-5" /> Module Completed! You have learned the
                      Digital Twin basics.
                    </div>
                  )}
                </div>
              )}

              {selectedTutorial !== "digital_twin" && (
                <div className="text-center py-20 text-xs text-slate-500 italic">
                  Additional tutorial modules are pre-configured. Complete Module 1 to unlock.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Tab 4: Performance Analytics & Reports --- */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Long-term analytics panel */}
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Panel */}
                <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5 space-y-4">
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Overall Performance Analytics
                  </h4>

                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-[#151A21] p-3 rounded border border-slate-100 dark:border-[#1E293B]">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">
                        Average Session Score
                      </span>
                      <span className="block text-2xl font-bold font-mono text-slate-200 mt-1">
                        {analytics.average_score}%
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#151A21] p-3 rounded border border-slate-100 dark:border-[#1E293B]">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">
                        Passing Rate
                      </span>
                      <span className="block text-xl font-bold font-mono text-slate-200 mt-1">
                        {(analytics.completion_rate * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#151A21] p-3 rounded border border-slate-100 dark:border-[#1E293B]">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">
                        Average Reaction Time
                      </span>
                      <span className="block text-xl font-bold font-mono text-slate-200 mt-1">
                        {analytics.average_response_time} seconds
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Chart & History */}
                <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider mb-4">
                    Improvement Trends (Scores)
                  </h4>

                  {/* Mock Score Trend Chart bar elements */}
                  <div className="h-40 flex items-end justify-between border-b border-slate-200 dark:border-[#2A313C] pb-2 px-4 gap-2">
                    {analytics.improvement_trends.length === 0 ? (
                      <span className="text-xs text-slate-500 italic m-auto">
                        No historical score data.
                      </span>
                    ) : (
                      analytics.improvement_trends.map((score: number, idx: number) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {score.toFixed(0)}
                          </span>
                          <div
                            style={{ height: `${score * 1.2}px` }}
                            className="w-full max-w-[20px] bg-orange-500 rounded-t shadow-sm"
                          />
                          <span className="text-[9px] font-mono text-slate-500">Run {idx + 1}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Focus areas and weaknesses */}
                <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5 space-y-4">
                  <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Target Remediation Areas
                  </h4>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      AI Mentor identified the following grid competencies requiring training focus:
                    </p>

                    {analytics.weak_areas.length === 0 ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded text-xs text-emerald-600 font-semibold text-center">
                        All competencies verified within normal range. Excellent work!
                      </div>
                    ) : (
                      analytics.weak_areas.map((weak: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs bg-red-500/5 border border-red-500/10 text-red-500 px-3 py-2 rounded"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> {weak}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-[#151A21]/30 border border-dashed border-slate-200 dark:border-[#2A313C] rounded-lg p-10 text-center text-xs text-slate-400 italic">
                Complete training runs to generate long-term analytics logs.
              </div>
            )}

            {/* Reports Export Panel */}
            <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Training Report Export Center
              </h3>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Report Category
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
                  >
                    <option value="individual">Individual Performance Report</option>
                    <option value="team">Team Collaboration Report</option>
                    <option value="scenario">Scenario Completion Report</option>
                    <option value="decision">Decision Quality Report</option>
                    <option value="certification">Certification Log Report</option>
                    <option value="mentor">AI Mentor Feedback Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
                  >
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                  </select>
                </div>

                <button
                  onClick={handleExport}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded shadow transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 5: Digital Certifications --- */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                Earned Digital Operator Credentials
              </h3>

              {certifications.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-[#2A313C] rounded text-xs text-slate-400 italic">
                  No certifications earned yet. Run a session in Certification Assessment mode and
                  achieve a score of 80% or higher.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      onClick={() => setSelectedCert(cert)}
                      className="border border-slate-200 dark:border-[#2A313C] rounded-lg p-5 hover:border-orange-500/50 cursor-pointer transition bg-slate-50 dark:bg-[#151A21]/50 relative overflow-hidden"
                    >
                      {/* Decorative background logo */}
                      <Award className="absolute -bottom-6 -right-6 w-24 h-24 opacity-5 text-orange-500" />

                      <span className="text-[9px] font-mono uppercase text-orange-500 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded">
                        VERIFIED CREDENTIAL
                      </span>

                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3">
                        {cert.level}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Issued: {new Date(cert.issued_at).toLocaleDateString()}
                      </p>

                      <span className="block text-[10px] text-orange-500 hover:underline mt-4">
                        Click to view Certificate
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Printable Digital Certificate Modal Overlay */}
            {selectedCert && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white text-slate-900 border-[12px] border-slate-100 rounded-lg p-8 max-w-2xl w-full shadow-2xl relative select-text">
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold"
                  >
                    ✕
                  </button>

                  <div className="border border-double border-slate-300 p-8 text-center space-y-6">
                    <h2 className="font-heading text-xl uppercase tracking-widest text-slate-500">
                      Certificate of Completion
                    </h2>
                    <p className="text-xs text-slate-400 italic">This credential certifies that</p>

                    <h3 className="font-serif text-3xl font-bold tracking-tight text-orange-600">
                      {selectedCert.trainee_username}
                    </h3>

                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      has successfully demonstrated technical accuracy and decision competency in
                      isolated grid control operations, passing the safety and optimization criteria
                      for:
                    </p>

                    <h4 className="font-heading text-lg font-bold text-slate-800">
                      {selectedCert.level}
                    </h4>

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] font-mono text-slate-500 max-w-sm mx-auto">
                      <div>
                        <span>ISSUED TIMESTAMP</span>
                        <span className="block font-bold text-slate-800 mt-1">
                          {new Date(selectedCert.issued_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span>VERIFICATION HASH</span>
                        <span className="block font-bold text-slate-800 mt-1">
                          {selectedCert.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tab 6: Team Training Center --- */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Team Lobby details */}
            <div className="bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-500" />
                Collaborative Training Lobby
              </h4>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Group Session ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={teamCode}
                    className="flex-1 bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1 text-xs text-slate-800 dark:text-[#F8FAFC] font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(teamCode);
                      alert("Lobby code copied to clipboard!");
                    }}
                    className="bg-slate-200 dark:bg-[#151A21] text-slate-600 dark:text-slate-400 hover:text-white p-2 rounded transition border border-slate-200 dark:border-[#2A313C]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-[#1E293B] pt-3">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-2">
                  Connected Operators ({teamMembers.length})
                </label>
                <div className="space-y-1.5">
                  {teamMembers.map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs bg-slate-50 dark:bg-[#151A21] px-2.5 py-1.5 rounded border border-slate-100 dark:border-[#1E293B]"
                    >
                      <div>
                        <span className="block font-medium text-slate-800 dark:text-slate-200">
                          {m.name}
                        </span>
                        <span className="block text-[9px] text-slate-400">{m.role}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded ${m.status === "Online" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Leaderboard */}
            <div className="md:col-span-2 bg-white dark:bg-[#0B0E13]/40 border border-slate-200 dark:border-[#1E293B] rounded-lg p-5">
              <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider mb-4">
                Operator Leaderboard
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2A313C] text-slate-400">
                      <th className="py-2.5 font-mono uppercase tracking-wider">Rank</th>
                      <th className="py-2.5 font-mono uppercase tracking-wider">
                        Operator Username
                      </th>
                      <th className="py-2.5 font-mono uppercase tracking-wider">Role</th>
                      <th className="py-2.5 font-mono uppercase tracking-wider text-right">
                        High Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 dark:border-[#1E293B] text-slate-700 dark:text-slate-300"
                      >
                        <td className="py-3 font-bold">#{idx + 1}</td>
                        <td className="py-3 font-semibold">{m.name}</td>
                        <td className="py-3">{m.role}</td>
                        <td className="py-3 text-right font-mono font-bold text-orange-500">
                          {m.score}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorTraining;
