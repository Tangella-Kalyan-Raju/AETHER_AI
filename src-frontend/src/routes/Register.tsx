import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, Mail, Lock, User, Building, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Grid Policy Orchestrator (GPO) Enterprise Registration Page (Phase 2.3 Rebuild)
// Path: src-frontend/src/routes/Register.tsx

export default function Register() {
  const { signUpWithEmail, signInWithGoogle, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Touched state trackers for real-time validation alerts on blur
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [organizationTouched, setOrganizationTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Real-time Validations
  const isFullNameEmpty = !fullName.trim();
  const isFullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 100;
  const fullNameError = fullNameTouched
    ? isFullNameEmpty
      ? "Full Name is required."
      : !isFullNameValid
        ? "Full name must be between 2 and 100 characters."
        : null
    : null;

  const isOrganizationEmpty = !organization.trim();
  const isOrganizationValid = organization.trim().length >= 2;
  const organizationError = organizationTouched
    ? isOrganizationEmpty
      ? "Organization is required."
      : !isOrganizationValid
        ? "Organization name must be at least 2 characters."
        : null
    : null;

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
  const isPasswordValid = password.length >= 8 && password.length <= 128;
  const passwordError = passwordTouched
    ? isPasswordEmpty
      ? "Password is required."
      : !isPasswordValid
        ? "Password must be between 8 and 128 characters."
        : null
    : null;

  const isConfirmPasswordEmpty = !confirmPassword;
  const isConfirmPasswordMatch = confirmPassword === password;
  const confirmPasswordError = confirmPasswordTouched
    ? isConfirmPasswordEmpty
      ? "Please confirm your password."
      : !isConfirmPasswordMatch
        ? "Passwords do not match."
        : null
    : null;

  // Global Form validity check
  const isFormValid =
    !isFullNameEmpty &&
    isFullNameValid &&
    !isOrganizationEmpty &&
    isOrganizationValid &&
    !isEmailEmpty &&
    isEmailValidFormat &&
    !isPasswordEmpty &&
    isPasswordValid &&
    !isConfirmPasswordEmpty &&
    isConfirmPasswordMatch &&
    termsAccepted;

  // Auto redirect on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  // Professional error mapping
  const getProfessionalErrorMessage = (rawError: string | null) => {
    if (!rawError) return null;
    const err = rawError.toLowerCase();
    if (
      err.includes("already registered") ||
      err.includes("already exists") ||
      err.includes("duplicate")
    ) {
      return "This email address is already registered.";
    }
    if (err.includes("weak password") || err.includes("password should be")) {
      return "The password provided is too weak.";
    }
    if (err.includes("fetch") || err.includes("network") || err.includes("connect")) {
      return "Unable to connect to the authentication server.";
    }
    return "Registration failed. Please check your inputs and try again.";
  };

  const displayAuthError = getProfessionalErrorMessage(authError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFullNameTouched(true);
    setOrganizationTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim(), organization.trim());
      setIsSuccess(true);
    } catch (err: any) {
      console.error("[GPO-AUTH-UI] Email registration submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("[GPO-AUTH-UI] Google sign-up failed:", err);
      setIsSubmitting(false);
    }
  };

  // Success view
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E13] text-[#F8FAFC] font-sans antialiased p-6">
        <div className="max-w-md w-full border border-[#2A313C] bg-[#151A21] p-8 rounded-[4px] shadow-card text-center select-none">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="font-heading text-xl font-bold uppercase tracking-tight mb-2">
            Account Created Successfully
          </h1>
          <p className="text-xs text-[#64748B] font-mono mb-6">[SYS.REGISTRATION-COMPLETE]</p>

          <div className="bg-[#1C222B] border border-[#2A313C] p-4 rounded-[2px] text-xs text-[#94A3B8] leading-relaxed mb-6 space-y-2 text-left">
            <p className="text-[#F8FAFC] font-medium">Welcome to Grid Policy Orchestrator.</p>
            <p>
              Your enterprise workspace is ready. You will be authenticated and redirected
              automatically.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8] font-mono">
            <div className="w-4.5 h-4.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0E13] text-[#F8FAFC] font-sans antialiased selection:bg-orange-500/20">
      {/* ── Left Section: Branding, Tagline, Introduction ── */}
      <div className="hidden md:flex flex-col justify-between p-8 sm:p-12 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[#2A313C] bg-[#07090C]/50 relative overflow-hidden select-none min-h-[350px] lg:min-h-screen">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern-reg" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2A313C" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern-reg)" />
          </svg>
        </div>

        {/* Branding header */}
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

        {/* Tagline & platform intro */}
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

          {/* GPO Security Schematic */}
          <div className="border border-[#2A313C] bg-[#151A21]/60 rounded-[3px] p-6 font-mono text-[11px] text-[#94A3B8] shadow-card">
            <div className="flex justify-between items-center border-b border-[#2A313C] pb-3 mb-4">
              <span className="text-[#FF7A1A] font-semibold uppercase">
                GPO SECURITY ARCHITECTURE
              </span>
              <span className="text-[10px] text-[#64748B]">CIP-004 ACCESS CONTROL</span>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                All GPO operators require formal identification linked to a validated electricity
                transmission / distribution grid owner.
              </p>
              <p className="text-[#64748B]">
                To fulfill NERC CIP compliance auditing requirements, actions are signed using
                public key infrastructure keys associated with the account identity.
              </p>
              <div className="p-2 border border-[#2A313C] bg-[#0B0E13]/50 rounded-[2px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[#F8FAFC] font-semibold text-[10px]">
                  ENTERPRISE RBAC SYSTEM ACTIVE
                </span>
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

      {/* ── Right Section: Registration Card ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 md:px-24 bg-[#0B0E13] relative min-h-[500px] overflow-y-auto">
        <div className="w-full max-w-[460px] mx-auto bg-[#151A21]/40 border border-[#2A313C]/60 rounded-[4px] p-6 sm:p-8 shadow-card backdrop-blur-sm">
          {/* Card Header (ONLY Logo, Title, and caption) */}
          <div className="mb-6 flex flex-col items-center text-center">
            {/* Logo */}
            <div className="flex items-center justify-center w-12 h-12 rounded-[4px] bg-[#151A21] border border-[#2A313C] mb-4">
              <svg className="w-8 h-8 text-[#FF7A1A]" viewBox="0 0 256 256" fill="currentColor">
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-[#F8FAFC] uppercase">
              Grid Policy Orchestrator
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              Register operator profile to submit credentials for NERC validation.
            </p>
          </div>

          {/* Registration Error Banner */}
          {displayAuthError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[2px] text-xs text-[#EF4444] font-mono flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block uppercase">
                  Security Event: Registration Error
                </span>
                <span className="text-[#F8FAFC] mt-0.5 block">{displayAuthError}</span>
              </div>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Organization (Grid Layout for better space utility) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-1.5 tracking-wider"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="full-name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameTouched) clearError();
                    }}
                    onBlur={() => setFullNameTouched(true)}
                    aria-invalid={!!fullNameError}
                    aria-describedby={fullNameError ? "fullname-error" : undefined}
                    placeholder="Jane Doe"
                    className={`w-full bg-[#151A21] border ${
                      fullNameError
                        ? "border-[#EF4444] focus:ring-[#EF4444]"
                        : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                    } text-sm text-[#F8FAFC] pl-10 pr-4 py-2 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                  />
                </div>
                {fullNameError && (
                  <p
                    id="fullname-error"
                    className="text-[10px] text-[#EF4444] mt-1 font-mono"
                    role="alert"
                  >
                    {fullNameError}
                  </p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label
                  htmlFor="organization"
                  className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-1.5 tracking-wider"
                >
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="organization"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={organization}
                    onChange={(e) => {
                      setOrganization(e.target.value);
                      if (organizationTouched) clearError();
                    }}
                    onBlur={() => setOrganizationTouched(true)}
                    aria-invalid={!!organizationError}
                    aria-describedby={organizationError ? "organization-error" : undefined}
                    placeholder="Utility / Grid Owner"
                    className={`w-full bg-[#151A21] border ${
                      organizationError
                        ? "border-[#EF4444] focus:ring-[#EF4444]"
                        : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                    } text-sm text-[#F8FAFC] pl-10 pr-4 py-2 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                  />
                </div>
                {organizationError && (
                  <p
                    id="organization-error"
                    className="text-[10px] text-[#EF4444] mt-1 font-mono"
                    role="alert"
                  >
                    {organizationError}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-1.5 tracking-wider"
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
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                  } text-sm text-[#F8FAFC] pl-10 pr-4 py-2 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                />
              </div>
              {emailError && (
                <p
                  id="email-error"
                  className="text-[10px] text-[#EF4444] mt-1 font-mono"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-1.5 tracking-wider"
              >
                Password
              </label>
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
                  aria-describedby="password-requirements password-error"
                  placeholder="••••••••••••"
                  className={`w-full bg-[#151A21] border ${
                    passwordError
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                  } text-sm text-[#F8FAFC] pl-10 pr-10 py-2 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#94A3B8] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p id="password-requirements" className="text-[10px] text-[#64748B] mt-1 font-mono">
                Password Requirement: Between 8 and 128 characters.
              </p>
              {passwordError && (
                <p
                  id="password-error"
                  className="text-[10px] text-[#EF4444] mt-1 font-mono"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-[11px] font-mono font-semibold uppercase text-[#94A3B8] mb-1.5 tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordTouched) clearError();
                  }}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                  placeholder="••••••••••••"
                  className={`w-full bg-[#151A21] border ${
                    confirmPasswordError
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#2A313C] hover:border-[#94A3B8]/30 focus:border-[#FF7A1A]"
                  } text-sm text-[#F8FAFC] pl-10 pr-4 py-2 rounded-[2px] outline-none transition-all placeholder:text-[#64748B] focus:ring-1 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#FF7A1A]`}
                />
              </div>
              {confirmPasswordError && (
                <p
                  id="confirm-password-error"
                  className="text-[10px] text-[#EF4444] mt-1 font-mono"
                  role="alert"
                >
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Terms and compliance agreement */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                disabled={isSubmitting}
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#FF7A1A] rounded-[1px] bg-[#151A21] border-[#2A313C] focus:ring-offset-0 focus:ring-0 mt-0.5 disabled:opacity-50"
              />
              <label
                htmlFor="terms"
                className="ml-2.5 text-[11px] text-[#94A3B8] select-none cursor-pointer leading-normal disabled:opacity-50"
              >
                I agree that this console is subject to NERC CIP monitoring guidelines. All logs,
                actions, and compilation telemetry will be archived and audited.
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-[#FF7A1A] hover:bg-[#E06510] disabled:bg-[#FF7A1A]/40 disabled:border-transparent disabled:text-[#F8FAFC]/50 text-[#F8FAFC] text-xs font-heading font-semibold uppercase tracking-wider py-3 rounded-[2px] transition-all flex items-center justify-center gap-2 border border-[#FF7A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151A21]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#F8FAFC] border-t-transparent rounded-full animate-spin" />
                  <span>TRANSMITTING OPERATOR SECURITY KEY...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A313C]"></div>
            </div>
            <span className="relative z-10 px-3 bg-[#151A21] text-[9px] font-mono text-[#64748B] uppercase tracking-widest">
              OAuth Registration
            </span>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
            className="w-full bg-[#151A21] hover:bg-[#1C222B] disabled:opacity-50 text-[#F8FAFC] text-xs font-heading font-semibold uppercase tracking-wider py-3 rounded-[2px] border border-[#2A313C] hover:border-[#94A3B8]/30 transition-all flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A1A]"
          >
            <svg className="w-4 h-4 text-[#F8FAFC]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Login Link Footer */}
          <div className="mt-6 text-center text-xs text-[#94A3B8] border-t border-[#2A313C]/40 pt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#FF7A1A] hover:text-[#FFA940] font-semibold underline-offset-4 hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF7A1A]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
