import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { users } from "../db/schema.js"

const registerBody = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
})

const loginBody = z.object({
  email: z.string().email(),
  password: z.string(),
})

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (req, reply) => {
    const body = registerBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const existing = await app.db.query.users.findFirst({
      where: eq(users.email, body.data.email),
    })
    if (existing) return reply.status(409).send({ error: "Email ya registrado" })

    const passwordHash = await bcrypt.hash(body.data.password, 10)
    const [user] = await app.db
      .insert(users)
      .values({ email: body.data.email, name: body.data.name, passwordHash })
      .returning({ id: users.id, email: users.email, name: users.name, plan: users.plan, createdAt: users.createdAt })

    const token = app.jwt.sign({ sub: user.id, email: user.email, plan: user.plan })
    return reply.status(201).send({ user, token })
  })

  app.post("/login", async (req, reply) => {
    const body = loginBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = await app.db.query.users.findFirst({
      where: eq(users.email, body.data.email),
    })
    if (!user) return reply.status(401).send({ error: "Credenciales inválidas" })

    const valid = await bcrypt.compare(body.data.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: "Credenciales inválidas" })

    const token = app.jwt.sign({ sub: user.id, email: user.email, plan: user.plan })
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, createdAt: user.createdAt },
      token,
    })
  })

  app.get("/me", { onRequest: [app.authenticate] }, async (req, reply) => {
    const payload = req.user as { sub: string }
    const user = await app.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
      columns: { passwordHash: false },
    })
    if (!user) return reply.status(404).send({ error: "Usuario no encontrado" })
    return reply.send({ user })
  })
}

export default authRoutes
