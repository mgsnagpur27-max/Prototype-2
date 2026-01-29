"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const errorParam = searchParams.get("error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/editor");
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Welcome back
        </h1>
        <p className="text-white/40">Sign in to continue to BEESTO</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <AnimatePresence>
          {(error || errorParam) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl border border-red-500/20 bg-red-500/5"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{error || "Authentication failed. Please try again."}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <Mail className="h-3.5 w-3.5" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <Lock className="h-3.5 w-3.5" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/40">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-white hover:underline font-medium">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[25%] -left-[10%] h-[1000px] w-[1000px] rounded-full bg-white/[0.02] blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-white/[0.015] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 md:py-8">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm font-medium text-white/50 hover:text-white transition-colors"
        >
          Create Account
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-white/40" />}>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-white/20">
        © 2026 BEESTO SYSTEMS INC.
      </footer>
    </div>
  );
}
