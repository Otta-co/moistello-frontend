import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata = { title: "Privacy Policy - Moistello" };

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="auroral-mesh min-h-screen">
        <div className="container-premium py-16 max-w-3xl mx-auto">
          <h1 className="holo-text font-heading text-5xl md:text-7xl font-black mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: May 2026</p>
          <div className="glass-premium rounded-2xl p-8 space-y-6">
            {[
              { title: "1. Information Collected", text: "Wallet address (public key), profile info you provide, on-chain activity (public, immutable), anonymous usage analytics." },
              { title: "2. Usage", text: "To provide the Platform, authenticate via wallet signature, display MoiScore, send circle notifications, and improve the experience." },
              { title: "3. Storage", text: "Profile data in our database. On-chain data on Stellar is permanent and cannot be deleted." },
              { title: "4. Sharing", text: "We do not sell data. Anonymized aggregates may be used for analytics. We disclose only as required by law." },
              { title: "5. Wallet Security", text: "We never have access to your private keys. You alone are responsible for wallet security." },
              { title: "6. Your Rights", text: "Request access, correction, or deletion of off-chain data. On-chain data is immutable. Disconnect your wallet anytime." },
            ].map((s) => (
              <div key={s.title}>
                <h2 className="font-heading text-lg font-semibold gradient-text mb-2">{s.title}</h2>
                <p className="text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
        <footer className="glass mt-20 py-8 border-t border-border">
          <div className="container-premium flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Moistello</span>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="/about" className="hover:text-foreground">About</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            </nav>
          </div>
        </footer>
      </div>
    </PublicLayout>
  );
}
