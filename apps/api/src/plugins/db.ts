import fp from "fastify-plugin"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../db/schema.js"

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>
  }
}

export default fp(async (app) => {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client, { schema })
  app.decorate("db", db)
})
