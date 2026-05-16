"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCreateCircle } from "@/hooks/use-circles"
import { createCircleSchema, type CreateCircleInput } from "@/lib/validators"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { CreateStepIndicator } from "@/components/circles/create-step-indicator"
import { CreateStepDetails } from "@/components/circles/create-step-details"
import { CreateStepFinancials } from "@/components/circles/create-step-financials"
import { CreateStepPayout } from "@/components/circles/create-step-payout"
import { CreateStepReview } from "@/components/circles/create-step-review"
import type { CircleFormData } from "@/types"

const STEP_LABELS = ["Details", "Financials", "Payout", "Review"]

const INITIAL_FORM: CircleFormData = {
  name: "", description: "", circleType: "public", payoutType: "random",
  contributionAmount: 100, currency: "USDC", frequency: "monthly", maxMembers: 10,
  minMoiScore: 0, collateralPercent: 10, lateFeePercent: 5, gracePeriodHours: 24,
  maxStrikes: 3, startDate: "",
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

const ANIM = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

const STEPS = [CreateStepDetails, CreateStepFinancials, CreateStepPayout, CreateStepReview] as const

export default function CreateCirclePage() {
  const router = useRouter()
  const createCircle = useCreateCircle()

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CircleFormData>(INITIAL_FORM)

  const buildFormData = useCallback((): CreateCircleInput => {
    const d = formData
    return {
      name: d.name, description: d.description || undefined, circleType: d.circleType,
      payoutType: d.payoutType, contributionAmount: d.contributionAmount, currency: d.currency,
      frequency: d.frequency, maxMembers: d.maxMembers,
      minMoiScore: d.minMoiScore ?? undefined, collateralPercent: d.collateralPercent ?? undefined,
      lateFeePercent: d.lateFeePercent, gracePeriodHours: d.gracePeriodHours,
      maxStrikes: d.maxStrikes, startDate: d.startDate || new Date().toISOString(),
    }
  }, [formData])

  const validateStep = useCallback((step: number): boolean => {
    setErrors({})
    const d = formData
    if (step === 1) {
      if (d.name.length < 3) { setErrors({ name: "Name must be at least 3 characters" }); return false }
      if (d.maxMembers < 2) { setErrors({ maxMembers: "Must have at least 2 members" }); return false }
      return true
    }
    if (step === 2) {
      if (d.contributionAmount <= 0) { setErrors({ contributionAmount: "Contribution must be positive" }); return false }
      return true
    }
    if (step === 3) return true
    try {
      createCircleSchema.parse(buildFormData())
      return true
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const fe: Record<string, string> = {}
        for (const e of (err as { errors: { path: (string | number)[]; message: string }[] }).errors) {
          fe[e.path.join(".")] = e.message
        }
        setErrors(fe)
      }
      return false
    }
  }, [formData, buildFormData])

  const go = (dir: number, step: number) => { setDirection(dir); setCurrentStep(step) }

  const handleNext = () => { if (validateStep(currentStep)) go(1, Math.min(4, currentStep + 1)) }
  const handleBack = () => { setErrors({}); go(-1, Math.max(1, currentStep - 1)) }
  const handleSubmit = () => {
    if (!validateStep(4)) return
    const payload = buildFormData()
    createCircle.mutate(payload as unknown as Parameters<typeof createCircle.mutate>[0], {
      onSuccess: (res: { data?: { id: string } }) => router.push(res.data?.id ? `/circles/${res.data.id}` : "/circles"),
      onError: () => setErrors({ submit: "Failed to create circle. Please try again." }),
    })
  }

  const StepC = STEPS[currentStep - 1]
  const stepProps = currentStep === 4
    ? { formData, isPending: createCircle.isPending, errors }
    : { formData, setFormData, errors }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Circle" description="Set up your savings circle in 2 minutes"
        breadcrumbs={[{ label: "Circles", href: "/circles" }, { label: "Create" }]} />
      <div className="mx-auto max-w-2xl">
        <CreateStepIndicator currentStep={currentStep} steps={STEP_LABELS} />
        <div className="glass-premium rounded-2xl p-6 md:p-8 holo-border">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={`step-${currentStep}`} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={ANIM}>
              <StepC
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(stepProps as any)} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" size="md" onClick={handleBack}
              leftIcon={<ChevronLeft className="h-4 w-4" />}>Previous</Button>
          ) : <div />}
          {currentStep < 4 ? (
            <Button variant="primary" size="md" onClick={handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}>Next</Button>
          ) : (
            <Button variant="premium" size="lg" onClick={handleSubmit}
              isLoading={createCircle.isPending}>Create Circle</Button>
          )}
        </div>
      </div>
    </div>
  )
}
