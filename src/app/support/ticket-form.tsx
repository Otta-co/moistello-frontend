"use client"

import { useState } from "react"

interface FormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
  priority: string
}

const categories = [
  "Account & Wallet",
  "Circle Management",
  "Payments & Withdrawals",
  "Passkey & Security",
  "MoiScore & Reputation",
  "Governance & Voting",
  "Bug Report",
  "Feature Request",
  "Other",
]

export function TicketForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
    priority: "medium",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [formError, setFormError] = useState<string | null>(null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = "Name is required"
    if (!formData.email.trim()) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Invalid email address"
    if (!formData.subject.trim()) errors.subject = "Subject is required"
    if (!formData.category) errors.category = "Select a category"
    if (!formData.message.trim()) errors.message = "Describe your issue"
    else if (formData.message.trim().length < 20)
      errors.message = "Please provide more detail (at least 20 characters)"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setFormState("submitting")
    setFormError(null)

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit ticket")
      }
      setFormState("success")
      setFormData({ name: "", email: "", subject: "", category: "", message: "", priority: "medium" })
    } catch (err) {
      setFormState("error")
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mb-3">
          <CheckCircleIcon />
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-1">
          Ticket Submitted
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          We&apos;ll respond within 24 hours at{" "}
          <span className="text-foreground">{formData.email}</span>.
        </p>
        <button
          type="button"
          onClick={() => { setFormState("idle"); setShowSubmitForm(false) }}
          className="text-sm text-aurora-cyan"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!showSubmitForm ? (
        <button
          type="button"
          onClick={() => setShowSubmitForm(true)}
          className="w-full h-12 rounded-xl bg-aurora-violet/10 text-aurora-violet text-sm font-medium flex items-center justify-center gap-2 hover:bg-aurora-violet/20 transition-colors"
        >
          <SendIcon />
          Open Ticket Form
        </button>
      ) : (
        <form onSubmit={handleSubmitTicket} className="space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
            className={`w-full h-11 rounded-xl bg-white/5 border px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 ${formErrors.name ? "border-red-400/50" : "border-white/10"}`}
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
            className={`w-full h-11 rounded-xl bg-white/5 border px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 ${formErrors.email ? "border-red-400/50" : "border-white/10"}`}
          />
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Subject"
            className={`w-full h-11 rounded-xl bg-white/5 border px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 ${formErrors.subject ? "border-red-400/50" : "border-white/10"}`}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-foreground focus:outline-none"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-card">{c}</option>
            ))}
          </select>
          <textarea
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describe your issue..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 resize-y min-h-[80px]"
          />
          {formState === "error" && formError && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{formError}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitForm(false)}
              className="flex-1 h-11 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formState === "submitting"}
              className="flex-1 h-11 rounded-xl gradient-bg-extended text-white text-sm font-heading font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {formState === "submitting" ? (
                <LoaderIcon />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function CheckCircleIcon() {
  return <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
}

function LoaderIcon() {
  return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 20v-4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
}

function SendIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
}