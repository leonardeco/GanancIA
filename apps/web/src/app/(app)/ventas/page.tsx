"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, ShoppingCart, Upload } from "lucide-react"
import * as Tabs from "@radix-ui/react-tabs"
import { api, ApiError } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { CsvImport } from "@/components/csv-import"
import { toast } from "sonner"
import type { MenuItem, Branch } from "@ganancia/shared"

interface SaleRow {
  menuItemId: string
  quantity: number
  unitPrice: number
}

export default function VentasPage() {
  const { activeRestaurant } = useRestaurantStore()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [rows, setRows] = useState<SaleRow[]>([{ menuItemId: "", quantity: 1, unitPrice: 0 }])
  const [saving, setSaving] = useState(false)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))

  const loadBranches = useCallback(async () => {
    if (!activeRestaurant) return
    try {
      const data = await api.restaurants.branches(activeRestaurant.id) as Branch[]
      setBranches(data)
      if (data.length > 0) setSelectedBranch(data[0].id)
    } catch { /* ignore */ }
  }, [activeRestaurant])

  const loadMenu = useCallback(async () => {
    if (!activeRestaurant) return
    try {
      const data = await api.menu.list(activeRestaurant.id) as MenuItem[]
      setMenuItems(data)
    } catch { /* ignore */ }
  }, [activeRestaurant])

  useEffect(() => {
    loadBranches()
    loadMenu()
  }, [loadBranches, loadMenu])

  function setRow(idx: number, patch: Partial<SaleRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { menuItemId: "", quantity: 1, unitPrice: 0 }])
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleItemSelect(idx: number, itemId: string) {
    const item = menuItems.find((m) => m.id === itemId)
    setRow(idx, { menuItemId: itemId, unitPrice: item?.salePrice ?? 0 })
  }

  const total = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBranch) return toast.error("Seleccioná una sucursal")
    const validRows = rows.filter((r) => r.quantity > 0 && r.unitPrice > 0)
    if (validRows.length === 0) return toast.error("Agregá al menos una venta válida")

    setSaving(true)
    try {
      const payload = validRows.map((r) => ({
        ...(r.menuItemId ? { menuItemId: r.menuItemId } : {}),
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        saleDate: new Date(saleDate).toISOString(),
      }))
      await api.sales.bulk(selectedBranch, payload)
      toast.success(`${validRows.length} venta(s) registrada(s)`)
      setRows([{ menuItemId: "", quantity: 1, unitPrice: 0 }])
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (!activeRestaurant) {
    return (
      <div className="p-8">
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-bosque font-medium">Seleccioná un restaurante primero</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-bosque rounded-xl flex items-center justify-center">
          <ShoppingCart size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-carbon">Ventas</h2>
          <p className="text-gray-400 text-sm">Carga manual o por CSV</p>
        </div>
      </div>

      <Tabs.Root defaultValue="manual">
        <Tabs.List className="flex bg-gray-100 rounded-xl p-1 gap-0.5 mb-6 w-fit">
          {[
            { value: "manual", label: "Carga manual", icon: Plus },
            { value: "csv", label: "Importar CSV", icon: Upload },
          ].map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-carbon data-[state=active]:shadow-sm text-gray-400 hover:text-gray-600"
            >
              <Icon size={14} />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Manual entry */}
        <Tabs.Content value="manual">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                >
                  {branches.length === 0 && <option value="">Sin sucursales</option>}
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Items vendidos</label>
                <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-bosque hover:underline">
                  <Plus size={12} /> Agregar línea
                </button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-1">
                  <span className="col-span-5 text-xs text-gray-400">Plato</span>
                  <span className="col-span-2 text-xs text-gray-400">Cant.</span>
                  <span className="col-span-3 text-xs text-gray-400">Precio unit.</span>
                  <span className="col-span-2 text-xs text-gray-400">Subtotal</span>
                </div>
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={row.menuItemId}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                      >
                        <option value="">Plato libre</option>
                        {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" min={1} value={row.quantity}
                        onChange={(e) => setRow(idx, { quantity: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-bosque/30"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" min={0} step={0.01} value={row.unitPrice}
                        onChange={(e) => setRow(idx, { unitPrice: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="text-sm text-gray-600 flex-1 text-right">${(row.quantity * row.unitPrice).toFixed(2)}</span>
                      {rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-400 ml-1">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <span className="text-sm text-gray-500">Total: </span>
                <span className="text-lg font-bold text-carbon">${total.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-bosque text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-bosque/90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Registrar ventas"}
              </button>
            </div>
          </form>
        </Tabs.Content>

        {/* CSV Import */}
        <Tabs.Content value="csv">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {branches.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Necesitás al menos una sucursal para importar ventas.
              </div>
            ) : (
              <CsvImport branches={branches} onSuccess={() => {}} />
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
