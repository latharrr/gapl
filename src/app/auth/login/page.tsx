"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { AuthPanel, AuthMobileBar } from "@/components/brand/AuthPanel";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithEmail, signInWithGoogle, createUserDocument, resetPassword } from "@/lib/firebase";
import { authErrorMessage, safeNextPath } from "@/lib/auth-errors";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = safeNextPath(nextParam);
  const signupHref = nextParam ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup";

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err: unknown) {
      // Don't reveal whether an account exists for this email.
      if ((err as { code?: string })?.code === "auth/user-not-found") setResetSent(true);
      else setError(authErrorMessage(err, "Couldn't send the reset email. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push(next);
    } catch (err: unknown) {
      setError(authErrorMessage(err, "Couldn't sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      await createUserDocument(result.user);
      router.push(next);
    } catch (err: unknown) {
      setError(authErrorMessage(err, "Google sign in failed. Please try again."));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col lg:flex-row">
      <AuthMobileBar />
      <AuthPanel
        headline="Your chart is waiting."
        lines={['See the evidence gaps behind your applications.', 'Work through the next most valuable improvement.', 'Re-check and watch your status move.']}
      />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {resetMode ? (
            <>
              <h1 className="display text-[2.25rem] mb-2">Reset password</h1>
              {resetSent ? (
                <div role="status" className="text-sm text-ink-secondary bg-success-bg border border-success px-3 py-3 rounded-[5px]">
                  If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-muted mb-8">Enter your email and we&apos;ll send you a link to choose a new password.</p>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      id="reset-email"
                    />
                    {error && (
                      <p role="alert" className="text-xs text-danger bg-danger-bg px-3 py-2 rounded-[5px] border border-danger-border">
                        {error}
                      </p>
                    )}
                    <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                      Send reset link
                    </Button>
                  </form>
                </>
              )}
              <p className="mt-6 text-center text-sm text-ink-muted">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetSent(false);
                    setError("");
                  }}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="display text-[2.25rem] mb-2">Welcome back</h1>
              <p className="text-sm text-ink-muted mb-8">Sign in to your Gapl account</p>

              {/* Google */}
              <Button
                variant="outline"
                size="lg"
                className="w-full mb-4"
                loading={googleLoading}
                onClick={handleGoogleLogin}
                id="google-signin-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border-DEFAULT" />
                <span className="text-xs text-ink-faint">or</span>
                <div className="flex-1 h-px bg-border-DEFAULT" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="login-email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="login-password"
                />
                <div className="-mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setError("");
                    }}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-danger bg-danger-bg px-3 py-2 rounded-[5px] border border-danger-border">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  id="login-submit-btn"
                >
                  Sign in
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-muted">
                Don&apos;t have an account?{" "}
                <Link href={signupHref} className="text-primary-600 font-medium hover:text-primary-700">
                  Sign up free
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
