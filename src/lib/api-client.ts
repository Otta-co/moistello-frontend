import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { API_BASE_URL } from "./constants"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

let refreshPromise: Promise<string> | null = null
let isRefreshing = false

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null

  const cookieMatch = document.cookie.match(
    /(?:^|;\s*)moistello_token=([^;]*)/
  )
  if (cookieMatch?.[1]) return cookieMatch[1]

  try {
    const stored = localStorage.getItem("moistello_token")
    if (stored) return JSON.parse(stored)
  } catch {
    return null
  }

  return null
}

function setAccessToken(token: string): void {
  if (typeof document === "undefined") return
  document.cookie = `moistello_token=${token}; path=/; max-age=86400; SameSite=Lax`
  try {
    localStorage.setItem("moistello_token", JSON.stringify(token))
  } catch {
    // localStorage not available
  }
}

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      let refreshToken: string | null = null

      if (typeof document !== "undefined") {
        const cookieMatch = document.cookie.match(
          /(?:^|;\s*)moistello_refresh=([^;]*)/
        )
        if (cookieMatch?.[1]) {
          refreshToken = cookieMatch[1]
        }

        if (!refreshToken) {
          try {
            const stored = localStorage.getItem("moistello_refresh")
            if (stored) refreshToken = JSON.parse(stored)
          } catch {
            // ignore
          }
        }
      }

      if (!refreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })

      const newToken = response.data?.data?.token || response.data?.token
      if (!newToken) {
        throw new Error("No token in refresh response")
      }

      setAccessToken(newToken)
      return newToken
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          document.cookie =
            "moistello_token=; path=/; max-age=0; SameSite=Lax"
          document.cookie =
            "moistello_refresh=; path=/; max-age=0; SameSite=Lax"
          try {
            localStorage.removeItem("moistello_token")
            localStorage.removeItem("moistello_refresh")
          } catch {
            // ignore
          }
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      }
    }

    if (typeof console !== "undefined") {
      const message = getErrorMessage(error)
      if (error.response?.status) {
        console.error(`[API ${error.response.status}] ${message}`)
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    if (data?.error) return data.error
    if (data?.message) return data.message
    if (typeof data === "string") return data

    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your inputs."
      case 401:
        return "Authentication required. Please log in."
      case 403:
        return "You do not have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 409:
        return "A conflict occurred. The resource may already exist."
      case 422:
        return "Validation failed. Please check your inputs."
      case 429:
        return "Too many requests. Please try again later."
      case 500:
        return "Internal server error. Please try again later."
      default:
        return error.message || "An unexpected error occurred."
    }
  }

  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected error occurred."
}

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config)
  return response.data
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config)
  return response.data
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config)
  return response.data
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config)
  return response.data
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config)
  return response.data
}

export { apiClient }
export default apiClient
