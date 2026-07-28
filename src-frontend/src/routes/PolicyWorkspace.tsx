import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  Search,
  Plus,
  Trash2,
  Copy,
  Edit,
  Check,
  Activity,
  AlertTriangle,
  RefreshCw,
  FileText,
  CheckCircle,
  Tag,
  Power,
  PowerOff,
  X,
  Sliders,
  DollarSign,
  Leaf,
  Zap,
  Info,
  Calendar,
  Layers,
  Sparkles,
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
  ai_explanation: string;
  expected_outcome: string;
  affected_systems: string[];
  category: string;
  status: string;
  updated_at: string;
}

export default function PolicyWorkspace() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected policy for details panel
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Operations");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formPriority, setFormPriority] = useState(5);
  const [formObjective, setFormObjective] = useState("CUSTOM");

  // Weights (Cost, Carbon, Stability, Reliability)
  const [weightCost, setWeightCost] = useState(0.25);
  const [weightCarbon, setWeightCarbon] = useState(0.25);
  const [weightStability, setWeightStability] = useState(0.25);
  const [weightReliability, setWeightReliability] = useState(0.25);

  // Constraints
  const [constraintVoltage, setConstraintVoltage] = useState(5.0);
  const [constraintThermal, setConstraintThermal] = useState(90.0);
  const [constraintSoc, setConstraintSoc] = useState(20.0);

  // Policy Intelligence State
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);

  const fetchPolicyIntelligence = async (id: number) => {
    setLoadingIntelligence(true);
    setIntelligenceError(null);
    try {
      const res = await api.get(`/api/v1/policies/${id}/intelligence`);
      setIntelligence(res.data?.data || res.data || null);
    } catch (err: any) {
      console.error("Error fetching policy intelligence:", err);
      setIntelligenceError("Failed to load policy intelligence metrics.");
    } finally {
      setLoadingIntelligence(false);
    }
  };

  useEffect(() => {
    if (selectedPolicyId) {
      fetchPolicyIntelligence(selectedPolicyId);
    } else {
      setIntelligence(null);
    }
  }, [selectedPolicyId]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/policies");
      // Check if response envelopes data in metadata/items structure or returns directly
      const fetchedItems = res.data?.items || res.data || [];
      const parsedItems = Array.isArray(fetchedItems) ? fetchedItems : [];
      setPolicies(parsedItems);

      if (parsedItems.length > 0) {
        // Default select active or first policy
        const active = parsedItems.find((p: Policy) => p.is_active);
        setSelectedPolicyId(active ? active.id : parsedItems[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching policies:", err);
      setError("Failed to connect to Policy Engine services.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingPolicyId(null);
    setFormName("");
    setFormCategory("Operations");
    setFormDescription("");
    setFormStatus("draft");
    setFormPriority(5);
    setFormObjective("CUSTOM");
    setWeightCost(0.25);
    setWeightCarbon(0.25);
    setWeightStability(0.25);
    setWeightReliability(0.25);
    setConstraintVoltage(5.0);
    setConstraintThermal(90.0);
    setConstraintSoc(20.0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (policy: Policy) => {
    setIsEditing(true);
    setEditingPolicyId(policy.id);
    setFormName(policy.name);
    setFormCategory(policy.category || "Operations");
    setFormDescription(policy.description || "");
    setFormStatus(policy.status || "draft");
    setFormPriority(policy.priority || 5);
    setFormObjective(policy.objective || "CUSTOM");

    const w = policy.weights || {};
    setWeightCost(w.cost !== undefined ? w.cost : 0.25);
    setWeightCarbon(w.carbon !== undefined ? w.carbon : 0.25);
    setWeightStability(w.stability !== undefined ? w.stability : 0.25);
    setWeightReliability(w.reliability !== undefined ? w.reliability : 0.25);

    const c = policy.constraints || {};
    setConstraintVoltage(c.voltage_deviation_pct !== undefined ? c.voltage_deviation_pct : 5.0);
    setConstraintThermal(c.thermal_limit_pct !== undefined ? c.thermal_limit_pct : 90.0);
    setConstraintSoc(c.min_soc_pct !== undefined ? c.min_soc_pct : 20.0);

    setIsModalOpen(true);
  };

  const handleAutoBalanceWeights = () => {
    const sum = weightCost + weightCarbon + weightStability + weightReliability;
    if (sum === 0) {
      setWeightCost(0.25);
      setWeightCarbon(0.25);
      setWeightStability(0.25);
      setWeightReliability(0.25);
      return;
    }
    setWeightCost(parseFloat((weightCost / sum).toFixed(2)));
    setWeightCarbon(parseFloat((weightCarbon / sum).toFixed(2)));
    setWeightStability(parseFloat((weightStability / sum).toFixed(2)));
    // Adjust reliability slightly to make sure sum is exactly 1.0 due to rounding
    const currentSum =
      parseFloat((weightCost / sum).toFixed(2)) +
      parseFloat((weightCarbon / sum).toFixed(2)) +
      parseFloat((weightStability / sum).toFixed(2));
    setWeightReliability(parseFloat((1.0 - currentSum).toFixed(2)));
  };

  const handleSavePolicy = async () => {
    const sum = weightCost + weightCarbon + weightStability + weightReliability;
    if (Math.abs(sum - 1.0) > 0.011) {
      setError("Validation Error: Weight coefficients must sum to exactly 1.0 (100%).");
      return;
    }

    const payload = {
      name: formName,
      category: formCategory,
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      objective: formObjective,
      weights: {
        cost: weightCost,
        carbon: weightCarbon,
        stability: weightStability,
        reliability: weightReliability,
      },
      constraints: {
        voltage_deviation_pct: constraintVoltage,
        thermal_limit_pct: constraintThermal,
        min_soc_pct: constraintSoc,
      },
      expected_outcome: `Custom dispatch with primary focus on ${formCategory}.`,
      ai_explanation: `Policy configured with a weight configuration prioritizing ${formCategory} and custom operational constraints.`,
      affected_systems: ["Optimization", "Dispatch Planning"],
    };

    setError(null);
    try {
      if (isEditing && editingPolicyId) {
        const res = await api.put(`/api/v1/policies/${editingPolicyId}`, payload);
        const updatedPolicy = res.data?.data || res.data;
        setPolicies((prev) => prev.map((p) => (p.id === editingPolicyId ? updatedPolicy : p)));
        setSuccess("Policy successfully updated.");
      } else {
        const res = await api.post("/api/v1/policies", {
          ...payload,
          organization_id: 1, // Default organization
        });
        const newPolicy = res.data?.data || res.data;
        setPolicies((prev) => [...prev, newPolicy]);
        setSelectedPolicyId(newPolicy.id);
        setSuccess("New policy successfully created.");
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving policy:", err);
      setError(err.response?.data?.detail || "Failed to save the operational policy.");
    }
  };

  const handleDuplicatePolicy = async (policy: Policy) => {
    setError(null);
    try {
      const res = await api.post(`/api/v1/policies/${policy.id}/clone`);
      const duplicated = res.data?.data || res.data;
      setPolicies((prev) => [...prev, duplicated]);
      setSelectedPolicyId(duplicated.id);
      setSuccess(`Duplicated policy '${policy.name}' successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error duplicating policy:", err);
      setError("Failed to duplicate operational policy.");
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this operational policy?")) return;
    setError(null);
    try {
      await api.delete(`/api/v1/policies/${id}`);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      if (selectedPolicyId === id) {
        setSelectedPolicyId(
          policies.length > 1 ? policies.find((p) => p.id !== id)?.id || null : null
        );
      }
      setSuccess("Policy deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting policy:", err);
      setError("Failed to delete policy.");
    }
  };

  const handleTogglePolicyActive = async (policy: Policy) => {
    setError(null);
    try {
      if (policy.is_active) {
        const res = await api.put(`/api/v1/policies/${policy.id}`, {
          status: "inactive",
        });
        const updated = res.data?.data || res.data;
        setPolicies((prev) =>
          prev.map((p) => (p.id === policy.id ? { ...updated, is_active: false } : p))
        );
        setSuccess(`Deactivated policy '${policy.name}'.`);
      } else {
        const res = await api.post(`/api/v1/policies/${policy.id}/activate`);
        setPolicies((prev) =>
          prev.map((p) => ({
            ...p,
            is_active: p.id === policy.id,
            status: p.id === policy.id ? "active" : p.status,
          }))
        );
        setSuccess(`Activated policy '${policy.name}' as the primary grid dispatch mode.`);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error toggling active state:", err);
      setError(err.response?.data?.detail || "Failed to alter active policy state.");
    }
  };

  const categories = [
    "All",
    "Operations",
    "Renewables",
    "Economics",
    "Safety",
    "Grid Operations",
    "Asset Lifecycle",
    "Sustainability",
  ];
  const statuses = ["All", "active", "inactive", "draft"];

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (policy.category || "").toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus =
      selectedStatus === "All" ||
      (policy.status || "").toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activePolicy = policies.find((p) => p.is_active);
  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  const getObjectiveIcon = (obj: string) => {
    switch (obj) {
      case "MIN_COST":
        return <DollarSign className="w-4 h-4 text-orange-500" />;
      case "MAX_RENEWABLES":
      case "RENEWABLE_PRIORITY":
        return <Leaf className="w-4 h-4 text-emerald-500" />;
      case "MAX_RELIABILITY":
      case "GRID_STABILIZATION":
        return <Zap className="w-4 h-4 text-purple-500" />;
      case "EMERGENCY_SAFEGUARD":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Layers className="w-4 h-4 text-sky-500" />;
    }
  };

  const getStatusBadge = (status: string, is_active: boolean) => {
    if (is_active) {
      return (
        <span className="px-2 py-0.5 bg-emerald-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
          active
        </span>
      );
    }
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
            active
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
            draft
          </span>
        );
      case "inactive":
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-550/30 font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
            inactive
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "renewables":
      case "sustainability":
        return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
      case "economics":
        return "text-orange-500 border-orange-500/20 bg-orange-500/5";
      case "safety":
        return "text-red-500 border-red-500/20 bg-red-505/5";
      case "grid operations":
        return "text-sky-500 border-sky-500/20 bg-sky-500/5";
      case "asset lifecycle":
        return "text-purple-500 border-purple-500/20 bg-purple-500/5";
      default:
        return "text-slate-400 border-slate-700 bg-slate-800/10";
    }
  };

  return (
    <div className="space-y-6 select-text font-sans">
      {error && (
        <div className="p-3 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 border border-emerald-500/25 bg-emerald-500/10 rounded-[3px] text-xs text-emerald-500 font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 gap-4 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Enterprise Policy Management System
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold rounded-[2px]"
          >
            <Plus className="w-3.5 h-3.5" /> CREATE CUSTOM POLICY
          </button>
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="p-1.5 rounded-[2px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reload policies list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {activePolicy && (
        <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-[4px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-500 font-bold block uppercase tracking-wider leading-none mb-1">
                [ACTIVE POWER POLICY DEPLOYED]
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activePolicy.name}
              </h2>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-500">
            Category: {activePolicy.category || "Operations"} // Priority Rank:{" "}
            {activePolicy.priority}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 p-3 bg-white dark:bg-[#07090C] border border-slate-200 dark:border-[#1E293B] rounded-[4px]">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search policies by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/10 dark:bg-[#151A21]/50 border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] py-1.5 pl-8 pr-3 text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50/10 dark:bg-[#151A21]/50 border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="All">All Categories</option>
            {categories.slice(1).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50/10 dark:bg-[#151A21]/50 border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="All">All Statuses</option>
            {statuses.slice(1).map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Policy Library ({filteredPolicies.length})
          </h3>

          {loading ? (
            <div className="p-12 border border-slate-200 dark:border-[#1E293B] rounded-[4px] text-center bg-white dark:bg-[#07090C]">
              <RefreshCw className="w-8 h-8 mx-auto text-orange-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500">Querying central operational database...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 dark:border-[#1E293B] rounded-[4px] text-center bg-white dark:bg-[#07090C]">
              <FileText className="w-10 h-10 mx-auto text-slate-500 mb-3 opacity-60" />
              <p className="text-sm font-semibold text-slate-400">No operational policies found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no policies matching your search query or filters. Create a new custom
                policy or reset filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicyId(policy.id)}
                  className={`p-4 border rounded-[4px] cursor-pointer transition-all flex flex-col justify-between space-y-3 relative ${
                    policy.is_active
                      ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/5 shadow"
                      : selectedPolicyId === policy.id
                        ? "border-orange-500 bg-orange-500/5 shadow-orange-500/5 shadow"
                        : "border-slate-200 dark:border-[#1E293B] hover:border-slate-400 bg-white dark:bg-[#07090C]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5">
                        {getObjectiveIcon(policy.objective)}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          {policy.name}
                        </h4>
                      </div>
                      {getStatusBadge(policy.status, policy.is_active)}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {policy.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span
                        className={`px-2 py-0.5 border text-[9px] font-mono rounded-[3px] font-medium ${getCategoryColor(policy.category)}`}
                      >
                        {policy.category || "Operations"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#2A313C]/40 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Rank: P-{policy.priority}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePolicyActive(policy);
                        }}
                        className={`px-2 py-1 font-mono font-semibold rounded-[2px] text-[9px] flex items-center gap-1 transition-colors ${
                          policy.is_active
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        }`}
                      >
                        {policy.is_active ? (
                          <>
                            <PowerOff className="w-2.5 h-2.5" /> DEACTIVATE
                          </>
                        ) : (
                          <>
                            <Power className="w-2.5 h-2.5" /> ACTIVATE
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Selected Policy Parameters
          </h3>

          {selectedPolicy ? (
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-5">
              <div className="flex justify-between items-start border-b border-[#2A313C]/40 pb-3 gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    {selectedPolicy.name}
                  </h4>
                  <span
                    className={`inline-block px-2 py-0.5 border text-[9px] font-mono rounded-[3px] mt-1 ${getCategoryColor(selectedPolicy.category)}`}
                  >
                    {selectedPolicy.category || "Operations"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(selectedPolicy.status, selectedPolicy.is_active)}
                  <span className="text-[9px] text-slate-500 font-mono">
                    Rank: P-{selectedPolicy.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-455 block uppercase tracking-wider mb-1">
                  Description
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedPolicy.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-455 block uppercase tracking-wider">
                  Optimization Weights
                </span>
                {Object.entries(selectedPolicy.weights || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1 font-mono text-[10.5px]">
                    <div className="flex justify-between text-slate-400">
                      <span className="capitalize">{key} priority</span>
                      <span>{Math.round(val * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1C222B] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${val * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-455 block uppercase tracking-wider">
                  Basic Constraints
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 border border-[#2A313C]/40 p-1.5 bg-[#151A21]/30 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Volt dev:{" "}
                      <strong className="text-orange-500">
                        {selectedPolicy.constraints?.voltage_deviation_pct || 5}%
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[#2A313C]/40 p-1.5 bg-[#151A21]/30 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Thermal lim:{" "}
                      <strong className="text-orange-500">
                        {selectedPolicy.constraints?.thermal_limit_pct || 90}%
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[#2A313C]/40 p-1.5 bg-[#151A21]/30 rounded col-span-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Min SoC:{" "}
                      <strong className="text-orange-500">
                        {selectedPolicy.constraints?.min_soc_pct || 20}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy Intelligence Section */}
              <div className="border-t border-[#2A313C]/30 pt-4 space-y-4">
                <div className="flex items-center gap-1.5 pb-2 border-b border-[#2A313C]/20">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
                    Policy Intelligence Analytics
                  </h5>
                </div>

                {loadingIntelligence ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs font-mono text-slate-400">
                    <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />
                    <span>Analyzing policy operational parameters...</span>
                  </div>
                ) : intelligenceError ? (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-[10px] font-mono">
                    {intelligenceError}
                  </div>
                ) : intelligence ? (
                  <div className="space-y-4 text-xs font-mono">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 border border-[#2A313C]/50 bg-[#161C24]/30 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">
                          Expected Cost
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          £{intelligence.expected_cost?.toLocaleString()}/hr
                        </span>
                      </div>
                      <div className="p-2 border border-[#2A313C]/50 bg-[#161C24]/30 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">
                          Emissions Impact
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {intelligence.emission_impact}
                        </span>
                      </div>
                      <div className="p-2 border border-[#2A313C]/50 bg-[#161C24]/30 rounded col-span-2 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 uppercase">
                          <span>Expected Renewable %</span>
                          <span className="text-slate-350">
                            {intelligence.expected_renewable_pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${intelligence.expected_renewable_pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-2 border border-[#2A313C]/50 bg-[#161C24]/30 rounded space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 uppercase">
                          <span>Reliability</span>
                          <span className="text-slate-350">{intelligence.reliability_score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${intelligence.reliability_score}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-2 border border-[#2A313C]/50 bg-[#161C24]/30 rounded space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 uppercase">
                          <span>Risk Score</span>
                          <span className="text-slate-350">{intelligence.risk_score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${intelligence.risk_score > 50 ? "bg-red-500" : "bg-yellow-500"}`}
                            style={{ width: `${intelligence.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advantages Card */}
                    {intelligence.advantages && intelligence.advantages.length > 0 && (
                      <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded space-y-1.5">
                        <span className="text-[9px] text-emerald-450 font-bold block uppercase tracking-wider">
                          Advantages
                        </span>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-300 list-none">
                          {intelligence.advantages.map((adv: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-500">•</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disadvantages Card */}
                    {intelligence.disadvantages && intelligence.disadvantages.length > 0 && (
                      <div className="p-3 border border-red-500/20 bg-red-500/5 rounded space-y-1.5">
                        <span className="text-[9px] text-red-400 font-bold block uppercase tracking-wider">
                          Disadvantages
                        </span>
                        <ul className="space-y-1 pl-1 text-[11px] text-slate-300 list-none">
                          {intelligence.disadvantages.map((dis: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-red-500">•</span>
                              <span>{dis}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-500 text-[11px]">
                    No intelligence profile loaded.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 border-t border-[#2A313C]/20 pt-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last Updated: {new Date(selectedPolicy.updated_at).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleOpenEditModal(selectedPolicy)}
                  className="px-2 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-700/50 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDuplicatePolicy(selectedPolicy)}
                  className="px-2 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-700/50 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button
                  onClick={() => handleDeletePolicy(selectedPolicy.id)}
                  disabled={selectedPolicy.is_active}
                  className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-500 border border-red-500/20 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  title={selectedPolicy.is_active ? "Cannot delete active policy" : "Delete policy"}
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-200 dark:border-[#1E293B] rounded-[4px] text-center bg-white dark:bg-[#07090C] text-slate-500 text-xs">
              Select an operational policy to view parameters.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-xl w-full border border-[#2A313C] bg-[#151A21] p-6 rounded-[4px] shadow-card space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-[#2A313C]/40 pb-2">
              <h3 className="text-xs font-bold text-orange-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />{" "}
                {isEditing ? "Edit Policy Config" : "Create Custom Policy"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Policy Name:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Green Storage Optimization"
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Category:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Description:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Define the purpose and scope of this operational control profile..."
                  rows={2}
                  className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Status:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Priority Rank (1-10):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value) || 5)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#2A313C]/20 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Optimization Priority Weights (Must sum to 100%)
                </span>
                <button
                  type="button"
                  onClick={handleAutoBalanceWeights}
                  className="text-[9px] font-mono text-orange-500 hover:underline"
                >
                  [Auto-Balance / Normalize]
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0B0E13]/50 p-2.5 border border-[#2A313C]/50 rounded space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Cost Weight:</span>
                    <span>{Math.round(weightCost * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weightCost}
                    onChange={(e) => setWeightCost(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1"
                  />
                </div>
                <div className="bg-[#0B0E13]/50 p-2.5 border border-[#2A313C]/50 rounded space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Carbon Weight:</span>
                    <span>{Math.round(weightCarbon * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weightCarbon}
                    onChange={(e) => setWeightCarbon(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1"
                  />
                </div>
                <div className="bg-[#0B0E13]/50 p-2.5 border border-[#2A313C]/50 rounded space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-450 text-[10px]">
                    <span>Stability Weight:</span>
                    <span>{Math.round(weightStability * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weightStability}
                    onChange={(e) => setWeightStability(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1"
                  />
                </div>
                <div className="bg-[#0B0E13]/50 p-2.5 border border-[#2A313C]/50 rounded space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-450 text-[10px]">
                    <span>Reliability Weight:</span>
                    <span>{Math.round(weightReliability * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weightReliability}
                    onChange={(e) => setWeightReliability(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1"
                  />
                </div>
              </div>

              {Math.abs(weightCost + weightCarbon + weightStability + weightReliability - 1.0) >
                0.011 && (
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] font-mono text-yellow-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Warning: Sum is{" "}
                    {Math.round(
                      (weightCost + weightCarbon + weightStability + weightReliability) * 100
                    )}
                    %. Must sum to 100% to save.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-[#2A313C]/20 pt-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Operational Control Constraints
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">
                    Volt Dev (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={constraintVoltage}
                    onChange={(e) => setConstraintVoltage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">
                    Thermal Lim (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={constraintThermal}
                    onChange={(e) => setConstraintThermal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">
                    Min SoC (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={constraintSoc}
                    onChange={(e) => setConstraintSoc(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0E13] border border-[#2A313C] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A313C]/20 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 border border-[#2A313C] hover:border-slate-500 rounded-[2px] font-semibold text-slate-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={
                  Math.abs(weightCost + weightCarbon + weightStability + weightReliability - 1.0) >
                  0.011
                }
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-[2px] transition-colors"
              >
                {isEditing ? "Save Changes" : "Create Control Policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
