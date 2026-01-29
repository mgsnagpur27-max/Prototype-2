"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Zap, Sparkles, Shield, Globe, Cpu } from "lucide-react";
import { Logo, LogoIcon } from "@/components/ui/logo";
import { useChatStore } from "@/lib/stores/chat-store";
import { AI_MODELS, AIModel } from "@/lib/stores/ui-store";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "signup">("signup");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const { setPendingMessage } = useChatStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsCheckingAuth(false);
    };
    checkUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (!user) {
      setAuthModalView("signup");
      setShowAuthModal(true);
      return;
    }
    
    setPendingMessage(input.trim(), selectedModel.id);
    router.push("/editor");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const openLoginModal = () => {
    setAuthModalView("login");
    setShowAuthModal(true);
  };

  const openSignupModal = () => {
    setAuthModalView("signup");
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.signOut();
    setUser(null);
  };

  return (
    <div ref={containerRef} className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#000] text-white selection:bg-white/20">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultView={authModalView}
        onSuccess={() => router.push("/editor")}
      />
      
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-full max-w-[1200px] rounded-full bg-white/[0.03] blur-[140px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-black to-transparent" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 md:px-12 bg-black/40 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-10">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-all">Platform</Link>
            <Link href="#" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-all">Solutions</Link>
            <Link href="#" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-all">Pricing</Link>
            <Link href="#" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 hover:text-white transition-all">Enterprise</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-5">
          {!isCheckingAuth && (
            <>
              {user ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors"
                  >
                    Log Out
                  </button>
                  <Link
                    href="/editor"
                    className="group relative flex items-center justify-center overflow-hidden rounded-full bg-white px-6 py-2 text-xs font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="relative z-10">Go to Editor</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={openLoginModal}
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="group relative flex items-center justify-center overflow-hidden rounded-full bg-white px-7 py-2.5 text-xs font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-20">
        <div className="w-full max-w-5xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative flex items-center gap-6 md:gap-10">
              {/* Decorative background glow for the logo area */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-white/[0.03] blur-[60px] rounded-full pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <LogoIcon size={120} className="md:w-[160px] md:h-[160px] lg:w-[200px] lg:h-[200px]" />
              </motion.div>

              <h1 className="relative text-[15vw] md:text-[120px] lg:text-[180px] font-black leading-none tracking-[-0.07em] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                BEESTO
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -top-2 -right-6 text-xl md:text-2xl font-medium tracking-normal text-white/20"
                >
                  ®
                </motion.span>
              </h1>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <p className="text-lg md:text-2xl font-light tracking-tight text-white/40 max-w-xl">
                A powerful IDE <span className="text-white/80 font-medium">reimagined</span> for the era of artificial intelligence.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 w-full max-w-3xl"
          >
            <div className="group relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-white/10 to-white/5 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
              
              <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-1.5 backdrop-blur-2xl shadow-2xl">
                <form onSubmit={handleSubmit} className="relative flex flex-col">
                  <div className="flex flex-col bg-black/40 rounded-[18px] border border-white/[0.05] transition-all focus-within:border-white/20 overflow-hidden">
                    <div className="p-5">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Build something extraordinary..."
                        className="w-full resize-none bg-transparent text-xl font-light text-white placeholder-white/10 focus:outline-none min-h-[60px]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border-t border-white/[0.05]">
                      <div className="relative" ref={modelDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsModelOpen(!isModelOpen)}
                          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all"
                        >
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
                            <Zap className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{selectedModel.name}</span>
                          <ChevronDown className={`h-3 w-3 text-white/20 transition-transform ${isModelOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isModelOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute bottom-full left-0 mb-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0b]/95 backdrop-blur-xl shadow-2xl z-[100]"
                          >
                            <div className="p-1.5">
                              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Available Intelligence</div>
                              {AI_MODELS.map((model) => (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setIsModelOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-4 px-3 py-3 rounded-xl text-left transition-all hover:bg-white/[0.05] ${
                                    selectedModel.id === model.id ? "bg-white/[0.08]" : ""
                                  }`}
                                >
                                  <div className={`h-2 w-2 rounded-full ${selectedModel.id === model.id ? "bg-white" : "bg-white/10"}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">{model.name}</div>
                                    <div className="text-[10px] text-white/30 font-medium tracking-tight">{model.provider}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="group flex items-center justify-center h-11 px-6 rounded-full bg-white text-black hover:bg-zinc-100 disabled:opacity-10 disabled:grayscale transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-95"
                      >
                        <span className="mr-2 text-xs font-bold uppercase tracking-wider">Execute</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {["Create a modern blog", "SaaS Dashboard", "AI Portfolio", "Crypto App"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-5 py-2.5 rounded-full border border-white/[0.05] bg-white/[0.03] text-[11px] font-semibold text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center justify-center py-20 px-8">
        <div className="mb-12 h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
        <div className="flex w-full max-w-5xl flex-col md:flex-row items-center justify-between gap-10 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-10">
            <Logo size="sm" />
            <span>© 2026 BEESTO SYSTEM INC.</span>
          </div>
          <div className="flex items-center gap-10">
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-white transition-colors">Community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
