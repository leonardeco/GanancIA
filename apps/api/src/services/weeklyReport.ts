/**
 * Servicio de reporte semanal automatico.
 * Genera el resumen ejecutivo con Gana y lo guarda en weeklyReports.
 * Disenado para ejecutarse los lunes desde un BullMQ job o cron externo.
 */
import { eq, gte, sql } from "drizzle-orm"
import { sales, branches, menuItems, restaurants, weeklyReports } from "../db/schema.js"
import { askGana } from "./gana.js"

interface DB {
  query: any
  select: any
  insert: any
}

async function getWeeklyMetrics(db: DB, restaurantId: string, weekStart: Date, weekEnd: Date) {
  const restaurantBranches = await db.query.branches.findMany({
    where: eq(branches.restaurantId, restaurantId),
  })
  const branchIds = restaurantBranches.map((b: any) => b.id)
  if (branchIds.length === 0) return null

  const buildCond = (ids: string[]) =>
    sql`${sales.branchId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}])`

  const [agg] = await db.select({
    revenue: sql<number>`COALESCE(sum(${sales.totalAmount}), 0)`,
    covers: sql<number>`COALESCE(sum(${sales.quantity}), 0)`,
    txCount: sql<number>`count(*)`,
  }).from(sales).where(
    sql`${buildCond(branchIds)} AND ${sales.saleDate} >= ${weekStart} AND ${sales.saleDate} <= ${weekEnd}`
  )

  // Calcular costo total de ventas
  const salesRows = await db.select({
    menuItemId: sales.menuItemId,
    quantity: sales.quantity,
  }).from(sales).where(
    sql`${buildCond(branchIds)} AND ${sales.saleDate} >= ${weekStart} AND ${sales.saleDate} <= ${weekEnd}`
  )

  let totalCost = 0
  const itemIds = [...new Set(salesRows.map((s: any) => s.menuItemId).filter(Boolean))] as string[]
  if (itemIds.length > 0) {
    const costs = await db.select({
      id: menuItems.id,
      costPrice: menuItems.costPrice,
    }).from(menuItems).where(
      sql`${menuItems.id} = ANY(ARRAY[${sql.join(itemIds.map((id) => sql`${id}::uuid`), sql`, `)}])`
    )
    const costMap = new Map((costs as any[]).map((c) => [c.id, Number(c.costPrice)]))
    totalCost = (salesRows as any[]).reduce((sum: number, s) =>
      sum + (s.menuItemId ? (costMap.get(s.menuItemId) ?? 0) : 0) * Number(s.quantity), 0
    )
  }

  // Top 5 platos
  const topItems = await db.select({
    name: menuItems.name,
    units: sql<number>`sum(${sales.quantity})`,
    revenue: sql<number>`sum(${sales.totalAmount})`,
  }).from(sales)
    .innerJoin(menuItems, eq(sales.menuItemId, menuItems.id))
    .where(sql`${buildCond(branchIds)} AND ${sales.saleDate} >= ${weekStart} AND ${sales.saleDate} <= ${weekEnd} AND ${sales.menuItemId} IS NOT NULL`)
    .groupBy(menuItems.name)
    .orderBy(sql`sum(${sales.totalAmount}) DESC`)
    .limit(5)

  const revenue = Number(agg?.revenue ?? 0)
  const txCount = Number(agg?.txCount ?? 0)
  const covers = Number(agg?.covers ?? 0)
  const grossMargin = revenue - totalCost
  const grossMarginPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0
  const ticketAverage = txCount > 0 ? revenue / txCount : 0

  return {
    revenue,
    cost: totalCost,
    grossMargin,
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    ticketAverage: Math.round(ticketAverage * 100) / 100,
    covers,
    txCount,
    topItems: (topItems as any[]).map((i) => ({
      name: i.name,
      units: Number(i.units),
      revenue: Number(i.revenue),
    })),
  }
}

export async function generateWeeklyReport(db: DB, restaurantId: string): Promise<string | null> {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, restaurantId),
  })
  if (!restaurant) return null

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(now)
  weekEnd.setHours(23, 59, 59, 999)

  const metrics = await getWeeklyMetrics(db, restaurantId, weekStart, weekEnd)
  if (!metrics) return null

  // Generar resumen con Gana
  const prompt = `Genera el resumen ejecutivo semanal del restaurante con estos datos:
- Ventas totales: $${metrics.revenue.toFixed(2)}
- Costo total: $${metrics.cost.toFixed(2)}
- Margen bruto: ${metrics.grossMarginPct}%
- Ticket promedio: $${metrics.ticketAverage.toFixed(2)}
- Cubiertos: ${metrics.covers}
- Transacciones: ${metrics.txCount}
- Top platos: ${metrics.topItems.map((i) => `${i.name} (${i.units} uds, $${i.revenue.toFixed(0)})`).join(", ")}

En máximo 5 oraciones. Usa tono directo y termina con 2 acciones concretas para la semana que comienza.`

  let summaryText: string
  try {
    summaryText = await askGana(restaurantId, [{ role: "user", content: prompt }], db, restaurant.name)
  } catch {
    summaryText = `Resumen semana ${weekStart.toLocaleDateString("es-AR")} al ${weekEnd.toLocaleDateString("es-AR")}: Ventas $${metrics.revenue.toFixed(0)}, margen ${metrics.grossMarginPct}%, ticket promedio $${metrics.ticketAverage.toFixed(2)}.`
  }

  // Guardar en DB
  await db.insert(weeklyReports).values({
    restaurantId,
    weekStart,
    metricsJson: metrics,
    summaryText,
  })

  return summaryText
}

// Generar reportes para todos los restaurantes (llamar desde cron)
export async function generateAllWeeklyReports(db: DB): Promise<void> {
  const allRestaurants = await db.query.restaurants.findMany()
  for (const restaurant of allRestaurants) {
    try {
      await generateWeeklyReport(db, restaurant.id)
      console.log(`[weeklyReport] Reporte generado para ${restaurant.name}`)
    } catch (err) {
      console.error(`[weeklyReport] Error en restaurante ${restaurant.id}:`, err)
    }
  }
}
