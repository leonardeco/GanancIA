import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and, sql } from "drizzle-orm"
import { menuItems, restaurants, sales } from "../db/schema.js"

const menuItemBody = z.object({
  name: z.string().min(2),
  category: z.string(),
  costPrice: z.number().positive(),
  salePrice: z.number().positive(),
})

function bcgCategory(unitsSold: number, margin: number, avgUnits: number, avgMargin: number) {
  const highUnits = unitsSold >= avgUnits
  const highMargin = margin >= avgMargin
  if (highUnits && highMargin) return "estrella"
  if (!highUnits && highMargin) return "puzzle"
  if (highUnits && !highMargin) return "caballo"
  return "perro"
}

const menuRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  app.get("/restaurants/:restaurantId/menu", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId } = req.params as { restaurantId: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const items = await app.db.query.menuItems.findMany({
      where: eq(menuItems.restaurantId, restaurantId),
    })

    // Calculate units sold per item from sales
    const salesData = await app.db
      .select({
        menuItemId: sales.menuItemId,
        totalUnits: sql<number>`sum(${sales.quantity})`,
      })
      .from(sales)
      .where(eq(sales.menuItemId, sql`ANY(ARRAY[${items.map((i) => i.id).join(",")}]::uuid[])`))
      .groupBy(sales.menuItemId)

    const salesMap = new Map(salesData.map((s) => [s.menuItemId, Number(s.totalUnits)]))

    const enriched = items.map((item) => {
      const costPrice = Number(item.costPrice)
      const salePrice = Number(item.salePrice)
      const margin = salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0
      const unitsSold = salesMap.get(item.id) ?? 0
      return { ...item, costPrice, salePrice, margin, unitsSold }
    })

    if (enriched.length === 0) return enriched

    const avgUnits = enriched.reduce((s, i) => s + i.unitsSold, 0) / enriched.length
    const avgMargin = enriched.reduce((s, i) => s + i.margin, 0) / enriched.length

    return enriched.map((item) => ({
      ...item,
      bcgCategory: bcgCategory(item.unitsSold, item.margin, avgUnits, avgMargin),
    }))
  })

  app.post("/restaurants/:restaurantId/menu", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId } = req.params as { restaurantId: string }
    const body = menuItemBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const [item] = await app.db
      .insert(menuItems)
      .values({ ...body.data, restaurantId, costPrice: String(body.data.costPrice), salePrice: String(body.data.salePrice) })
      .returning()
    return reply.status(201).send(item)
  })

  app.put("/restaurants/:restaurantId/menu/:itemId", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId, itemId } = req.params as { restaurantId: string; itemId: string }
    const body = menuItemBody.partial().safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const updateData: Record<string, unknown> = { ...body.data }
    if (body.data.costPrice !== undefined) updateData.costPrice = String(body.data.costPrice)
    if (body.data.salePrice !== undefined) updateData.salePrice = String(body.data.salePrice)

    const [updated] = await app.db
      .update(menuItems)
      .set(updateData)
      .where(and(eq(menuItems.id, itemId), eq(menuItems.restaurantId, restaurantId)))
      .returning()
    if (!updated) return reply.status(404).send({ error: "Item no encontrado" })
    return updated
  })

  app.delete("/restaurants/:restaurantId/menu/:itemId", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId, itemId } = req.params as { restaurantId: string; itemId: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    await app.db.delete(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.restaurantId, restaurantId)))
    return reply.status(204).send()
  })

  // Simulador de precios — calcula impacto mensual de cambiar el precio de un plato
  app.get("/restaurants/:restaurantId/menu/:itemId/simulate", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId, itemId } = req.params as { restaurantId: string; itemId: string }
    const { newPrice } = z.object({ newPrice: z.coerce.number().positive() }).parse(req.query)

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const item = await app.db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.restaurantId, restaurantId)),
    })
    if (!item) return reply.status(404).send({ error: "Plato no encontrado" })

    // Unidades vendidas en los ultimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [salesAgg] = await app.db
      .select({ units: sql<number>`COALESCE(sum(${sales.quantity}), 0)` })
      .from(sales)
      .where(
        and(
          eq(sales.menuItemId, itemId),
          sql`${sales.saleDate} >= ${thirtyDaysAgo}`
        )
      )

    const monthlyUnits = Number(salesAgg?.units ?? 0)
    const cost = Number(item.costPrice)
    const currentPrice = Number(item.salePrice)

    const currentMargin = currentPrice > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0
    const newMargin = newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 : 0
    const currentMonthlyProfit = (currentPrice - cost) * monthlyUnits
    const newMonthlyProfit = (newPrice - cost) * monthlyUnits
    const monthlyDelta = newMonthlyProfit - currentMonthlyProfit

    return {
      itemName: item.name,
      costPrice: cost,
      currentPrice,
      newPrice,
      currentMargin: Math.round(currentMargin * 10) / 10,
      newMargin: Math.round(newMargin * 10) / 10,
      monthlyUnits,
      currentMonthlyProfit: Math.round(currentMonthlyProfit * 100) / 100,
      newMonthlyProfit: Math.round(newMonthlyProfit * 100) / 100,
      monthlyDelta: Math.round(monthlyDelta * 100) / 100,
    }
  })
}

export default menuRoutes
