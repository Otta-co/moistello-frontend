import Link from "next/link"
import { PublicLayout } from "@/components/layout/public-layout"
import { Key, LogIn, Home } from "lucide-react"

export default function Unauthorized() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container-premium max-w-xl mx-auto px-4">
          <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-baseline gap-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-aurora-violet/15">
                  <Key className="h-8 w-8 text-aurora-violet" />
                </div>
                <h1 className="font-heading text-5xl md:text-6xl font-black text-foreground">401</h1>
              </div>
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-3 text-foreground">Sign In Required</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Please log in to access this page. Your session may have expired.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="gradient-bg-extended text-white px-6 py-3 rounded-xl font-heading font-medium transition-transform duration-300 hover:scale-105">
                <LogIn className="h-4 w-4 inline mr-2" />
                Sign In
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