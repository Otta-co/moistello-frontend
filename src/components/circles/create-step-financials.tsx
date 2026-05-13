"use client"

import React from "react"
import { motion } from "framer-motion"
import { DollarSign, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"
import type { CircleFormData, Frequency, Currency } from "@/types"

interface CreateStepFinancialsProps {
  formData: CircleFormData
  setFormData: React.Dispatch<React.SetStateAction<CircleFormData>>
  errors: Record<string, string>
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USDC", label: "USDC" },
  { value: "XLM", label: "XLM" },
]

const FREQUENCIES: { value: Frequency; label: string; icon: React.ReactNode }[] = [
  { value: "daily", label: "Daily", icon: <Clock className="h-4 w-4" /> },
  { value: "weekly", label: "Weekly", icon: <Clock className="h-4 w-4" /> },
  { value: "biweekly", label: "Biweekly", icon: <Clock className="h-4 w-4" /> },
  { value: "monthly", label: "Monthly", icon: <Clock className="h-4 w-4" /> },
]

export function CreateStepFinancials({ formData, setFormData, errors }: CreateStepFinancialsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
        Financial Settings
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Contribution Amount"
          type="number"
          min={1}
          value={String(formData.contributionAmount)}
          onChange={(e) => setFormData((prev) => ({ ...prev, contributionAmount: Number(e.target.value) }))}
          leftIcon={<DollarSign className="h-4 w-4" />}
          error={errors.contributionAmount}
        />
        <div>
          <label className="mb-2 block font-heading text-xs tracking-wider uppercase text-muted-foreground">
            Currency
          </label>
          <div className="flex gap-2">
            {CURRENCIES.map((c) => (
              <motion.button
                key={c.value}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFormData((prev) => ({ ...prev, currency: c.value }))}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-heading font-medium transition-all duration-300",
                  formData.currency === c.value
                    ? "gradient-bg-extended text-white holo-glow"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-heading text-sm text-muted-foreground">
          Contribution Frequency
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FREQUENCIES.map((f) => (
            <motion.button
              key={f.value}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFormData((prev) => ({ ...prev, frequency: f.value }))}
              className={cn(
                "glass rounded-xl p-3 text-center transition-all duration-300",
                formData.frequency === f.value
                  ? "glass-strong holo-border"
                  : "hover:glass-strong",
              )}
            >
              <span
                className={cn(
                  "mx-auto mb-1 block",
                  formData.frequency === f.value ? "gradient-text" : "text-muted-foreground",
                )}
              >
                {f.icon}
              </span>
              <span
                className={cn(
                  "text-xs font-medium font-heading",
                  formData.frequency === f.value
                    ? "text-foreground dark:text-white"
                    : "text-muted-foreground",
                )}
              >
                {f.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-heading font-medium text-foreground dark:text-white">
          Penalty Settings
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block font-heading text-xs tracking-wider uppercase text-muted-foreground">
              Late Fee ({formData.lateFeePercent}%)
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={formData.lateFeePercent}
              onChange={(e) => setFormData((prev) => ({ ...prev, lateFeePercent: Number(e.target.value) }))}
              className="w-full accent-aurora-violet h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
            />
            <span className="text-2xs text-muted-foreground">Cost per missed deadline</span>
          </div>
          <Input
            label="Grace Period (hrs)"
            type="number"
            min={1}
            max={168}
            value={String(formData.gracePeriodHours)}
            onChange={(e) => setFormData((prev) => ({ ...prev, gracePeriodHours: Number(e.target.value) }))}
          />
          <Input
            label="Max Strikes"
            type="number"
            min={1}
            max={10}
            value={String(formData.maxStrikes)}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxStrikes: Number(e.target.value) }))}
            hint="Strikes before removal"
          />
        </div>
      </div>
    </div>
  )
}
