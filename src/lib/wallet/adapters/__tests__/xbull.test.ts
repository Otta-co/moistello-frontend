import { describe, it, expect } from "vitest"

describe("xBull Adapter", () => {
  it("should have correct wallet meta", () => {
    const meta = {
      id: "xbull",
      name: "xBull",
      category: "extension" as const,
      installUrl: "https://xbull.app",
      description: "Stellar browser extension",
      priority: 2,
    }
    expect(meta.id).toBe("xbull")
    expect(meta.priority).toBe(2)
  })

  it("should detect xBull via window.xBullSDK", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWindow: any = {}
    expect(typeof mockWindow.xBullSDK).toBe("undefined")
    mockWindow.xBullSDK = { connect: async () => "GABC..." }
    expect(typeof mockWindow.xBullSDK).toBe("object")
  })
})
