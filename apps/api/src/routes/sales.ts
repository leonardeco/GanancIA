import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { sales, branches, restaurants } from "../db/schema.js"

const createSaleBody = z.object({
  menuItemId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  saleDate: z.string().datetime().optional(),
})

const salesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate)

  app.get("/branches/:branchId/sales", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { branchId } = req.params as { branchId: string }

    const branch = await app.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { restaurant: true },
    })
    if (!branch || branch.restaurant.ownerId !== sub) {
      return reply.status(404).send({ error: "Sucursal no encontrada" })
    }

    return app.db.query.sales.findMany({
      where: eq(sales.branchId, branchId),
      orderBy: (s, { desc }) => [desc(s.saleDate)],
    })
  })

  app.post("/branches/:branchId/sales", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { branchId } = req.params as { branchId: string }
    const body = createSaleBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const branch = await app.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { restaurant: true },
    })
    if (!branch || branch.restaurant.ownerId !== sub) {
      return reply.status(404).send({ error: "Sucursal no encontrada" })
    }

    const totalAmount = body.data.quantity * body.data.unitPrice
    const [sale] = await app.db
      .insert(sales)
      .values({
        branchId,
        menuItemId: body.data.menuItemId,
        quantity: body.data.quantity,
        unitPrice: String(body.data.unitPrice),
        totalAmount: String(totalAmount),
        saleDate: body.data.saleDate ? new Date(body.data.saleDate) : new Date(),
      })
      .returning()
    return reply.status(201).send(sale)
  })

  app.post("/branches/:branchId/sales/bulk", async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { branchId } = req.params as { branchId: string }
    const body = z.array(createSaleBody).safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const branch = await app.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { restaurant: true },
    })
    if (!branch || branch.restaurant.ownerId !== sub) {
      return reply.status(404).send({ error: "Sucursal no encontrada" })
    }

    const rows = body.data.map((s) => ({
      branchId,
      menuItemId: s.menuItemId,
      quantity: s.quantity,
      unitPrice: String(s.unitPrice),
      totalAmount: String(s.quantity * s.unitPrice),
      saleDate: s.saleDate ? new Date(s.saleDate) : new Date(),
    }))

    const inserted = await app.db.insert(sales).values(rows).returning()
    return reply.status(201).send(inserted)
  })
}

export default salesRoutes
