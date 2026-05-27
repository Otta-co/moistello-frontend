import { describe, it, expect, beforeEach } from "vitest"
import { WCRelayMonitor } from "../wc2-relay"

describe("WCRelayMonitor", () => {
  let monitor: WCRelayMonitor

  beforeEach(() => {
    monitor = new WCRelayMonitor()
  })

  it("starts as healthy", () => {
    expect(monitor.status).toBe("healthy")
  })

  it("stays healthy after all successful operations", () => {
    for (let i = 0; i < 10; i++) {
      monitor.recordOutcome(true, 100)
    }
    expect(monitor.status).toBe("healthy")
  })

  it("transitions to degraded after 50% failures", () => {
    for (let i = 0; i < 5; i++) {
      monitor.recordOutcome(true, 100)
      monitor.recordOutcome(false, 100)
    }
    expect(monitor.status).toBe("degraded")
  })

  it("transitions to down after majority failures", () => {
    for (let i = 0; i < 7; i++) {
      monitor.recordOutcome(false, 100)
    }
    expect(monitor.status).toBe("down")
  })

  it("resets consecutive successes on failure during recovery", () => {
    for (let i = 0; i < 7; i++) {
      monitor.recordOutcome(false, 100)
    }
    expect(monitor.status).toBe("down")

    monitor.recordOutcome(true, 100)
    monitor.recordOutcome(true, 100)
    monitor.recordOutcome(false, 100)
    monitor.recordOutcome(true, 100)
    monitor.recordOutcome(true, 100)
    monitor.recordOutcome(true, 100)

    expect(monitor.status).toBe("degraded")
  })

  it("maintains sliding window of 10 entries", () => {
    for (let i = 0; i < 20; i++) {
      monitor.recordOutcome(true, 100)
    }
    expect(monitor.status).toBe("healthy")
  })
})
