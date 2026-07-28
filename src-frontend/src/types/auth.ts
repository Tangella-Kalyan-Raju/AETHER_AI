// Grid Policy Orchestrator (GPO) Authentication Types
// Path: src-frontend/src/types/auth.ts

export type UserRole =
  "Super Admin" | "Grid Administrator" | "Operations Engineer" | "Policy Analyst" | "Viewer";

export interface User {
  id: string | number;
  email: string;
  full_name: string;
  organization: string;
  role: UserRole;
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
    organization?: string;
    role?: UserRole;
  };
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  organization: string;
  created_at: string;
  updated_at: string;
  is_mfa_enabled?: boolean;
  security_clearance_level?: number;
  last_login_at?: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}
