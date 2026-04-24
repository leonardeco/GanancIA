import fp from "fastify-plugin"

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>
  }
}

export default fp(async (app) => {
  app.decorate("authenticate", async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: "No autorizado" })
    }
  })
})
