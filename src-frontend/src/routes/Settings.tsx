import { Settings2, Database, Globe, Bell, Shield, Palette } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-8 py-2 select-text">
      <section className="border-b border-slate-200 dark:border-[#1E293B] pb-6">
        <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Platform Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
          Configure enterprise integrations, monitoring preferences, and API keys. Note: Some
          advanced configurations are locked until Phase 6 rollout.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {[
            { id: "general", label: "General", icon: Settings2, active: true },
            { id: "data", label: "Data Sources", icon: Database, active: false },
            { id: "weather", label: "Weather APIs", icon: Globe, active: false },
            { id: "notifications", label: "Notifications", icon: Bell, active: false },
            { id: "security", label: "Security", icon: Shield, active: false },
            { id: "theme", label: "Appearance", icon: Palette, active: false },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[3px] transition-colors ${
                item.active
                  ? "bg-slate-100 text-slate-900 dark:bg-[#1C222B] dark:text-[#F8FAFC]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#151A21] dark:hover:text-slate-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-6 min-h-[400px] flex items-center justify-center text-center">
          <div>
            <Settings2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Settings Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              The settings management module is currently operating in read-only mode during the
              Pre-Phase 5 transition window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
