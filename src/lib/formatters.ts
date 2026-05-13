import { formatDistanceToNow } from "date-fns"

export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "XLM" ? "USD" : "USD",
    currencyDisplay: "symbol",
  })

  if (currency === "XLM") {
    return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} XLM`
  }

  return formatter.format(amount)
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date

  const defaults: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  return new Intl.DateTimeFormat("en-US", { ...defaults, ...options }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date

  try {
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return formatDate(d)
  }
}

export function formatAddress(
  address: string,
  startChars = 6,
  endChars = 4
): string {
  if (!address) return ""
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US")
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) {
    return `${days}d`
  }
  return `${days}d ${remainingHours}h`
}
