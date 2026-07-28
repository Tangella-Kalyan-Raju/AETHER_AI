import { createContext, ReactNode, useEffect, useState, useRef } from "react";
import { User, Session, Profile, UserRole } from "../types/auth";
import { authService } from "../core/authService";
import { DEFAULT_ROLE } from "../constants/auth";

// Grid Policy Orchestrator (GPO) Authentication Context (Phase 2.7 Custom Backend Migration)
// Path: src-frontend/src/context/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    organization: string,
    role?: UserRole
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isManualLogoutRef = useRef(false);
  const wasLoggedInRef = useRef(false);

  const isAuthenticated = !!user;
  const role = profile?.role || null;

  useEffect(() => {
    if (user) {
      wasLoggedInRef.current = true;
    }
  }, [user]);

  const syncProfile = async (currentUser: User) => {
    try {
      const userProfile = await authService.getProfile(currentUser.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (err: any) {
      console.error("[GPO-AUTH] Error syncing profile details:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Load and verify initial session on startup
    const initializeAuth = async () => {
      const token = authService.getToken();
      if (!token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Session verification query returned error status.");
        }

        const userData = await res.json();
        const activeSession = authService.getSession();

        if (isMounted && activeSession) {
          setSession(activeSession);
          setUser(activeSession.user);
          wasLoggedInRef.current = true;
          setProfile({
            id: String(userData.id),
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: "",
            role: userData.role,
            organization: userData.organization,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error("[GPO-AUTH] Startup session restoration failure:", err);
        const activeSession = authService.getSession();
        if (
          activeSession &&
          (token.startsWith("sandbox-") ||
            err.message?.includes("fetch") ||
            err.message?.includes("connect") ||
            err.name === "TypeError" ||
            err.message?.includes("Failed to fetch"))
        ) {
          console.warn(
            "[GPO-AUTH] Server offline or sandbox token detected. Restoring local profile."
          );
          setSession(activeSession);
          setUser(activeSession.user);
          wasLoggedInRef.current = true;
          setProfile({
            id: String(activeSession.user.id),
            email: activeSession.user.email,
            full_name: activeSession.user.full_name || "Grid Operator",
            avatar_url: "",
            role: activeSession.user.role || "Super Admin",
            organization: activeSession.user.organization || "GPO Utility Corp",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          // Clear expired or invalid credentials
          localStorage.removeItem("gpo_access_token");
          localStorage.removeItem("gpo_user");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to custom auth state change notifications (syncs tabs, etc.)
    const subscription = authService.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      console.log(`[GPO-AUTH] Custom Auth event triggered: ${event}`);

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setLoading(true);
        await syncProfile(currentSession.user);
        setLoading(false);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);

        if (wasLoggedInRef.current) {
          if (isManualLogoutRef.current) {
            isManualLogoutRef.current = false;
          } else {
            setError("Your session has expired. Please sign in again.");
          }
        }
        wasLoggedInRef.current = false;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithEmail(email, password);
    } catch (err: any) {
      console.error("[GPO-AUTH] Email login failure:", err);
      setError(err.message || "Incorrect email or password.");
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    organization: string,
    roleOverride?: UserRole
  ) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signUpWithEmail(email, password, fullName, organization, roleOverride);
    } catch (err: any) {
      console.error("[GPO-AUTH] Email signup failure:", err);
      setError(err.message || "Registration failed. Please check your inputs.");
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      console.error("[GPO-AUTH] Google login redirect failure:", err);
      setError(err.message || "Google Sign-In is temporarily unavailable.");
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    isManualLogoutRef.current = true;
    try {
      await authService.signOut();
    } catch (err: any) {
      console.error("[GPO-AUTH] Signout failure:", err);
      setError(err.message || "Signout request failed.");
      isManualLogoutRef.current = false;
      setLoading(false);
      throw err;
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No active session token to refresh.");

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Session refresh query returned error status.");
      }

      const userData = await res.json();
      const activeSession = authService.getSession();

      if (activeSession) {
        setSession(activeSession);
        setUser(activeSession.user);
        setProfile({
          id: String(userData.id),
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: "",
          role: userData.role,
          organization: userData.organization,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error("[GPO-AUTH] Failed to refresh session:", err);
      const activeSession = authService.getSession();
      const token = authService.getToken();
      if (
        activeSession &&
        (token?.startsWith("sandbox-") ||
          err.message?.includes("fetch") ||
          err.message?.includes("connect") ||
          err.name === "TypeError" ||
          err.message?.includes("Failed to fetch"))
      ) {
        console.warn(
          "[GPO-AUTH] Server offline or sandbox token detected. Retaining local session."
        );
        setSession(activeSession);
        setUser(activeSession.user);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setError("Your session has expired. Please sign in again.");
        wasLoggedInRef.current = false;
        await authService.signOut().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    isAuthenticated,
    role,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
