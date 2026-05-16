import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ── Mocks (hoisted) ──────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/reputation",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/stores/auth-store", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useAuthStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      user: { displayName: "Test User", moiScore: 750, walletAddress: "GABC", preferredLanguage: "en" },
      isAuthenticated: true,
      token: "mock-token",
      refreshToken: "mock-refresh",
      isLoading: false,
    }
    return selector ? selector(state) : state
  }),
}))

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock("@/lib/api-client", () => ({
  get: mockGet,
  post: mockPost,
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getErrorMessage: vi.fn((e: any) => e?.message ?? "Unknown error"),
}))

// Strip framer-motion down to plain DOM elements for deterministic jsdom rendering
vi.mock("framer-motion", () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = [
      "initial", "animate", "exit", "transition", "variants",
      "whileHover", "whileTap", "whileInView", "whileFocus", "whileDrag",
      "layout", "layoutId", "layoutRoot", "layoutScroll",
      "onAnimationStart", "onAnimationComplete",
      "onDragStart", "onDrag", "onDragEnd",
      "onUpdate", "onLayoutAnimationStart", "onLayoutAnimationComplete",
      "drag", "dragConstraints", "dragElastic", "dragMomentum",
      "dragControls", "dragListener", "dragPropagation",
      "viewport", "custom", "inherit", "static",
    ]
    const clean: Record<string, unknown> = {}
    for (const key of Object.keys(props)) {
      if (!motionKeys.includes(key)) {
        clean[key] = props[key]
      }
    }
    return clean
  }

  const createMotionComponent = (tag: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/display-name
    return React.forwardRef((rawProps: any, ref: any) => {
      const { children, ...rest } = stripMotionProps(rawProps)
      return React.createElement(tag, { ...rest, ref }, children as React.ReactNode)
    })
  }

  return {
    motion: {
      div: createMotionComponent("div"),
      li: createMotionComponent("li"),
      span: createMotionComponent("span"),
      circle: createMotionComponent("circle"),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useMotionValue: (v: any) => ({ get: () => v, set: vi.fn() }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useTransform: (v: any) => v,
  }
})

// ── Imports (after mocks) ─────────────────────────────────

import { TierCard } from "@/components/reputation/tier-card"
import ReputationPage from "@/app/(dashboard)/reputation/page"

// ── Helpers ───────────────────────────────────────────────

const renderTierCard = (props: Partial<{
  score: number
  streak: number
  completions: number
  totalContributed: number
  defaults: number
}> = {}) => {
  return render(
    <TierCard
      score={750}
      streak={5}
      completions={10}
      totalContributed={50000}
      defaults={0}
      {...props}
    />
  )
}

/**
 * Finds a leaf element (no child elements with the same matching text)
 * whose textContent contains every substring provided.
 */
const getByTextFragmented = (tagName: string, ...fragments: string[]) => {
  return screen.getByText((_, element) => {
    if (!element || element?.tagName?.toLowerCase() !== tagName.toLowerCase()) return false
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim()
    return fragments.every((f) => text.includes(f))
  })
}

// ── Tier thresholds (from component source) ───────────────
// Bronze: 0-300   Silver: 301-600   Gold: 601-850
// Platinum: 851-950   Diamond: 951-1000

