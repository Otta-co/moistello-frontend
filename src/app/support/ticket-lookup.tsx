"use client"

import { useState } from "react"

interface TicketStatus {
  id: string
  subject: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  lastUpdated: string
}

const statusConfig = {
  open: { label: "Open", color: "text-amber-400 bg-amber-500/10" },
  in_progress: { label: "In Progress", color: "text-blue-400 bg-blue-500/10" },
  resolved: { label: "Resolved", color: "text-emerald-400 bg-emerald-500/10" },
  closed: { label: "Closed", color: "text-muted-foreground bg-white/5" },
}

export function TicketLookup() {
  const [ticketId, setTicketId] = useState("")
  const [ticketLookupState, setTicketLookupState] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle")
  const [lookedUpTicket, setLookedUpTicket] = useState<TicketStatus | null>(null)
  const [ticketLookupError, setTicketLookupError] = useState<string | null>(null)

  const handleLookupTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId.trim()) return

    setTicketLookupState("loading")
    setTicketLookupError(null)
    setLookedUpTicket(null)

    try {
      const res = await fetch(`/api/support/tickets/${ticketId.trim()}`)
      if (res.status === 404) {
        setTicketLookupState("not_found")
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Lookup failed")
      }
      const data = await res.json()
      setLookedUpTicket(data.ticket as TicketStatus)
      setTicketLookupState("found")
    } catch (err) {
      setTicketLookupState("error")
      setTicketLookupError(err instanceof Error ? err.message : "Lookup failed")
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookupTicket} className="flex gap-2 mb-4">
        <input
          type="text"
          value={ticketId}
          onChange={(e) => {
            setTicketId(e.target.value)
            if (ticketLookupState !== "idle") {
              setTicketLookupState("idle")
              setLookedUpTicket(null)
            }
          }}
          placeholder="Ticket ID"
          className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!ticketId.trim() || ticketLookupState === "loading"}
          className="h-11 px-4 rounded-xl bg-aurora-cyan/15 text-aurora-cyan text-sm font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {ticketLookupState === "loading" ? (
            <LoaderIcon />
          ) : (
            "Search"
          )}
        </button>
      </form>

      {ticketLookupState === "not_found" && (
        <p className="text-xs text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2">Ticket not found</p>
      )}
      {ticketLookupState === "error" && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{ticketLookupError}</p>
      )}
      {ticketLookupState === "found" && lookedUpTicket && (
        <div className="rounded-xl border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-muted-foreground">{lookedUpTicket.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[lookedUpTicket.status].color}`}>
              {statusConfig[lookedUpTicket.status].label}
            </span>
          </div>
          <p className="text-sm text-foreground">{lookedUpTicket.subject}</p>
        </div>
      )}
      {ticketLookupState === "idle" && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Enter the ticket ID emailed to you.
        </p>
      )}
    </div>
  )
}

function LoaderIcon() {
  return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 20v-4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
}