import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation - Moistello",
  description: "Moistello documentation. Learn about Stellar savings circles, USDC contributions, MoiScore reputation, and Soroban smart contracts.",
  keywords: "moistello, documentation, stellar, savings circles, USDC, XLM, MoiScore, soroban, smart contracts, ROSCA, tontine",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Moistello",
  publisher: "Moistello",
  alternates: { canonical: "/docs" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com/docs",
    siteName: "Moistello",
    title: "Documentation - Moistello",
    description: "Learn about savings circles, USDC contributions, MoiScore reputation, and smart contracts on Stellar.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Documentation - Moistello" }],
  },
  twitter: { card: "summary_large_image", title: "Documentation - Moistello", description: "Moistello docs for Stellar savings circles.", images: ["/logo.jpg"] },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}