import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { sales, branches, restaurants, menuItems } from "../db/schema.js"
import type { FastifyInstance } from "fastify"

const querySchema = z.object({
  restaurantId: z.string().uuid(),
  from: z.string().optional(),
  to: z.string().optional(),
  branchId: z.string().uuid().optional(),
})

function buildBranchCondition(branchIds: string[]) {
  return sql`${sales.branchId} = ANY(ARRAY[${sql.join(branchIds.map((id) => sql`${id}::uuid`), sql`, `)}])`
}

async function aggregatePeriod(
  db: FastifyInstance["db"],
  branchIds: string[],
  from?: string,
  to?: string,
) {
  const conditions = [buildBranchCondition(branchIds)]
  if (from) conditions.push(gte(sales.saleDate, new Date(from)))
  if (to) conditions.push(lte(sales.saleDate, new Date(to + "T23:59:59")))

  const [agg] = await db
    .select({
      revenue: sql<number>`COALESCE(sum(${sales.totalAmount}), 0)`,
      covers: sql<number>`COALESCE(sum(${sales.quantity}), 0)`,
      txCount: sql<number>`count(*)`,
    })
    .from(sales)
    .where(and(...conditions))

  const salesRows = await db
    .select({ menuItemId: sales.menuItemId, quantity: sales.quantity })
    .from(sales)
    .where(and(...conditions))

  let totalCost = 0
  if (salesRows.length > 0) {
    const itemIds = [...new Set(salesRows.map((s) => s.menuItemId).filter(Boolean))] as string[]
    if (itemIds.length > 0) {
      const itemCosts = await db
        .select({ id: menuItems.id, costPrice: menuItems.costPrice })
        .from(menuItems)
        .where(sql`${menuItems.id} = ANY(ARRAY[${sql.join(itemIds.map((id) => sql`${id}::uuid`), sql`, `)}])`)
      const costMap = new Map(itemCosts.map((i) => [i.id, Number(i.costPrice)]))
      totalCost = salesRows.reduce((sum, s) => sum + (s.menuItemId ? (costMap.get(s.menuItemId) ?? 0) : 0) * s.quantity, 0)
    }
  }

  const revenue = Number(agg.revenue)
  const grossMargin = revenue - totalCost
  const grossMarginPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0
  const txCount = Number(agg.txCount)
  const ticketAverage = txCount > 0 ? revenue / txCount : 0

  return {
    revenue,
    cost: totalCost,
    grossMargin,
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    ticketAverage: Math.round(ticketAverage * 100) / 100,
    covers: Number(agg.covers),
  }
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function shiftPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from)
  const t = new Date(to)
  const days = Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1
  const prevTo = new Date(f)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - days + 1)
  return {
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
  }
}

const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  app.get("/kpis", async (req, reply) => {
    const query = querySchema.safeParse(req.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const { sub } = req.user as { sub: string }
    const { restaurantId, from, to, branchId } = query.data

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const restaurantBranches = await app.db.query.branches.findMany({
      where: eq(branches.restaurantId, restaurantId),
    })
    const branchIds = branchId ? [branchId] : restaurantBranches.map((b) => b.id)

    if (branchIds.length === 0) {
      return { revenue: 0, cost: 0, grossMargin: 0, grossMarginPct: 0, ticketAverage: 0, covers: 0, period: `${from ?? "inicio"} - ${to ?? "hoy"}`, deltas: null }
    }

    const current = await aggregatePeriod(app.db, branchIds, from, to)

    let deltas: Record<string, number | null> | null = null
    if (from && to) {
      const prev = shiftPeriod(from, to)
      const previous = await aggregatePeriod(app.db, branchIds, prev.from, prev.to)
      deltas = {
        revenue: delta(current.revenue, previous.revenue),
        grossMarginPct: previous.grossMarginPct > 0
          ? Math.round((current.grossMarginPct - previous.grossMarginPct) * 10) / 10
          : null,
        ticketAverage: delta(current.ticketAverage, previous.ticketAverage),
        covers: delta(current.covers, previous.covers),
      }
    }

    return {
      ...current,
      period: `${from ?? "inicio"} - ${to ?? "hoy"}`,
      deltas,
    }
  })

  app.get("/revenue-chart", async (req, reply) => {
    const query = querySchema.safeParse(req.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const { sub } = req.user as { sub: string }
    const { restaurantId, from, to, branchId } = query.data

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const restaurantBranches = await app.db.query.branches.findMany({
      where: eq(branches.restaurantId, restaurantId),
    })
    const branchIds = branchId ? [branchId] : restaurantBranches.map((b) => b.id)
    if (branchIds.length === 0) return []

    const conditions = [buildBranchCondition(branchIds)]
    if (from) conditions.push(gte(sales.saleDate, new Date(from)))
    if (to) conditions.push(lte(sales.saleDate, new Date(to + "T23:59:59")))

    const rows = await app.db
      .select({
        date: sql<string>`DATE(${sales.saleDate})::text`,
        revenue: sql<number>`sum(${sales.totalAmount})`,
      })
      .from(sales)
      .where(and(...conditions))
      .groupBy(sql`DATE(${sales.saleDate})`)
      .orderBy(sql`DATE(${sales.saleDate})`)

    return rows.map((r) => ({ date: r.date, revenue: Number(r.revenue), cost: 0, margin: 0 }))
  })

  app.get("/top-items", async (req, reply) => {
    const query = querySchema.extend({ limit: z.coerce.number().int().min(1).max(20).default(5) }).safeParse(req.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const { sub } = req.user as { sub: string }
    const { restaurantId, from, to, branchId, limit } = query.data

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const restaurantBranches = await app.db.query.branches.findMany({
      where: eq(branches.restaurantId, restaurantId),
    })
    const branchIds = branchId ? [branchId] : restaurantBranches.map((b) => b.id)
    if (branchIds.length === 0) return []

    const conditions = [
      buildBranchCondition(branchIds),
      sql`${sales.menuItemId} IS NOT NULL`,
    ]
    if (from) conditions.push(gte(sales.saleDate, new Date(from)))
    if (to) conditions.push(lte(sales.saleDate, new Date(to + "T23:59:59")))

    const rows = await app.db
      .select({
        menuItemId: sales.menuItemId,
        itemName: menuItems.name,
        category: menuItems.category,
        costPrice: menuItems.costPrice,
        salePrice: menuItems.salePrice,
        unitsSold: sql<number>`sum(${sales.quantity})`,
        revenue: sql<number>`sum(${sales.totalAmount})`,
      })
      .from(sales)
      .innerJoin(menuItems, eq(sales.menuItemId, menuItems.id))
      .where(and(...conditions))
      .groupBy(sales.menuItemId, menuItems.name, menuItems.category, menuItems.costPrice, menuItems.salePrice)
      .orderBy(sql`sum(${sales.totalAmount}) DESC`)
      .limit(limit)

    return rows.map((r) => {
      const cost = Number(r.costPrice)
      const price = Number(r.salePrice)
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0
      return {
        menuItemId: r.menuItemId,
        name: r.itemName,
        category: r.category,
        unitsSold: Number(r.unitsSold),
        revenue: Number(r.revenue),
        margin: Math.round(margin * 10) / 10,
      }
    })
  })
}

export default analyticsRoutes
