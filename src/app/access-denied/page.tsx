'use client'

import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { Shield, ShieldQuestion, Home } from "lucide-react"

export default function Forbidden() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container-premium max-w-xl mx-auto px-4">
          <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-baseline gap-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
                <h1 className="font-heading text-5xl md:text-6xl font-black text-foreground">403</h1>
              </div>
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-3 text-foreground">Access Denied</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              You don&apos;t have permission to view this resource. Contact support for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/support" className="gradient-bg-extended text-white px-6 py-3 rounded-xl font-heading font-medium transition-transform duration-300 hover:scale-105">
                <ShieldQuestion className="h-4 w-4 inline mr-2" />
                Contact Support
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