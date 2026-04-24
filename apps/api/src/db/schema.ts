import { pgTable, uuid, text, numeric, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan", { enum: ["starter", "pro", "cadena"] }).notNull().default("starter"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// RESTAURANTS
// ─────────────────────────────────────────────
export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
  posType: text("pos_type", { enum: ["square", "toast", "clover", "manual"] }).default("manual"),
  posAccessToken: text("pos_access_token"),
  alertThreshold: numeric("alert_threshold", { precision: 5, scale: 2 }).default("10"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// BRANCHES (Sucursales)
// ─────────────────────────────────────────────
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
})

// ─────────────────────────────────────────────
// MENU ITEMS (Platos)
// ─────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// MENU CLASSIFICATIONS (Matriz BCG por semana)
// ─────────────────────────────────────────────
export const menuClassifications = pgTable("menu_classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  weekStart: timestamp("week_start").notNull(),
  classification: text("classification", { enum: ["estrella", "puzzle", "caballo", "perro"] }).notNull(),
  popularity: numeric("popularity", { precision: 10, scale: 2 }),
  margin: numeric("margin", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// SALES (Ventas) — candidata a hypertable TimescaleDB
// ─────────────────────────────────────────────
export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id),
  ticketId: text("ticket_id"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  waiterId: text("waiter_id"),
  itemsJson: jsonb("items_json"),
  saleDate: timestamp("sale_date").notNull(),
}, (t) => ({
  saleDateIdx: index("sales_sale_date_idx").on(t.saleDate),
  branchDateIdx: index("sales_branch_date_idx").on(t.branchId, t.saleDate),
}))

// ─────────────────────────────────────────────
// INVENTORY COSTS (Costo real vs. teórico)
// ─────────────────────────────────────────────
export const inventoryCosts = pgTable("inventory_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  ingredient: text("ingredient").notNull(),
  theoreticalCost: numeric("theoretical_cost", { precision: 10, scale: 2 }).notNull(),
  realCost: numeric("real_cost", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// ALERTS (Detección de fugas)
// ─────────────────────────────────────────────
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  severity: text("severity", { enum: ["critical", "warning", "info"] }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  restaurantSeverityIdx: index("alerts_restaurant_severity_idx").on(t.restaurantId, t.severity),
}))

// ─────────────────────────────────────────────
// POS SYNC LOG
// ─────────────────────────────────────────────
export const posSyncLog = pgTable("pos_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  recordsInserted: integer("records_inserted").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  status: text("status", { enum: ["success", "partial", "failed"] }).notNull(),
  errorMessage: text("error_message"),
})

// ─────────────────────────────────────────────
// WEEKLY REPORTS (Resúmenes ejecutivos WhatsApp)
// ─────────────────────────────────────────────
export const weeklyReports = pgTable("weekly_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  weekStart: timestamp("week_start").notNull(),
  metricsJson: jsonb("metrics_json").notNull(),
  summaryText: text("summary_text"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
}))

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, { fields: [restaurants.ownerId], references: [users.id] }),
  branches: many(branches),
  menuItems: many(menuItems),
  menuClassifications: many(menuClassifications),
  inventoryCosts: many(inventoryCosts),
  alerts: many(alerts),
  posSyncLogs: many(posSyncLog),
  weeklyReports: many(weeklyReports),
}))

export const branchesRelations = relations(branches, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [branches.restaurantId], references: [restaurants.id] }),
  sales: many(sales),
}))

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [menuItems.restaurantId], references: [restaurants.id] }),
  classifications: many(menuClassifications),
}))

export const menuClassificationsRelations = relations(menuClassifications, ({ one }) => ({
  restaurant: one(restaurants, { fields: [menuClassifications.restaurantId], references: [restaurants.id] }),
  menuItem: one(menuItems, { fields: [menuClassifications.menuItemId], references: [menuItems.id] }),
}))

export const salesRelations = relations(sales, ({ one }) => ({
  branch: one(branches, { fields: [sales.branchId], references: [branches.id] }),
  menuItem: one(menuItems, { fields: [sales.menuItemId], references: [menuItems.id] }),
}))

export const inventoryCostsRelations = relations(inventoryCosts, ({ one }) => ({
  restaurant: one(restaurants, { fields: [inventoryCosts.restaurantId], references: [restaurants.id] }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  restaurant: one(restaurants, { fields: [alerts.restaurantId], references: [restaurants.id] }),
}))

export const posSyncLogRelations = relations(posSyncLog, ({ one }) => ({
  restaurant: one(restaurants, { fields: [posSyncLog.restaurantId], references: [restaurants.id] }),
}))

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
  restaurant: one(restaurants, { fields: [weeklyReports.restaurantId], references: [restaurants.id] }),
}))
