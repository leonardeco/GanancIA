/**
 * Scheduler de jobs periodicos usando node-cron.
 * Se inicializa al arrancar el servidor.
 *
 * Jobs programados:
 *  - Motor de alertas: cada 6 horas (0 *\/6 * * *)
 *  - Reporte semanal:  lunes a las 08:00 (0 8 * * 1)
 */
import cron from "node-cron"
import { runAlertEngine } from "../services/alertEngine.js"
import { generateAllWeeklyReports } from "../services/weeklyReport.js"

export function startScheduler(db: any) {
  // ─────────────────────────────────────────────
  // JOB 1: Motor de alertas — cada 6 horas
  // ─────────────────────────────────────────────
  cron.schedule("0 */6 * * *", async () => {
    console.log("[scheduler] Ejecutando motor de alertas...")
    try {
      const allRestaurants = await db.query.restaurants.findMany()
      let total = 0
      for (const restaurant of allRestaurants) {
        const created = await runAlertEngine(db, restaurant.id)
        total += created
      }
      console.log(`[scheduler] Motor de alertas completado. ${total} alertas nuevas.`)
    } catch (err) {
      console.error("[scheduler] Error en motor de alertas:", err)
    }
  }, { timezone: "America/Argentina/Buenos_Aires" })

  // ─────────────────────────────────────────────
  // JOB 2: Reporte semanal — lunes a las 08:00
  // ─────────────────────────────────────────────
  cron.schedule("0 8 * * 1", async () => {
    console.log("[scheduler] Generando reportes semanales...")
    try {
      await generateAllWeeklyReports(db)
      console.log("[scheduler] Reportes semanales generados.")
    } catch (err) {
      console.error("[scheduler] Error en reportes semanales:", err)
    }
  }, { timezone: "America/Argentina/Buenos_Aires" })

  console.log("[scheduler] Jobs programados: alertas cada 6h, reporte semanal lunes 08:00")
}
