import Fastify from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import rateLimit from "@fastify/rate-limit"
import dbPlugin from "./plugins/db.js"
import authPlugin from "./plugins/auth.js"
import authRoutes from "./routes/auth.js"
import restaurantRoutes from "./routes/restaurants.js"
import menuRoutes from "./routes/menu.js"
import salesRoutes from "./routes/sales.js"
import analyticsRoutes from "./routes/analytics.js"
import importRoutes from "./routes/import.js"
import { chatRoutes } from "./routes/chat.js"
import alertsRoutes from "./routes/alerts.js"
import inventoryRoutes from "./routes/inventory.js"
import { startScheduler } from "./jobs/scheduler.js"

const app = Fastify({ logger: true })

async function start() {
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  })

  await app.register(dbPlugin)
  await app.register(authPlugin)

  app.get("/health", async () => ({ status: "ok", service: "ganancia-api" }))

  await app.register(authRoutes, { prefix: "/auth" })
  await app.register(restaurantRoutes, { prefix: "/restaurants" })
  await app.register(menuRoutes, { prefix: "/menu" })
  await app.register(salesRoutes, { prefix: "/sales" })
  await app.register(analyticsRoutes, { prefix: "/analytics" })
  await app.register(importRoutes)
  await app.register(chatRoutes, { prefix: "/chat" })
  await app.register(alertsRoutes, { prefix: "/alerts" })
  await app.register(inventoryRoutes, { prefix: "/inventory" })

  const port = Number(process.env.PORT ?? 4000)
  await app.listen({ port, host: "0.0.0.0" })
  console.log(`API corriendo en http://localhost:${port}`)

  // Iniciar jobs periodicos (alertas + reportes semanales)
  startScheduler(app.db)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
