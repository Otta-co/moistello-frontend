export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100/v1"

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1100/ws"

export const STELLAR_NETWORK = "testnet"

export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org"

export const STELLAR_RPC_URL = "https://soroban-testnet.stellar.org"

export const USDC_CONTRACT_ID =
  process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ||
  "CAWQBY6LQ6TUKH4H6RDRSFPSZZMEQH7HURB5X4AFTYLA3T4R7SCAORR6"

export const APP_NAME = "Moistello"

export const SUPPORTED_CURRENCIES = [
  {
    code: "USDC",
    name: "USD Coin",
    icon: "/icons/usdc.svg",
    decimals: 7,
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  {
    code: "XLM",
    name: "Stellar Lumens",
    icon: "/icons/xlm.svg",
    decimals: 7,
    isNative: true,
  },
] as const

export const CIRCLE_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
] as const

export const PAYOUT_TYPES = [
  { value: "random", label: "Random" },
  { value: "fixed", label: "Fixed" },
  { value: "auction", label: "Auction" },
  { value: "vote", label: "Vote" },
] as const

export const CIRCLE_TYPES = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "org", label: "Organization" },
  { value: "community", label: "Community" },
  { value: "premium", label: "Premium" },
] as const

export const MOI_SCORE_MAX = 1000

export const MAX_PENDING_APPLICATIONS = 10

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const Routes = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CIRCLES: "/circles",
  CIRCLE_DETAIL: (id: string) => `/circles/${id}`,
  CREATE_CIRCLE: "/circles/create",
  PROFILE: "/reputation",
  PROFILE_SETTINGS: "/settings",
  PROFILE_SCORE: "/reputation",
  WALLET: "/wallet",
  NOTIFICATIONS: "/notifications",
  INVITE: (code: string) => `/invite/${code}`,
  TERMS: "/terms",
  PRIVACY: "/privacy",
  ABOUT: "/about",
} as const
