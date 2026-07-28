import { useState } from "react";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Play,
  Save,
  Plus,
  Trash2,
  Code,
  Terminal,
  Settings,
} from "lucide-react";

interface Constraint {
  id: string;
  name: string;
  category: "Voltage" | "Frequency" | "Load" | "Carbon" | "Security";
  limitValue: string;
  status: "ACTIVE" | "WARNING" | "DISABLED";
}

export default function PolicyEngine() {
  const [minVoltage, setMinVoltage] = useState(0.95);
  const [maxVoltage, setMaxVoltage] = useState(1.05);
  const [minFreq, setMinFreq] = useState(59.9);
  const [maxFreq, setMaxFreq] = useState(60.1);
  const [carbonCap, setCarbonCap] = useState(250);
  const [reserveCap, setReserveCap] = useState(150);

  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      id: "1",
      name: "NERC BAL-001 frequency stabilization limit",
      category: "Frequency",
      limitValue: "59.90 - 60.10 Hz",
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "IEEE 1547 voltage ride-through boundary",
      category: "Voltage",
      limitValue: "0.95 - 1.05 p.u.",
      status: "ACTIVE",
    },
    {
      id: "3",
      name: "Region-A maximum line load thermal limit",
      category: "Load",
      limitValue: "1800 MW",
      status: "ACTIVE",
    },
    {
      id: "4",
      name: "Decarbonization carbon intensity ceiling",
      category: "Carbon",
      limitValue: "250 gCO2/kWh",
      status: "ACTIVE",
    },
    {
      id: "5",
      name: "NERC CIP-007 secure login block threshold",
      category: "Security",
      limitValue: "3 Failures",
      status: "ACTIVE",
    },
  ]);

  const [newConstraintName, setNewConstraintName] = useState("");
  const [newConstraintCategory, setNewConstraintCategory] = useState<
    "Voltage" | "Frequency" | "Load" | "Carbon" | "Security"
  >("Voltage");
  const [newConstraintVal, setNewConstraintVal] = useState("");

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [compileStatus, setCompileStatus] = useState<"idle" | "success" | "failed">("idle");

  const addConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConstraintName || !newConstraintVal) return;
    const item: Constraint = {
      id: String(Date.now()),
      name: newConstraintName,
      category: newConstraintCategory,
      limitValue: newConstraintVal,
      status: "ACTIVE",
    };
    setConstraints([...constraints, item]);
    setNewConstraintName("");
    setNewConstraintVal("");
  };

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  const toggleStatus = (id: string) => {
    setConstraints(
      constraints.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const compilePolicies = () => {
    setIsCompiling(true);
    setCompileStatus("idle");
    setCompileLogs([
      "[SYSTEM.INFO] Policy compiler version 1.4.0 initialized...",
      "[SYSTEM.INFO] Checking constraint definitions compliance...",
      `[PARSING] Verifying Voltage limits: [${minVoltage} - ${maxVoltage}] p.u.`,
      `[PARSING] Verifying Frequency limits: [${minFreq} - ${maxFreq}] Hz`,
      `[PARSING] Carbon intensity threshold target: ${carbonCap} gCO2/kWh`,
      `[PARSING] Active reserve requirement: ${reserveCap} MW`,
      `[VERIFY] Validating ${constraints.filter((c) => c.status === "ACTIVE").length} active NERC compliance rules...`,
    ]);

    setTimeout(() => {
      setCompileLogs((prev) => [
        ...prev,
        "[COMPILE] Checking constraint overlaps... OK",
        "[COMPILE] Resolving optimization solver constraints... OK",
        "[COMPILE] Validating telemetry bindings... OK",
        "[VERIFY] All rules matched NERC CIP compliance standard.",
      ]);
    }, 1000);

    setTimeout(() => {
      setIsCompiling(false);
      setCompileStatus("success");
      setCompileLogs((prev) => [
        ...prev,
        "[SYSTEM.SUCCESS] Grid policy rules compilation complete. Active in sandbox Digital Twin.",
      ]);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
            Operational Rules // NERC CIP-005 Compliance
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Grid Policy & Constraints Engine
          </h1>
        </div>
        <button
          onClick={compilePolicies}
          disabled={isCompiling}
          className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-xs font-bold text-white transition-all shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${isCompiling ? "animate-spin" : ""}`} />
          <span>Compile & Deploy Policy</span>
        </button>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Core Bounds Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" /> Operational Bounds
            </h3>
            <div className="space-y-4">
              {/* Voltage boundaries */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  Voltage Limit (min - max p.u.)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={minVoltage}
                    onChange={(e) => setMinVoltage(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={maxVoltage}
                    onChange={(e) => setMaxVoltage(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                  />
                </div>
              </div>

              {/* Frequency boundaries */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  Frequency Boundary (min - max Hz)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={minFreq}
                    onChange={(e) => setMinFreq(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={maxFreq}
                    onChange={(e) => setMaxFreq(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                  />
                </div>
              </div>

              {/* Carbon ceiling */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  Carbon Intensity Ceiling (gCO2/kWh)
                </label>
                <input
                  type="number"
                  value={carbonCap}
                  onChange={(e) => setCarbonCap(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                />
              </div>

              {/* Active power reserve requirement */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  Active Reserve Requirement (MW)
                </label>
                <input
                  type="number"
                  value={reserveCap}
                  onChange={(e) => setReserveCap(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Assertions and Custom Constraints */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rules Table */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" /> NERC CIP Safety Policies
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1E293B] text-slate-500 font-medium">
                    <th className="py-2.5">Rule / Standard</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Threshold Target</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]/60 text-slate-300">
                  {constraints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#151A21]/30">
                      <td className="py-3 font-semibold">{c.name}</td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-[#1C222B] text-slate-400 text-[10px] font-mono">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 font-mono">{c.limitValue}</td>
                      <td className="py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className="text-[10px] text-orange-400 hover:text-orange-300"
                        >
                          {c.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => removeConstraint(c.id)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Rule Form */}
            <form
              onSubmit={addConstraint}
              className="border-t border-slate-100 dark:border-[#1E293B] pt-4 mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1">Rule Description</label>
                <input
                  type="text"
                  placeholder="e.g. Substation over-temperature boundary"
                  value={newConstraintName}
                  onChange={(e) => setNewConstraintName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Category</label>
                <select
                  value={newConstraintCategory}
                  onChange={(e: any) => setNewConstraintCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                >
                  <option value="Voltage">Voltage</option>
                  <option value="Frequency">Frequency</option>
                  <option value="Load">Load</option>
                  <option value="Carbon">Carbon</option>
                  <option value="Security">Security</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Threshold</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 110°C"
                    value={newConstraintVal}
                    onChange={(e) => setNewConstraintVal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold border border-slate-700 text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Compilation Logs */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-500" /> Compiler Console Out
            </h3>
            <div className="bg-[#0B0D11] border border-[#1E293B] rounded-[3px] p-3 font-mono text-[11px] text-slate-300 h-40 overflow-y-auto space-y-1 select-text">
              {compileLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-10">
                  No active compilations. Click Deploy to run.
                </div>
              ) : (
                compileLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes("SUCCESS")
                        ? "text-emerald-500 font-bold"
                        : log.includes("failed")
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
            {compileStatus === "success" && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Sandbox Grid updated successfully with compiled policies.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
