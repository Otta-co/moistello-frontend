import { Metadata } from "next"
import { PublicLayout } from "@/components/layout/public-layout"

export const metadata: Metadata = {
  title: "About - Moistello",
  description: "Moistello brings traditional savings circles to the Stellar blockchain. Built for the unbanked, powered by Soroban smart contracts for true financial sovereignty.",
  keywords: "moistello, stellar, savings circles, soroban, blockchain, unbanked, financial inclusion, esusu, tontine, chit fund",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Moistello",
  publisher: "Moistello",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com/about",
    siteName: "Moistello",
    title: "About Moistello - Financial Inclusion on Stellar",
    description: "Learn about Moistello's mission to bring trustless savings circles to 1.7 billion unbanked adults using Stellar blockchain and Soroban smart contracts.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "About Moistello - Our Mission" }],
  },
  twitter: { card: "summary_large_image", title: "About - Moistello", description: "Moistello brings traditional savings circles to the Stellar blockchain for financial inclusion.", images: ["/logo.jpg"] },
}

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
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text">Open Source</h2>
              <p className="text-muted-foreground leading-relaxed">Our smart contracts, backend API, and frontend are open source under Apache 2.0. Contribute on GitHub.</p>
            </div>
            <div className="glass rounded-2xl p-8 border-l-4 border-l-premium-gold">
              <h2 className="font-heading text-xl font-semibold mb-3 gradient-text-gold">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">Join our Discord or open an issue on our GitHub repository.</p>
            </div>
          </div>
        </main>
      </div>
    </PublicLayout>
  );
}