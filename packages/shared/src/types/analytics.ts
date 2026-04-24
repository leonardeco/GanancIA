export interface KPIDeltas {
  revenue: number | null
  grossMarginPct: number | null
  ticketAverage: number | null
  covers: number | null
}

export interface KPIs {
  revenue: number
  cost: number
  grossMargin: number
  grossMarginPct: number
  ticketAverage: number
  covers: number
  period: string
  deltas: KPIDeltas | null
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  cost: number
  margin: number
}

export interface TopItem {
  menuItemId: string
  name: string
  category: string
  unitsSold: number
  revenue: number
  margin: number
}
