"use client"

export type MetricName =
  | "governance.proposal.created"
  | "governance.proposal.executed"
  | "governance.vote.cast"
  | "governance.timelock.expired"
  | "reputation.tier.upgraded"
  | "reputation.tier.downgraded"
  | "wallet.connect.attempt"
  | "wallet.connect.success"
  | "wallet.connect.failure"
  | "wallet.sign.attempt"
  | "wallet.sign.success"
  | "wallet.sign.failure"
  | "feature.flag.toggled"
  | "page.view"
  | "error.unhandled"

export interface MetricEvent {
  name: MetricName
  value?: number
  tags?: Record<string, string>
  timestamp: number
}

const METRIC_FLUSH_SIZE = 50
const METRIC_FLUSH_INTERVAL = 30_000

let metricBuffer: MetricEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

export function recordMetric(
  name: MetricName,
  value?: number,
  tags?: Record<string, string>,
): void {
  const event: MetricEvent = {
    name,
    value,
    tags,
    timestamp: Date.now(),
  }
  metricBuffer.push(event)

  if (metricBuffer.length >= METRIC_FLUSH_SIZE) {
    flushMetrics()
  }
}

function startFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(flushMetrics, METRIC_FLUSH_INTERVAL)
}

function flushMetrics(): void {
  if (metricBuffer.length === 0) return
  const batch = metricBuffer.splice(0, metricBuffer.length)

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[Metrics]", JSON.stringify(batch))
  }

  // Production path: POST batch to telemetry endpoint
  // fetch("/v1/metrics", { method: "POST", body: JSON.stringify(batch) })
}

export function initMonitoring(): void {
  if (typeof window === "undefined") return
  startFlushTimer()

  const pagePath = window.location.pathname
  recordMetric("page.view", 1, { path: pagePath })

  window.addEventListener("error", (event) => {
    recordMetric("error.unhandled", 1, {
      message: event.message,
      source: event.filename || "unknown",
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    recordMetric("error.unhandled", 1, {
      message: event.reason?.message || String(event.reason),
      source: "unhandled-rejection",
    })
  })
}

export function getMetricBufferSize(): number {
  return metricBuffer.length
}

export function resetMetrics(): void {
  metricBuffer = []
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}
