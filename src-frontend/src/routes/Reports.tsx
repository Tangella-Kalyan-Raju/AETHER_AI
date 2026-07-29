import React, { useState, useEffect } from "react";
import { FileText, Download, Filter, BarChart2, Plus, X, Eye, FilePieChart } from "lucide-react";
import api from "../api/axios";

interface Report {
  id: number;
  title: string;
  type: string;
  content: string;
  created_at: string;
}

const TABS = ["Grid Reports", "Renewables", "Energy Flow", "Demand", "Carbon Footprint"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState(TABS[0]);
  const [generating, setGenerating] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/reports?type=${activeTab}`);
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleGenerateReport = async () => {
    if (!newTitle) return alert("Please enter a title");
    setGenerating(true);

    const mockContent = JSON.stringify(
      {
        summary: `Automated analytical report generated for ${newType}.`,
        key_metrics: {
          confidence_score: 98.4,
          data_points_analyzed: 145032,
          anomalies_detected: Math.floor(Math.random() * 5),
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    try {
      const res = await api.post("/api/v1/reports", {
        title: newTitle,
        type: newType,
        content: mockContent,
        organization_id: 1, // Mock Org
      });
      if (res.data?.success) {
        setShowGenerateModal(false);
        setNewTitle("");
        if (newType === activeTab) {
          fetchReports();
        } else {
          setActiveTab(newType);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error generating report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 py-2 select-text animate-in fade-in duration-500 text-slate-200">
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
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-[3px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Generate Report
          </button>
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
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-orange-500 text-orange-500 dark:text-orange-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="border border-slate-800 bg-[#07090C]/40 rounded-lg p-5">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-4">
          {activeTab} History
        </h2>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[4px] p-12 text-center mt-6">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] flex items-center justify-center mb-4">
              <FilePieChart className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-2">
              NO REPORTS FOUND
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Generate a new report to view historical {activeTab.toLowerCase()} data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-mono">
                  <th className="py-2.5 font-semibold">Report Title</th>
                  <th className="py-2.5 font-semibold">Category</th>
                  <th className="py-2.5 font-semibold">Generated Date</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {r.title}
                    </td>
                    <td className="py-3 font-mono text-slate-400">{r.type}</td>
                    <td className="py-3 text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-all font-mono text-[10px] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full border border-slate-700 bg-[#0B0E13] p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-orange-500 font-mono uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> New Analytical Report
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Report Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Grid Stability Overview"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#151A21] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Report Category
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-[#151A21] border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                >
                  {TABS.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-500 font-mono italic">
                Note: Simulated models will generate synthetic output points for demonstration.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded font-semibold text-xs text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating || !newTitle}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center gap-2"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full border border-slate-700 bg-[#0B0E13] p-6 rounded-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-200">{selectedReport.title}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                  Type: {selectedReport.type} | ID: {selectedReport.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#151A21] border border-slate-800 rounded p-4 max-h-[60vh] overflow-y-auto">
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                {selectedReport.content}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">
                Generated: {new Date(selectedReport.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
