import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Grid Policy Orchestrator (GPO) Authentication Hook
// Path: src-frontend/src/hooks/useAuth.ts

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
