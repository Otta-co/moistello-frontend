import type { Metadata, Viewport } from "next"
import { Space_Grotesk } from "next/font/google"
import { Inter } from "next/font/google"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { ToastProvider } from "@/providers/toast-provider"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Moistello — Stellar Savings Circles",
  description: "Decentralized rotating savings and credit circles on the Stellar blockchain. Save together. Grow together.",
  keywords: "moistello, stellar, blockchain, savings circles, defi, decentralized finance, rotating credit, USDC, XLM, smart contracts, soroban",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Nekwachukwu Ucheokoye",
  publisher: "Moistello",
  metadataBase: new URL("https://moistello.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com",
    siteName: "Moistello",
    title: "Moistello — Decentralized Savings Circles on Stellar",
    description: "Join trustless savings circles with zero intermediaries. Built on Stellar blockchain for true financial sovereignty.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Moistello - Decentralized Stellar Savings Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moistello",
    creator: "@nekwasar",
    title: "Moistello — Stellar Savings Circles",
    description: "Build trustless savings circles on Stellar. Join rotating credit groups with USDC/XLM, earn on-chain reputation, and achieve financial sovereignty.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08080c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
<head>
         <script
           dangerouslySetInnerHTML={{
             __html: `(function(){try{var t=localStorage.getItem('moistello_theme');if(t){var p=JSON.parse(t);if(p.state&&p.state.theme==='light'){document.documentElement.classList.remove('dark')}else if(p.state&&p.state.theme==='system'){if(!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.remove('dark')}}}}catch(e){}})()`,
           }}
         />
         <script
           type="application/ld+json"
           dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "Organization",
               "name": "Moistello",
               "alternateName": "Moistello Savings Platform",
               "url": "https://moistello.com",
               "logo": "https://moistello.com/logo.jpg",
               "sameAs": ["https://github.com/otta-co", "https://x.com/nekwasar"],
               "description": "Decentralized rotating savings and credit circles on the Stellar blockchain.",
             }),
           }}
         />
         <script
           type="application/ld+json"
           dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "WebSite",
               "name": "Moistello",
               "url": "https://moistello.com",
               "potentialAction": {
                 "@type": "SearchAction",
                 "target": "https://moistello.com/docs?q={search_term_string}",
                 "query-input": "required name=search_term_string",
               },
             }),
           }}
         />
       </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-body bg-[rgb(var(--background))] text-[rgb(var(--foreground))] antialiased`}
      >
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
