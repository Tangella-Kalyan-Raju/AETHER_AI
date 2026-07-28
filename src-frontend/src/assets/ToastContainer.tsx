import { X, CheckCircle, AlertTriangle, AlertOctagon, Info } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const getIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2 max-w-sm w-full select-text">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-3.5 border rounded-[3px] shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 duration-150 ${
            toast.type === "success"
              ? "bg-slate-950/95 border-emerald-500/30 text-slate-200"
              : toast.type === "error"
                ? "bg-slate-950/95 border-red-500/30 text-slate-200"
                : toast.type === "warning"
                  ? "bg-slate-950/95 border-amber-500/30 text-slate-200"
                  : "bg-slate-950/95 border-blue-500/30 text-slate-200"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 text-[11px] font-mono leading-relaxed">{toast.message}</div>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
export default ToastContainer;
