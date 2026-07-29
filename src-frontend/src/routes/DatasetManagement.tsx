import React, { useState, useEffect } from "react";
import {
  Database,
  Upload,
  Eye,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Check,
  X,
  Shield,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";

interface DatasetMeta {
  id: string;
  filename: string;
  file_size: number;
  columns: Record<string, string>;
  row_count: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export default function DatasetManagement() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  // Preview states
  const [previewDataset, setPreviewDataset] = useState<DatasetMeta | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    preview_rows: any[];
    columns: Record<string, string>;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [enrichWeather, setEnrichWeather] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/datasets/list");
      if (res.data?.success) setDatasets(res.data.data);
    } catch (err) {
      console.error("Error loading datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
        setSelectedFile(file);
      } else {
        alert("Only CSV and XLSX files are supported.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadStatus("Uploading to secure landing zone...");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/api/v1/datasets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadProgress(70);

      if (res.data?.success) {
        setUploadProgress(100);
        setUploadStatus("Upload verified and schema scanned successfully!");
        setTimeout(() => {
          setSelectedFile(null);
          setUploading(false);
          setUploadProgress(0);
          setUploadStatus("");
          fetchDatasets();
        }, 1500);
      } else {
        throw new Error(res.data?.error || "Failed parsing headers");
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatus("Error: " + err.message);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 3000);
    }
  };

  const viewPreview = async (dataset: DatasetMeta) => {
    setPreviewDataset(dataset);
    setLoadingPreview(true);
    setPreviewData(null);
    try {
      const res = await api.get(`/api/v1/datasets/preview/${dataset.id}`);
      if (res.data?.success) setPreviewData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const triggerImport = async (datasetId: string) => {
    setImportingId(datasetId);
    try {
      const formData = new FormData();
      formData.append("enrich_weather", String(enrichWeather));

      const res = await api.post(`/api/v1/datasets/import/${datasetId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        alert("Import successfully completed! Grid operating data updated.");
        fetchDatasets();
        setPreviewDataset(null);
        setPreviewData(null);
      } else {
        alert("Import failed: " + res.data?.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              Secure Information Architecture
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">DATASET MANAGEMENT</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingest and validate Kaggle CSV or Excel files containing generation output and regional
            grid telemetry.
          </p>
        </div>
        <button
          onClick={fetchDatasets}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Upload & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="lg:col-span-1 rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Secure Landing Ingestion Zone
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragOver ? "border-orange-500 bg-orange-500/5" : "border-slate-800 bg-[#11161d]/30"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">
                Drag and drop your file here, or <span className="text-orange-500">browse</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Supports CSV, XLSX up to 50MB
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="p-3 bg-[#11161d] rounded border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 truncate max-w-[180px]">
                  {selectedFile.name}
                </span>
                <span className="text-slate-500 font-mono">{roundBytes(selectedFile.size)}</span>
              </div>

              {uploading && (
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{uploadStatus}</div>
                </div>
              )}

              {!uploading && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="flex-1 py-1.5 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 rounded transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={uploadFile}
                    className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white rounded transition-colors"
                  >
                    Upload File
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-3.5 bg-yellow-500/5 rounded border border-yellow-500/10 text-[10px] leading-relaxed text-yellow-400/80">
            <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" /> Schema Validation Policy
            </div>
            Files must contain standard columns: Timestamp, Region, Demand, and clean generation
            telemetry indicators. Missing weather elements will be filled during validation if
            requested.
          </div>
        </div>

        {/* List of Datasets */}
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            History & Database Sync Log
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Querying database ingestion logs...
            </div>
          ) : datasets.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <div className="text-xs font-semibold">No operating datasets imported yet.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-mono">
                    <th className="py-2.5 font-semibold">Filename</th>
                    <th className="py-2.5 font-semibold">Size</th>
                    <th className="py-2.5 font-semibold">Rows</th>
                    <th className="py-2.5 font-semibold">Upload Date</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {datasets.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/40">
                      <td className="py-3 font-semibold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {d.filename}
                      </td>
                      <td className="py-3 font-mono text-slate-400">{roundBytes(d.file_size)}</td>
                      <td className="py-3 font-mono text-slate-300">{d.row_count}</td>
                      <td className="py-3 text-slate-400">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                            d.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : d.status === "failed"
                                ? "bg-red-500/10 text-red-400"
                                : d.status === "processing"
                                  ? "bg-blue-500/10 text-blue-400 animate-pulse"
                                  : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => viewPreview(d)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-all font-mono text-[10px]"
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {previewDataset && (
        <div className="rounded-lg border border-slate-800 bg-[#07090C]/40 p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Schema scan & Data preview:{" "}
                {previewDataset.filename}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Dataset UUID: {previewDataset.id}
              </p>
            </div>
            <button
              onClick={() => setPreviewDataset(null)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingPreview ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Parsing files and compiling columns schema...
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Columns Detected Card */}
              <div className="p-4 bg-[#11161d] rounded border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-wider">
                  Detected Column Schema mappings
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  {Object.entries(previewData.columns || {}).map(([std, raw]) => (
                    <div
                      key={std}
                      className="p-2 bg-[#07090C] rounded border border-slate-800 flex justify-between items-center"
                    >
                      <span className="text-slate-500 uppercase text-[9px]">{std}</span>
                      <span
                        className="font-semibold text-slate-300 truncate max-w-[80px]"
                        title={raw}
                      >
                        {raw}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="max-h-[300px] overflow-y-auto border border-slate-850 rounded">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#11161d] sticky top-0 border-b border-slate-800">
                    <tr className="text-slate-400 font-mono">
                      {previewData.headers.map((h, idx) => (
                        <th key={idx} className="p-2 font-semibold truncate max-w-[120px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-[#07090C]/20">
                    {previewData.preview_rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40">
                        {previewData.headers.map((h, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-2 text-slate-300 font-mono max-w-[120px] truncate"
                          >
                            {String(row[h] || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Options & Trigger */}
              <div className="p-4 bg-slate-900/30 rounded border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enrich"
                    checked={enrichWeather}
                    onChange={(e) => setEnrichWeather(e.target.checked)}
                    className="rounded border-slate-800 text-orange-500 focus:ring-0 w-4 h-4 bg-slate-950 cursor-pointer"
                  />
                  <label htmlFor="enrich" className="text-xs text-slate-300 cursor-pointer">
                    Enrich missing weather points automatically using OpenWeather Map / Open-Meteo
                  </label>
                </div>
                <button
                  onClick={() => triggerImport(previewDataset.id)}
                  disabled={importingId !== null}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-xs font-semibold text-white rounded transition-colors flex items-center gap-2"
                >
                  {importingId ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Authorize DB Import
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-red-400 font-mono text-xs">
              Error parsing preview content. Make sure dataset file format is correct.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function roundBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
