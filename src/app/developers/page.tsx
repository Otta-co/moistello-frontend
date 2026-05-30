import Link from "next/link"
import { Metadata } from "next"
import { PublicLayout } from "@/components/layout/public-layout"
import {
  BookOpen,
  Code,
  Users,
  GitBranch,
  ExternalLink,
  Zap,
  Shield,
  Database,
  Cpu,
  Key,
  AlertTriangle,
  Globe,
  Terminal,
  Package,
  Mail,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Developers - Moistello",
  description: "Moistello developer platform. Build on Stellar with our complete API documentation, 27 endpoints, 7 Soroban contracts, and open-source tools for decentralized savings.",
  keywords: "moistello, developers, API, stellar, soroban, smart contracts, open source, typescript, react, rest API, blockchain",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Moistello",
  publisher: "Moistello",
  alternates: { canonical: "/developers" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com/developers",
    siteName: "Moistello",
    title: "Developers - Moistello",
    description: "Build decentralized savings on Stellar. Full API documentation, smart contracts, and resources for developers.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Developers - Moistello" }],
  },
  twitter: { card: "summary_large_image", title: "Developers - Moistello", description: "Build on Moistello's Stellar savings platform.", images: ["/logo.jpg"] },
}

const apiEndpoints = [
  {
    category: "Authentication",
    icon: Key,
    color: "text-aurora-violet",
    endpoints: [
      { method: "POST", path: "/v1/auth/nonce", desc: "Get authentication nonce" },
      { method: "POST", path: "/v1/auth/verify", desc: "Verify wallet signature and login" },
      { method: "POST", path: "/v1/auth/register", desc: "Register with profile" },
      { method: "POST", path: "/v1/auth/refresh", desc: "Refresh JWT tokens" },
      { method: "POST", path: "/v1/auth/logout", desc: "Invalidate session" },
    ],
  },
  {
    category: "Circles",
    icon: Users,
    color: "text-aurora-cyan",
    endpoints: [
      { method: "GET", path: "/v1/circles", desc: "List circles" },
      { method: "POST", path: "/v1/circles", desc: "Create a circle" },
      { method: "GET", path: "/v1/circles/{id}", desc: "Get a circle" },
      { method: "PATCH", path: "/v1/circles/{id}", desc: "Update circle settings" },
    ],
  },
  {
    category: "Contributions",
    icon: Database,
    color: "text-emerald-400",
    endpoints: [
      { method: "GET", path: "/v1/contributions", desc: "List contributions" },
      { method: "GET", path: "/v1/contributions/{id}", desc: "Get contribution" },
    ],
  },
]

const errorCodes = [
  { code: "400", desc: "Bad Request", detail: "Invalid parameters or malformed request" },
  { code: "401", desc: "Unauthorized", detail: "Missing or invalid authentication" },
  { code: "403", desc: "Forbidden", detail: "Insufficient permissions" },
  { code: "404", desc: "Not Found", detail: "Resource does not exist" },
  { code: "409", desc: "Conflict", detail: "Resource already exists" },
  { code: "422", desc: "Unprocessable", detail: "Validation failed" },
  { code: "429", desc: "Rate Limited", detail: "Too many requests" },
  { code: "500", desc: "Server Error", detail: "Internal error, try again later" },
]

