import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata = {
  title: "About - Moistello",
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="auroral-mesh min-h-screen">
        <main className="container-premium py-16">
          <h1 className="holo-text font-heading text-5xl md:text-7xl font-black mb-8">About Moistello</h1>
          <div className="space-y-6 max-w-3xl">
            <div className="glass-premium rounded-2xl p-8 holo-border border-l-4 border-l-aurora-indigo">
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                1.7 billion adults remain unbanked globally. In communities across Africa, Latin America, South Asia, and Southeast Asia, people rely on informal savings circles — esusu, tontines, chit funds, tandas — to access capital and build financial resilience. Moistello wraps this centuries-old model in Soroban smart contracts on Stellar, bringing transparency, security, and portable on-chain reputation to every participant.
              </p>
            </div>
            <div className="glass rounded-2xl p-8 border-l-4 border-l-aurora-violet">
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text">Why Stellar</h2>
              <p className="text-muted-foreground leading-relaxed">Stellar&apos;s sub-cent transaction fees and 3-5 second settlement make contribution cycles practical. The Soroban smart contract platform provides the programmability for complex payout rules, auction mechanics, and reputation tracking — all while keeping gas costs negligible.</p>
            </div>
            <div className="glass rounded-2xl p-8 border-l-4 border-l-aurora-cyan">
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text">Built for Drips Wave</h2>
              <p className="text-muted-foreground leading-relaxed">Moistello participates in the Drips Wave program by the Stellar Development Foundation. Our smart contracts, backend API, and frontend are open source under Apache 2.0.</p>
            </div>
            <div className="glass rounded-2xl p-8 border-l-4 border-l-premium-gold">
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text-gold">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">Join us on the Drips Discord or open an issue on our GitHub repository.</p>
            </div>
          </div>
        </main>
        <footer className="glass mt-20 py-8 border-t border-border">
          <div className="container-premium flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Moistello</span>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </nav>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-aurora-cyan animate-pulse-glow" />Built on Stellar</span>
          </div>
        </footer>
      </div>
    </PublicLayout>
  );
}
