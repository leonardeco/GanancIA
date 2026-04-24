export type AlertSeverity = "critical" | "warning" | "info"

export interface Alert {
  id: string
  restaurantId: string
  type: string
  severity: AlertSeverity
  message: string
  resolved: boolean
  createdAt: string
  metadata?: Record<string, any>
}
