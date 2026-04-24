export interface Restaurant {
  id: string
  ownerId: string
  name: string
  currency: string
  timezone: string
  createdAt: string
}

export interface Branch {
  id: string
  restaurantId: string
  name: string
  address?: string
}
