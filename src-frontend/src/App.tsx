import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { TelemetryProvider } from "@/context/TelemetryContext";
import { ErrorBoundary } from "@/core/ErrorBoundary";
import { Layout } from "@/core/Layout";
import { LoadingPlaceholder } from "@/core/LoadingPlaceholder";
import { NotFound } from "@/core/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { PermissionGuard } from "@/components/PermissionGuard";
import { ShieldCheck } from "lucide-react";

// Grid Policy Orchestrator (GPO) Application Core Router (Phase 2.5 Rebuild)
// Path: src-frontend/src/App.tsx

const Home = lazy(() => import("@/routes/Home"));
const Login = lazy(() => import("@/routes/Login"));
const Register = lazy(() => import("@/routes/Register"));
const Unauthorized = lazy(() => import("@/routes/Unauthorized"));
const GridOverview = lazy(() => import("@/routes/GridOverview"));
const AssetWorkspace = lazy(() => import("@/assets/AssetWorkspace"));
const GlobalOperationsDashboard = lazy(() => import("@/dashboard/GlobalOperationsDashboard"));
const DigitalTwin = lazy(() => import("@/routes/DigitalTwin"));
const ScenarioLibrary = lazy(() => import("@/routes/ScenarioLibrary"));
const ScenarioBuilder = lazy(() => import("@/routes/ScenarioBuilder"));
const SimulationControlCenter = lazy(() => import("@/routes/SimulationControlCenter"));
const ImpactAnalysis = lazy(() => import("@/routes/ImpactAnalysis"));
const Reports = lazy(() => import("@/routes/Reports"));
const Settings = lazy(() => import("@/routes/Settings"));
const OperatorTraining = lazy(() => import("@/routes/OperatorTraining"));
const PolicyEngine = lazy(() => import("@/routes/PolicyEngine"));
const Analytics = lazy(() => import("@/routes/Analytics"));
const Admin = lazy(() => import("@/routes/Admin"));
const OptimizationDashboard = lazy(() => import("@/routes/OptimizationDashboard"));
const OptimizationAnalytics = lazy(() => import("@/routes/OptimizationAnalytics"));
const ForecastingWorkspace = lazy(() => import("@/routes/ForecastingWorkspace"));
const DemandForecast = lazy(() => import("@/pages/forecasting/DemandForecast"));
const GenerationForecast = lazy(() => import("@/pages/forecasting/GenerationForecast"));
const WeatherForecast = lazy(() => import("@/pages/forecasting/WeatherForecast"));
const PriceForecast = lazy(() => import("@/pages/forecasting/PriceForecast"));
const FrequencyForecast = lazy(() => import("@/pages/forecasting/FrequencyForecast"));
const VoltageForecast = lazy(() => import("@/pages/forecasting/VoltageForecast"));
const ReserveForecast = lazy(() => import("@/pages/forecasting/ReserveForecast"));
const RenewableForecast = lazy(() => import("@/pages/forecasting/RenewableForecast"));
const BatteryForecast = lazy(() => import("@/pages/forecasting/BatteryForecast"));
const AIDecisionDashboard = lazy(() => import("@/pages/decisions/AIDecisionDashboard"));
const EnterpriseDigitalTwinDashboard = lazy(
  () => import("@/pages/digital-twin/EnterpriseDigitalTwinDashboard")
);
const PredictiveDigitalTwinDashboard = lazy(
  () => import("@/pages/digital-twin/PredictiveDigitalTwinDashboard")
);
const PolicyWorkspace = lazy(() => import("@/routes/PolicyWorkspace"));
const OptimizationPolicyWorkspace = lazy(() => import("@/routes/OptimizationPolicyWorkspace"));
const PolicyBuilderWorkspace = lazy(() => import("@/routes/PolicyBuilderWorkspace"));
const PolicySimulationWorkspace = lazy(() => import("@/routes/PolicySimulationWorkspace"));
const AdaptivePolicyWorkspace = lazy(() => import("@/routes/AdaptivePolicyWorkspace"));
const PolicyDeploymentWorkspace = lazy(() => import("@/routes/PolicyDeploymentWorkspace"));
const OptimizationCenter = lazy(() => import("@/routes/OptimizationCenter"));
const GenerationSources = lazy(() => import("@/routes/GenerationSources"));
const DatasetManagement = lazy(() => import("@/routes/DatasetManagement"));
const DecisionIntelligenceWorkspace = lazy(() => import("@/routes/DecisionIntelligenceWorkspace"));
const EnterpriseAnalyticsCenter = lazy(() => import("@/routes/EnterpriseAnalyticsCenter"));

