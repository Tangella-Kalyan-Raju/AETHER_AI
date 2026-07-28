import { useState } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  Lock,
  Terminal,
  Activity,
  Plus,
  RefreshCw,
  Key,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Operator {
  id: string;
  name: string;
  role: "Administrator" | "Grid Dispatcher" | "Compliance Officer" | "Trainee";
  status: "ONLINE" | "OFFLINE";
  lastActive: string;
}

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
}

export default function Admin() {
  const [operators, setOperators] = useState<Operator[]>([
    {
      id: "1",
      name: "dispatcher_steve",
      role: "Grid Dispatcher",
      status: "ONLINE",
      lastActive: "Active now",
    },
    {
      id: "2",
      name: "compliance_officer_mary",
      role: "Compliance Officer",
      status: "ONLINE",
      lastActive: "Active now",
    },
    {
      id: "3",
      name: "admin_root",
      role: "Administrator",
      status: "ONLINE",
      lastActive: "Active now",
    },
    { id: "4", name: "trainee_john", role: "Trainee", status: "ONLINE", lastActive: "30 mins ago" },
    { id: "5", name: "trainee_alex", role: "Trainee", status: "OFFLINE", lastActive: "2 days ago" },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      timestamp: "2026-07-25 16:50:11",
      user: "admin_root",
      action: "Deployed Compiled Safety Policy rules to sandbox Digital Twin",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-07-25 16:48:32",
      user: "dispatcher_steve",
      action: "Initiated Battery B1 Dispatch policy command",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-07-25 16:45:15",
      user: "compliance_officer_mary",
      action: "Queried Trainee Training score list reports",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-07-25 16:32:00",
      user: "trainee_john",
      action: "Failed NERC simulation test exercise due to frequency limit breach",
      status: "WARNING",
    },
    {
      timestamp: "2026-07-25 16:15:00",
      user: "unknown_host",
      action: "Secure login handshake attempt blocked: invalid API key",
      status: "FAILED",
    },
  ]);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<
    "Administrator" | "Grid Dispatcher" | "Compliance Officer" | "Trainee"
  >("Trainee");

  // NERC Switches
  const [mfa, setMfa] = useState(true);
  const [tls, setTls] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const nextOp: Operator = {
      id: String(Date.now()),
      name: newName,
      role: newRole,
      status: "ONLINE",
      lastActive: "Active now",
    };
    setOperators([...operators, nextOp]);
    setAuditLogs([
      {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: "admin_root",
        action: `Provisioned operator profile: ${newName} as ${newRole}`,
        status: "SUCCESS",
      },
      ...auditLogs,
    ]);
    setNewName("");
  };

  const handleRemove = (id: string) => {
    const target = operators.find((op) => op.id === id);
    if (target) {
      setOperators(operators.filter((op) => op.id !== id));
      setAuditLogs([
        {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: "admin_root",
          action: `Deprovisioned operator account: ${target.name}`,
          status: "SUCCESS",
        },
        ...auditLogs,
      ]);
    }
  };

  const triggerAuditRefresh = () => {
    setAuditLogs([
      {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: "admin_root",
        action: "Polled live security events and resolved audit log synchrony",
        status: "SUCCESS",
      },
      ...auditLogs,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
            System Administration // NERC CIP Secure Domain
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Compliance & Security Control
          </h1>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Management Panel */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Operator Registry
            </h3>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
              {operators.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#151A21]/30 border border-slate-200/50 dark:border-[#1E293B]/40"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">{op.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">{op.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${op.status === "ONLINE" ? "bg-emerald-500" : "bg-slate-600"}`}
                    ></span>
                    <button
                      onClick={() => handleRemove(op.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add User Form */}
            <form
              onSubmit={handleAddOperator}
              className="border-t border-slate-100 dark:border-[#1E293B] pt-4 space-y-3"
            >
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">New Operator Alias</label>
                <input
                  type="text"
                  placeholder="e.g. operator_john"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A1A]/60"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Security Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Grid Dispatcher">Grid Dispatcher</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="Trainee">Trainee</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold border border-slate-700 text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision User</span>
              </button>
            </form>
          </div>

          {/* NERC Switches Panel */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" /> NERC compliance flags
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Enforce MFA (CIP-004)
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    Force multi-factor token check
                  </span>
                </div>
                <button onClick={() => setMfa(!mfa)} className="text-orange-500">
                  {mfa ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Strict TLS 1.3 Cipher Suites
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    Block legacy encryption suites
                  </span>
                </div>
                <button onClick={() => setTls(!tls)} className="text-orange-500">
                  {tls ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Session Lockout (CIP-007)
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    15 min idle console terminal timeout
                  </span>
                </div>
                <button
                  onClick={() => setSessionTimeout(!sessionTimeout)}
                  className="text-orange-500"
                >
                  {sessionTimeout ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-[#1E293B]/40 pb-2">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-500" /> NERC Audit Trail Log
              </h3>
              <button
                onClick={triggerAuditRefresh}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-[#151A21]"
                title="Refresh Logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-[#151A21]/30 border border-slate-200/50 dark:border-[#1E293B]/40 rounded-[3px] flex items-start gap-3"
                >
                  <div
                    className={`mt-0.5 p-1 rounded-[2px] ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : log.status === "WARNING"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {log.timestamp}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-[#2A313C]/40 uppercase">
                        {log.user}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{log.action}</p>
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
