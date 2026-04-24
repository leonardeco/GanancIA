import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { alerts, restaurants } from "../db/schema.js"

export default async function alertsRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate)

  // GET /alerts/restaurants/:restaurantId — Listar alertas activas
  app.get("/restaurants/:restaurantId", async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { restaurantId } = request.params as { restaurantId: string }

    // Verificar que el restaurante pertenece al usuario autenticado
    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    // Traer alertas de la DB
    const alertList = await app.db.query.alerts.findMany({
      where: eq(alerts.restaurantId, restaurantId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    })

    return alertList
  })

  // PUT /alerts/restaurants/:restaurantId/:alertId/resolve
  app.put("/restaurants/:restaurantId/:alertId/resolve", async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { restaurantId, alertId } = request.params as { restaurantId: string; alertId: string }

    // Verificar propietario
    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    await app.db
      .update(alerts)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(and(eq(alerts.id, alertId), eq(alerts.restaurantId, restaurantId)))

    return { success: true, message: "Alerta marcada como resuelta" }
  })
}
