export function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E13] text-[#F8FAFC] p-6 font-sans">
      <div className="max-w-md w-full border border-[#2A313C] bg-[#151A21] p-6 rounded-[3px] shadow-[0px_2px_4px_rgba(0,0,0,0.2)] text-center">
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-[#2A313C] border-t-[#FF7A1A] rounded-full animate-spin mx-auto mb-4" />

        <h1 className="font-heading text-lg font-semibold uppercase tracking-[-0.02em] mb-1">
          Synchronizing Console
        </h1>
        <p className="text-xs text-[#64748B] font-mono mb-6">[SYS.CONNECTING-NODE]</p>

        {/* Skeleton Loaders Fading Pulse */}
        <div className="space-y-3">
          <div className="h-4 bg-[#1C222B] rounded-[1px] animate-pulse w-3/4 mx-auto" />
          <div className="h-4 bg-[#1C222B] rounded-[1px] animate-pulse w-5/6 mx-auto" />
          <div className="h-4 bg-[#1C222B] rounded-[1px] animate-pulse w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// Reusable micro-spinner
export function Spinner({
  className = "w-5 h-5",
  colorClass = "border-t-orange-500",
}: {
  className?: string;
  colorClass?: string;
}) {
  return (
    <div
      className={`border-2 border-slate-200 dark:border-slate-800 rounded-full animate-spin ${className} ${colorClass}`}
    />
  );
}

// Reusable Skeleton placeholder
export function Skeleton({
  className = "h-4 w-full",
  rounded = "rounded-[2px]",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={`bg-slate-200 dark:bg-slate-800/60 animate-pulse ${rounded} ${className}`} />
  );
}

// Reusable full-screen/container overlay loading component
export function LoadingOverlay({ message = "Loading System..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/60 dark:bg-[#0B0E13]/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-3">
      <Spinner className="w-8 h-8" />
      <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">{message}</span>
    </div>
  );
}

export default LoadingPlaceholder;
