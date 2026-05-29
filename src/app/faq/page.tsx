import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata = { title: "FAQ - Moistello" };

const faqs = [
  { q: "What is a savings circle (ROSCA)?", a: "A Rotating Savings and Credit Association is a group who contribute a fixed amount regularly. Each cycle, one member receives the total pool. Known worldwide as esusu, tontine, chit fund, tanda, and hui." },
  { q: "How is Moistello different?", a: "Traditional circles rely on trust. Moistello uses Soroban smart contracts to enforce rules transparently: on-chain contributions, automatic payouts, programmatic penalties, and portable MoiScore reputation. No organizer can run off with the pool." },
  { q: "Do I need a bank account?", a: "No. You only need a Stellar wallet (Freighter or Lobstr) and USDC or XLM. Accessible to the 1.7 billion unbanked with a smartphone." },
  { q: "What currencies?", a: "USDC and XLM natively. Additional Stellar-issued stablecoins (EURC, BRL, NGN) planned." },
  { q: "What if someone doesn't pay?", a: "Late payments incur a configurable penalty (default 5%). After max strikes (default 3), the member is removed. Collateralized circles: staked funds can be slashed." },
  { q: "What is MoiScore?", a: "Your on-chain reputation (0-1000) built from streak, completions, volume, and recency. High scores unlock larger circles and lower collateral." },
  { q: "Is it free?", a: "0.5% protocol fee on payouts. Stellar network fees &lt; $0.001 per transaction. No fees to create/join circles." },
  { q: "What is Drips Wave?", a: "A recurring bounty program by the Stellar Development Foundation rewarding open-source contributors. Moistello participates with scoped issues and point rewards." },
];

export default function FAQPage() {
  return (
    <PublicLayout>
      <div className="auroral-mesh min-h-screen">
        <div className="container-premium py-16">
          <h1 className="holo-text font-heading text-5xl md:text-7xl font-black mb-16 text-center">FAQ</h1>
          <div className="max-w-2xl mx-auto space-y-3 mb-16">
            {faqs.map((faq, i) => (
              <details key={i} className="glass rounded-2xl group cursor-pointer overflow-hidden">
                <summary className="flex items-center justify-between p-5 font-heading text-lg font-medium hover:text-foreground transition-colors">
                  {faq.q}
                  <span className="text-xl text-muted-foreground group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
                </summary>
                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
          <div className="text-center p-8 rounded-2xl glass-premium max-w-md mx-auto">
            <h2 className="font-heading text-xl font-bold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-4">Join our Discord or open an issue on GitHub.</p>
            <Link href="/login" className="gradient-bg-premium h-10 px-6 rounded-xl text-white font-heading font-semibold inline-flex items-center gap-2">Get Started</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
