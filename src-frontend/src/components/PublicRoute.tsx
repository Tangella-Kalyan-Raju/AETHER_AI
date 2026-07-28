import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingPlaceholder } from "../core/LoadingPlaceholder";

// Grid Policy Orchestrator (GPO) Public Route Guard (Redirects away from auth screens)
// Path: src-frontend/src/components/PublicRoute.tsx

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default PublicRoute;
