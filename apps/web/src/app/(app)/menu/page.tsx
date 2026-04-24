"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, Star, Puzzle, Swords, Dog, Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useRestaurantStore } from "@/store/restaurant"
import { DEMO_MENU_ITEMS } from "@/lib/mock-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MenuItem, MenuCategory } from "@ganancia/shared"

const DEMO_TOKEN = "demo-token"

const bcgConfig: Record<MenuCategory, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  estrella: { label: "Estrella", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", icon: Star, desc: "Alta popularidad, alto margen" },
  puzzle: { label: "Puzzle", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Puzzle, desc: "Bajo volumen, alto margen" },
  caballo: { label: "Caballo de batalla", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: Swords, desc: "Alta popularidad, bajo margen" },
  perro: { label: "Perro", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: Dog, desc: "Bajo volumen, bajo margen" },
}

function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<MenuItem>
  onSave: (data: { name: string; category: string; costPrice: number; salePrice: number }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "principal",
    costPrice: initial?.costPrice ?? 0,
    salePrice: initial?.salePrice ?? 0,
  })

  const margin = form.salePrice > 0 ? ((form.salePrice - form.costPrice) / form.salePrice) * 100 : 0

  return (
    <div className="bg-menta/30 border border-bosque/20 rounded-2xl p-5 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
            placeholder="Ej: Milanesa napolitana"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
            placeholder="Ej: principal, entrada"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Costo</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Precio de venta</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
          />
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Margen: <strong className={margin >= 50 ? "text-bosque" : "text-orange-500"}>{margin.toFixed(1)}%</strong>
          </span>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
            <button
              onClick={() => onSave(form)}
              className="px-4 py-1.5 bg-bosque text-white rounded-lg text-sm font-medium hover:bg-bosque/90"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SimResult {
  itemName: string
  costPrice: number
  currentPrice: number
  newPrice: number
  currentMargin: number
  newMargin: number
  monthlyUnits: number
  currentMonthlyProfit: number
  newMonthlyProfit: number
  monthlyDelta: number
}

function PriceSimulator({ items, restaurantId }: { items: MenuItem[]; restaurantId: string }) {
  const [selectedId, setSelectedId] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = items.find((i) => i.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    const item = items.find((i) => i.id === selectedId)
    if (item) setNewPrice(String(item.salePrice))
    setResult(null)
  }, [selectedId, items])

  useEffect(() => {
    if (!selectedId || !newPrice || Number(newPrice) <= 0) { setResult(null); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.menu.simulate(restaurantId, selectedId, Number(newPrice))
        setResult(res)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }, 600)
  }, [selectedId, newPrice, restaurantId])

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n)

  return (
    <div className="mt-10 border border-bosque/20 bg-menta/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-bosque rounded-xl flex items-center justify-center">
          <Calculator size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-carbon">Simulador de precios</h3>
          <p className="text-xs text-gray-400">¿Cuánto más ganarías si subís el precio de un plato?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Plato</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30 bg-white"
          >
            <option value="">Elegí un plato...</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name} — ${i.salePrice}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nuevo precio de venta</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            disabled={!selectedId}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30 bg-white disabled:bg-gray-50 disabled:text-gray-300"
            placeholder="0.00"
          />
        </div>
      </div>

      {selected && newPrice && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-carbon">{selected.name}</p>
            <span className="text-xs text-gray-400">· Costo: {fmt(selected.costPrice)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Precio actual → Margen actual</p>
              <p className="text-sm font-mono font-medium text-carbon">
                {fmt(selected.salePrice)} → <span className={selected.margin >= 50 ? "text-bosque" : "text-orange-500"}>{selected.margin.toFixed(1)}%</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Precio nuevo → Margen nuevo</p>
              {result ? (
                <p className="text-sm font-mono font-medium text-carbon">
                  {fmt(result.newPrice)} → <span className={result.newMargin >= 50 ? "text-bosque" : "text-orange-500"}>{result.newMargin.toFixed(1)}%</span>
                </p>
              ) : (
                <p className="text-sm text-gray-300">—</p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-xs text-gray-400 animate-pulse">Calculando impacto...</div>
      )}

      {result && !loading && (
        <div className={cn(
          "rounded-2xl p-5 border",
          result.monthlyDelta > 0 ? "bg-emerald-50 border-emerald-200" :
          result.monthlyDelta < 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-center gap-2 mb-4">
            {result.monthlyDelta > 0
              ? <TrendingUp size={18} className="text-emerald-600" />
              : result.monthlyDelta < 0
              ? <TrendingDown size={18} className="text-red-500" />
              : <Minus size={18} className="text-gray-400" />}
            <p className={cn(
              "font-semibold text-sm",
              result.monthlyDelta > 0 ? "text-emerald-700" : result.monthlyDelta < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {result.monthlyDelta > 0
                ? `Ganarías ${fmt(result.monthlyDelta)} más por mes`
                : result.monthlyDelta < 0
                ? `Perderías ${fmt(Math.abs(result.monthlyDelta))} por mes`
                : "Sin cambio en rentabilidad mensual"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Unidades/mes</p>
              <p className="font-bold text-carbon">{result.monthlyUnits}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Ganancia actual</p>
              <p className="font-bold text-carbon">{fmt(result.currentMonthlyProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Ganancia nueva</p>
              <p className={cn("font-bold", result.newMonthlyProfit > result.currentMonthlyProfit ? "text-emerald-600" : "text-red-500")}>
                {fmt(result.newMonthlyProfit)}
              </p>
            </div>
          </div>
          {result.monthlyUnits === 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Sin ventas registradas en los últimos 30 días. El cálculo está basado en proyección.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MenuPage() {
  const { activeRestaurant } = useRestaurantStore()
  const token = useAuthStore((s) => s.token)
  const isDemo = token === DEMO_TOKEN

  const [items, setItems] = useState<MenuItem[]>(isDemo ? DEMO_MENU_ITEMS : [])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeRestaurant || isDemo) return
    setLoading(true)
    try {
      const data = await api.menu.list(activeRestaurant.id)
      setItems(data as MenuItem[])
    } catch {
      toast.error("No se pudieron cargar los items del menú")
    } finally {
      setLoading(false)
    }
  }, [activeRestaurant, isDemo])

  useEffect(() => { load() }, [load])

  async function handleCreate(data: { name: string; category: string; costPrice: number; salePrice: number }) {
    if (!activeRestaurant) return
    try {
      await api.menu.create(activeRestaurant.id, data)
      toast.success("Item agregado")
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar")
    }
  }

  async function handleUpdate(itemId: string, data: Partial<{ name: string; category: string; costPrice: number; salePrice: number }>) {
    if (!activeRestaurant) return
    try {
      await api.menu.update(activeRestaurant.id, itemId, data)
      toast.success("Item actualizado")
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al actualizar")
    }
  }

  async function handleDelete(itemId: string) {
    if (!activeRestaurant) return
    if (!confirm("¿Eliminar este item?")) return
    try {
      await api.menu.delete(activeRestaurant.id, itemId)
      toast.success("Item eliminado")
      load()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.bcgCategory ?? "sin_clasificar"
    acc[cat] = acc[cat] ?? []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-carbon">Ingeniería de Menú</h2>
          <p className="text-gray-400 text-sm mt-0.5">Clasificación BCG de tus platos</p>
        </div>
        {activeRestaurant && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-bosque text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-bosque/90"
          >
            <Plus size={16} /> Agregar plato
          </button>
        )}
      </div>

      {!activeRestaurant && (
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-6 text-center">
          <p className="text-bosque font-medium">Seleccioná un restaurante para ver el menú</p>
        </div>
      )}

      {activeRestaurant && (
        <>
          {showForm && <ItemForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}

          {loading && <p className="text-gray-400 text-sm">Cargando...</p>}

          {!loading && items.length === 0 && !showForm && (
            <div className="text-center py-16 text-gray-300">
              <p className="text-lg font-medium">Sin platos todavía</p>
              <p className="text-sm mt-1">Agregá el primero para comenzar el análisis</p>
            </div>
          )}

          {/* BCG legend */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {(Object.entries(bcgConfig) as [MenuCategory, typeof bcgConfig[MenuCategory]][]).map(([key, cfg]) => (
                <div key={key} className={`rounded-xl border p-3 ${cfg.bg}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <cfg.icon size={14} className={cfg.color} />
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{cfg.desc}</p>
                  <p className={`text-lg font-bold mt-1 ${cfg.color}`}>{grouped[key]?.length ?? 0}</p>
                </div>
              ))}
            </div>
          )}

          {(["estrella", "puzzle", "caballo", "perro"] as MenuCategory[]).map((cat) => {
            const catItems = grouped[cat] ?? []
            if (catItems.length === 0) return null
            const cfg = bcgConfig[cat]
            return (
              <div key={cat} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <cfg.icon size={16} className={cfg.color} />
                  <h3 className={`font-semibold ${cfg.color}`}>{cfg.label}</h3>
                  <span className="text-xs text-gray-400">({catItems.length})</span>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) =>
                    editingId === item.id ? (
                      <ItemForm
                        key={item.id}
                        initial={item}
                        onSave={(data) => handleUpdate(item.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-xl px-4 py-3 flex items-center justify-between ${cfg.bg}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-carbon">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.category} · {item.unitsSold} vendidos</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Costo / Venta</p>
                            <p className="text-sm font-mono">${item.costPrice} / ${item.salePrice}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Margen</p>
                            <p className={`text-sm font-bold ${item.margin >= 50 ? "text-bosque" : "text-orange-500"}`}>
                              {item.margin.toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="p-1.5 text-gray-400 hover:text-bosque rounded-lg hover:bg-bosque/5"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}
          {items.length > 0 && !isDemo && (
            <PriceSimulator items={items} restaurantId={activeRestaurant.id} />
          )}
        </>
      )}
    </div>
  )
}
