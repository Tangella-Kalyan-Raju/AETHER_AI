import { useAuth } from "./useAuth";
import { ROLE_DEFINITIONS, hasPermission, hasAnyPermission, hasRole } from "../core/authorization";
import { UserRole } from "../types/auth";

// Grid Policy Orchestrator (GPO) Authorization Custom Hook
// Path: src-frontend/src/hooks/useAuthorization.ts

export function useAuthorization() {
  const { profile } = useAuth();
  const currentRole = profile?.role || null;

  return {
    role: currentRole,
    permissions: currentRole ? ROLE_DEFINITIONS[currentRole].permissions : [],
    checkPermission: (permission: string) => hasPermission(currentRole, permission),
    checkAnyPermission: (permissions: string[]) => hasAnyPermission(currentRole, permissions),
    checkRole: (roles: UserRole[]) => hasRole(currentRole, roles),
  };
}

export default useAuthorization;
