"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Package } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InventoryRow {
  id: string
  ingredient: string
  theoreticalCost: number
  realCost: number
  variance: number
  variancePct: number
  date: string
}

function VarianceBadge({ pct }: { pct: number }) {
  if (pct > 10) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingUp size={10} /> +{pct}%
    </span>
  )
  if (pct < -5) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <TrendingDown size={10} /> {pct}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus size={10} /> {pct}%
    </span>
  )
}

const EMPTY_FORM = { ingredient: "", theoreticalCost: "", realCost: "", date: new Date().toISOString().slice(0, 10) }

export default function InventarioPage() {
  const { activeRestaurant } = useRestaurantStore()
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!activeRestaurant) return
    setLoading(true)
    try {
      const data = await api.inventory.list(activeRestaurant.id)
      setRows(data as InventoryRow[])
    } catch {
      toast.error("No se pudo cargar el inventario")
    } finally {
      setLoading(false)
    }
  }, [activeRestaurant])

  useEffect(() => { load() }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRestaurant) return
    if (!form.ingredient.trim() || !form.theoreticalCost || !form.realCost) {
      return toast.error("Completá todos los campos")
    }
    setSaving(true)
    try {
      await api.inventory.create(activeRestaurant.id, {
        ingredient: form.ingredient,
        theoreticalCost: Number(form.theoreticalCost),
        realCost: Number(form.realCost),
        date: form.date,
      })
      toast.success("Registro guardado")
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!activeRestaurant) return
    if (!confirm("¿Eliminar este registro?")) return
    try {
      await api.inventory.delete(activeRestaurant.id, id)
      toast.success("Registro eliminado")
      load()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: activeRestaurant?.currency ?? "USD", maximumFractionDigits: 2 }).format(n)

  const totalVariance = rows.reduce((s, r) => s + r.variance, 0)
  const criticalCount = rows.filter((r) => r.variancePct > 10).length

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-carbon">Control de Inventario</h2>
          <p className="text-gray-400 text-sm mt-0.5">Costo real vs. teórico — detectá mermas y fugas</p>
        </div>
        {activeRestaurant && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-bosque text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-bosque/90"
          >
            <Plus size={16} /> Registrar conteo
          </button>
        )}
      </div>

      {!activeRestaurant ? (
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-6 text-center">
          <p className="text-bosque font-medium">Seleccioná un restaurante para ver el inventario</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          {rows.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Registros</p>
                <p className="text-2xl font-bold text-carbon">{rows.length}</p>
              </div>
              <div className={cn("border rounded-2xl p-4", totalVariance > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-100")}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Variación total</p>
                <p className={cn("text-2xl font-bold", totalVariance > 0 ? "text-red-600" : "text-emerald-600")}>
                  {totalVariance > 0 ? "+" : ""}{fmt(totalVariance)}
                </p>
              </div>
              <div className={cn("border rounded-2xl p-4", criticalCount > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100")}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Con variación crítica</p>
                <p className={cn("text-2xl font-bold", criticalCount > 0 ? "text-orange-600" : "text-carbon")}>{criticalCount}</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          {showForm && (
            <form onSubmit={handleSave} className="bg-menta/30 border border-bosque/20 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-carbon mb-4">Nuevo conteo de inventario</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ingrediente o insumo</label>
                  <input
                    autoFocus
                    value={form.ingredient}
                    onChange={(e) => setForm({ ...form, ingredient: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                    placeholder="Ej: Carne picada, Aceite de oliva, Pollo..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo teórico (esperado)</label>
                  <input
                    type="number" min={0} step={0.01}
                    value={form.theoreticalCost}
                    onChange={(e) => setForm({ ...form, theoreticalCost: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo real (conteo físico)</label>
                  <input
                    type="number" min={0} step={0.01}
                    value={form.realCost}
                    onChange={(e) => setForm({ ...form, realCost: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del conteo</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                  />
                </div>
                {form.theoreticalCost && form.realCost && Number(form.theoreticalCost) > 0 && (
                  <div className="flex items-center">
                    <div className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium w-full",
                      Number(form.realCost) > Number(form.theoreticalCost) ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      Variación: {(((Number(form.realCost) - Number(form.theoreticalCost)) / Number(form.theoreticalCost)) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-bosque text-white rounded-xl text-sm font-medium hover:bg-bosque/90 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          )}

          {/* Tabla */}
          {loading ? (
            <p className="text-gray-400 text-sm">Cargando inventario...</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Package size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium mb-1">Sin registros de inventario</p>
              <p className="text-gray-300 text-sm">Hacé tu primer conteo físico para detectar mermas y diferencias</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingrediente</span>
                <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Teórico</span>
                <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Real</span>
                <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Diferencia</span>
                <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Variación</span>
                <span className="col-span-1" />
              </div>
              {rows.map((row) => (
                <div key={row.id} className={cn(
                  "grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center",
                  row.variancePct > 10 && "bg-red-50/30"
                )}>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-carbon">{row.ingredient}</p>
                    <p className="text-xs text-gray-400">{new Date(row.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <p className="col-span-2 text-sm text-gray-600 text-right font-mono">{fmt(row.theoreticalCost)}</p>
                  <p className="col-span-2 text-sm text-carbon text-right font-mono font-medium">{fmt(row.realCost)}</p>
                  <p className={cn(
                    "col-span-2 text-sm text-right font-mono font-semibold",
                    row.variance > 0 ? "text-red-600" : row.variance < 0 ? "text-emerald-600" : "text-gray-400"
                  )}>
                    {row.variance > 0 ? "+" : ""}{fmt(row.variance)}
                  </p>
                  <div className="col-span-2 flex justify-center">
                    <VarianceBadge pct={row.variancePct} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
