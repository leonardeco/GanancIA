import type { KPIs, RevenueDataPoint, TopItem, MenuItem, Branch, Restaurant, Alert } from "@ganancia/shared"

export const DEMO_USER = { id: "demo", email: "demo@ganancia.app", name: "Demo User", plan: "pro" as const, createdAt: new Date().toISOString() }
export const DEMO_TOKEN = "demo-token"

export const DEMO_RESTAURANT: Restaurant = {
  id: "demo-restaurant",
  ownerId: "demo",
  name: "La Parrilla Demo",
  currency: "USD",
  timezone: "America/Argentina/Buenos_Aires",
  createdAt: new Date().toISOString(),
}

export const DEMO_BRANCH: Branch = {
  id: "demo-branch",
  restaurantId: "demo-restaurant",
  name: "Casa central",
  address: "Av. Corrientes 1234",
}

export const DEMO_KPIS: KPIs = {
  revenue: 84320,
  cost: 29112,
  grossMargin: 55208,
  grossMarginPct: 65.5,
  ticketAverage: 4216,
  covers: 412,
  period: "Este mes",
  deltas: {
    revenue: 12.4,
    grossMarginPct: 1.8,
    ticketAverage: 5.1,
    covers: -3.2,
  },
}

function generateChart(): RevenueDataPoint[] {
  const points: RevenueDataPoint[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const base = 2400 + Math.sin(i * 0.4) * 600
    const noise = (Math.random() - 0.5) * 800
    const revenue = Math.max(800, Math.round(base + noise))
    points.push({
      date: d.toISOString().slice(0, 10),
      revenue,
      cost: Math.round(revenue * 0.34),
      margin: 66,
    })
  }
  return points
}

export const DEMO_CHART: RevenueDataPoint[] = generateChart()

export const DEMO_TOP_ITEMS: TopItem[] = [
  { menuItemId: "1", name: "Bife de chorizo", category: "principal", unitsSold: 312, revenue: 24960, margin: 68 },
  { menuItemId: "2", name: "Empanadas (docena)", category: "entrada", unitsSold: 280, revenue: 11200, margin: 72 },
  { menuItemId: "3", name: "Milanesa napolitana", category: "principal", unitsSold: 198, revenue: 13860, margin: 61 },
  { menuItemId: "4", name: "Provoleta", category: "entrada", unitsSold: 175, revenue: 6125, margin: 74 },
  { menuItemId: "5", name: "Costillas BBQ", category: "principal", unitsSold: 120, revenue: 14400, margin: 55 },
]

export const DEMO_MENU_ITEMS: MenuItem[] = [
  { id: "1", restaurantId: "demo-restaurant", name: "Bife de chorizo", category: "principal", costPrice: 25.6, salePrice: 80, margin: 68, unitsSold: 312, bcgCategory: "estrella" },
  { id: "2", restaurantId: "demo-restaurant", name: "Empanadas (docena)", category: "entrada", costPrice: 11.2, salePrice: 40, margin: 72, unitsSold: 280, bcgCategory: "estrella" },
  { id: "3", restaurantId: "demo-restaurant", name: "Milanesa napolitana", category: "principal", costPrice: 27.3, salePrice: 70, margin: 61, unitsSold: 198, bcgCategory: "estrella" },
  { id: "4", restaurantId: "demo-restaurant", name: "Provoleta", category: "entrada", costPrice: 9.1, salePrice: 35, margin: 74, unitsSold: 175, bcgCategory: "estrella" },
  { id: "5", restaurantId: "demo-restaurant", name: "Costillas BBQ", category: "principal", costPrice: 54, salePrice: 120, margin: 55, unitsSold: 120, bcgCategory: "caballo" },
  { id: "6", restaurantId: "demo-restaurant", name: "Lomo Wellington", category: "especial", costPrice: 72, salePrice: 160, margin: 55, unitsSold: 38, bcgCategory: "puzzle" },
  { id: "7", restaurantId: "demo-restaurant", name: "Sopa del día", category: "entrada", costPrice: 8, salePrice: 22, margin: 64, unitsSold: 35, bcgCategory: "puzzle" },
  { id: "8", restaurantId: "demo-restaurant", name: "Sandwich de vacío", category: "principal", costPrice: 18, salePrice: 38, margin: 53, unitsSold: 22, bcgCategory: "perro" },
]

export const DEMO_ALERTS: Alert[] = [
  {
    id: "alert-1",
    restaurantId: "demo-restaurant",
    type: "cost_variance",
    severity: "critical",
    message: "Diferencia crítica de costo en 'Bife de chorizo'. El costo real excedió un 15% el costo teórico esperado esta semana.",
    resolved: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "alert-2",
    restaurantId: "demo-restaurant",
    type: "suspicious_cancellations",
    severity: "warning",
    message: "Patrón inusual de tickets cancelados detectado. Cajero 'Ana' ha cancelado 5 tickets por encima del promedio.",
    resolved: false,
    createdAt: new Date(Date.now() - 86400000).toISOString() // Ayer
  },
  {
    id: "alert-3",
    restaurantId: "demo-restaurant",
    type: "inventory_low",
    severity: "info",
    message: "El inventario de 'Vino Malbec Reserva' está por debajo del umbral de seguridad para el fin de semana.",
    resolved: false,
    createdAt: new Date(Date.now() - 172800000).toISOString() // Antier
  }
]
