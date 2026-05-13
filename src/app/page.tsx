import Link from "next/link";
import { Shield, Globe, Award, Zap, Shuffle, Coins, ArrowRight } from "lucide-react";
import { Routes } from "@/lib/constants";
import { PublicLayout } from "@/components/layout/public-layout";

const features = [
  {
    icon: Shield,
    title: "Trustless & Transparent",
    description: "Smart contracts enforce every rule. No organizer can run with the pool. Every contribution verified on-chain.",
    colSpan: "lg:col-span-2",
    featured: true,
  },
  { icon: Globe, title: "Global Access", description: "Anyone with a Stellar wallet. No bank account. No credit check. No borders.", colSpan: "lg:col-span-1" },
  { icon: Award, title: "On-Chain Reputation", description: "Build your MoiScore. Carry your financial identity across every circle.", colSpan: "lg:col-span-1" },
  { icon: Zap, title: "Near-Zero Fees", description: "Stellar's sub-cent transactions make daily circles practical. No platform fees to create or join.", colSpan: "lg:col-span-2", featured: true },
  { icon: Shuffle, title: "Flexible Rules", description: "Random, fixed, auction, or vote. Your circle, your rules.", colSpan: "lg:col-span-1" },
  { icon: Coins, title: "Multi-Currency", description: "USDC and XLM today. More stablecoins coming.", colSpan: "lg:col-span-1" },
];

const stats = [
  { value: "10,000+", label: "Circles Created" },
  { value: "50,000+", label: "Members Worldwide" },
  { value: "$2M+", label: "In Payouts" },
  { value: "99.9%", label: "On-Time Rate" },
];

export default function Home() {
  return (
    <PublicLayout>
      <div className="auroral-mesh min-h-screen">
        {/* Hero */}
        <section className="relative z-10 min-h-[90vh] flex flex-col justify-center">
          <div className="container-premium">
            <p className="font-heading text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
              BUILT FOR THE NEXT BILLION
            </p>
            <h1>
              <span className="font-heading text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter block">Save Together.</span>
              <span className="holo-text text-5xl md:text-7xl xl:text-8xl font-black block">Grow</span>
              <span className="font-heading text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter block">Together.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mt-8">
              Decentralized savings circles on Stellar. Zero intermediaries. Pure smart contracts. Financial sovereignty for the 1.7 billion unbanked.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href={Routes.LOGIN} className="gradient-bg-premium h-14 px-10 rounded-2xl text-lg font-heading font-semibold text-white inline-flex items-center justify-center gap-2 holo-glow hover:opacity-90 transition-all shadow-[0_0_40px_rgb(var(--premium-gold)/0.25)]">
                Launch App <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/how-it-works" className="holo-border h-14 px-10 rounded-2xl text-lg font-heading font-medium text-foreground inline-flex items-center justify-center glass-strong hover:bg-white/[0.06] transition-all">
                How It Works
              </Link>
            </div>
            <div className="mt-10">
              <div className="glass-strong rounded-full px-6 py-3 inline-flex flex-wrap items-center justify-center gap-8 text-sm">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-aurora-cyan animate-pulse-glow" />1.7B+ Unbanked</span>
                <span className="text-muted-foreground">|</span>
                <span>$0.001 Fees</span>
                <span className="text-muted-foreground">|</span>
                <span>3s Settlement</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 py-24 md:py-32">
          <div className="container-premium">
            <h2 className="font-heading text-4xl md:text-5xl gradient-text-extended text-center mb-16">Architecture of Trust</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className={`glass-premium rounded-2xl p-6 md:p-8 tilt-hover ${feature.colSpan} ${feature.featured ? "holo-border" : ""}`}>
                    <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mb-5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg md:text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative z-10 py-12">
          <div className="container-premium">
            <div className="glass-flagship rounded-3xl max-w-5xl mx-auto p-8 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="gradient-text-extended font-heading text-3xl md:text-5xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 py-24 text-center">
          <div className="container-premium">
            <h2 className="font-heading text-4xl md:text-6xl gradient-text-extended">Ready to Start?</h2>
            <p className="text-muted-foreground mt-4">Create your first savings circle in under two minutes.</p>
            <Link href={Routes.LOGIN} className="gradient-bg-premium h-14 px-10 rounded-2xl text-lg font-heading font-semibold text-white inline-flex items-center justify-center gap-2 mt-8 holo-glow hover:opacity-90 transition-all shadow-[0_0_40px_rgb(var(--premium-gold)/0.25)]">
              Launch App <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass mt-20 py-8 border-t border-border">
          <div className="container-premium flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Moistello</span>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href={Routes.ABOUT} className="hover:text-foreground transition-colors">About</Link>
              <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href={Routes.TERMS} className="hover:text-foreground transition-colors">Terms</Link>
              <Link href={Routes.PRIVACY} className="hover:text-foreground transition-colors">Privacy</Link>
            </nav>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-aurora-cyan animate-pulse-glow" />Built on Stellar</span>
          </div>
        </footer>
      </div>
    </PublicLayout>
  );
}
