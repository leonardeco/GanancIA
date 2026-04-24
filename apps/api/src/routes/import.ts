import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { sales, branches, menuItems, restaurants } from "../db/schema.js"

// Accepts a pre-parsed array of rows from the frontend
// Each row: { date, itemName?, quantity, unitPrice }
const rowSchema = z.object({
  date: z.string(),
  itemName: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
})

const bodySchema = z.object({
  branchId: z.string().uuid(),
  rows: z.array(rowSchema).min(1).max(5000),
})

const importRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  app.post("/import/sales", async (req, reply) => {
    const body = bodySchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { sub } = req.user as { sub: string }
    const { branchId, rows } = body.data

    const branch = await app.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { restaurant: true },
    })
    if (!branch || branch.restaurant.ownerId !== sub) {
      return reply.status(404).send({ error: "Sucursal no encontrada" })
    }

    // Build a name→id map for menu items of this restaurant
    const items = await app.db.query.menuItems.findMany({
      where: eq(menuItems.restaurantId, branch.restaurantId),
    })
    const nameMap = new Map(items.map((i) => [i.name.toLowerCase().trim(), i.id]))

    const toInsert = rows.map((row) => {
      const itemId = row.itemName ? nameMap.get(row.itemName.toLowerCase().trim()) : undefined
      const totalAmount = row.quantity * row.unitPrice
      return {
        branchId,
        menuItemId: itemId ?? null,
        quantity: row.quantity,
        unitPrice: String(row.unitPrice),
        totalAmount: String(totalAmount),
        saleDate: new Date(row.date),
      }
    })

    // Insert in chunks of 500 to avoid huge queries
    const CHUNK = 500
    let inserted = 0
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK)
      await app.db.insert(sales).values(chunk)
      inserted += chunk.length
    }

    const matched = toInsert.filter((r) => r.menuItemId).length
    return reply.status(201).send({
      inserted,
      matched,
      unmatched: inserted - matched,
    })
  })
}

export default importRoutes
