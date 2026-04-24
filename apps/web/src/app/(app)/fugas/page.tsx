"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useRestaurantStore } from "@/store/restaurant"
import { DEMO_ALERTS } from "@/lib/mock-data"
import { toast } from "sonner"
import type { Alert, AlertSeverity } from "@ganancia/shared"

const DEMO_TOKEN = "demo-token"

const severityConfig: Record<AlertSeverity, { icon: React.ElementType, color: string, bg: string, label: string }> = {
  critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Crítica" },
  warning: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50 border-orange-200", label: "Advertencia" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 border-blue-200", label: "Informativa" }
}

export default function FugasPage() {
  const { activeRestaurant } = useRestaurantStore()
  const token = useAuthStore((s) => s.token)
  const isDemo = token === DEMO_TOKEN

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!activeRestaurant) return
    if (isDemo) {
      setAlerts(DEMO_ALERTS)
      return
    }
    setLoading(true)
    try {
      const data = await api.alerts.list(activeRestaurant.id)
      setAlerts(data as Alert[])
    } catch {
      toast.error("No se pudieron cargar las alertas")
    } finally {
      setLoading(false)
    }
  }, [activeRestaurant, isDemo])

  useEffect(() => { load() }, [load])

  async function handleResolve(alertId: string) {
    if (!activeRestaurant) return
    try {
      if (isDemo) {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a))
      } else {
        await api.alerts.resolve(activeRestaurant.id, alertId)
        load()
      }
      toast.success("Alerta marcada como resuelta")
    } catch {
      toast.error("Error al resolver la alerta")
    }
  }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.resolved)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-carbon">Detección de Fugas</h2>
        <p className="text-gray-400 text-sm mt-0.5">Monitoreo automático de anomalías financieras</p>
      </div>

      {!activeRestaurant ? (
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-6 text-center">
          <p className="text-bosque font-medium">Seleccioná un restaurante para ver las alertas</p>
        </div>
      ) : loading ? (
        <p className="text-gray-400 text-sm">Cargando alertas...</p>
      ) : activeAlerts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-teal" />
          </div>
          <h3 className="text-xl font-bold text-carbon mb-2">Todo en orden</h3>
          <p className="text-gray-500 max-w-md">No hemos detectado patrones inusuales ni fugas de capital en tu operación reciente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-carbon mb-4">Alertas Activas ({activeAlerts.length})</h3>
          {activeAlerts.map(alert => {
            const config = severityConfig[alert.severity]
            const date = new Date(alert.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            return (
              <div key={alert.id} className={`flex items-start gap-4 p-5 rounded-2xl border ${config.bg}`}>
                <div className={`shrink-0 mt-0.5 ${config.color}`}>
                  <config.icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{date}</span>
                  </div>
                  <p className="text-carbon font-medium text-sm leading-relaxed mb-3">
                    {alert.message}
                  </p>
                  <button 
                    onClick={() => handleResolve(alert.id)}
                    className="text-xs font-medium bg-white border shadow-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Marcar como resuelta
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="mt-12">
          <h3 className="font-semibold text-gray-400 mb-4">Historial de Resueltas</h3>
          <div className="space-y-2 opacity-60">
            {resolvedAlerts.map(alert => {
              const config = severityConfig[alert.severity]
              const date = new Date(alert.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
              return (
                <div key={alert.id} className="flex items-center gap-4 p-3 rounded-xl border bg-gray-50">
                  <config.icon size={16} className="text-gray-400" />
                  <p className="text-sm text-gray-500 flex-1 truncate">{alert.message}</p>
                  <span className="text-xs text-gray-400 font-mono">{date}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
