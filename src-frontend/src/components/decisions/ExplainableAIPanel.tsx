import React from "react";
import { ArrowRight, BrainCircuit, LineChart, Cpu, Zap, Activity } from "lucide-react";

export const ExplainableAIPanel = ({ explanation, metadata }: any) => {
  if (!explanation) return null;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
        <h4 className="flex items-center text-sm font-semibold text-indigo-400 mb-2">
          <BrainCircuit className="w-4 h-4 mr-2" />
          AI Decision Summary
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">{explanation.summary}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Reasoning Chain
        </h4>
        <div className="relative border-l-2 border-slate-700 ml-3 space-y-6">
          {explanation.reasoning_chain?.map((step: any, idx: number) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-[#1E232B]"></div>
              <div>
                <h5 className="text-sm font-semibold text-white">{step.step}</h5>
                <p className="text-xs text-slate-400 mt-1">{step.finding}</p>
              </div>
            </div>
          ))}

          <div className="relative pl-6 pt-2">
            <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[9px] top-2.5 ring-4 ring-[#1E232B] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#1E232B] rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-bold text-emerald-400">
                Final Recommendation Synthesized
              </h5>
              <p className="text-xs text-slate-500 mt-1">
                Processed in {metadata?.processing_time_ms}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <div>
          <h5 className="text-xs text-slate-500 uppercase mb-2">Primary Factors</h5>
          <div className="flex flex-wrap gap-2">
            {explanation.primary_factors?.map((f: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs text-slate-500 uppercase mb-2">Secondary Factors</h5>
          <div className="flex flex-wrap gap-2">
            {explanation.secondary_factors?.map((f: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
