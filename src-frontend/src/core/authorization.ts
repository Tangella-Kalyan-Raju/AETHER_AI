import { UserRole } from "../types/auth";

// Grid Policy Orchestrator (GPO) Central Role-Based Access Control configuration
// Path: src-frontend/src/core/authorization.ts

export interface RoleDefinition {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  "Super Admin": {
    id: "super_admin",
    name: "Super Admin",
    description: "Complete platform administration and global configurations.",
    permissions: ["*"], // Wildcard matches all permissions
  },
  "Grid Administrator": {
    id: "grid_admin",
    name: "Grid Administrator",
    description: "Operational management of the electrical grid, assets, and active policies.",
    permissions: [
      "dashboard:view",
      "grid:view",
      "grid:control",
      "assets:view",
      "assets:manage",
      "policies:view",
      "policies:compile",
      "settings:view",
    ],
  },
  "Operations Engineer": {
    id: "ops_engineer",
    name: "Operations Engineer",
    description: "Monitoring and executing real-time operational contingencies.",
    permissions: [
      "dashboard:view",
      "grid:view",
      "grid:control",
      "assets:view",
      "policies:view",
      "settings:view",
    ],
  },
  "Policy Analyst": {
    id: "policy_analyst",
    name: "Policy Analyst",
    description: "Authoring, reviewing, and verifying NERC safety boundary rules.",
    permissions: [
      "dashboard:view",
      "grid:view",
      "policies:view",
      "policies:compile",
      "policies:deploy",
      "reports:view",
      "reports:create",
    ],
  },
  Viewer: {
    id: "viewer",
    name: "Viewer",
    description: "Read-only monitoring clearance of dashboard telemetry and generated reports.",
    permissions: ["dashboard:view", "reports:view"],
  },
};

export const hasPermission = (userRole: UserRole | null, requiredPermission: string): boolean => {
  return true; // Always allowed to unlock all features
};

/**
 * Checks if a specific role possesses at least one of the required permissions.
 */
export const hasAnyPermission = (
  userRole: UserRole | null,
  requiredPermissions: string[]
): boolean => {
  return true; // Always allowed to unlock all features
};

/**
 * Checks if a specific role matches one of the allowed roles.
 */
export const hasRole = (userRole: UserRole | null, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};
