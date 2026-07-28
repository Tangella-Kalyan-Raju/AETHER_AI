import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E13] text-[#F8FAFC] p-6 font-sans">
      <div className="max-w-md w-full border border-[#2A313C] bg-[#151A21] p-6 rounded-[3px] shadow-[0px_2px_4px_rgba(0,0,0,0.2)] text-center">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-[#FFA940]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h1 className="font-heading text-xl font-bold uppercase tracking-[-0.02em] mb-1">
          Resource Not Found
        </h1>
        <p className="text-xs text-[#64748B] font-mono mb-4">[ERR.RES-NOT-FOUND]</p>
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
          The requested coordinate, node parameter, or audit log segment does not exist or has been
          archived.
        </p>
        <Link
          to="/"
          className="inline-block bg-[#1C222B] hover:bg-[#2A313C] text-[#F8FAFC] font-heading font-medium uppercase text-xs tracking-[0.05em] px-6 py-2.5 rounded-[1px] border border-[#2A313C] transition-colors"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
export default NotFound;
