import { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { restaurants } from "../db/schema.js"
import { askGana } from "../services/gana.js"

const chatBodySchema = z.object({
  restaurantId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  }))
})

export async function chatRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate)

  app.post("/", async (request, reply) => {
    try {
      const body = chatBodySchema.parse(request.body)
      const { sub } = request.user as { sub: string }

      // Verificar que el restaurante pertenece al usuario
      const restaurant = await app.db.query.restaurants.findFirst({
        where: and(eq(restaurants.id, body.restaurantId), eq(restaurants.ownerId, sub)),
      })
      if (!restaurant) {
        return reply.status(404).send({ error: "Restaurante no encontrado" })
      }

      // Llamar a Gana con la DB y el nombre del restaurante
      const responseText = await askGana(
        body.restaurantId,
        body.messages,
        app.db,
        restaurant.name
      )

      return reply.send({ response: responseText })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: "Payload inválido", details: error.errors })
      }
      console.error("Chat route error:", error)
      return reply.status(500).send({ error: "Error interno del servidor" })
    }
  })
}
