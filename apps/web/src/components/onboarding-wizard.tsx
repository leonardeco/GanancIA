"use client"

import { useState } from "react"
import { Store, MapPin, UtensilsCrossed, CheckCircle2, ArrowRight } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { toast } from "sonner"
import type { Restaurant, Branch } from "@ganancia/shared"

type Step = "restaurant" | "branch" | "menu" | "done"

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "restaurant", label: "Tu restaurante", icon: Store },
  { id: "branch", label: "Primera sucursal", icon: MapPin },
  { id: "menu", label: "Primer plato", icon: UtensilsCrossed },
]

interface Props {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: Props) {
  const { setRestaurants, setActiveRestaurant } = useRestaurantStore()

  const [step, setStep] = useState<Step>("restaurant")
  const [saving, setSaving] = useState(false)

  const [restaurantForm, setRestaurantForm] = useState({ name: "", currency: "USD" })
  const [branchForm, setBranchForm] = useState({ name: "", address: "" })
  const [menuForm, setMenuForm] = useState({ name: "", category: "principal", costPrice: "", salePrice: "" })

  const [createdRestaurant, setCreatedRestaurant] = useState<Restaurant | null>(null)
  const [createdBranch, setCreatedBranch] = useState<Branch | null>(null)

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  async function handleRestaurant(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.restaurants.create(restaurantForm) as Restaurant
      setCreatedRestaurant(r)
      setRestaurants([r])
      setActiveRestaurant(r)
      setStep("branch")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear el restaurante")
    } finally {
      setSaving(false)
    }
  }

  async function handleBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!createdRestaurant) return
    setSaving(true)
    try {
      const b = await api.restaurants.createBranch(createdRestaurant.id, {
        name: branchForm.name,
        address: branchForm.address || undefined,
      }) as Branch
      setCreatedBranch(b)
      setStep("menu")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear la sucursal")
    } finally {
      setSaving(false)
    }
  }

  async function handleMenu(e: React.FormEvent) {
    e.preventDefault()
    if (!createdRestaurant) return
    setSaving(true)
    try {
      await api.menu.create(createdRestaurant.id, {
        name: menuForm.name,
        category: menuForm.category,
        costPrice: Number(menuForm.costPrice),
        salePrice: Number(menuForm.salePrice),
      })
      setStep("done")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar el plato")
    } finally {
      setSaving(false)
    }
  }

  function skipMenu() {
    setStep("done")
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-menta rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-bosque" />
          </div>
          <h2 className="text-2xl font-bold text-carbon mb-2">¡Todo listo!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Tu restaurante está configurado. Ahora podés empezar a cargar ventas y ver tus análisis.
          </p>
          <button
            onClick={onComplete}
            className="w-full bg-bosque text-white rounded-xl py-3 font-semibold hover:bg-bosque/90 transition-colors"
          >
            Ir al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-black text-3xl text-carbon mb-1">
            Gananc<span className="text-bosque">IA</span>
          </h1>
          <p className="text-gray-400 text-sm">Configuremos tu cuenta en 3 pasos</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const done = idx < stepIndex
            const active = s.id === step
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  active ? "bg-bosque text-white" :
                  done ? "bg-menta text-bosque" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  <s.icon size={13} />
                  {s.label}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-px w-4 ${done ? "bg-bosque/30" : "bg-gray-200"}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step: Restaurante */}
        {step === "restaurant" && (
          <form onSubmit={handleRestaurant} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-carbon mb-1">¿Cómo se llama tu restaurante?</h2>
              <p className="text-gray-400 text-sm mb-4">Podés cambiar esto después en configuración.</p>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                autoFocus
                required
                value={restaurantForm.name}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Ej: La Parrilla de Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select
                value={restaurantForm.currency}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, currency: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
              >
                <option value="USD">USD — Dólar</option>
                <option value="ARS">ARS — Peso argentino</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="CLP">CLP — Peso chileno</option>
                <option value="COP">COP — Peso colombiano</option>
                <option value="BRL">BRL — Real brasileño</option>
                <option value="PEN">PEN — Sol peruano</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving || !restaurantForm.name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-bosque text-white rounded-xl py-3 font-semibold hover:bg-bosque/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creando..." : "Continuar"} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step: Sucursal */}
        {step === "branch" && (
          <form onSubmit={handleBranch} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-carbon mb-1">Creá tu primera sucursal</h2>
              <p className="text-gray-400 text-sm mb-4">Las ventas siempre se registran en una sucursal específica.</p>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la sucursal</label>
              <input
                autoFocus
                required
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Ej: Casa central, Sucursal Norte"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección <span className="text-gray-300">(opcional)</span></label>
              <input
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Ej: Av. Corrientes 1234"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !branchForm.name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-bosque text-white rounded-xl py-3 font-semibold hover:bg-bosque/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creando..." : "Continuar"} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step: Menú */}
        {step === "menu" && (
          <form onSubmit={handleMenu} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-carbon mb-1">Agregá tu primer plato</h2>
              <p className="text-gray-400 text-sm mb-4">GanancIA necesita los costos para calcular tu rentabilidad.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del plato</label>
              <input
                autoFocus
                required
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                placeholder="Ej: Milanesa napolitana"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Costo de producción</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={menuForm.costPrice}
                  onChange={(e) => setMenuForm({ ...menuForm, costPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Precio de venta</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={menuForm.salePrice}
                  onChange={(e) => setMenuForm({ ...menuForm, salePrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
                  placeholder="0.00"
                />
              </div>
            </div>
            {menuForm.costPrice && menuForm.salePrice && Number(menuForm.salePrice) > 0 && (
              <div className="bg-menta/40 rounded-xl px-4 py-2.5 text-sm text-bosque font-medium">
                Margen: {Math.round(((Number(menuForm.salePrice) - Number(menuForm.costPrice)) / Number(menuForm.salePrice)) * 1000) / 10}%
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={skipMenu}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
              >
                Omitir por ahora
              </button>
              <button
                type="submit"
                disabled={saving || !menuForm.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-bosque text-white rounded-xl py-3 font-semibold hover:bg-bosque/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : "Finalizar"} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
