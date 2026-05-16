"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  FileText,
  Shield,
  Clock,
  Lock,
  Users,
  BarChart3,
  Coins,
  AlertCircle,
  Info,
  ChevronDown,
  Send,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Input } from "@/components/ui/input"
import { Select, type SelectOption } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/cn"

const TARGET_CONTRACTS: SelectOption[] = [
  { label: "Circle Factory  ·  Deploy and manage savings circles", value: "circle_factory" },
  { label: "Treasury  ·  Manages protocol fees and reserves", value: "treasury" },
  { label: "Governance Token  ·  MOI token contract", value: "governance_token" },
  { label: "Reputation Registry  ·  On-chain reputation scores", value: "reputation_registry" },
  { label: "Governance  ·  DAO governance parameters", value: "governance" },
]

const CONTRACT_METHODS: Record<string, SelectOption[]> = {
  circle_factory: [
    { label: "Update Creation Fee  ·  Change the fee to create a new circle", value: "update_creation_fee" },
    { label: "Update Max Circles Per User  ·  Limit circles per address", value: "update_max_circles" },
    { label: "Pause Factory  ·  Emergency pause for all factory operations", value: "pause_factory" },
  ],
  treasury: [
    { label: "Update Fee Percentage  ·  Adjust protocol fee rate", value: "update_fee_pct" },
    { label: "Update Reserve Ratio  ·  Modify treasury reserve ratio", value: "update_reserve_ratio" },
    { label: "Pause Treasury  ·  Emergency pause for treasury operations", value: "pause_treasury" },
  ],
  governance_token: [
    { label: "Mint Tokens  ·  Mint new MOI tokens to a specified address", value: "mint_tokens" },
    { label: "Update Transfer Fee  ·  Adjust fee on token transfers", value: "update_transfer_fee" },
  ],
  reputation_registry: [
    { label: "Update Score Thresholds  ·  Change bronze/silver/gold/platinum thresholds", value: "update_thresholds" },
    { label: "Update Tier Benefits  ·  Modify benefits for each reputation tier", value: "update_tier_benefits" },
    { label: "Pause Registry  ·  Emergency pause for reputation operations", value: "pause_registry" },
  ],
  governance: [
    { label: "Update Config  ·  General governance configuration", value: "update_config" },
    { label: "Update Quorum  ·  Change minimum quorum requirement", value: "update_quorum" },
    { label: "Update Pass Threshold  ·  Change required vote percentage for passing", value: "update_pass_threshold" },
  ],
}

type MethodArgumentFields = {
  label: string
  key: string
  type: "number" | "text"
  placeholder?: string
}[]

const METHOD_ARGUMENTS: Record<string, MethodArgumentFields> = {
  update_creation_fee: [
    { label: "New Fee (in stroops)", key: "new_fee", type: "number", placeholder: "e.g., 10000000" },
  ],
  update_max_circles: [
    { label: "Max Circles Per User", key: "max_circles", type: "number", placeholder: "e.g., 5" },
  ],
  update_fee_pct: [
    { label: "New Fee Percentage (basis points)", key: "new_fee_pct", type: "number", placeholder: "e.g., 250 (2.5%)" },
  ],
  update_reserve_ratio: [
    { label: "New Reserve Ratio (basis points)", key: "reserve_ratio", type: "number", placeholder: "e.g., 2000 (20%)" },
  ],
  mint_tokens: [
    { label: "Recipient Address", key: "recipient", type: "text", placeholder: "G..." },
    { label: "Amount (in stroops)", key: "amount", type: "number", placeholder: "e.g., 10000000000" },
  ],
  update_transfer_fee: [
    { label: "Transfer Fee (basis points)", key: "transfer_fee", type: "number", placeholder: "e.g., 30 (0.3%)" },
  ],
  update_thresholds: [
    { label: "Bronze Max Score", key: "bronze_max", type: "number", placeholder: "e.g., 199" },
    { label: "Silver Max Score", key: "silver_max", type: "number", placeholder: "e.g., 499" },
    { label: "Gold Max Score", key: "gold_max", type: "number", placeholder: "e.g., 999" },
    { label: "Platinum Min Score", key: "platinum_min", type: "number", placeholder: "e.g., 1000" },
  ],
  update_tier_benefits: [
    { label: "Bronze Benefit", key: "bronze_benefit", type: "text", placeholder: "e.g., 1% fee discount" },
    { label: "Silver Benefit", key: "silver_benefit", type: "text", placeholder: "e.g., 2% fee discount" },
    { label: "Gold Benefit", key: "gold_benefit", type: "text", placeholder: "e.g., 3% fee discount + priority" },
    { label: "Platinum Benefit", key: "platinum_benefit", type: "text", placeholder: "e.g., 5% fee discount + governance" },
  ],
  update_quorum: [
    { label: "New Quorum (basis points)", key: "new_quorum", type: "number", placeholder: "e.g., 2000 (20%)" },
  ],
  update_pass_threshold: [
    { label: "New Pass Threshold (basis points)", key: "pass_threshold", type: "number", placeholder: "e.g., 5000 (50%)" },
  ],
}

