"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Loader2, User, Key, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [fullName, setFullName] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isStep1Valid = email && username && password && confirmPassword && password === confirmPassword && password.length >= 6;
  const isStep2Valid = fullName && (geminiApiKey || groqApiKey);

  const handleNextStep = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        username,
        full_name: fullName,
        gemini_api_key: geminiApiKey || null,
        groq_api_key: groqApiKey || null,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/editor");
    router.refresh();
  };

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
          href="/auth/login"
          className="text-sm font-medium text-white/50 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Create your account
            </h1>
            <p className="text-white/40">
              Step {step} of 2 — {step === 1 ? "Account details" : "API Keys & Profile"}
            </p>
          </div>

          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? "bg-white" : "bg-white/10"}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? "bg-white" : "bg-white/10"}`} />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 rounded-xl border border-red-500/20 bg-red-500/5"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}
                className="space-y-5"
              >
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
                    <User className="h-3.5 w-3.5" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
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
                      minLength={6}
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

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <Lock className="h-3.5 w-3.5" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isStep1Valid}
                  className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <User className="h-3.5 w-3.5" />
                    Full Name <span className="text-red-400 text-xs">*required</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
                  />
                </div>

                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-400/80">
                      At least one API key is required. Gemini for Gemini models, Groq for LLaMA/DeepSeek.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <Key className="h-3.5 w-3.5" />
                    Gemini API Key
                    {geminiApiKey && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <Key className="h-3.5 w-3.5" />
                    Groq API Key
                    {groqApiKey && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  </label>
                  <div className="relative">
                    <input
                      type={showGroqKey ? "text" : "password"}
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                    >
                      {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isStep2Valid}
                    className="group flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-white/20">
        © 2026 BEESTO SYSTEMS INC.
      </footer>
    </div>
  );
}
