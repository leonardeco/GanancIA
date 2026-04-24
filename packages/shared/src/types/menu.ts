export type MenuCategory = "estrella" | "puzzle" | "caballo" | "perro"

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  margin: number
  unitsSold: number
  bcgCategory?: MenuCategory
}
