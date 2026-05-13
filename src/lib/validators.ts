import { z } from "zod"

export const loginSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  signature: z.string().min(1, "Signature is required"),
})

export const createCircleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  circleType: z.enum(["public", "private", "org", "community", "premium"]),
  payoutType: z.enum(["random", "fixed", "auction", "vote"]),
  contributionAmount: z.number().positive("Contribution must be positive"),
  currency: z.enum(["USDC", "XLM"]),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  maxMembers: z.number().int().min(2).max(100),
  minMoiScore: z.number().int().min(0).max(1000).optional(),
  collateralPercent: z.number().min(0).max(100).optional(),
  lateFeePercent: z.number().min(0).max(50).default(5),
  gracePeriodHours: z.number().int().min(1).max(168).default(24),
  maxStrikes: z.number().int().min(1).max(10).default(3),
  startDate: z.string().datetime({ message: "Start date must be a valid ISO date" }),
})

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50)
    .optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  countryCode: z
    .string()
    .length(2, "Country code must be 2 characters")
    .optional()
    .or(z.literal("")),
  preferredLanguage: z.string().max(10).optional().or(z.literal("")),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateCircleInput = z.infer<typeof createCircleSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
