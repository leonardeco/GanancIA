import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { restaurants, branches } from "../db/schema.js"

const createRestaurantBody = z.object({
  name: z.string().min(2),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/Argentina/Buenos_Aires"),
})

const createBranchBody = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
})

const restaurantRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  app.get("/", async (req) => {
    const { sub } = req.user as { sub: string }
    return app.db.query.restaurants.findMany({
      where: eq(restaurants.ownerId, sub),
      with: { branches: true },
    })
  })

  app.post("/", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = createRestaurantBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const [restaurant] = await app.db
      .insert(restaurants)
      .values({ ...body.data, ownerId: sub })
      .returning()
    return reply.status(201).send(restaurant)
  })

  app.get("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, id), eq(restaurants.ownerId, sub)),
      with: { branches: true },
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })
    return restaurant
  })

  app.put("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const body = createRestaurantBody.partial().safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const [updated] = await app.db
      .update(restaurants)
      .set(body.data)
      .where(and(eq(restaurants.id, id), eq(restaurants.ownerId, sub)))
      .returning()
    if (!updated) return reply.status(404).send({ error: "Restaurante no encontrado" })
    return updated
  })

  // Branches
  app.get("/:id/branches", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, id), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })
    return app.db.query.branches.findMany({ where: eq(branches.restaurantId, id) })
  })

  app.post("/:id/branches", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const body = createBranchBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const restaurant = await app.db.query.restaurants.findFirst({
      where: and(eq(restaurants.id, id), eq(restaurants.ownerId, sub)),
    })
    if (!restaurant) return reply.status(404).send({ error: "Restaurante no encontrado" })

    const [branch] = await app.db
      .insert(branches)
      .values({ ...body.data, restaurantId: id })
      .returning()
    return reply.status(201).send(branch)
  })
}

export default restaurantRoutes
