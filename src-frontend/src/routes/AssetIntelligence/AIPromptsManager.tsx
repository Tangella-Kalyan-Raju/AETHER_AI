import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, Edit2, Trash2, Check, X, ShieldAlert } from "lucide-react";
import { copilotApi, PromptTemplate } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AIPromptsManager() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [isActive, setIsActive] = useState(true);

  const [isAdding, setIsAdding] = useState(false);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await copilotApi.getPrompts();
      setPrompts(list);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load prompt templates database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !template.trim()) return;
    try {
      const added = await copilotApi.createPrompt(name, template, version, isActive);
      setPrompts([...prompts, added]);
      setIsAdding(false);
      setName("");
      setTemplate("");
      setVersion("1.0.0");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim() || !template.trim()) return;
    try {
      const updated = await copilotApi.updatePrompt(id, name, template, version, isActive);
      setPrompts(prompts.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setName("");
      setTemplate("");
      setVersion("1.0.0");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await copilotApi.deletePrompt(id);
      setPrompts(prompts.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (p: PromptTemplate) => {
    setEditingId(p.id);
    setName(p.name);
    setTemplate(p.template);
    setVersion(p.version);
    setIsActive(p.is_active);
  };

  if (loading) return <LoadingState message="Connecting to system prompt nodes..." />;
  if (error) return <ErrorState message={error} retry={fetchPrompts} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID COPIOT SYSTEM INSTRUCTIONS
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            AI Prompt Templates Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Customize copilot system behaviors, safety fences, and response formats dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrompts}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] font-mono text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-slate-50 dark:bg-[#131922] border border-slate-255 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-[#F8FAFC]">New Prompt Template</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Template Name (e.g. Incident Analysis Prompt)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#181F2A] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Version (e.g. 1.0.0)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#181F2A] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
            />
          </div>
          <textarea
            placeholder="Template prompt instructions..."
            rows={4}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-[#181F2A] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 dark:border-[#2A313C] text-slate-500 rounded hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {/* Prompts Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {prompts.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-3"
          >
            {editingId === p.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
                  />
                </div>
                <textarea
                  value={template}
                  rows={4}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-[#252D37] rounded text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUpdate(p.id)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-[#252D37] rounded text-emerald-500"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A313C] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{p.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] text-slate-400">
                      v{p.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-[#252D37] rounded text-slate-400 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-[#252D37] rounded text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-650 dark:text-slate-350 font-mono text-xs whitespace-pre-wrap select-text">
                  {p.template}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
