import { ReactNode, useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { useAuthorization } from "../hooks/useAuthorization";
import {
  LayoutDashboard,
  Network,
  Building2,
  Shield,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Sliders,
  Sun,
  Moon,
  ShieldCheck,
  Activity,
  Terminal,
  LogOut,
  Lock,
  Database,
  CloudLightning,
  Wind,
  Battery,
  Leaf,
  Zap,
  BookOpen,
  PieChart,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Star,
  Search,
  Clock,
  ChevronLeft,
  X,
  Layers,
  Sparkles,
  Compass,
  History,
  Map,
  Cpu,
  Play,
  TrendingUp,
  Bot,
  GitBranch,
  Eye,
  Users,
  Gauge,
  CircuitBoard,
  Target,
  FlaskConical,
  Workflow,
  ServerCog,
} from "lucide-react";
import RightContextPanel from "../components/ui/RightContextPanel";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { checkPermission } = useAuthorization();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar Collapse state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("gpo_sidebar_collapsed") === "true";
  });

  // Search filter for nav items
  const [navSearch, setNavSearch] = useState("");

  // Pinned favorites (persisted)
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gpo_pinned_pages") || "[]");
    } catch {
      return [];
    }
  });

  // Recently visited pages (persisted)
  const [recent, setRecent] = useState<{ label: string; path: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gpo_recent_pages") || "[]");
    } catch {
      return [];
    }
  });

  // Nested menu expand states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    return {
      "Grid Topology": true,
      "Scenario Management": true,
    };
  });

  // Clock
  const [timeStr, setTimeStr] = useState("");

  // Command Palette states
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const paletteInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (!profile?.full_name) return "GO";
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Keep Clock Updated
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Title and responsive viewports
  useEffect(() => {
    document.title = "Grid Policy Orchestrator (GPO)";
    const viewportMeta = document.querySelector("meta[name='viewport']");
    if (viewportMeta) {
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=5.0"
      );
    }
  }, []);

  // Command Palette Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set focus on open
  useEffect(() => {
    if (isPaletteOpen && paletteInputRef.current) {
      paletteInputRef.current.focus();
      setPaletteQuery("");
      setSelectedIndex(0);
    }
  }, [isPaletteOpen]);

  const navGroups = [
    {
      group: "Operations",
      items: [
        { label: "Overview", icon: LayoutDashboard, path: "/", permission: "dashboard:view" },
        {
          label: "Grid Operations",
          icon: Network,
          path: "/grid-overview",
          permission: "grid:view",
        },
        {
          label: "Interactive Grid Map",
          icon: Map,
          path: "/interactive-map",
          permission: "grid:view",
        },
        {
          label: "Digital Twin",
          icon: Layers,
          path: "/digital-twin",
          permission: "grid:view",
          subItems: [
            { label: "Twin Foundation", path: "/digital-twin", permission: "grid:view" },
            { label: "Predictive Twin", path: "/digital-twin/predictive", permission: "grid:view" },
          ],
        },
        {
          label: "Enterprise Dashboard",
          icon: Gauge,
          path: "/dashboard/enterprise",
          permission: "dashboard:view",
        },
      ],
    },
    {
      group: "Monitoring",
      items: [
        {
          label: "Generation Sources",
          icon: Sun,
          path: "/generation-sources",
          permission: "dashboard:view",
        },
        {
          label: "Weather Intelligence",
          icon: CloudLightning,
          path: "/dashboard/weather",
          permission: "dashboard:view",
        },
        {
          label: "Renewable Energy",
          icon: Wind,
          path: "/dashboard/renewable",
          permission: "dashboard:view",
        },
        {
          label: "Demand Analysis",
          icon: Activity,
          path: "/dashboard/demand",
          permission: "dashboard:view",
        },
        {
          label: "Energy Storage",
          icon: Battery,
          path: "/dashboard/storage",
          permission: "dashboard:view",
        },
        {
          label: "Carbon Tracking",
          icon: Leaf,
          path: "/dashboard/carbon",
          permission: "dashboard:view",
        },
      ],
    },
    {
      group: "Planning",
      items: [
        {
          label: "Forecasting",
          icon: TrendingUp,
          path: "/forecasting",
          permission: "dashboard:view",
          subItems: [
            { label: "Enterprise Engine", path: "/forecasting", permission: "dashboard:view" },
            { label: "Demand Forecast", path: "/forecasting/demand", permission: "dashboard:view" },
            {
              label: "Generation Forecast",
              path: "/forecasting/generation",
              permission: "dashboard:view",
            },
            {
              label: "Weather Forecast",
              path: "/forecasting/weather",
              permission: "dashboard:view",
            },
            { label: "Price Forecast", path: "/forecasting/price", permission: "dashboard:view" },
            {
              label: "Frequency Forecast",
              path: "/forecasting/frequency",
              permission: "dashboard:view",
            },
            {
              label: "Voltage Forecast",
              path: "/forecasting/voltage",
              permission: "dashboard:view",
            },
            {
              label: "Reserve Forecast",
              path: "/forecasting/reserve",
              permission: "dashboard:view",
            },
            {
              label: "Renewable Forecast",
              path: "/forecasting/renewable",
              permission: "dashboard:view",
            },
            {
              label: "Battery Forecast",
              path: "/forecasting/battery",
              permission: "dashboard:view",
            },
          ],
        },
        { label: "Optimization Center", icon: Cpu, path: "/optimization-center", permission: "dashboard:view" },
        { label: "Optimization Legacy", icon: Cpu, path: "/optimization", permission: "dashboard:view" },
      ],
    },
    {
      group: "Grid",
      items: [
        { label: "Assets", icon: Database, path: "/assets", permission: "assets:view" },
        {
          label: "Analytics",
          icon: BarChart3,
          path: "/optimization-analytics",
          permission: "analytics:view",
        },
        {
          label: "Grid Analytics",
          icon: PieChart,
          path: "/analytics",
          permission: "analytics:view",
        },
        {
          label: "Topology Explorer",
          icon: CircuitBoard,
          path: "/topology/explorer",
          permission: "grid:view",
        },
        { label: "Power Flow", icon: Zap, path: "/topology/power-flow", permission: "grid:view" },
      ],
    },
    {
      group: "Intelligence",
      items: [
        {
          label: "AI Decision Center",
          icon: Sparkles,
          path: "/decisions",
          permission: "policies:view",
        },
        {
          label: "Policy Center",
          icon: ShieldCheck,
          path: "/policies",
          permission: "policies:view",
        },
        {
          label: "Policy Engine",
          icon: ServerCog,
          path: "/policy-engine",
          permission: "policies:view",
        },
        {
          label: "Optimization Policy",
          icon: Sliders,
          path: "/optimization-policy",
          permission: "policies:view",
        },
        {
          label: "Custom Policy Builder",
          icon: Workflow,
          path: "/custom-policy-builder",
          permission: "policies:compile",
        },
        {
          label: "Policy Simulation",
          icon: FlaskConical,
          path: "/policy-simulation",
          permission: "policies:view",
        },
        {
          label: "Policy Deployment",
          icon: History,
          path: "/policy-deployment",
          permission: "policies:view",
        },
      ],
    },
    {
      group: "Administration",
      items: [
        { label: "Reports", icon: FileText, path: "/reports", permission: "reports:view" },
        {
          label: "Operator Training",
          icon: GraduationCap,
          path: "/operator-training",
          permission: "dashboard:view",
        },
        {
          label: "Dataset Management",
          icon: Database,
          path: "/dataset-management",
          permission: "dashboard:view",
        },
        { label: "Admin Panel", icon: Users, path: "/admin", permission: "admin:view" },
        { label: "Settings", icon: Settings, path: "/settings", permission: "settings:view" },
      ],
    },
  ];

  // Build a flat list of items for command palette / search / pinning lookup
  const allNavItems: { label: string; path: string; permission: string; icon?: any }[] = [];
  navGroups.forEach((g) => {
    g.items.forEach((i) => {
      if (i.subItems) {
        i.subItems.forEach((s) => {
          allNavItems.push({
            label: `${i.label} ➔ ${s.label}`,
            path: s.path,
            permission: s.permission,
            icon: i.icon,
          });
        });
      } else {
        allNavItems.push({ label: i.label, path: i.path, permission: i.permission, icon: i.icon });
      }
    });
  });

  // Track page visits
  useEffect(() => {
    const currentPath = location.pathname;
    const match = allNavItems.find((item) => item.path === currentPath);
    if (match) {
      setRecent((prev) => {
        const filtered = prev.filter((p) => p.path !== currentPath);
        const updated = [{ label: match.label, path: currentPath }, ...filtered].slice(0, 5);
        localStorage.setItem("gpo_recent_pages", JSON.stringify(updated));
        return updated;
      });
    }
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("gpo_sidebar_collapsed", String(next));
  };

  const togglePin = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinned((prev) => {
      let next;
      if (prev.includes(path)) {
        next = prev.filter((p) => p !== path);
      } else {
        next = [...prev, path];
      }
      localStorage.setItem("gpo_pinned_pages", JSON.stringify(next));
      return next;
    });
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  // Filter items matching the sidebar search field
  const filteredNavGroups = navGroups
    .map((group) => {
      const matchedItems = group.items.filter((item) => {
        const matchParent = item.label.toLowerCase().includes(navSearch.toLowerCase());
        if (matchParent) return true;
        if (item.subItems) {
          return item.subItems.some((sub) =>
            sub.label.toLowerCase().includes(navSearch.toLowerCase())
          );
        }
        return false;
      });
      return { ...group, items: matchedItems };
    })
    .filter((group) => group.items.length > 0);

  // Command palette filter
  const filteredPaletteItems = allNavItems.filter((item) => {
    const isAllowed = checkPermission(item.permission);
    const matchesQuery = item.label.toLowerCase().includes(paletteQuery.toLowerCase());
    return isAllowed && matchesQuery;
  });

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredPaletteItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredPaletteItems.length) % Math.max(1, filteredPaletteItems.length)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredPaletteItems[selectedIndex];
      if (target) {
        navigate(target.path);
        setIsPaletteOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsPaletteOpen(false);
    }
  };

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const currentPath = location.pathname;
    const match = allNavItems.find((item) => item.path === currentPath);
    if (!match) return ["GPO"];
    return match.label.split(" ➔ ");
  };

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col font-sans antialiased select-none tracking-[-0.01em] transition-colors duration-200 ${
        theme === "dark" ? "bg-[#0B0E13] text-[#F8FAFC]" : "bg-slate-50 text-[#1E293B]"
      }`}
    >
      {/* Enterprise Header */}
      <header className="h-14 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0E13] px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center justify-center w-8 h-8 rounded-[4px] bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]">
            <svg
              className="w-5 h-5 text-orange-500 dark:text-[#FF7A1A]"
              viewBox="0 0 256 256"
              fill="currentColor"
            >
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
          </div>
          <span className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC]">
            Grid Policy Orchestrator
          </span>
          <div className="hidden lg:flex items-center gap-2 ml-4">
            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border border-orange-500/20 bg-orange-500/10 text-orange-500">
              OPERATIONAL
            </span>
            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border border-slate-200 dark:border-[#1E293B] bg-slate-100 dark:bg-[#151A21] text-slate-600 dark:text-slate-400">
              SECURE
            </span>
          </div>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-200 dark:border-[#1E293B] text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">CONSOLE</span>
            {getBreadcrumbs().map((b, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span>/</span>
                <span
                  className={
                    idx === getBreadcrumbs().length - 1
                      ? "text-slate-200 font-semibold"
                      : "text-slate-500"
                  }
                >
                  {b.toUpperCase()}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Command Search Bar */}
          <div
            onClick={() => setIsPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#151A21]/50 text-slate-400 hover:text-slate-200 hover:border-slate-300 dark:hover:border-[#2A313C] transition-all cursor-pointer text-xs w-48"
            title="Global Console Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left text-[11px]">Command Search...</span>
            <kbd className="text-[9px] font-mono bg-slate-100 dark:bg-[#1E293B] px-1 rounded border border-slate-200 dark:border-[#2A313C]">
              Ctrl+K
            </kbd>
          </div>

          {/* Clock Timer */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#151A21]/50 text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>UTC {timeStr}</span>
          </div>

          {/* Notifications Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#1E293B] bg-[#151A21]/10 dark:bg-[#151A21]/50 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] transition-colors relative"
              title="Active Operations Logs"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-[#0B0E13] border border-[#1E293B] rounded-lg shadow-2xl z-[200] font-mono text-xs overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-[#1E293B]">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Alerts & Notifications
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {[
                    {
                      time: "2m ago",
                      msg: "Frequency deviation detected: 49.82 Hz (Threshold: 49.85 Hz)",
                      severity: "warning",
                    },
                    {
                      time: "8m ago",
                      msg: "Solar generation dropped 12% — cloud cover increasing over Zone 3",
                      severity: "info",
                    },
                    {
                      time: "15m ago",
                      msg: "Battery Bank #2 SOC below 20% — dispatch recommendation queued",
                      severity: "critical",
                    },
                    {
                      time: "23m ago",
                      msg: "Wind turbine WT-07 anemometer signal degraded",
                      severity: "warning",
                    },
                    {
                      time: "31m ago",
                      msg: "Optimization job completed: Economic Dispatch (Config #1)",
                      severity: "success",
                    },
                    {
                      time: "45m ago",
                      msg: "Market price feed latency exceeded 500ms threshold",
                      severity: "info",
                    },
                    {
                      time: "1h ago",
                      msg: "Demand forecast accuracy validated: 94.6% (60-min horizon)",
                      severity: "success",
                    },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 border-b border-[#1E293B]/50 hover:bg-[#151A21]/60 transition-colors cursor-pointer"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          n.severity === "critical"
                            ? "bg-red-500 animate-pulse"
                            : n.severity === "warning"
                              ? "bg-yellow-500"
                              : n.severity === "success"
                                ? "bg-emerald-500"
                                : "bg-blue-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 leading-relaxed">{n.msg}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-[#1E293B] text-center">
                  <button className="text-[10px] text-orange-400 hover:text-orange-300 uppercase tracking-wider">
                    View All Operational Logs
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#1E293B] bg-[#151A21]/10 dark:bg-[#151A21]/50 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] transition-colors"
            title="Toggle Console Contrast"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile */}
          {/* User Profile */}
          <div className="relative flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-[#1E293B]">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-7 h-7 rounded-full object-cover border border-orange-500/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xs font-mono font-semibold text-orange-500">
                  {getInitials()}
                </div>
              )}
              <div className="hidden sm:block text-left select-text">
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
                  {profile?.full_name || "Grid Operator"}
                </span>
                <span className="block text-[9px] font-mono text-slate-500 uppercase leading-none mt-1">
                  {profile?.role || "Viewer"}
                </span>
              </div>
            </button>
            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm("Terminate secure console session?")) {
                  signOut();
                }
              }}
              className="w-7 h-7 rounded-full border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
              title="Logout secure session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-10 w-72 bg-[#0B0E13] border border-[#1E293B] rounded-lg shadow-2xl z-[200] font-mono text-xs overflow-hidden">
                <div className="p-4 border-b border-[#1E293B] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-sm font-mono font-bold text-orange-500">
                    {getInitials()}
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-white">
                      {profile?.full_name || "Grid Operator"}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {profile?.email || "operator@grid.gov.in"}
                    </span>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {profile?.role || "Viewer"}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-0.5">
                  {[
                    {
                      label: "Session Info",
                      detail: `Active since ${new Date().toLocaleTimeString("en-US", { hour12: false })}`,
                    },
                    { label: "Auth Method", detail: "JWT Token (Bearer)" },
                    { label: "Security Level", detail: "NERC-CIP Compliant" },
                    {
                      label: "RBAC Permissions",
                      detail:
                        profile?.role === "admin"
                          ? "Full Access"
                          : profile?.role === "operator"
                            ? "Read/Write Ops"
                            : "Read Only",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#151A21]/60"
                    >
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-slate-300">{item.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-[#1E293B]">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#151A21]/60 text-slate-300 hover:text-white transition-colors"
                  >
                    ⚙ Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (window.confirm("Terminate secure console session?")) {
                        signOut();
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                  >
                    ⏻ Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation */}
        <aside
          className={`border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] flex flex-col justify-between transition-all duration-200 ${
            isCollapsed ? "w-16" : "w-64"
          } flex`}
        >
          <div className="p-3 flex-1 flex flex-col min-h-0">
            {/* Collapsed/Expanded Toggle Header */}
            <div
              className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-3`}
            >
              {!isCollapsed && (
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] py-1.5 pl-8 pr-3 text-[11px] placeholder-slate-500 focus:outline-none focus:border-[#FF7A1A]/60"
                  />
                </div>
              )}
              <button
                onClick={toggleCollapse}
                className="w-7 h-7 rounded bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 flex items-center justify-center text-slate-500 hover:text-slate-200 ml-1.5"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Pinned Favorites Area */}
            {pinned.length > 0 && !isCollapsed && (
              <div className="mb-4">
                <span className="px-3 block text-[9px] font-mono text-orange-500/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> Pinned Workspace
                </span>
                <div className="space-y-0.5">
                  {pinned.map((path) => {
                    const match = allNavItems.find((item) => item.path === path);
                    if (!match) return null;
                    const IconComp = match.icon || LayoutDashboard;
                    const isActive = location.pathname === path;
                    return (
                      <div
                        key={path}
                        className="group flex items-center justify-between w-full rounded-[3px] text-xs font-medium"
                      >
                        <Link
                          to={path}
                          className={`flex-1 flex items-center gap-3 px-3 py-1.5 rounded-[3px] transition-all ${
                            isActive
                              ? "bg-slate-100 dark:bg-[#151A21] text-[#FF7A1A]"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#151A21]/30"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{match.label.split(" ➔ ").pop()}</span>
                        </Link>
                        <button
                          onClick={(e) => togglePin(e, path)}
                          className="px-1 text-slate-500 hover:text-[#FF7A1A] transition-colors"
                          title="Unpin"
                        >
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {filteredNavGroups.map((group) => (
                <div key={group.group} className="space-y-0.5">
                  {!isCollapsed && (
                    <div className="px-3 py-1.5 mb-1.5 flex justify-between items-center border-b border-slate-100 dark:border-[#1E293B]/40">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {group.group}
                      </span>
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isAllowed = checkPermission(item.permission);
                    const isActive = location.pathname === item.path;

                    if (!isAllowed) {
                      return (
                        <div
                          key={item.label}
                          className={`flex items-center justify-between px-3 py-2 rounded-[3px] text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent`}
                          title="Authorization restricted"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </div>
                          {!isCollapsed && <Lock className="w-3 h-3 opacity-60 flex-shrink-0" />}
                        </div>
                      );
                    }

                    // Nested Submenus
                    if (item.subItems) {
                      const isGroupExpanded = expandedGroups[item.label] || false;
                      const hasActiveSub = item.subItems.some(
                        (sub) => location.pathname === sub.path
                      );

                      return (
                        <div key={item.label} className="space-y-0.5">
                          <button
                            onClick={() => toggleGroup(item.label)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-[3px] text-xs font-medium transition-all ${
                              hasActiveSub
                                ? "bg-slate-100/50 dark:bg-[#151A21]/30 text-orange-500"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151A21]/20 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4 flex-shrink-0" />
                              {!isCollapsed && <span>{item.label}</span>}
                            </div>
                            {!isCollapsed &&
                              (isGroupExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ))}
                          </button>

                          {isGroupExpanded && !isCollapsed && (
                            <div className="pl-6 border-l border-slate-100 dark:border-[#1E293B] ml-5 space-y-0.5 mt-0.5">
                              {item.subItems.map((sub) => {
                                const isSubAllowed = checkPermission(sub.permission);
                                const isSubActive = location.pathname === sub.path;
                                const isSubPinned = pinned.includes(sub.path);

                                if (!isSubAllowed) return null;

                                return (
                                  <div
                                    key={sub.path}
                                    className="group flex items-center justify-between w-full"
                                  >
                                    <Link
                                      to={sub.path}
                                      className={`flex-1 px-3 py-1 rounded-[3px] text-[11px] font-medium transition-all ${
                                        isSubActive
                                          ? "text-[#FF7A1A] font-semibold bg-[#FF7A1A]/5"
                                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                      }`}
                                    >
                                      {sub.label}
                                    </Link>
                                    <button
                                      onClick={(e) => togglePin(e, sub.path)}
                                      className="opacity-0 group-hover:opacity-100 px-1 text-slate-500 hover:text-orange-500 transition-all"
                                      title={isSubPinned ? "Unpin Page" : "Pin Page"}
                                    >
                                      <Star
                                        className={`w-3 h-3 ${isSubPinned ? "fill-orange-500 text-orange-500" : ""}`}
                                      />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isPinned = pinned.includes(item.path);

                    return (
                      <div
                        key={item.label}
                        className="group flex items-center justify-between w-full"
                      >
                        <Link
                          to={item.path}
                          className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-[3px] text-xs font-medium transition-all ${
                            isActive
                              ? "bg-slate-100 dark:bg-[#151A21] text-[#FF7A1A] border border-slate-200/50 dark:border-[#2A313C]/40"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#151A21]/30"
                          }`}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                        {!isCollapsed && (
                          <button
                            onClick={(e) => togglePin(e, item.path)}
                            className="opacity-0 group-hover:opacity-100 px-1 text-slate-500 hover:text-orange-500 transition-all"
                            title={isPinned ? "Unpin Page" : "Pin Page"}
                          >
                            <Star
                              className={`w-3 h-3 ${isPinned ? "fill-orange-500 text-orange-500" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Grid System Status Panel */}
          <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#07090C]/20 space-y-3">
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    System Status
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    NORMAL
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div className="p-1.5 bg-[#11161d] rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block">Frequency</span>
                    <span className="font-bold text-slate-200">49.98 Hz</span>
                  </div>
                  <div className="p-1.5 bg-[#11161d] rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block">Voltage</span>
                    <span className="font-bold text-slate-200">407 kV</span>
                  </div>
                  <div className="p-1.5 bg-[#11161d] rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block">ACE</span>
                    <span className="font-bold text-red-400">-12.4 MW</span>
                  </div>
                  <div className="p-1.5 bg-[#11161d] rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block">Res. Margin</span>
                    <span className="font-bold text-emerald-400">18.6%</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-800/60 text-[9px] font-mono text-slate-500 space-y-1">
                  <div>
                    Data Source: <span className="text-slate-400">POSOCO / NLDC</span>
                  </div>
                  <div>
                    Last Sync:{" "}
                    <span className="text-slate-400">
                      {new Date().toLocaleTimeString("en-US", { hour12: false })} IST
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDataQuality(true)}
                  className="w-full mt-1.5 py-1 px-2 border border-[#FF7A1A]/30 hover:border-[#FF7A1A]/60 bg-[#FF7A1A]/5 hover:bg-[#FF7A1A]/10 text-white rounded text-[10px] font-mono transition-all"
                >
                  View Data Quality
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
                  title="System Status: Normal"
                />
                <span className="text-[9px] font-mono font-bold text-slate-400">49.98</span>
              </div>
            )}
          </div>
        </aside>

        {/* Center Workspace Canvas (Remaining space between left sidebar and right context panel) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Active Workspace Viewport */}
          <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50/10 dark:bg-[#07090C]/10 flex flex-col">
            <div className="flex-1 w-full p-4 md:p-6 lg:p-8 select-text">{children}</div>
          </main>

          {/* Right Context Panel (Display contextual info only) */}
          <aside className="w-80 border-l border-slate-200 dark:border-[#1E293B] bg-[#07090C] hidden xl:flex flex-col h-full flex-shrink-0">
            <RightContextPanel />
          </aside>
        </div>
      </div>

      {/* Data Quality Modal */}
      {showDataQuality && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDataQuality(false)}
        >
          <div
            className="bg-[#0B0E13] border border-[#1E293B] rounded-lg shadow-2xl w-full max-w-lg p-6 space-y-5 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Telemetry Data Quality Report
              </h2>
              <button
                onClick={() => setShowDataQuality(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-t border-[#1E293B] pt-4 space-y-3">
              {[
                { label: "SCADA Telemetry Feed", status: "LIVE", quality: 99.2, color: "emerald" },
                { label: "PMU Phasor Data", status: "LIVE", quality: 97.8, color: "emerald" },
                { label: "Weather Station Feed", status: "LIVE", quality: 95.4, color: "emerald" },
                { label: "Market Price Feed", status: "DELAYED", quality: 88.1, color: "yellow" },
                { label: "Demand Forecast Model", status: "LIVE", quality: 94.6, color: "emerald" },
                {
                  label: "Solar Irradiance Sensor",
                  status: "LIVE",
                  quality: 96.3,
                  color: "emerald",
                },
                { label: "Wind Anemometer Array", status: "DEGRADED", quality: 72.5, color: "red" },
              ].map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#1E293B]/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${d.color === "emerald" ? "bg-emerald-500" : d.color === "yellow" ? "bg-yellow-500 animate-pulse" : "bg-red-500 animate-pulse"}`}
                    />
                    <span className="text-slate-300">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-bold uppercase ${d.color === "emerald" ? "text-emerald-400" : d.color === "yellow" ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {d.status}
                    </span>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.color === "emerald" ? "bg-emerald-500" : d.color === "yellow" ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${d.quality}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-10 text-right">{d.quality}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 bg-[#151A21] rounded border border-[#1E293B] text-center">
                <span className="block text-[9px] text-slate-500 uppercase">Avg Quality</span>
                <span className="text-lg font-bold text-emerald-400">92.0%</span>
              </div>
              <div className="p-2.5 bg-[#151A21] rounded border border-[#1E293B] text-center">
                <span className="block text-[9px] text-slate-500 uppercase">Active Feeds</span>
                <span className="text-lg font-bold text-orange-400">7 / 7</span>
              </div>
              <div className="p-2.5 bg-[#151A21] rounded border border-[#1E293B] text-center">
                <span className="block text-[9px] text-slate-500 uppercase">Last Refresh</span>
                <span className="text-lg font-bold text-slate-300">
                  {new Date().toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
            </div>
            <div className="text-[9px] text-slate-500 pt-1">
              Data sourced from POSOCO / NLDC telemetry gateway. Quality scores computed over the
              last 60-minute rolling window.
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <footer className="h-7 border-t border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0E13] px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM COMPLIANCE: NERC-CIP ACTIVE
          </span>
          <span className="hidden sm:inline border-l border-slate-200 dark:border-[#1E293B] pl-4">
            SECURE SESSION // TLS 1.3
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#FF7A1A]" />
            LATENCY: 12ms
          </span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            SIMULATION ENGINE: STANDBY
          </span>
        </div>
      </footer>

      {/* Command Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
          <div
            className="w-full max-w-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] shadow-2xl flex flex-col overflow-hidden max-h-[400px]"
            onKeyDown={handlePaletteKeyDown}
          >
            {/* Palette Header */}
            <div className="p-3 border-b border-slate-200 dark:border-[#2A313C] flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Type a module name to navigate..."
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Palette Body */}
            <div className="flex-1 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-[#2A313C]/20">
              {filteredPaletteItems.length > 0 ? (
                filteredPaletteItems.map((item, idx) => {
                  const IconComp = item.icon || LayoutDashboard;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsPaletteOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-orange-500/10 text-orange-500 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]/40 hover:text-slate-200"
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-slate-500" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-[#1A202C] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#2A313C]/40">
                        {item.path}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching modules found.
                </div>
              )}
            </div>

            {/* Palette Footer */}
            <div className="p-2 bg-slate-50 dark:bg-[#0B0D11] border-t border-slate-200 dark:border-[#2A313C] flex items-center justify-between text-[9px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Enter to select</span>
              </div>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
