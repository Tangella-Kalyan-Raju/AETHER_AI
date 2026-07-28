# Enterprise Grid Policy Orchestrator Architecture

## Overview
The Grid Policy Orchestrator (GPO) Phase 5 represents the comprehensive orchestration of multiple intelligence layers, progressing from raw telemetry ingestion to high-level artificial intelligence reasoning.

## Data Flow Pipeline

### 1. Integration Layer (Phase 5.1)
- **Component**: `IntegrationScheduler`, `BaseIntegrationConnector`
- **Function**: Polls real-world telemetry from weather APIs, SCADA systems, and solar trackers.
- **Protocol**: HTTP/MQTT into normalized SQLite Timeseries data (`telemetry_timeseries`).

### 2. Digital Twin & State (Phase 5.2)
- **Component**: `DigitalTwinRouter`, Network Topology Models.
- **Function**: Represents the physical layout of buses, generators, and loads. Maps live telemetry to topological nodes in real-time.

### 3. Forecasting Engine (Phase 5.3)
- **Component**: `ForecastManager`, `ForecastValidationEngine`
- **Function**: Takes current state and applies heuristic physics (and eventual ML models) to project the grid state 30m, 1h, 3h, 6h, 12h, and 24h into the future.
- **Storage**: `forecast_records`

### 4. Optimization Engine (Phase 5.4)
- **Component**: `OptimizationManager`, `GridConstraintValidator`
- **Function**: Translates the forecast into actionable strategies. For instance, if solar drops, it calculates the exact battery discharge required.
- **Storage**: `optimization_recommendations`

### 5. AI Decision Intelligence (Phase 5.5)
- **Component**: `AIDecisionEngine`, `LLMGateway`
- **Function**: Ingests telemetry, forecasts, and optimized recommendations to formulate a context window. Prompts the LLM to generate explainable, operator-friendly actions answering *why* a specific strategy was chosen.
- **Security**: Logs every interaction in `ai_decision_logs`.

## Production Validation (Phase 5.6)
The platform is fully integrated, unit-tested, and E2E-tested via pytest. All mocked "placeholder" data has been stripped in favor of the active pipeline sequence.

Ready for Phase 6.
