export type Plan = "starter" | "pro" | "cadena"

export interface User {
  id: string
  email: string
  name: string
  plan: Plan
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
