"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronDown, Plus, Store } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { api, ApiError } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { toast } from "sonner"
import type { Restaurant } from "@ganancia/shared"
import { cn } from "@/lib/utils"

export function RestaurantSelector() {
  const { restaurants, activeRestaurant, setRestaurants, setActiveRestaurant } = useRestaurantStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  const load = useCallback(async () => {
    try {
      const data = await api.restaurants.list()
      const list = data as Restaurant[]
      setRestaurants(list)
      if (!activeRestaurant && list.length > 0) setActiveRestaurant(list[0])
    } catch { /* ignore on initial load */ }
  }, [activeRestaurant, setRestaurants, setActiveRestaurant])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      const r = await api.restaurants.create({ name: newName.trim() })
      toast.success("Restaurante creado")
      setNewName("")
      setCreating(false)
      await load()
      setActiveRestaurant(r as Restaurant)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear")
    }
  }

  return (
    <div className="px-3 mb-3">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
            <Store size={14} className="shrink-0" />
            <span className="flex-1 text-left truncate">{activeRestaurant?.name ?? "Sin restaurante"}</span>
            <ChevronDown size={12} className="shrink-0 text-white/40" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 py-1 text-sm"
            sideOffset={4}
            align="start"
          >
            {restaurants.map((r) => (
              <DropdownMenu.Item
                key={r.id}
                className={cn(
                  "px-3 py-2 cursor-pointer outline-none",
                  r.id === activeRestaurant?.id
                    ? "bg-menta/60 text-bosque font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                onSelect={() => setActiveRestaurant(r)}
              >
                {r.name}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
            {creating ? (
              <div className="px-3 py-2 flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false) }}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-bosque/30"
                  placeholder="Nombre del restaurante"
                />
                <button onClick={handleCreate} className="px-2 py-1 bg-bosque text-white rounded-lg text-xs">OK</button>
              </div>
            ) : (
              <DropdownMenu.Item
                className="px-3 py-2 flex items-center gap-2 text-bosque hover:bg-menta/30 cursor-pointer outline-none"
                onSelect={() => setCreating(true)}
              >
                <Plus size={12} /> Nuevo restaurante
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