export default function DevelopersPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-aurora-indigo/8 via-transparent to-aurora-violet/5 pointer-events-none" />
          <div className="container-premium pt-24 pb-16 md:pt-32 md:pb-24 relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aurora-violet/10 border border-aurora-violet/20 text-xs text-aurora-violet font-medium mb-6">
                <Code className="h-3.5 w-3.5" />
                Developer Platform
              </div>
              <h1 className="font-heading text-4xl md:text-6xl font-black mb-4">
                Build on <span className="gradient-text-extended">Moistello</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
                Complete API documentation, smart contracts, and resources for building decentralized savings on Stellar.
              </p>
            </div>
          </div>
        </section>

        {/* ─── QUICK STATS ─── */}
        <section className="container-premium py-12 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Zap, label: "API Endpoints", value: "27", color: "text-aurora-cyan" },
              { icon: Shield, label: "Smart Contracts", value: "7", color: "text-aurora-indigo" },
              { icon: Database, label: "Ready to Deploy", value: "Testnet", color: "text-emerald-400" },
              { icon: Cpu, label: "Source", value: "Open", color: "text-aurora-violet" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 text-center"
              >
                <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} mx-auto mb-3`} />
                <div className={`font-heading text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── DESKTOP: MAIN CONTENT ─── */}
        <section className="container-premium pb-20">
          <div className="hidden md:block space-y-8">
            {/* QUICK START */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-violet/15 text-aurora-violet">
                  <Zap className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-foreground">Quick Start</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">1. Get a Nonce</h3>
                  <code className="text-xs text-aurora-cyan font-mono">POST /v1/auth/nonce</code>
                  <p className="text-xs text-muted-foreground mt-2">Send wallet address to receive a nonce</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">2. Sign & Verify</h3>
                  <code className="text-xs text-aurora-cyan font-mono">POST /v1/auth/verify</code>
                  <p className="text-xs text-muted-foreground mt-2">Sign nonce with your wallet</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">3. Access API</h3>
                  <code className="text-xs text-aurora-cyan font-mono">Authorization: Bearer</code>
                  <p className="text-xs text-muted-foreground mt-2">Use JWT token in requests</p>
                </div>
              </div>
              <Link href="/docs/api" className="inline-block text-xs text-aurora-cyan hover:underline mt-6">
                View full API docs →
              </Link>
            </div>

            {/* API ENDPOINTS */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-cyan/15 text-aurora-cyan">
                  <Terminal className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-foreground">API Reference</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {apiEndpoints.map((cat) => (
                  <div key={cat.category} className="bg-white/5 border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      <h3 className="font-heading text-sm font-semibold text-foreground">{cat.category}</h3>
                    </div>
                    <div className="space-y-2">
                      {cat.endpoints.map((ep) => (
                        <div key={ep.path} className="flex items-center gap-2 text-xs">
                          <span className={`font-mono ${ep.method === "GET" ? "text-emerald-400" : ep.method === "POST" ? "text-aurora-violet" : "text-amber-400"}`}>
                            {ep.method}
                          </span>
                          <code className="text-aurora-cyan font-mono flex-1 truncate">{ep.path}</code>
                          <span className="text-muted-foreground">{ep.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SMART CONTRACTS */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-indigo/15 text-aurora-indigo">
                  <Shield className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-foreground">Smart Contracts</h2>
              </div>

              <p className="text-sm text-muted-foreground">
                Smart contracts deployed on Stellar Mainnet. See{" "}
                <Link href="/docs/contracts" className="text-aurora-cyan hover:underline">
                  documentation
                </Link>{" "}
                for architecture overview.
              </p>
            </div>

            {/* ERROR CODES */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-foreground">Error Codes</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {errorCodes.map((err) => (
                  <div key={err.code} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-400">{err.code}</p>
                    <p className="text-xs font-medium text-foreground">{err.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{err.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RESOURCES */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-indigo/15 text-aurora-indigo">
                  <Package className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-foreground">Resources</h2>
              </div>

              <div className="space-y-3">
                <Link href="/docs/api" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-aurora-violet/10">
                    <BookOpen className="h-4 w-4 text-aurora-violet" />
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">API Documentation</p>
                    <p className="text-xs text-muted-foreground">Swagger UI with live testing</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
                <a
                  href="https://github.com/orgs/Otta-co/repositories"
                  target="_blank"
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-white/5">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-muted-foreground">Source code</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>

          {/* ─── MOBILE: STACKED SECTIONS ─── */}
          <div className="md:hidden space-y-6">
            {/* Quick Start */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-violet/15 text-aurora-violet">
                  <Zap className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-base font-semibold text-foreground">Quick Start</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-foreground font-medium">1.</span> <span className="text-muted-foreground">GET /v1/auth/nonce</span></div>
                <div><span className="text-foreground font-medium">2.</span> <span className="text-muted-foreground">Sign & verify</span></div>
                <div><span className="text-foreground font-medium">3.</span> <span className="text-muted-foreground">Use Bearer token</span></div>
              </div>
              <Link href="/docs/api" className="block text-xs text-aurora-cyan mt-3">
                Full docs →
              </Link>
            </div>

            {/* Contracts */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-cyan/15 text-aurora-cyan">
                  <Shield className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-base font-semibold text-foreground">Contracts</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart contracts on Stellar. See{" "}
                <Link href="/docs/contracts" className="text-aurora-cyan hover:underline">
                  docs
                </Link>
                .
              </p>
            </div>

            {/* Resources */}
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-indigo/15 text-aurora-indigo">
                  <Package className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-base font-semibold text-foreground">Resources</h2>
              </div>
              <div className="space-y-2">
                <Link href="/docs/api" className="flex items-center gap-2 text-sm text-foreground">
                  <BookOpen className="h-4 w-4" /> API Documentation
                </Link>
                <a href="https://github.com/orgs/Otta-co/repositories" target="_blank" className="flex items-center gap-2 text-sm text-foreground">
                  <GitBranch className="h-4 w-4" /> GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTRIBUTORS SECTION ─── */}
        <section className="border-t border-white/5">
          <div className="container-premium py-12 md:py-20">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-cyan/15 text-aurora-cyan">
                  <Users className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                  Contributors
                </h2>
              </div>

              <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 p-6 md:p-8">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-aurora-cyan font-medium">@nekwasar</span> · v1 Sole Author & Architect
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs">
                  <div className="space-y-2">
                    <p><span className="text-foreground font-medium">Full Name:</span> Nekwasachukwu Ucheokoye</p>
                    <p><span className="text-foreground font-medium">Role:</span> Founder, Agentic & Systems Engineer</p>
                    <p><span className="text-foreground font-medium">Organization:</span> O4A Innovations</p>
                    <p><span className="text-foreground font-medium">Location:</span> Awka, Nigeria (UTC +01:00)</p>
                  </div>
                  <div className="space-y-2">
                    <a href="https://nekwasar.com" target="_blank" className="flex items-center gap-1 text-aurora-cyan hover:underline">
                      <Globe className="h-3 w-3" /> nekwasar.com
                    </a>
                    <a href="https://github.com/nekwasar" target="_blank" className="flex items-center gap-1 text-aurora-cyan hover:underline">
                      <GitBranch className="h-3 w-3" /> github.com/nekwasar
                    </a>
                    <a href="https://linkedin.com/in/nekwasar" target="_blank" className="flex items-center gap-1 text-aurora-cyan hover:underline">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.268c-.966 0-1.718-.759-1.718-1.725s.752-1.725 1.718-1.725c.967 0 1.72.759 1.72 1.725s-.753 1.725-1.72 1.725zm13.5 10.268h-3v-4.5c0-1.083-.024-2.484-1.512-2.484-.773 0-1.283.446-1.283 1.02v4.632h-3v-9h2.881v1.233h.041c.2-.386.767-.75 1.512-.75 1.512 0 2.095.995 2.095 2.484v5.516z"/></svg>
                      linkedin.com/in/nekwasar
                    </a>
                    <a href="https://x.com/nekwasar" target="_blank" className="flex items-center gap-1 text-aurora-cyan hover:underline">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.22-6.819L4.99 22.5H1.68l7.73-8.845L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 5.134H5.117z"/></svg>
                      @nekwasar
                    </a>
                    <a href="mailto:hello@nekwasar.com" className="flex items-center gap-1 text-aurora-cyan hover:underline">
                      <Mail className="h-3 w-3" /> hello@nekwasar.com
                    </a>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-3">
                    <span className="text-foreground font-medium">Contributions:</span> Architected full Moistello (frontend, backend, 5 Soroban contracts on Mainnet)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">Stack:</span> TypeScript · Node.js · Next.js · React · Soroban · PostgreSQL · Docker
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COMMITMENT SECTION ─── */}
        <section className="border-t border-white/5">
          <div className="container-premium py-10 md:py-14">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground mb-3">
                Developer Commitment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-left">
                {[
                  { icon: Zap, title: "27 Endpoints", desc: "Complete REST API for all platform features." },
                  { icon: Shield, title: "Open Source", desc: "All code publicly available for review." },
                  { icon: Database, title: "Testnet Ready", desc: "Start building with test tokens immediately." },
                ].map((item) => (
                  <div key={item.title} className="text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 mx-auto mb-2">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <p className="text-xs font-medium text-foreground mb-1">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}