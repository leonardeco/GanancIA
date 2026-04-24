import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Restaurant, Branch } from "@ganancia/shared"

interface RestaurantState {
  restaurants: Restaurant[]
  activeRestaurant: Restaurant | null
  activeBranch: Branch | null
  setRestaurants: (restaurants: Restaurant[]) => void
  setActiveRestaurant: (restaurant: Restaurant) => void
  setActiveBranch: (branch: Branch | null) => void
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      restaurants: [],
      activeRestaurant: null,
      activeBranch: null,
      setRestaurants: (restaurants) => set({ restaurants }),
      setActiveRestaurant: (restaurant) => set({ activeRestaurant: restaurant, activeBranch: null }),
      setActiveBranch: (branch) => set({ activeBranch: branch }),
    }),
    {
      name: "ganancia-restaurant",
    }
  )
)
