import { FileText, Download, Filter, BarChart2 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-8 py-2 select-text">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Enterprise Reporting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Generate and export Grid, Renewable, Energy, and Demand analytical reports.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-[3px] hover:bg-slate-50 dark:hover:bg-[#1C222B] transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-[3px] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B]">
        {["Grid Reports", "Renewables", "Energy Flow", "Demand", "Carbon Footprint"].map(
          (tab, idx) => (
            <button
              key={tab}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                idx === 0
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      <div className="border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[4px] p-12 text-center mt-6">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] flex items-center justify-center mb-4">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-2">
          [REPORTING ENGINE STANDBY]
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Historical forecasting and optimization reporting logic will be activated in the Phase 5
          ML pipelines.
        </p>
      </div>
    </div>
  );
}
