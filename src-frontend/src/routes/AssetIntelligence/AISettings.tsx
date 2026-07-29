import React, { useState } from "react";
import { Check, ShieldCheck, Cpu } from "lucide-react";

export default function AISettings() {
  const [provider, setProvider] = useState("groq");
  const [model, setModel] = useState("llama3-70b-8192");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2 select-text font-mono text-xs">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          GRID COPIOT SETTINGS
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          AI Foundation Configurator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Configure API endpoints, default models, temperature ranges, and token constraints.
        </p>
      </div>

      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-6 space-y-5">
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-emerald-500" />
          LLM Provider Parameters
        </h3>

        <div className="space-y-4">
          {/* Provider */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-slate-450 uppercase text-[10px]">Active Provider</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="groq">Groq Cloud (Default)</option>
              <option value="openai" disabled>
                OpenAI compatibility (Future)
              </option>
              <option value="anthropic" disabled>
                Anthropic compatibility (Future)
              </option>
            </select>
          </div>

          {/* Model */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-slate-450 uppercase text-[10px]">Configured Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="llama3-70b-8192">Llama 3.3 70B (Default)</option>
              <option value="deepseek-r1">DeepSeek R1 (Optional)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B (Optional)</option>
            </select>
          </div>

          {/* Temperature */}
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-[10px] text-slate-450">
              <span className="uppercase">Temperature</span>
              <span>{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-[#2A313C] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Max Tokens */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-slate-450 uppercase text-[10px]">Max Response Tokens</span>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] focus:outline-none"
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2A313C]">
          <div className="flex items-center gap-1.5 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold">API Key Authenticated</span>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] transition font-bold"
          >
            {isSaved ? "Saved!" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
