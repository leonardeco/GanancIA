/**
 * GanancIA — Seed de datos para desarrollo local
 * Ejecutar con: npx tsx src/db/seed.ts
 */
import "dotenv/config"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema.js"
import * as bcrypt from "bcryptjs"

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

async function seed() {
  console.log("🌱 Iniciando seed de GanancIA...\n")

  // ── 1. Usuario propietario ─────────────────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 10)
  const [owner] = await db.insert(schema.users).values({
    email: "demo@ganancia.app",
    name: "Leonardo (Demo)",
    passwordHash,
    plan: "pro",
  }).returning()
  console.log(`✅ Usuario creado: ${owner.email}`)

  // ── 2. Restaurante ────────────────────────────────────────
  const [restaurant] = await db.insert(schema.restaurants).values({
    ownerId: owner.id,
    name: "La Parrilla Demo",
    currency: "USD",
    timezone: "America/Argentina/Buenos_Aires",
    posType: "manual",
  }).returning()
  console.log(`✅ Restaurante creado: ${restaurant.name}`)

  // ── 3. Sucursal ───────────────────────────────────────────
  const [branch] = await db.insert(schema.branches).values({
    restaurantId: restaurant.id,
    name: "Casa Central",
    address: "Av. Corrientes 1234, Buenos Aires",
  }).returning()
  console.log(`✅ Sucursal creada: ${branch.name}`)

  // ── 4. Platos del menú ────────────────────────────────────
  const menuData = [
    { name: "Bife de chorizo",     category: "principal", costPrice: "25.60", salePrice: "80.00" },
    { name: "Empanadas (docena)",  category: "entrada",   costPrice: "11.20", salePrice: "40.00" },
    { name: "Milanesa napolitana", category: "principal", costPrice: "27.30", salePrice: "70.00" },
    { name: "Provoleta",           category: "entrada",   costPrice:  "9.10", salePrice: "35.00" },
    { name: "Costillas BBQ",       category: "principal", costPrice: "54.00", salePrice: "120.00" },
    { name: "Lomo Wellington",     category: "especial",  costPrice: "72.00", salePrice: "160.00" },
    { name: "Sopa del día",        category: "entrada",   costPrice:  "8.00", salePrice: "22.00" },
    { name: "Sandwich de vacío",   category: "principal", costPrice: "18.00", salePrice: "38.00" },
  ]

  const items = await db.insert(schema.menuItems)
    .values(menuData.map(d => ({ ...d, restaurantId: restaurant.id })))
    .returning()
  console.log(`✅ ${items.length} platos del menú creados`)

  // ── 5. Ventas de los últimos 30 días ─────────────────────
  const salesData = []
  const today = new Date()
  const waiters = ["waiter_01", "waiter_02", "waiter_03"]

  for (let day = 29; day >= 0; day--) {
    const date = new Date(today)
    date.setDate(date.getDate() - day)
    // Entre 8 y 20 ventas por día
    const dailySales = Math.floor(Math.random() * 13) + 8

    for (let i = 0; i < dailySales; i++) {
      const item = items[Math.floor(Math.random() * items.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const unitPrice = parseFloat(item.salePrice)
      const totalAmount = unitPrice * quantity
      const waiter = waiters[Math.floor(Math.random() * waiters.length)]

      salesData.push({
        branchId: branch.id,
        menuItemId: item.id,
        quantity,
        unitPrice: item.salePrice,
        totalAmount: totalAmount.toFixed(2),
        waiterId: waiter,
        saleDate: date,
      })
    }
  }

  await db.insert(schema.sales).values(salesData)
  console.log(`✅ ${salesData.length} ventas de los últimos 30 días creadas`)

  // ── 6. Alertas de ejemplo ─────────────────────────────────
  await db.insert(schema.alerts).values([
    {
      restaurantId: restaurant.id,
      type: "cost_variance",
      severity: "critical",
      message: "Diferencia crítica de costo en 'Bife de chorizo'. El costo real excedió un 15% el costo teórico esta semana.",
    },
    {
      restaurantId: restaurant.id,
      type: "suspicious_cancellations",
      severity: "warning",
      message: "Patrón inusual de tickets cancelados detectado. El cajero 'waiter_02' tiene 5 cancelaciones por encima del promedio.",
    },
    {
      restaurantId: restaurant.id,
      type: "inventory_low",
      severity: "info",
      message: "El inventario de 'Vino Malbec Reserva' está por debajo del umbral de seguridad para el fin de semana.",
    },
  ])
  console.log("✅ 3 alertas de ejemplo creadas")

  console.log("\n✨ Seed completado exitosamente!")
  console.log(`\n📋 Credenciales de acceso:`)
  console.log(`   Email:    demo@ganancia.app`)
  console.log(`   Password: demo1234`)
  console.log(`   Plan:     Pro\n`)

  await client.end()
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err)
  process.exit(1)
})
