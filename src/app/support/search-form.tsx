"use client"

import { useState } from "react"
import Link from "next/link"

const quickLinks = [
  {
    title: "Frequently Asked Questions",
    desc: "Instant answers to common questions about circles, wallets, and fees.",
    href: "/faq",
    color: "from-aurora-indigo/20 to-aurora-violet/10",
  },
  {
    title: "Documentation",
    desc: "Technical guides, API references, and smart contract details.",
    href: "/docs",
    color: "from-aurora-cyan/20 to-aurora-violet/10",
  },
  {
    title: "How It Works",
    desc: "Learn how savings circles, MoiScore, and governance work.",
    href: "/how-it-works",
    color: "from-premium-gold/15 to-aurora-amber/10",
  },
]

export function SearchForm() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof quickLinks | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const q = searchQuery.toLowerCase()
    const results = quickLinks.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.desc.toLowerCase().includes(q),
    )
    setSearchResults(results.length > 0 ? results : [])
  }

  return (
    <div className="relative max-w-lg mx-auto">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!e.target.value) setSearchResults(null)
            }}
            placeholder="Search for answers..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 focus:border-aurora-violet/40 text-base transition-all"
          />
        </div>
      </form>

      {searchResults !== null && (
        <div className="mt-4 max-w-lg mx-auto text-left">
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-white/5 rounded-xl px-4 py-3">
              No results found. Try a different term or submit a ticket.
            </p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors group"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-aurora-violet/10 text-aurora-violet shrink-0">
                    <LinkIcon />
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground">
                      {link.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.desc}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
}

function ChevronRightIcon() {
  return <svg className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
}

function LinkIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 7H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"/><path d="M17 2h5v5"/><path d="M21 2l-8 8-4-4-6 6 4 4 8-8 8 8"/></svg>
}