// Phase 5.2 Dashboards
const EnterpriseDashboard = lazy(() => import("@/dashboard/EnterpriseDashboard"));
const WeatherDashboard = lazy(() => import("@/dashboard/weather/WeatherDashboard"));
const RenewableDashboard = lazy(() => import("@/dashboard/renewable/RenewableDashboard"));
const DemandDashboard = lazy(() => import("@/dashboard/demand/DemandDashboard"));
const CarbonDashboard = lazy(() => import("@/dashboard/carbon/CarbonDashboard"));
const EnergyStorageDashboard = lazy(() => import("@/dashboard/storage/EnergyStorageDashboard"));
const TopologyExplorer = lazy(() => import("@/topology/TopologyExplorer"));
const PowerFlowDashboard = lazy(() => import("@/topology/PowerFlowDashboard"));
const InteractiveMap = lazy(() => import("@/routes/InteractiveMap"));

// Reusable technical placeholder page for restricted modules
function PlaceholderPage({ title, permission }: { title: string; permission: string }) {
  return (
    <div className="space-y-6 py-2 select-text">
      <div>
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Clearance Authorized // {permission}
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          This system module is fully configured under your current clearance permissions.
        </p>
      </div>

      <div className="border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[4px] p-12 text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-2">
          [SYS.MODULE-STANDBY]
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Operational telemetry and dashboard controls for {title} will compile on physical link
          activation.
        </p>
      </div>
    </div>
  );
}

// Wrapper that activates TelemetryProvider only for authenticated routes
function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  return <TelemetryProvider>{children}</TelemetryProvider>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TelemetryProvider>
            <HashRouter>
              <Suspense fallback={<LoadingPlaceholder />}>
                <Routes>
                  {/* Public Auth Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />

                  {/* Protected Application Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <Home />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/grid-overview"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <GridOverview />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <GlobalOperationsDashboard />
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/digital-twin"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <DigitalTwin />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="assets:view">
                          <Layout>
                            <AssetWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/enterprise"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <EnterpriseDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/weather"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <WeatherDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/renewable"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <RenewableDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/demand"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <DemandDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <ForecastingWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/demand"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <DemandForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/generation"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <GenerationForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/weather"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <WeatherForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/price"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <PriceForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/frequency"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <FrequencyForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/voltage"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <VoltageForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/reserve"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <ReserveForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/renewable"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <RenewableForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forecasting/battery"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <BatteryForecast />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/decisions"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <AIDecisionDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/digital-twin"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <EnterpriseDigitalTwinDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/digital-twin/predictive"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <PredictiveDigitalTwinDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dashboard/carbon"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <CarbonDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/storage"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <EnergyStorageDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/topology/explorer"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <TopologyExplorer />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interactive-map"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <InteractiveMap />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/topology/power-flow"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <PowerFlowDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/policy-engine"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <PolicyEngine />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="analytics:view">
                          <Layout>
                            <Analytics />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/optimization-analytics"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="analytics:view">
                          <Layout>
                            <OptimizationAnalytics />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/enterprise-analytics"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="analytics:view">
                          <Layout>
                            <EnterpriseAnalyticsCenter />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/decision-intelligence"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="analytics:view">
                          <Layout>
                            <DecisionIntelligenceWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/optimization"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <OptimizationDashboard />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/optimization-center"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <OptimizationCenter />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/policies"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <PolicyWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/optimization-policy"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <OptimizationPolicyWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/custom-policy-builder"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:compile">
                          <Layout>
                            <PolicyBuilderWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/policy-simulation"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <PolicySimulationWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/adaptive-policy"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <AdaptivePolicyWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/policy-deployment"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="policies:view">
                          <Layout>
                            <PolicyDeploymentWorkspace />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/generation-sources"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <GenerationSources />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dataset-management"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <DatasetManagement />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/simulation"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <SimulationControlCenter />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scenarios"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <ScenarioLibrary />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scenario-builder"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <ScenarioBuilder />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/impact-analysis"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <ImpactAnalysis />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <PlaceholderPage title="Audit History" permission="dashboard:view" />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scada"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <PlaceholderPage title="SCADA Core Console" permission="grid:view" />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ems"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <PlaceholderPage title="EMS Control Console" permission="grid:view" />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dms"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="grid:view">
                          <Layout>
                            <PlaceholderPage title="DMS Control Console" permission="grid:view" />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="reports:view">
                          <Layout>
                            <Reports />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/operator-training"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="dashboard:view">
                          <Layout>
                            <OperatorTraining />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="settings:view">
                          <Layout>
                            <Settings />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard requiredPermission="admin:view">
                          <Layout>
                            <Admin />
                          </Layout>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/unauthorized"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Unauthorized />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NotFound />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </HashRouter>
          </TelemetryProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