const GENERIC_ARGUMENTS: MethodArgumentFields = [
  { label: "Arguments (comma separated values)", key: "generic_args", type: "text", placeholder: "e.g., arg1, arg2, arg3" },
]

const METHOD_PAUSE_OPTIONS = ["pause_factory", "pause_treasury", "pause_registry", "update_config"]

function getContractLabel(value: string): string {
  const contract = TARGET_CONTRACTS.find((c) => c.value === value)
  return contract ? contract.label.split("  ·")[0] : value
}

function getMethodLabel(contract: string, value: string): string {
  const methods = CONTRACT_METHODS[contract]
  if (!methods) return value
  const method = methods.find((m) => m.value === value)
  return method ? method.label.split("  ·")[0] : value
}

interface FormData {
  title: string
  description: string
  targetContract: string
  method: string
  args: Record<string, string>
}

interface FormErrors {
  title?: string
  description?: string
  targetContract?: string
  method?: string
  args?: string
}

const INITIAL_FORM: FormData = {
  title: "",
  description: "",
  targetContract: "",
  method: "",
  args: {},
}

const RULES = [
  { icon: <Coins className="h-4 w-4" />, label: "Proposal Deposit: 100 MOI" },
  { icon: <Clock className="h-4 w-4" />, label: "Voting Period: 7 days" },
  { icon: <Lock className="h-4 w-4" />, label: "Timelock: 48 hours" },
  { icon: <Users className="h-4 w-4" />, label: "Quorum: 20% of MOI supply" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Pass Threshold: 50%+ For votes" },
]

export default function CreateProposalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const methodOptions = useMemo<SelectOption[]>(() => {
    if (!formData.targetContract) return []
    return CONTRACT_METHODS[formData.targetContract] ?? []
  }, [formData.targetContract])

  const argumentFields = useMemo<MethodArgumentFields>(() => {
    if (!formData.method) return []
    if (METHOD_PAUSE_OPTIONS.includes(formData.method)) return []
    return METHOD_ARGUMENTS[formData.method] ?? GENERIC_ARGUMENTS
  }, [formData.method])

  const setField = useCallback(
    (field: keyof FormData, value: string | Record<string, string>) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value }
        if (field === "targetContract") {
          next.method = ""
          next.args = {}
        }
        if (field === "method") {
          next.args = {}
        }
        return next
      })
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        if (field === "targetContract") {
          delete next.method
          delete next.args
        }
        if (field === "method") {
          delete next.args
        }
        return next
      })
    },
    [],
  )

  const setArg = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      args: { ...prev.args, [key]: value },
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.args
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 120) {
      newErrors.title = "Title must be 120 characters or less"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less"
    }

    if (!formData.targetContract) {
      newErrors.targetContract = "Please select a target contract"
    }

    if (!formData.method) {
      newErrors.method = "Please select a method to call"
    }

    if (argumentFields.length > 0) {
      const hasEmptyArg = argumentFields.some(
        (f) => !formData.args[f.key]?.trim(),
      )
      if (hasEmptyArg) {
        newErrors.args = "All arguments are required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, argumentFields])

  const handleSubmit = useCallback(() => {
    if (!validate()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Proposal submitted!")
      router.push("/governance")
    }, 1500)
  }, [validate, router])

  const hasArguments = argumentFields.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Proposal"
        description="Submit a governance proposal to the Moistello DAO. A deposit of 100 MOI is required."
        breadcrumbs={[
          { label: "Governance", href: "/governance" },
          { label: "Create" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* LEFT — Form */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong rounded-2xl p-6 md:p-8 depth-2"
        >
          <div className="space-y-6">
            {/* Field 1 — Title */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block font-heading text-xs tracking-wider uppercase text-muted-foreground">
                  Proposal Title
                </label>
                <span className="text-red-400 text-xs">*</span>
              </div>
              <Input
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 120) setField("title", val)
                }}
                placeholder="e.g., Reduce Circle Creation Fee"
                maxLength={120}
                error={errors.title}
              />
              <p className="mt-1 text-right text-2xs text-muted-foreground">
                {formData.title.length}/120
              </p>
            </div>

            {/* Field 2 — Description */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <label className="block font-heading text-xs tracking-wider uppercase text-muted-foreground">
                  Description
                </label>
                <span className="text-red-400 text-xs">*</span>
              </div>
              <textarea
                ref={descriptionRef}
                value={formData.description}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 500) setField("description", val)
                }}
                placeholder="Describe your proposal in detail. Explain the motivation, implementation, and expected impact."
                maxLength={500}
                rows={5}
                className={cn(
                  "block w-full min-h-[120px] bg-transparent px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50",
                  "border-b-2 border-border",
                  "transition-all duration-300 rounded-none resize-y",
                  "focus:outline-none",
                  "focus:border-b-aurora-violet",
                  "focus:shadow-[0_0_12px_rgb(var(--aurora-violet)/0.1)]",
                  errors.description
                    ? "border-b-red-500 shadow-[0_0_12px_rgb(239_68_68/0.1)]"
                    : "",
                )}
              />
              {errors.description && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400" role="alert">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-right text-2xs text-muted-foreground">
                {formData.description.length}/500
              </p>
            </div>

            {/* Field 3 — Target Contract */}
            <Select
              label="Target Contract"
              options={TARGET_CONTRACTS}
              value={formData.targetContract}
              onChange={(val) => setField("targetContract", val)}
              placeholder="Select a contract"
              error={errors.targetContract}
            />

            {/* Field 4 — Method */}
            {formData.targetContract && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
              >
                <Select
                  label="Method to Call"
                  options={methodOptions}
                  value={formData.method}
                  onChange={(val) => setField("method", val)}
                  placeholder="Select a method"
                  error={errors.method}
                />
              </motion.div>
            )}

            {/* Field 5 — Arguments */}
            {hasArguments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <p className="font-heading text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5" />
                  Arguments
                </p>
                {argumentFields.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    value={formData.args[field.key] ?? ""}
                    onChange={(e) => setArg(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ))}
                {errors.args && (
                  <p className="flex items-center gap-1 text-xs text-red-400" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.args}
                  </p>
                )}
              </motion.div>
            )}

            {/* Field 6 — Deposit Info */}
            <div className="glass-whisper rounded-xl p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-aurora-violet mt-0.5" />
              <div className="space-y-1 text-sm text-muted-foreground font-body leading-relaxed">
                <p>
                  You will stake <span className="text-foreground font-semibold">100 MOI</span> to create this proposal
                </p>
                <p className="text-emerald-400">Deposit is returned if proposal passes and is executed</p>
                <p className="text-red-400">Deposit is forfeited if proposal fails or is cancelled</p>
              </div>
            </div>

            {/* Submit */}
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              onClick={handleSubmit}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Submit Proposal
            </Button>
          </div>
        </motion.div>

        {/* RIGHT — Preview + Info */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6 lg:sticky lg:top-6"
        >
          {/* Preview Card */}
          <Card className="glass rounded-2xl depth-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-aurora-violet" />
                Proposal Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-heading text-lg font-semibold text-foreground break-words">
                {formData.title.trim() || "Untitled Proposal"}
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" size="sm">
                  Draft
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">Proposer: You</p>

              {formData.description.trim() && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {formData.description}
                </p>
              )}

              {(formData.targetContract || formData.method) && (
                <div className="flex flex-wrap items-center gap-2">
                  {formData.targetContract && (
                    <span className="inline-flex items-center gap-1 rounded-lg glass-whisper px-2.5 py-1 text-2xs text-muted-foreground">
                      {getContractLabel(formData.targetContract)}
                    </span>
                  )}
                  {formData.method && (
                    <span className="inline-flex items-center gap-1 rounded-lg glass-whisper px-2.5 py-1 text-2xs text-muted-foreground">
                      {getMethodLabel(formData.targetContract, formData.method)}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="glass rounded-2xl depth-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-4 w-4 text-muted-foreground" />
                Governance Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {RULES.map((rule, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aurora-violet/10 text-aurora-violet">
                      {rule.icon}
                    </span>
                    {rule.label}
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
