/**
 * Motor de deteccion automatica de alertas.
 * Se puede llamar desde un job periodico (BullMQ/cron) o desde rutas de ventas.
 */
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { sales, branches, menuItems, alerts, restaurants, inventoryCosts } from "../db/schema.js"

interface DB {
  query: any
  select: any
  insert: any
  update: any
}

export async function runAlertEngine(db: DB, restaurantId: string): Promise<number> {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, restaurantId),
  })
  if (!restaurant) return 0

  let created = 0

  // Helper: crear alerta si no existe una igual sin resolver en los ultimos 7 dias
  async function createAlertIfNew(
    type: string,
    severity: "critical" | "warning" | "info",
    message: string,
    metadata: Record<string, unknown> = {}
  ) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const existing = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.restaurantId, restaurantId),
        eq(alerts.type, type),
        eq(alerts.resolved, false),
        gte(alerts.createdAt, sevenDaysAgo)
      ),
    })
    if (existing) return

    await db.insert(alerts).values({ restaurantId, type, severity, message, metadata })
    created++
  }

  const restaurantBranches = await db.query.branches.findMany({
    where: eq(branches.restaurantId, restaurantId),
  })
  const branchIds = restaurantBranches.map((b: any) => b.id)
  if (branchIds.length === 0) return 0

  const buildBranchCond = (ids: string[]) =>
    sql`${sales.branchId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}])`

  // Fechas de referencia
  const now = new Date()
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7)
  const prevWeekStart = new Date(now); prevWeekStart.setDate(now.getDate() - 14)
  const prevWeekEnd = new Date(thisWeekStart); prevWeekEnd.setSeconds(prevWeekEnd.getSeconds() - 1)

  // ─────────────────────────────────────────────
  // ALERTA 1: Caida de ventas > 20% semana a semana
  // ─────────────────────────────────────────────
  const [thisWeek] = await db.select({
    revenue: sql<number>`COALESCE(sum(${sales.totalAmount}), 0)`,
  }).from(sales).where(and(buildBranchCond(branchIds), gte(sales.saleDate, thisWeekStart)))

  const [prevWeek] = await db.select({
    revenue: sql<number>`COALESCE(sum(${sales.totalAmount}), 0)`,
  }).from(sales).where(and(
    buildBranchCond(branchIds),
    gte(sales.saleDate, prevWeekStart),
    lte(sales.saleDate, prevWeekEnd)
  ))

  const thisRev = Number(thisWeek?.revenue ?? 0)
  const prevRev = Number(prevWeek?.revenue ?? 0)

  if (prevRev > 0 && thisRev < prevRev * 0.8) {
    const drop = Math.round(((prevRev - thisRev) / prevRev) * 100)
    await createAlertIfNew(
      "revenue_drop",
      drop >= 35 ? "critical" : "warning",
      `Las ventas de esta semana cayeron ${drop}% respecto a la semana pasada ($${prevRev.toFixed(0)} → $${thisRev.toFixed(0)}).`,
      { drop, thisRev, prevRev }
    )
  }

  // ─────────────────────────────────────────────
  // ALERTA 2: Platos con margen < 25% entre los mas vendidos
  // ─────────────────────────────────────────────
  const topSoldItems = await db.select({
    menuItemId: sales.menuItemId,
    units: sql<number>`sum(${sales.quantity})`,
  }).from(sales)
    .where(and(buildBranchCond(branchIds), gte(sales.saleDate, thisWeekStart), sql`${sales.menuItemId} IS NOT NULL`))
    .groupBy(sales.menuItemId)
    .orderBy(sql`sum(${sales.quantity}) DESC`)
    .limit(10)

  for (const sold of topSoldItems) {
    if (!sold.menuItemId) continue
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, sold.menuItemId),
    })
    if (!item) continue
    const cost = Number(item.costPrice)
    const price = Number(item.salePrice)
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0
    if (margin < 25) {
      await createAlertIfNew(
        `low_margin_${item.id}`,
        margin < 15 ? "critical" : "warning",
        `"${item.name}" tiene margen de ${margin.toFixed(1)}% y es uno de los platos más vendidos esta semana. Revisá el costo o el precio de venta.`,
        { itemId: item.id, itemName: item.name, margin }
      )
    }
  }

  // ─────────────────────────────────────────────
  // ALERTA 3: Variacion de inventario critica (> umbral del restaurante)
  // ─────────────────────────────────────────────
  const threshold = Number(restaurant.alertThreshold ?? 10)
  const recentInventory = await db.query.inventoryCosts.findMany({
    where: and(
      eq(inventoryCosts.restaurantId, restaurantId),
      gte(inventoryCosts.date, thisWeekStart)
    ),
  })

  for (const inv of recentInventory) {
    const theoretical = Number(inv.theoreticalCost)
    const real = Number(inv.realCost)
    if (theoretical <= 0) continue
    const variancePct = ((real - theoretical) / theoretical) * 100
    if (variancePct >= threshold) {
      await createAlertIfNew(
        `inventory_variance_${inv.ingredient.toLowerCase().replace(/\s+/g, "_")}`,
        variancePct >= threshold * 2 ? "critical" : "warning",
        `Inventario: "${inv.ingredient}" tiene un excedente real de ${variancePct.toFixed(1)}% sobre el costo teórico. Posible merma o robo.`,
        { ingredient: inv.ingredient, variancePct, theoretical, real }
      )
    }
  }

  // ─────────────────────────────────────────────
  // ALERTA 4: Sin ventas registradas en las ultimas 48 horas
  // ─────────────────────────────────────────────
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(now.getDate() - 2)

  const [recentSales] = await db.select({
    count: sql<number>`count(*)`,
  }).from(sales).where(and(buildBranchCond(branchIds), gte(sales.saleDate, twoDaysAgo)))

  if (Number(recentSales?.count ?? 0) === 0) {
    await createAlertIfNew(
      "no_recent_sales",
      "info",
      "No se registraron ventas en las últimas 48 horas. ¿La carga de datos está al día?",
      {}
    )
  }

  return created
}