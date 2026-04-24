import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { alerts, restaurants } from "../db/schema.js"
import { runAlertEngine } from "../services/alertEngine.js"
import { generateWeeklyReport } from "../services/weeklyReport.js"

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

  // POST /alerts/restaurants/:restaurantId/scan — ejecutar motor de alertas manualmente
  app.post("/restaurants/:restaurantId/scan", async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { restaurantId } = request.params as { restaurantId: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const created = await runAlertEngine(app.db, restaurantId)
    return { success: true, alertsCreated: created }
  })

  // POST /alerts/restaurants/:restaurantId/weekly-report — generar reporte semanal manualmente
  app.post("/restaurants/:restaurantId/weekly-report", async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const { restaurantId } = request.params as { restaurantId: string }

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const summary = await generateWeeklyReport(app.db, restaurantId)
    return { success: true, summary }
  })
}
