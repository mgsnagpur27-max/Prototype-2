"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Loader2, User, Key, CheckCircle2, X, LogIn, UserPlus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthView = "login" | "signup-step1" | "signup-step2";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultView?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultView = "signup" }: AuthModalProps) {
  const router = useRouter();
  const [view, setView] = useState<AuthView>(defaultView === "login" ? "login" : "signup-step1");
  
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

  useEffect(() => {
    if (isOpen) {
      setView(defaultView === "login" ? "login" : "signup-step1");
      setError("");
    }
  }, [isOpen, defaultView]);

  const isStep1Valid = email && username && password && confirmPassword && password === confirmPassword && password.length >= 6;
  const isStep2Valid = fullName && (geminiApiKey || groqApiKey);
  const isLoginValid = email && password;

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setGeminiApiKey("");
    setGroqApiKey("");
    setError("");
  };

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
    setView("signup-step2");
  };

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

    resetForm();
    onClose();
    onSuccess?.();
    router.refresh();
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

    resetForm();
    onClose();
    onSuccess?.();
    router.refresh();
  };

  const switchToLogin = () => {
    setView("login");
    setError("");
  };

  const switchToSignup = () => {
    setView("signup-step1");
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Logo size="sm" />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5"
                  >
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {view === "login" && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <LogIn className="h-6 w-6 text-white/60" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Welcome back</h2>
                      <p className="text-sm text-white/40 mt-1">Sign in to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
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
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
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
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
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
                        disabled={loading || !isLoginValid}
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

                    <p className="mt-6 text-center text-sm text-white/40">
                      Don&apos;t have an account?{" "}
                      <button onClick={switchToSignup} className="text-white hover:underline font-medium">
                        Create one
                      </button>
                    </p>
                  </motion.div>
                )}

                {view === "signup-step1" && (
                  <motion.div
                    key="signup-step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="h-6 w-6 text-white/60" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Create account</h2>
                      <p className="text-sm text-white/40 mt-1">Step 1 of 2 — Account details</p>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <div className="flex-1 h-1 rounded-full bg-white" />
                      <div className="flex-1 h-1 rounded-full bg-white/10" />
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
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
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
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
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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
                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-zinc-400">
                            <Lock className="h-3.5 w-3.5" />
                            Confirm
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-400">Passwords do not match</p>
                      )}

                      <button
                        type="submit"
                        disabled={!isStep1Valid}
                        className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-white/40">
                      Already have an account?{" "}
                      <button onClick={switchToLogin} className="text-white hover:underline font-medium">
                        Sign in
                      </button>
                    </p>
                  </motion.div>
                )}

                {view === "signup-step2" && (
                  <motion.div
                    key="signup-step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="mb-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Key className="h-6 w-6 text-white/60" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Almost there</h2>
                      <p className="text-sm text-white/40 mt-1">Step 2 of 2 — API Keys & Profile</p>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <div className="flex-1 h-1 rounded-full bg-white" />
                      <div className="flex-1 h-1 rounded-full bg-white" />
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-zinc-400">
                          <User className="h-3.5 w-3.5" />
                          Full Name <span className="text-red-400 text-xs">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          required
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all"
                        />
                      </div>

                      <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-400/80">
                            At least one API key required. Gemini for Gemini models, Groq for LLaMA/DeepSeek.
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
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
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
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all pr-12"
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

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setView("signup-step1")}
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
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
