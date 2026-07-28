import { UserRole } from "../types/auth";

// Grid Policy Orchestrator (GPO) Authentication Constants
// Path: src-frontend/src/constants/auth.ts

export const ENTERPRISE_ROLES: UserRole[] = [
  "Super Admin",
  "Grid Administrator",
  "Operations Engineer",
  "Policy Analyst",
  "Viewer",
];

export const DEFAULT_ROLE: UserRole = "Viewer";
export const NERC_CIP_DOMAINS = "NERC CIP-002 — CIP-014";
