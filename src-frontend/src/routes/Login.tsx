import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Grid Policy Orchestrator (GPO) Enterprise Login Page (Phase 2.2 Rebuild)
// Path: src-frontend/src/routes/Login.tsx

export default function Login() {
  const { signInWithEmail, signInWithGoogle, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touched state for validation trigger on blur
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Real-time Validation Checks
  const isEmailEmpty = !email.trim();
  const isEmailValidFormat = /\S+@\S+\.\S+/.test(email.trim());
  const emailError = emailTouched
    ? isEmailEmpty
      ? "Email address is required."
      : !isEmailValidFormat
        ? "Please enter a valid email address (e.g., operator@utility.org)."
        : null
    : null;

  const isPasswordEmpty = !password;
  const isPasswordMinLength = password.length >= 4;
  const passwordError = passwordTouched
    ? isPasswordEmpty
      ? "Password is required."
      : !isPasswordMinLength
        ? "Password must be at least 4 characters in length."
        : null
    : null;

  // Validation status
  const isFormValid =
    !isEmailEmpty && isEmailValidFormat && !isPasswordEmpty && isPasswordMinLength;

  // Map Supabase errors to professional, operator-safe messages
  const getProfessionalErrorMessage = (rawError: string | null) => {
    if (!rawError) return null;
    const err = rawError.toLowerCase();
    if (
      err.includes("invalid") &&
      (err.includes("credential") || err.includes("login") || err.includes("grant"))
    ) {
      return "Incorrect email or password.";
    }
    if (
      err.includes("fetch") ||
      err.includes("network") ||
      err.includes("connection") ||
      err.includes("connect")
    ) {
      return "Unable to connect to the authentication server.";
    }
    return "Authentication failed. Please verify your credentials and try again.";
  };

  const displayAuthError = getProfessionalErrorMessage(authError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate("/");
    } catch (err: any) {
      console.error("[GPO-AUTH-UI] Signin failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("[GPO-AUTH-UI] Google Sign-in failure:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0E13] text-[#F8FAFC] font-sans antialiased selection:bg-orange-500/20">
      {/* ── Left Side: branding, tagline, description, vector illustration ── */}
      <div className="hidden md:flex flex-col justify-between p-8 sm:p-12 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[#2A313C] bg-[#07090C]/50 relative overflow-hidden select-none min-h-[350px] lg:min-h-screen">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2A313C" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-[#151A21] border border-[#2A313C]">
            <svg className="w-6 h-6 text-[#FF7A1A]" viewBox="0 0 256 256" fill="currentColor">
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
          </div>
          <span className="font-heading text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
            Grid Policy Orchestrator
          </span>
        </div>

        {/* Tagline & Technical Schematic Vector */}
        <div className="my-8 lg:my-auto flex flex-col gap-8 max-w-lg relative z-10">
          <div>
            <h2 className="font-heading text-xl lg:text-2xl font-bold uppercase tracking-tight text-[#F8FAFC] mb-3 leading-snug">
              Real-time decision intelligence and autonomous policy enforcement for electrical
              utility control rooms.
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Automate localized grid stabilization, DER dispatch, and load-balancing operations
              within strict compliance boundaries. Secure topological connections against
              contingency events with millisecond response paths.
            </p>
          </div>

          {/* ASCII Schematic Card */}
          <div className="border border-[#2A313C] bg-[#151A21]/60 rounded-[3px] p-6 font-mono text-[11px] text-[#94A3B8] shadow-card">
            <div className="flex justify-between items-center border-b border-[#2A313C] pb-3 mb-4">
              <span className="text-[#FF7A1A] font-semibold flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] animate-pulse"></span>
                Topological Schematic // SECURE_CORE
              </span>
              <span className="text-[10px] text-[#64748B]">CIP-002 ACTIVE</span>
            </div>

            <div className="space-y-2 text-[#64748B] leading-tight">
              <div>[FEEDER_RENO_1A] --------- [TRIP_GATE_SHIELD] --------- [BUS_BAR_101]</div>
              <div className="pl-24 text-emerald-500">| [NOMINAL_STATE]</div>
              <div className="pl-24">v</div>
              <div className="flex items-center gap-1 text-[#FF7A1A] font-semibold bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 p-2 rounded-[2px]">
                <ShieldCheck className="w-4 h-4 text-[#FF7A1A] flex-shrink-0" />
                <span>POLICY VALIDATION: PASSED // BOUNDARY SECURITY SIGNATURE</span>
              </div>
              <div className="pl-24 text-slate-500">v</div>
              <div>[DIST_TRANSFORMER] -------- [LOAD_BALANCER_AI] -------- [USER_GATE_AUTH]</div>
              <div className="pl-28 text-[#FFA940] font-semibold animate-pulse">
                [AWAITING_CREDENTIALS]
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#2A313C] text-[10px]">
              <div>
                <div className="text-[#64748B] uppercase">ENCRYPTION</div>
                <div className="font-semibold text-[#F8FAFC]">AES-GCM-256</div>
              </div>
              <div>
                <div className="text-[#64748B] uppercase">TUNNEL</div>
                <div className="font-semibold text-[#F8FAFC]">TLS v1.3</div>
              </div>
              <div>
                <div className="text-[#64748B] uppercase">CONTROLLER</div>
                <div className="font-semibold text-[#F8FAFC]">RTU_AUTO_SHIELD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer Compliance Tag */}
        <div className="relative z-10 text-[10px] font-mono text-[#64748B] tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            NERC CIP COMPLIANCE DOMAIN
          </span>
          <span>v1.5.0-SECURE</span>
        </div>
      </div>

      {/* ── Right Side: Login Card ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 md:px-24 bg-[#0B0E13] relative min-h-[500px]">
        <div className="w-full max-w-[420px] mx-auto bg-[#151A21]/40 border border-[#2A313C]/60 rounded-[4px] p-6 sm:p-8 shadow-card backdrop-blur-sm">
          {/* Card Header (ONLY Logo, GPO Title, and Welcome Message) */}
          <div className="mb-8 flex flex-col items-center text-center">
            {/* GPO Logo */}
            <div className="flex items-center justify-center w-12 h-12 rounded-[4px] bg-[#151A21] border border-[#2A313C] mb-4">
              <svg className="w-8 h-8 text-[#FF7A1A]" viewBox="0 0 256 256" fill="currentColor">
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-[#F8FAFC] uppercase">
              Grid Policy Orchestrator
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed max-w-[280px]">
              Welcome back. Access the GPO operations console.
            </p>
          </div>

          {/* Authentication Failure Banner */}
          {displayAuthError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="mb-6 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[2px] text-xs text-[#EF4444] font-mono flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block uppercase">
                  Security Event: Authentication Error
                </span>
                <span className="text-[#F8FAFC] mt-0.5 block">{displayAuthError}</span>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-2 tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched) clearError();
                  }}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  placeholder="operator@utility-domain.org"
                  className={`w-full bg-[#151A21] border ${
                    emailError
                      ? "border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]"
                      : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                  } text-sm text-[#F8FAFC] pl-10 pr-4 py-2.5 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                />
              </div>
              {emailError && (
                <p
                  id="email-error"
                  className="text-xs text-[#EF4444] mt-1.5 font-mono"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="text-[11px] font-mono font-semibold uppercase text-[#94A3B8] tracking-wider"
                >
                  Password
                </label>
                <a
                  href="#forgot-password"
                  className="text-[10px] font-mono text-[#FF7A1A] hover:text-[#FFA940] transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Contact your utility system administrator to reset credentials.");
                  }}
                >
                  FORGOT PASSWORD?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordTouched) clearError();
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  placeholder="••••••••••••"
                  className={`w-full bg-[#151A21] border ${
                    passwordError
                      ? "border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]"
                      : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                  } text-sm text-[#F8FAFC] pl-10 pr-10 py-2.5 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#94A3B8] transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p
                  id="password-error"
                  className="text-xs text-[#EF4444] mt-1.5 font-mono"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me controls */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                disabled={isSubmitting}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#FF7A1A] rounded-[1px] bg-[#151A21] border-[#2A313C] focus:ring-offset-0 focus:ring-0 disabled:opacity-50"
              />
              <label
                htmlFor="remember-me"
                className="ml-2.5 text-xs text-[#94A3B8] select-none cursor-pointer disabled:opacity-50"
              >
                Remember Me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-[#FF7A1A] hover:bg-[#E06510] disabled:bg-[#FF7A1A]/40 disabled:border-transparent disabled:text-[#F8FAFC]/50 text-[#F8FAFC] text-xs font-heading font-semibold uppercase tracking-wider py-3 rounded-[2px] transition-all flex items-center justify-center gap-2 border border-[#FF7A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151A21]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#F8FAFC] border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING SECURE KEY...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A313C]"></div>
            </div>
            <span className="relative z-10 px-3 bg-[#151A21] text-[9px] font-mono text-[#64748B] uppercase tracking-widest">
              Security OAuth Credentials
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-[#151A21] hover:bg-[#1C222B] disabled:opacity-50 text-[#F8FAFC] text-xs font-heading font-semibold uppercase tracking-wider py-3 rounded-[2px] border border-[#2A313C] hover:border-[#94A3B8]/30 transition-all flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A1A]"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4 text-[#F8FAFC]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Create Account Link Footer */}
          <div className="mt-8 text-center text-xs text-[#94A3B8] border-t border-[#2A313C]/40 pt-4">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#FF7A1A] hover:text-[#FFA940] font-semibold underline-offset-4 hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF7A1A]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
