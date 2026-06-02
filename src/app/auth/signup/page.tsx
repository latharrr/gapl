"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUpWithEmail, signInWithGoogle, createUserDocument } from "@/lib/firebase";
import { ArrowLeft } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password);
      // Save profile to Firestore — non-blocking, Firestore may not be set up yet
      try {
        await createUserDocument(result.user, { displayName: name });
      } catch {
        console.warn("Firestore not configured yet — skipping user document creation");
      }
      trackEvent("signup", {
        userId: result.user.uid,
        email: result.user.email || email,
        name: name,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      try {
        await createUserDocument(result.user);
      } catch {
        console.warn("Firestore not configured yet — skipping user document creation");
      }
      trackEvent("signup", {
        userId: result.user.uid,
        email: result.user.email || "",
        name: result.user.displayName || "Explorer",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || "Google sign up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-[#111111] p-12 justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="text-white text-sm font-semibold">Gapl</span>
        </Link>

        <div className="space-y-6">
          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-danger-bg rounded-full flex items-center justify-center">
                <span className="text-danger text-xs font-bold">✕</span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Start with evidence</p>
                <p className="text-sm font-medium text-white">Understand the rejection risk</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Find the visible skill, project, and deployment gaps that weaken your application.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-px h-6 bg-white/10" />
          </div>

          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-success-bg rounded-full flex items-center justify-center">
                <span className="text-success text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Build the next signal</p>
                <p className="text-sm font-medium text-white">Work through a focused roadmap</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Return with stronger evidence and compare how your readiness estimate changes.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          Free to start. No card required.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-ink tracking-tight mb-1">Get started free</h1>
          <p className="text-sm text-ink-muted mb-8">Create your Gapl account</p>

          {/* Google */}
          <Button
            variant="outline"
            size="lg"
            className="w-full mb-4"
            loading={googleLoading}
            onClick={handleGoogleSignup}
            id="google-signup-btn"
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

          {/* Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Aryan Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              id="signup-name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="signup-email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="signup-password"
            />

            {error && (
              <p className="text-xs text-danger bg-danger-bg px-3 py-2 rounded-lg border border-danger-border">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              id="signup-submit-btn"
            >
              Create account
            </Button>
          </form>

          <p className="mt-4 text-xs text-ink-faint text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 hover:text-primary-700">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>.
          </p>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
