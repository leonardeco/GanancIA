"use client"

import { useEffect, useState } from "react"
import { Settings, Store, Bell, Shield, Trash2, CheckCircle2, Plus } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Restaurant, Branch } from "@ganancia/shared"

const CURRENCIES = [
  { value: "USD", label: "USD — Dólar" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "PEN", label: "PEN — Sol peruano" },
]

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Mexico_City", label: "México (Ciudad de México)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo)" },
  { value: "America/Caracas", label: "Venezuela (Caracas)" },
  { value: "America/Guayaquil", label: "Ecuador (Guayaquil)" },
  { value: "America/La_Paz", label: "Bolivia (La Paz)" },
  { value: "America/Montevideo", label: "Uruguay (Montevideo)" },
]

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-menta rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-bosque" />
        </div>
        <h3 className="font-semibold text-carbon">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function ConfiguracionPage() {
  const { activeRestaurant, setActiveRestaurant, restaurants, setRestaurants } = useRestaurantStore()
  const { user } = useAuthStore()

  const [form, setForm] = useState({
    name: "",
    currency: "USD",
    timezone: "America/Argentina/Buenos_Aires",
    alertThreshold: 10,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [branches, setBranches] = useState<Branch[]>([])
  const [newBranch, setNewBranch] = useState({ name: "", address: "" })
  const [addingBranch, setAddingBranch] = useState(false)
  const [savingBranch, setSavingBranch] = useState(false)

  // Cargar datos del restaurante activo en el formulario
  useEffect(() => {
    if (!activeRestaurant) return
    setForm({
      name: activeRestaurant.name,
      currency: activeRestaurant.currency ?? "USD",
      timezone: (activeRestaurant as any).timezone ?? "America/Argentina/Buenos_Aires",
      alertThreshold: Number((activeRestaurant as any).alertThreshold ?? 10),
    })
  }, [activeRestaurant])

  // Cargar sucursales
  useEffect(() => {
    if (!activeRestaurant) return
    api.restaurants.branches(activeRestaurant.id)
      .then((data) => setBranches(data as Branch[]))
      .catch(() => {})
  }, [activeRestaurant])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRestaurant) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.restaurants.update(activeRestaurant.id, form) as Restaurant
      setActiveRestaurant(updated)
      setRestaurants(restaurants.map((r) => r.id === updated.id ? updated : r))
      setSaved(true)
      toast.success("Configuración guardada")
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRestaurant || !newBranch.name.trim()) return
    setSavingBranch(true)
    try {
      const branch = await api.restaurants.createBranch(activeRestaurant.id, {
        name: newBranch.name,
        address: newBranch.address || undefined,
      }) as Branch
      setBranches((prev) => [...prev, branch])
      setNewBranch({ name: "", address: "" })
      setAddingBranch(false)
      toast.success("Sucursal agregada")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear sucursal")
    } finally {
      setSavingBranch(false)
    }
  }

  if (!activeRestaurant) {
    return (
      <div className="p-8">
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-bosque font-medium">Seleccioná un restaurante para ver su configuración</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-carbon">Configuración</h2>
        <p className="text-gray-400 text-sm mt-0.5">{activeRestaurant.name}</p>
      </div>

      {/* Datos del restaurante */}
      <Section title="Restaurante" icon={Store}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del restaurante</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
              placeholder="Nombre del restaurante"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Zona horaria</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
              >
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-bosque text-white hover:bg-bosque/90 disabled:opacity-50"
              )}
            >
              {saved ? <><CheckCircle2 size={15} /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Section>

      {/* Alertas */}
      <Section title="Alertas automáticas" icon={Bell}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Umbral de variación de inventario para disparar alerta
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={form.alertThreshold}
                onChange={(e) => setForm({ ...form, alertThreshold: Number(e.target.value) })}
                className="flex-1 accent-bosque"
              />
              <span className="text-sm font-bold text-bosque w-12 text-right">{form.alertThreshold}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Si el costo real de un ingrediente supera el teórico en más del {form.alertThreshold}%, se genera una alerta automática.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-bosque text-white rounded-xl text-sm font-semibold hover:bg-bosque/90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar umbral"}
          </button>
        </div>
      </Section>

      {/* Sucursales */}
      <Section title="Sucursales" icon={Shield}>
        <div className="space-y-2 mb-4">
          {branches.length === 0 && !addingBranch && (
            <p className="text-sm text-gray-400 text-center py-4">Sin sucursales registradas</p>
          )}
          {branches.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-carbon">{b.name}</p>
                {b.address && <p className="text-xs text-gray-400">{b.address}</p>}
              </div>
            </div>
          ))}
        </div>

        {addingBranch ? (
          <form onSubmit={handleAddBranch} className="bg-menta/30 border border-bosque/20 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la sucursal</label>
              <input
                autoFocus
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Ej: Sucursal Norte"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección <span className="text-gray-300">(opcional)</span></label>
              <input
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Av. Principal 123"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddingBranch(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingBranch || !newBranch.name.trim()}
                className="px-4 py-2 bg-bosque text-white rounded-lg text-sm font-medium hover:bg-bosque/90 disabled:opacity-50"
              >
                {savingBranch ? "Guardando..." : "Agregar"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingBranch(true)}
            className="flex items-center gap-2 text-sm text-bosque hover:underline"
          >
            <Plus size={14} /> Agregar sucursal
          </button>
        )}
      </Section>

      {/* Cuenta */}
      <Section title="Cuenta" icon={Settings}>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-carbon">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <span className="text-xs font-semibold bg-menta text-bosque px-3 py-1 rounded-full capitalize">
              {user?.plan ?? "starter"}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Para cambiar tu contraseña o cancelar tu suscripción, escribinos a{" "}
              <a href="mailto:hola@ganancia.app" className="text-bosque hover:underline">hola@ganancia.app</a>
            </p>
          </div>
        </div>
      </Section>

      {/* Zona de peligro */}
      <div className="border border-red-200 bg-red-50/40 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Trash2 size={15} className="text-red-500" />
          <h3 className="font-semibold text-red-600">Zona de peligro</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Eliminar el restaurante borrará todos los datos asociados: ventas, menú, alertas e inventario. Esta acción no se puede deshacer.
        </p>
        <button
          onClick={() => toast.error("Para eliminar tu cuenta escribinos a hola@ganancia.app")}
          className="px-4 py-2 border border-red-300 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Eliminar restaurante
        </button>
      </div>
    </div>
  )
}
