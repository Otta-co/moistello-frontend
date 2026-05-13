"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle, X, Eye, LogOut, Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ALLOWED_EXTENSIONS = [".md", ".html"];

export default function UploadPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [showSamples, setShowSamples] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check existing session
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setLoginError("Enter username and password");
      return;
    }
    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthenticated(true);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Network error");
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setFile(null);
    setStatus("idle");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setStatus("error");
      setMessage("Only .md and .html files are allowed");
      return;
    }
    setFile(f);
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(`Published as /p/${data.slug}`);
        setUploadedUrl(`/p/${data.slug}`);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setStatus("error");
        setMessage(data.error || "Upload failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — try again");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-aurora-violet border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-void auroral-mesh flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-premium rounded-3xl p-8 max-w-sm w-full holo-border"
        >
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl gradient-text">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in to manage uploaded pages
            </p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loggingIn}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loggingIn}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {loginError && (
              <div className="glass rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {loginError}
              </div>
            )}
            <Button
              variant="premium"
              size="lg"
              className="w-full rounded-xl"
              disabled={loggingIn}
              isLoading={loggingIn}
              onClick={handleLogin}
            >
              {loggingIn ? "Signing in..." : "Sign In"}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-6">
            Don&apos;t have an account? Run{" "}
            <code className="glass-whisper px-1 py-0.5 rounded font-mono">node scripts/create-user.js</code>{" "}
            on the server.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Upload Screen ──
  return (
    <div className="min-h-screen bg-void auroral-mesh">
      <header className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
        <div className="glass-strong rounded-2xl h-14 flex items-center justify-between px-4 max-w-4xl mx-auto">
          <Link href="/" className="font-heading font-bold text-lg gradient-text-extended">
            Moistello
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">/upload</span>
            <button
              onClick={handleLogout}
              className="glass-whisper rounded-full p-2 text-muted-foreground hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 px-4 max-w-xl mx-auto pb-24">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-premium rounded-2xl p-8 holo-border"
        >
          <h1 className="font-heading text-2xl gradient-text mb-2">Upload Page</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Drop a .md or .html file. The filename becomes the route.
            <br />
            Example: <code className="glass-whisper px-1.5 py-0.5 rounded font-mono text-xs">about.md</code> → <code className="text-aurora-cyan text-xs">/p/about</code>
          </p>

          {/* Sample download section */}
          <div className="mb-8">
            <button
              onClick={() => setShowSamples(!showSamples)}
              className="glass-whisper rounded-xl px-4 py-2.5 w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:glass transition-all"
            >
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Sample Template
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showSamples ? "rotate-180" : ""}`} />
            </button>
            {showSamples && (
              <div className="mt-2 glass rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Download a sample file to see the expected format. Give it to your agent to prepare content.
                </p>
                <div className="flex gap-2">
                  <a
                    href="/samples/template.md"
                    download="template.md"
                    className="flex-1 glass-strong rounded-lg px-3 py-2 text-sm font-medium text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-aurora-cyan" />
                    .md Sample
                  </a>
                  <a
                    href="/samples/template.html"
                    download="template.html"
                    className="flex-1 glass-strong rounded-lg px-3 py-2 text-sm font-medium text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-aurora-amber" />
                    .html Sample
                  </a>
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
              file
                ? "border-aurora-violet/40 bg-aurora-violet/5"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
            )}
          >
            <input ref={fileRef} type="file" accept=".md,.html" onChange={handleFileSelect} className="hidden" />
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <FileText className="h-8 w-8 text-aurora-cyan" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB → /p/{file.name.replace(/\.[^.]+$/, "")}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="glass-whisper rounded-full p-1.5 hover:text-red-400" aria-label="Remove selected file">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Click to select a file</p>
                <p className="text-muted-foreground/50 text-xs mt-1">.md or .html only</p>
              </>
            )}
          </div>

          {status === "uploading" && (
            <div className="mt-4 glass rounded-xl p-3 flex items-center gap-2 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-aurora-violet border-t-transparent rounded-full" />
              Uploading...
            </div>
          )}
          {status === "success" && (
            <div className="mt-4 glass rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              {message}
              {uploadedUrl && (
                <a href={uploadedUrl} target="_blank" className="ml-auto glass-whisper rounded-lg px-3 py-1 text-xs hover:text-white flex items-center gap-1">
                  <Eye className="h-3 w-3" /> View
                </a>
              )}
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 glass rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          <Button
            variant="premium"
            size="lg"
            className="w-full mt-6 rounded-xl"
            disabled={!file || status === "uploading"}
            isLoading={status === "uploading"}
            onClick={handleUpload}
          >
            {status === "uploading" ? "Uploading..." : "Upload & Publish"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
