"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Shield, Target, Award, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"
import type { CircleFormData, CircleType } from "@/types"

interface CreateStepDetailsProps {
  formData: CircleFormData
  setFormData: React.Dispatch<React.SetStateAction<CircleFormData>>
  errors: Record<string, string>
}

const CIRCLE_TYPES: {
  value: CircleType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  { value: "public", label: "Public", description: "Anyone can discover and join", icon: <Users className="h-5 w-5" /> },
  { value: "private", label: "Private", description: "Invite-only access", icon: <Shield className="h-5 w-5" /> },
  { value: "community", label: "Community", description: "Community-governed circle", icon: <Target className="h-5 w-5" /> },
  { value: "premium", label: "Premium", description: "High-trust circles", icon: <Award className="h-5 w-5" /> },
]

export function CreateStepDetails({ formData, setFormData, errors }: CreateStepDetailsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
        Circle Details
      </h3>
      <div className="space-y-4">
        <Input
          label="Circle Name"
          placeholder="e.g., Neighborhood Savings Circle"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          label="Description (optional)"
          placeholder="Briefly describe the purpose of this circle"
          value={formData.description ?? ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-3 block font-heading text-sm text-muted-foreground">
          Circle Type
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CIRCLE_TYPES.map((ct) => (
            <motion.button
              key={ct.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, circleType: ct.value }))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all duration-300",
                formData.circleType === ct.value
                  ? "glass-strong holo-border"
                  : "hover:glass-strong",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    formData.circleType === ct.value ? "gradient-text" : "text-muted-foreground",
                  )}
                >
                  {ct.icon}
                </span>
                <span className="font-heading font-semibold text-foreground dark:text-white text-sm">
                  {ct.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{ct.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Max Members"
          type="number"
          min={2}
          max={100}
          value={String(formData.maxMembers)}
          onChange={(e) => setFormData((prev) => ({ ...prev, maxMembers: Number(e.target.value) }))}
          error={errors.maxMembers}
        />
        <Input
          label="Start Date"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
          leftIcon={<Calendar className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
