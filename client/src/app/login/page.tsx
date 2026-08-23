"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../supabase/browserClient";
import { useRouter } from "next/navigation";
import { useTheme } from "../../lib/ThemeContext";
import ThemeToggle from "../../components/ui/ThemeToggle";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import AnimatedGrid from "../../components/AnimatedGrid";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (mode === "register" && password !== confirmPassword)
      return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        const userId = authData.user?.id;
        const { data: workspaces } = await supabase
          .from("workspace")
          .select("id, onboarding_completed")
          .eq("cust_id", userId);

        if (!workspaces || workspaces.length === 0 || !workspaces.some((w) => w.onboarding_completed)) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: email.split("@")[0] },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Account created! Check your email for confirmation, then sign in."
        );
        setMode("login");
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--fn-bg)]">
      {/* Left Side — Auth Form (40%) */}
      <div className="absolute top-6 left-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)] hover:bg-[var(--fn-elevated)] transition-all cursor-pointer group shadow-xs active:scale-95"
          title="Return to Home"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>
      <div className="w-full lg:w-[40%] flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo with text */}
          <div>
            <div className="flex items-center mb-5 justify-between">
              <Link href="/" title="FoxxNuts Home">
                <img
                  src="/light_with_text.png"
                  alt="FoxxNuts"
                  className="h-10 sm:h-12 w-auto object-contain select-none hidden [.light_&]:block cursor-pointer"
                />
                <img
                  src="/dark_with_text.png"
                  alt="FoxxNuts"
                  className="h-10 sm:h-12 w-auto object-contain select-none block [.light_&]:hidden cursor-pointer"
                />
              </Link>
              <ThemeToggle className="hover:bg-[var(--fn-surface)] border border-[var(--fn-border)]" />
            </div>

            <h1 className="text-2xl font-semibold text-[var(--fn-text)] tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[var(--fn-text-secondary)] mt-1">
              {mode === "login"
                ? "Sign in to your FoxxNuts workspace"
                : "Get started with FoxxNuts"}
            </p>
          </div>

          {/* Google Auth */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium bg-[var(--fn-surface)] text-[var(--fn-text)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] hover:bg-[var(--fn-elevated)] hover:border-[var(--fn-text-tertiary)] transition-colors duration-200 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--fn-border)]" />
            <span className="text-xs text-[var(--fn-text-tertiary)]">or</span>
            <div className="flex-1 h-px bg-[var(--fn-border)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />

            {mode === "register" && (
              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}

            {error && (
              <div className="text-xs text-[var(--fn-error)] bg-[var(--fn-error)]/5 border border-[var(--fn-error)]/20 px-3 py-2.5 rounded-[var(--fn-radius)]">
                {error}
              </div>
            )}

            {message && (
              <div className="text-xs text-[var(--fn-success)] bg-[var(--fn-success)]/5 border border-[var(--fn-success)]/20 px-3 py-2.5 rounded-[var(--fn-radius)]">
                {message}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {/* Toggle Mode */}
          <p className="text-sm text-center text-[var(--fn-text-secondary)]">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[var(--fn-accent)] hover:underline font-medium cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[var(--fn-accent)] hover:underline font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Side — Animated Grid Background with Content Overlay (60%) */}
      <div className="hidden lg:flex lg:w-[60%] items-center justify-center bg-[var(--fn-bg)] border-l border-[var(--fn-border)] relative overflow-hidden">
        {/* Animated grid canvas */}
        <AnimatedGrid />

        {/* Subtle radial glow at top-left for depth */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,0,30,0.06)_0%,transparent_70%)] pointer-events-none" />

        {/* Content overlay */}
        <div className="relative z-10 max-w-md px-12 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-[var(--fn-text)] tracking-tight leading-tight">
              Turn your business
              <br />
              knowledge into an
              <br />
              <span className="text-[var(--fn-accent)]">AI assistant</span>
            </h2>
            <p className="text-sm text-[var(--fn-text-secondary)] mt-4 leading-relaxed">
              Upload your documents, configure your chatbot, and embed it on any
              website — all in minutes.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Upload your knowledge", desc: "PDF documents " },
              { label: "Configure your AI", desc: "Choose models, tune behavior" },
              { label: "Test instantly", desc: "Chat with your knowledge base" },
              { label: "Embed anywhere", desc: "One script tag, any website" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-[var(--fn-radius)] border border-[var(--fn-border)]/60 bg-[var(--fn-surface)]/60 backdrop-blur-md"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--fn-accent)]/10 border border-[var(--fn-accent)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--fn-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--fn-text)]">
                    {feature.label}
                  </p>
                  <p className="text-xs text-[var(--fn-text-tertiary)]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini chat preview */}
          <div className="border border-[var(--fn-border)]/60 rounded-[var(--fn-radius-lg)] overflow-hidden bg-[var(--fn-surface)]/60 backdrop-blur-md">
            <div className="h-8 bg-[var(--fn-accent)] flex items-center px-3 gap-2">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-[10px] text-white/80 font-medium">AI Assistant</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="bg-[var(--fn-elevated)]/80 border border-[var(--fn-border)] rounded-lg rounded-bl-none px-3 py-2 max-w-[80%]">
                <p className="text-xs text-[var(--fn-text-secondary)]">
                  Hi! How can I help you today?
                </p>
              </div>
              <div className="flex justify-end">
                <div className="bg-[var(--fn-accent)] rounded-lg rounded-br-none px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-white">
                    What&apos;s your refund policy?
                  </p>
                </div>
              </div>
              <div className="bg-[var(--fn-elevated)]/80 border border-[var(--fn-border)] rounded-lg rounded-bl-none px-3 py-2 max-w-[85%]">
                <p className="text-xs text-[var(--fn-text-secondary)]">
                  Based on your documentation, your refund policy allows returns within 30 days...
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
