import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthorization } from "../hooks/useAuthorization";
import { useAuth } from "../hooks/useAuth";
import { LoadingPlaceholder } from "../core/LoadingPlaceholder";

// Grid Policy Orchestrator (GPO) Permission Guard for Route Protection
// Path: src-frontend/src/components/PermissionGuard.tsx

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: string;
}

export function PermissionGuard({ children, requiredPermission }: PermissionGuardProps) {
  const { checkPermission } = useAuthorization();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPlaceholder />;
  }

  const isAllowed = checkPermission(requiredPermission);

  if (!isAllowed) {
    console.warn(
      `[GPO-AUTH] Access denied for permission: ${requiredPermission}. Redirecting to /unauthorized.`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default PermissionGuard;
