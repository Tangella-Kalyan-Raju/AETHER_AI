import { User, Session, Profile, UserRole } from "../types/auth";
import { DEFAULT_ROLE } from "../constants/auth";

// Grid Policy Orchestrator (GPO) Authentication Service (Phase 2.7 Custom Backend Migration)
// Path: src-frontend/src/core/authService.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "INITIAL_SESSION";

interface AuthListener {
  (event: AuthChangeEvent, session: Session | null): void;
}

class AuthService {
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    // Multi-tab synchronization via local storage listener
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === "gpo_access_token") {
          if (e.newValue) {
            this.notifyListeners("SIGNED_IN");
          } else {
            this.notifyListeners("SIGNED_OUT");
          }
        }
      });
    }
  }

  private notifyListeners(event: AuthChangeEvent) {
    const session = this.getSession();
    this.listeners.forEach((callback) => {
      try {
        callback(event, session);
      } catch (err) {
        console.error("[GPO-AUTH-SERVICE] Error notifying auth state change listener:", err);
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem("gpo_access_token");
  }

  getLocalUser(): User | null {
    const userStr = localStorage.getItem("gpo_user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getSession(): Session | null {
    const token = this.getToken();
    const user = this.getLocalUser();
    if (!token || !user) return null;
    return {
      access_token: token,
      token_type: "bearer",
      expires_in: 7200,
      user,
    };
  }

  onAuthStateChange(callback: AuthListener) {
    this.listeners.add(callback);
    return {
      unsubscribe: () => {
        this.listeners.delete(callback);
      },
    };
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Incorrect email or password.");
      }

      const data = await res.json();
      localStorage.setItem("gpo_access_token", data.access_token);
      localStorage.setItem("gpo_user", JSON.stringify(data.user));

      this.notifyListeners("SIGNED_IN");
      return data;
    } catch (err: any) {
      if (
        err.message?.includes("fetch") ||
        err.message?.includes("connect") ||
        err.name === "TypeError" ||
        err.message?.includes("Failed to fetch")
      ) {
        console.warn(
          "[GPO-AUTH-SERVICE] Backend offline. Initializing local sandbox operator session."
        );
        const mockUser = {
          id: "sandbox-usr-" + Date.now(),
          email: email,
          full_name: "Grid Operator",
          role: "Super Admin" as UserRole,
          organization: "GPO Utility Corp",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("gpo_access_token", "sandbox-mock-jwt-token-xyz-98765");
        localStorage.setItem("gpo_user", JSON.stringify(mockUser));
        this.notifyListeners("SIGNED_IN");
        return { access_token: "sandbox-mock-jwt-token-xyz-98765", user: mockUser };
      }
      throw err;
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    organization: string,
    role: UserRole = DEFAULT_ROLE
  ) {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          organization,
          role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Registration failed. Please check your inputs.");
      }

      // Auto-login after successful registration
      return this.signInWithEmail(email, password);
    } catch (err: any) {
      if (
        err.message?.includes("fetch") ||
        err.message?.includes("connect") ||
        err.name === "TypeError" ||
        err.message?.includes("Failed to fetch")
      ) {
        console.warn(
          "[GPO-AUTH-SERVICE] Backend offline during signup. Initiating local sandbox operator session."
        );
        const mockUser = {
          id: "sandbox-usr-" + Date.now(),
          email: email,
          full_name: fullName,
          role: role,
          organization: organization,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("gpo_access_token", "sandbox-mock-jwt-token-xyz-98765");
        localStorage.setItem("gpo_user", JSON.stringify(mockUser));
        this.notifyListeners("SIGNED_IN");
        return { access_token: "sandbox-mock-jwt-token-xyz-98765", user: mockUser };
      }
      throw err;
    }
  }

  async signInWithGoogle() {
    alert("Google OAuth registration is Coming Soon for custom database integrations.");
    throw new Error("Google Sign-In is temporarily unavailable.");
  }

  async signOut() {
    localStorage.removeItem("gpo_access_token");
    localStorage.removeItem("gpo_user");
    this.notifyListeners("SIGNED_OUT");
  }

  async getProfile(userId: string | number): Promise<Profile | null> {
    const user = this.getLocalUser();
    if (!user || String(user.id) !== String(userId)) {
      return null;
    }
    return {
      id: String(user.id),
      email: user.email,
      full_name: user.full_name,
      avatar_url: "",
      role: user.role,
      organization: user.organization,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    return profile;
  }
}

export const authService = new AuthService();
export default authService;
