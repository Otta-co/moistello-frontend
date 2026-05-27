export type RelayStatus = "healthy" | "degraded" | "down"

interface RelayEntry {
  success: boolean
  latencyMs: number
}

const WINDOW_SIZE = 10
const HEALTHY_THRESHOLD = 0.9
const DEGRADED_THRESHOLD = 0.5
const HEALTHY_LATENCY = 2000
const RECOVERY_CONSECUTIVE_SUCCESS = 3
const HEALTHY_CONSECUTIVE_SUCCESS = 5

export class WCRelayMonitor {
  private window: RelayEntry[] = []
  private consecutiveSuccesses = 0
  private _status: RelayStatus = "healthy"

  get status(): RelayStatus {
    return this._status
  }

  recordOutcome(success: boolean, latencyMs: number): void {
    this.window.push({ success, latencyMs })
    if (this.window.length > WINDOW_SIZE) {
      this.window.shift()
    }

    if (success) {
      this.consecutiveSuccesses++
    } else {
      this.consecutiveSuccesses = 0
    }

    this.recalculate()
  }

  private recalculate(): void {
    if (this.window.length === 0) return

    const successCount = this.window.filter((e) => e.success).length
    const avgLatency =
      this.window.reduce((sum, e) => sum + e.latencyMs, 0) / this.window.length

    const successRate = successCount / this.window.length

    if (successRate >= HEALTHY_THRESHOLD && avgLatency < HEALTHY_LATENCY) {
      if (this._status === "down") {
        if (this.consecutiveSuccesses >= RECOVERY_CONSECUTIVE_SUCCESS) {
          this._status = "degraded"
        }
      } else if (this.consecutiveSuccesses >= HEALTHY_CONSECUTIVE_SUCCESS) {
        this._status = "healthy"
      }
    } else if (successRate >= DEGRADED_THRESHOLD) {
      if (this._status !== "down") {
        this._status = "degraded"
      } else if (this.consecutiveSuccesses >= RECOVERY_CONSECUTIVE_SUCCESS) {
        this._status = "degraded"
      }
    } else {
      this._status = "down"
    }
  }
}

let _monitor: WCRelayMonitor | null = null

export function getRelayMonitor(): WCRelayMonitor {
  if (!_monitor) {
    _monitor = new WCRelayMonitor()
  }
  return _monitor
}
