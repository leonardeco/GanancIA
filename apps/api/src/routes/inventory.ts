import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and, desc } from "drizzle-orm"
import { inventoryCosts, restaurants, alerts } from "../db/schema.js"

const inventoryBody = z.object({
  ingredient: z.string().min(1),
  theoreticalCost: z.number().positive(),
  realCost: z.number().positive(),
  date: z.string().optional(),
})

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  // Listar registros de inventario
  app.get("/restaurants/:restaurantId/inventory", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId } = req.params as { restaurantId: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const rows = await app.db.query.inventoryCosts.findMany({
      where: eq(inventoryCosts.restaurantId, restaurantId),
      orderBy: [desc(inventoryCosts.date)],
    })

    return rows.map((r) => ({
      ...r,
      theoreticalCost: Number(r.theoreticalCost),
      realCost: Number(r.realCost),
      variance: Number(r.realCost) - Number(r.theoreticalCost),
      variancePct: Number(r.theoreticalCost) > 0
        ? Math.round(((Number(r.realCost) - Number(r.theoreticalCost)) / Number(r.theoreticalCost)) * 1000) / 10
        : 0,
    }))
  })

  // Registrar nuevo conteo de inventario
  app.post("/restaurants/:restaurantId/inventory", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId } = req.params as { restaurantId: string }
    const body = inventoryBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const date = body.data.date ? new Date(body.data.date) : new Date()

    const [row] = await app.db
      .insert(inventoryCosts)
      .values({
        restaurantId,
        ingredient: body.data.ingredient,
        theoreticalCost: String(body.data.theoreticalCost),
        realCost: String(body.data.realCost),
        date,
      })
      .returning()

    // Detectar fuga automaticamente si la variacion supera el umbral del restaurante
    const variancePct = body.data.theoreticalCost > 0
      ? ((body.data.realCost - body.data.theoreticalCost) / body.data.theoreticalCost) * 100
      : 0

    const threshold = Number(restaurant.alertThreshold ?? 10)

    if (variancePct >= threshold) {
      const severity = variancePct >= threshold * 2 ? "critical" : "warning"
      await app.db.insert(alerts).values({
        restaurantId,
        type: "inventory_variance",
        severity,
        message: `${body.data.ingredient}: costo real $${body.data.realCost} supera el teórico $${body.data.theoreticalCost} en ${variancePct.toFixed(1)}%.`,
        metadata: { ingredient: body.data.ingredient, variancePct },
      })
    }

    return reply.status(201).send({
      ...row,
      theoreticalCost: Number(row.theoreticalCost),
      realCost: Number(row.realCost),
      variance: Number(row.realCost) - Number(row.theoreticalCost),
      variancePct: Math.round(variancePct * 10) / 10,
    })
  })

  // Eliminar registro
  app.delete("/restaurants/:restaurantId/inventory/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { restaurantId, id } = req.params as { restaurantId: string; id: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    await app.db
      .delete(inventoryCosts)
      .where(and(eq(inventoryCosts.id, id), eq(inventoryCosts.restaurantId, restaurantId)))

    return reply.status(204).send()
  })
}

export default inventoryRoutes