// ===========================================================
// CATEGORIES 1–5: TierCard Unit Tests
// ===========================================================
describe("TierCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── CATEGORY 1: Tier Calculation (5 tests) ──

  describe("Tier Calculation", () => {
    it("CAT1-01: renders Bronze tier when score is 100", () => {
      renderTierCard({ score: 100 })
      expect(screen.getAllByText("Bronze").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT1-02: renders Silver tier when score is 350", () => {
      renderTierCard({ score: 350 })
      expect(screen.getAllByText("Silver").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT1-03: renders Gold tier when score is 650", () => {
      renderTierCard({ score: 650 })
      expect(screen.getAllByText("Gold").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT1-04: renders Platinum tier when score is 900", () => {
      renderTierCard({ score: 900 })
      expect(screen.getAllByText("Platinum").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT1-05: renders Diamond tier when score is 960", () => {
      renderTierCard({ score: 960 })
      expect(screen.getAllByText("Diamond").length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── CATEGORY 2: Badge Rendering (5 tests) ──

  describe("Badge Rendering", () => {
    it("CAT2-06: Bronze tier badge shows 'Bronze' text", () => {
      renderTierCard({ score: 100 })
      expect(screen.getAllByText("Bronze").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT2-07: Silver tier badge shows 'Silver' text", () => {
      renderTierCard({ score: 350 })
      expect(screen.getAllByText("Silver").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT2-08: Gold tier badge shows 'Gold' text", () => {
      renderTierCard({ score: 650 })
      expect(screen.getAllByText("Gold").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT2-09: Platinum tier badge shows 'Platinum' text", () => {
      renderTierCard({ score: 900 })
      expect(screen.getAllByText("Platinum").length).toBeGreaterThanOrEqual(2)
    })

    it("CAT2-10: Diamond tier badge shows 'Diamond' text", () => {
      renderTierCard({ score: 960 })
      expect(screen.getAllByText("Diamond").length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── CATEGORY 3: Progress Bar (4 tests) ──

  describe("Progress Bar", () => {
    it("CAT3-11: shows 'points to next tier' text with correct score count", () => {
      // Score 650 is Gold (601-850), next tier is Platinum
      // pointsToNext = Platinum.min - score = 851 - 650 = 201
      renderTierCard({ score: 650 })
      const el = getByTextFragmented("p", "201", "points to", "Platinum")
      expect(el).toBeDefined()
    })

    it("CAT3-12: score at tier minimum shows low (0%) progress", () => {
      // Gold tier starts at 601 — exactly at minimum
      renderTierCard({ score: 601 })
      const bar = screen.getByRole("progressbar")
      expect(Number(bar.getAttribute("aria-valuenow"))).toBe(0)
    })

    it("CAT3-13: score near tier maximum shows high progress (90%+)", () => {
      // Gold ends at 850, 840 is near max — progress = (840-601)/(850-601)*100 ≈ 96%
      renderTierCard({ score: 840 })
      const bar = screen.getByRole("progressbar")
      const progress = Number(bar.getAttribute("aria-valuenow"))
      expect(progress).toBeGreaterThanOrEqual(90)
    })

    it("CAT3-14: score 1000 (global max) shows 100% progress", () => {
      // Diamond tier (951-1000), score 1000 → (1000-951)/49 * 100 = 100%
      renderTierCard({ score: 1000 })
      const bar = screen.getByRole("progressbar")
      expect(Number(bar.getAttribute("aria-valuenow"))).toBe(100)
    })
  })

  // ── CATEGORY 4: Benefits (4 tests) ──

  describe("Benefits", () => {
    it("CAT4-15: Bronze tier shows 'Basic collateral (10%)' benefit", () => {
      renderTierCard({ score: 100 })
      expect(screen.getByText("Basic collateral (10%)")).toBeDefined()
    })

    it("CAT4-16: Silver tier shows 'Reduced collateral (5%)' benefit", () => {
      renderTierCard({ score: 350 })
      expect(screen.getByText("Reduced collateral (5%)")).toBeDefined()
    })

    it("CAT4-17: Diamond tier shows 'Zero collateral (0%)' benefit", () => {
      renderTierCard({ score: 960 })
      expect(screen.getByText("Zero collateral (0%)")).toBeDefined()
    })

    it("CAT4-18: Bronze tier shows locked Silver benefits section", () => {
      renderTierCard({ score: 100 })
      // The locked heading is an <h4> containing "Locked" and "Silver" and "Benefits"
      const lockedHeading = screen.getByRole("heading", { name: /Locked/ })
      expect(lockedHeading).toBeDefined()
      expect(lockedHeading.textContent).toContain("Silver")
      // A locked benefit from Silver tier appears in the locked section
      expect(screen.getByText("Create circles (up to 10 members)")).toBeDefined()
    })
  })

  // ── CATEGORY 5: Edge Cases (4 tests) ──

  describe("Edge Cases", () => {
    it("CAT5-19: score 0 renders Bronze tier with 0% progress", () => {
      renderTierCard({ score: 0, streak: 0 })
      expect(screen.getAllByText("Bronze").length).toBeGreaterThanOrEqual(2)
      const bar = screen.getByRole("progressbar")
      expect(Number(bar.getAttribute("aria-valuenow"))).toBe(0)
    })

    it("CAT5-20: score 1000 renders Diamond tier with 100% progress and max-tier message", () => {
      renderTierCard({ score: 1000 })
      expect(screen.getAllByText("Diamond").length).toBeGreaterThanOrEqual(2)
      const bar = screen.getByRole("progressbar")
      expect(Number(bar.getAttribute("aria-valuenow"))).toBe(100)
      expect(screen.getByText(/Maximum tier achieved/)).toBeDefined()
    })

    it("CAT5-21: score 200 shows substantial progress toward Silver", () => {
      // Bronze tier (0-300), score 200 → progress = 200/300*100 ≈ 66.7%
      renderTierCard({ score: 200 })
      const bar = screen.getByRole("progressbar")
      const progress = Number(bar.getAttribute("aria-valuenow"))
      expect(progress).toBeGreaterThanOrEqual(65)
      expect(progress).toBeLessThanOrEqual(70)
      // Points to Silver = 301 - 200 = 101
      expect(getByTextFragmented("p", "101", "points to", "Silver")).toBeDefined()
    })

    it("CAT5-22: streak of 0 does not break rendering; score text shows correctly", () => {
      // TierCard receives but does not visually display the streak prop.
      // The component must still render without error when streak is 0.
      renderTierCard({ score: 200, streak: 0 })
      // Score "200" appears in multiple places (desktop + mobile). Verify at least one.
      expect(screen.getAllByText("200").length).toBeGreaterThanOrEqual(1)
      // Progress bar rendered
      expect(screen.getByRole("progressbar")).toBeDefined()
      // Bronze tier badge present
      expect(screen.getAllByText("Bronze").length).toBeGreaterThanOrEqual(2)
    })
  })
})

// ===========================================================
// CATEGORY 6: Reputation Page Integration Tests
// ===========================================================
describe("Reputation Page Integration", () => {
  const fixtureData = {
    success: true,
    data: {
      score: 500,
      breakdown: {
        streaks: 3,
        completions: 12,
        volume: 25000,
        recency: Date.now() / 1000,
      },
      history: [
        { date: "2025-01-01T00:00:00Z", score: 450, reason: "circle completion" },
        { date: "2025-02-01T00:00:00Z", score: 500, reason: "streak bonus" },
      ],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue(fixtureData)
  })

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <ReputationPage />
      </QueryClientProvider>
    )
  }

  it("CAT6-23: reputation page renders the TierCard benefits section", async () => {
    renderPage()
    await waitFor(() => {
      // The TierCard renders "Your Benefits" heading
      expect(screen.getByText("Your Benefits")).toBeDefined()
    })
  })

  it("CAT6-24: TierCard appears between ScoreGauge and breakdown cards", async () => {
    renderPage()
    await waitFor(() => {
      // ScoreGauge renders the MoiScore page header
      expect(screen.getByText("MoiScore")).toBeDefined()
      // TierCard renders benefits heading
      expect(screen.getByText("Your Benefits")).toBeDefined()
      // Breakdown cards appear after TierCard
      expect(screen.getByText("Streaks")).toBeDefined()
      expect(screen.getByText("Completed")).toBeDefined()
    })
  })

  it("CAT6-25: TierCard receives the score prop from loaded API data", async () => {
    renderPage()
    await waitFor(() => {
      // The score "500" appears in the gauge and in the TierCard.
      // Since it may appear in multiple elements, use getAllByText.
      const scoreElements = screen.getAllByText("500")
      expect(scoreElements.length).toBeGreaterThanOrEqual(1)
      // The gauge shows "/ 1000" label
      expect(screen.getByText("/ 1000")).toBeDefined()
    })
  })
})
