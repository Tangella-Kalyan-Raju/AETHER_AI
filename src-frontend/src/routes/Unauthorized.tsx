import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldAlert, ArrowLeft, LogOut, Lock } from "lucide-react";

// Grid Policy Orchestrator (GPO) Access Denied / Unauthorized Page
// Path: src-frontend/src/routes/Unauthorized.tsx

export default function Unauthorized() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("[GPO-AUTH-UI] Signout request failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-transparent text-[#F8FAFC] p-4 font-sans select-none">
      <div className="max-w-md w-full border border-[#EF4444]/40 bg-[#151A21]/90 rounded-[4px] p-6 sm:p-8 shadow-card backdrop-blur-md">
        {/* Header Warning Alert Indicator */}
        <div className="flex items-center gap-3.5 mb-6 text-[#EF4444]">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
            <ShieldAlert className="w-5.5 h-5.5 text-[#EF4444]" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight uppercase leading-none">
              Access Denied
            </h1>
            <p className="text-[10px] text-[#64748B] font-mono mt-1">
              [SECURITY.CLEARANCE-REJECTED]
            </p>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
          Your operator profile credentials possess insufficient clearance privileges to
          authenticate for this terminal workspace. Active security parameters require specific NERC
          role boundaries.
        </p>

        {/* Security parameters metadata panel */}
        <div className="bg-[#1C222B] border border-[#2A313C] rounded-[2px] p-4 font-mono text-[11px] text-[#94A3B8] mb-8 space-y-2.5">
          <div className="flex justify-between items-center border-b border-[#2A313C]/40 pb-1.5">
            <span className="uppercase text-[#64748B]">OPERATOR</span>
            <span className="text-[#F8FAFC] truncate max-w-[200px]">
              {user?.email || "Unknown Identity"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-[#2A313C]/40 pb-1.5">
            <span className="uppercase text-[#64748B]">ASSIGNED ROLE</span>
            <span className="text-[#FFA940] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#FFA940]" />
              {profile?.role || "Viewer"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-[#2A313C]/40 pb-1.5">
            <span className="uppercase text-[#64748B]">ORGANIZATION</span>
            <span className="text-[#F8FAFC]">{profile?.organization || "GPO Authority"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="uppercase text-[#64748B]">SECURITY DOMAIN</span>
            <span className="text-slate-500 font-semibold">NERC CIP-002 — CIP-014</span>
          </div>
        </div>

        {/* Button Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-[#2A313C] hover:bg-[#3A4556] text-[#F8FAFC] text-xs font-heading font-semibold uppercase tracking-wider py-2.5 px-4 rounded-[2px] border border-[#2A313C] transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-[#FF7A1A]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex-1 bg-transparent hover:bg-[#EF4444]/10 text-[#EF4444] hover:text-[#EF4444] text-xs font-heading font-semibold uppercase tracking-wider py-2.5 px-4 rounded-[2px] border border-[#EF4444]/30 hover:border-[#EF4444]/50 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-[#EF4444]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Operator Keys</span>
          </button>
        </div>
      </div>
    </div>
  );
}
