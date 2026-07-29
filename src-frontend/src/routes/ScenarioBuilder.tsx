import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EventTimeline from "../components/scenarios/EventTimeline";
import EventConfigurator from "../components/scenarios/EventConfigurator";
import api from "../api/axios";
import {
  Save,
  CloudLightning,
  Plus,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Settings,
  Target,
  Map,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function ScenarioBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const cloneScenario = location.state?.scenario;

  const [step, setStep] = useState(1);
  const [scenarioName, setScenarioName] = useState("New Enterprise Scenario");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operational");
  const [scenarioType, setScenarioType] = useState("Peak Load");
  const [severity, setSeverity] = useState("Medium");
  const [region, setRegion] = useState("Global");
  const [timeHorizon, setTimeHorizon] = useState(24);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

  useEffect(() => {
    if (cloneScenario) {
      setScenarioName(`${cloneScenario.name} (Clone)`);
      setDescription(cloneScenario.description || "");
      setCategory(cloneScenario.category || "Operational");
      setScenarioType(cloneScenario.scenario_type || "Peak Load");
      setSeverity(cloneScenario.severity || "Medium");
      setRegion(cloneScenario.region || "Global");
      setTimeHorizon(cloneScenario.time_horizon_hours || 24);
      setEvents(cloneScenario.events || []);
      if ((cloneScenario.events || []).length > 0) {
        setSelectedEventIndex(0);
      }
    }
  }, [cloneScenario]);

  const handleAddEvent = () => {
    const newEvent = {
      event_type: "Weather",
      start_offset_mins: 0,
      duration_mins: 60,
      parameters_json: { impact: "High" },
      order_index: events.length,
    };
    setEvents([...events, newEvent]);
    setSelectedEventIndex(events.length);
  };

  const handleUpdateEvent = (updatedEvent: any) => {
    if (selectedEventIndex !== null) {
      const newEvents = [...events];
      newEvents[selectedEventIndex] = updatedEvent;
      setEvents(newEvents);
    }
  };

  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    const payload = {
      name: scenarioName,
      description,
      category,
      scenario_type: scenarioType,
      severity,
      region,
      time_horizon_hours: timeHorizon,
      status: status,
      trigger_conditions_json: {},
      events: events,
    };
    try {
      await api.post("/api/v1/scenarios/build", payload);
      alert(`Scenario saved successfully as ${status}!`);
      navigate("/scenarios");
    } catch (e) {
      alert("Error saving scenario");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/scenarios")}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#151A21] text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              Enterprise Scenario Builder
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Construct complex operational scenarios and contingency events.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave("DRAFT")}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#151A21] hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-[#2A313C] transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("PUBLISHED")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between px-12 py-4 bg-white dark:bg-[#0B0E13] rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-sm">
        {[
          { num: 1, label: "General & Type", icon: Settings },
          { num: 2, label: "Scope & Environment", icon: Map },
          { num: 3, label: "Event Configuration", icon: Target },
          { num: 4, label: "Review & Save", icon: Sparkles },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                step >= s.num
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 dark:bg-[#151A21] text-slate-500"
              }`}
            >
              <s.icon className="w-4 h-4" />
            </div>
            <span
              className={`text-sm font-semibold hidden md:block ${
                step >= s.num ? "text-slate-900 dark:text-white" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
            {i < 3 && (
              <div className="w-12 h-px bg-slate-200 dark:bg-[#1E293B] mx-4 hidden lg:block" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0B0E13] rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-sm min-h-[50vh] flex flex-col">
        <div className="p-8 flex-1">
          {step === 1 && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-4">
                Step 1: General Information & Classification
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option>Operational</option>
                      <option>Emergency</option>
                      <option>Maintenance</option>
                      <option>Weather</option>
                      <option>Renewable</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Scenario Type
                    </label>
                    <select
                      value={scenarioType}
                      onChange={(e) => setScenarioType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option>Peak Load</option>
                      <option>Generator Failure</option>
                      <option>Transmission Failure</option>
                      <option>Renewable Loss</option>
                      <option>Battery Failure</option>
                      <option>Cyber Attack</option>
                      <option>Extreme Weather</option>
                      <option>N-1 Contingency</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <div className="flex gap-4">
                    {["Low", "Medium", "High", "Critical"].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`px-4 py-2 rounded border text-sm font-bold ${severity === sev ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-transparent border-slate-200 dark:border-[#2A313C] text-slate-500 hover:border-slate-400"}`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-4">
                Step 2: Scope & Environment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option>Global</option>
                    <option>North Grid</option>
                    <option>South Grid</option>
                    <option>East Grid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time Horizon (Hours)
                  </label>
                  <input
                    type="number"
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(parseInt(e.target.value) || 24)}
                    className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded px-4 py-2 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-4">
                Step 3: Event Configuration
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <CloudLightning className="w-4 h-4 text-[#FF7A1A]" />
                        Event Timeline
                      </h3>
                      <button
                        onClick={handleAddEvent}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-[#151A21] text-slate-700 dark:text-slate-300 hover:text-[#FF7A1A] hover:bg-[#FF7A1A]/10 border border-slate-200 dark:border-[#2A313C] rounded text-[11px] font-bold transition-all"
                      >
                        <Plus className="w-3 h-3" /> Add Event
                      </button>
                    </div>
                    <EventTimeline
                      events={events}
                      selectedIndex={selectedEventIndex}
                      onSelect={setSelectedEventIndex}
                    />
                  </div>
                </div>
                <div className="lg:col-span-7 bg-slate-50 dark:bg-[#151A21] rounded-lg border border-slate-200 dark:border-[#2A313C] p-4">
                  {selectedEventIndex !== null && events[selectedEventIndex] ? (
                    <EventConfigurator
                      event={events[selectedEventIndex]}
                      onChange={handleUpdateEvent}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Target className="w-12 h-12 mb-2 opacity-50" />
                      <p>Select an event from the timeline to configure parameters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-4">
                Step 4: Review Scenario
              </h2>
              <div className="bg-slate-50 dark:bg-[#151A21] p-6 rounded-lg border border-slate-200 dark:border-[#2A313C]">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500 font-medium">Name</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">{scenarioName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Type</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">{scenarioType}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Category</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">{category}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Severity</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">{severity}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Region</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">{region}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Time Horizon</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">
                      {timeHorizon} hours
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500 font-medium">Events Configured</dt>
                    <dd className="text-slate-900 dark:text-white font-bold">
                      {events.length} events
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] flex justify-between bg-slate-50 dark:bg-[#151A21] rounded-b-xl">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded font-bold text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(Math.max(1, step + 1))}
              className="px-4 py-2 rounded font-bold text-sm bg-slate-800 dark:bg-slate-700 text-white flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSave("PUBLISHED")}
              className="px-4 py-2 rounded font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Scenario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
