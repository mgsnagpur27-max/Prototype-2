"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Loader2, RefreshCw, ExternalLink } from "lucide-react";

export default function SecretDownloadPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "downloading">("loading");

  const handleDownload = useCallback(() => {
    setStatus("downloading");
    
    const downloadUrl = `${window.location.origin}/api/download-source?t=${Date.now()}`;
    
    window.parent.postMessage({ 
      type: "OPEN_EXTERNAL_URL", 
      data: { url: downloadUrl } 
    }, "*");

    setTimeout(() => {
      setStatus("ready");
    }, 3000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("ready");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-white/30">
      <div className="relative flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <div className="absolute inset-0 bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/[0.03] ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
          {status === "loading" ? (
            <Loader2 className="h-10 w-10 text-white/60 animate-spin" />
          ) : status === "downloading" ? (
            <RefreshCw className="h-10 w-10 text-white/60 animate-spin" />
          ) : (
            <Download className="h-10 w-10 text-white/60" />
          )}
        </div>

        <div className="text-center relative">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Source Code Export
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            Your project files are ready for download. We'll open the download link in a new tab to bypass security restrictions.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full relative">
          <button
            onClick={handleDownload}
            disabled={status === "loading"}
            className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-5 font-bold text-black transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "downloading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting Download...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
                Download Project ZIP
              </>
            )}
          </button>

          <a
            href="/api/download-source"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Try direct link if button fails
          </a>
        </div>

        <div className="mt-4 pt-8 border-t border-white/5 w-full">
          <div className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-medium text-center">
            <span>Secure Generator v2.0</span>
            <span>Archive includes: src, public, config</span>
            <span className="text-zinc-500">+ beesto-4k.svg (3840×2160)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
