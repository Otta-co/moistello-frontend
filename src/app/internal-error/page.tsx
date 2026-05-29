'use client'

import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { AlertTriangle, Home, RefreshCw, ExternalLink } from "lucide-react"

export default function InternalError() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container-premium max-w-xl mx-auto px-4">
          <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/15 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-black mb-4 text-foreground">500</h1>
            <h2 className="font-heading text-2xl font-semibold mb-3 text-foreground">Something Broke</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our backend had an unexpected error. The team has been notified. Please try again in a few minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => location.reload()} className="gradient-bg-extended text-white px-6 py-3 rounded-xl font-heading font-medium transition-transform duration-300 hover:scale-105">
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Refresh
              </button>
              <Link href="/status" className="glass-premium text-foreground px-6 py-3 rounded-xl font-heading font-medium transition-transform duration-300 hover:scale-105">
                <ExternalLink className="h-4 w-4 inline mr-2" />
                System Status
              </Link>
              <Link href="/" className="glass text-muted-foreground px-6 py-3 rounded-xl font-heading transition-transform duration-300 hover:scale-105">
                <Home className="h-4 w-4 inline mr-2" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}