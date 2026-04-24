const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (data: { email: string; name: string; password: string }) =>
      request<{ user: unknown; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: unknown; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    me: () => request<{ user: unknown }>("/auth/me"),
  },
  restaurants: {
    list: () => request<unknown[]>("/restaurants"),
    get: (id: string) => request<unknown>(`/restaurants/${id}`),
    create: (data: { name: string; currency?: string; timezone?: string }) =>
      request<unknown>("/restaurants", { method: "POST", body: JSON.stringify(data) }),
    branches: (id: string) => request<unknown[]>(`/restaurants/${id}/branches`),
    createBranch: (id: string, data: { name: string; address?: string }) =>
      request<unknown>(`/restaurants/${id}/branches`, { method: "POST", body: JSON.stringify(data) }),
  },
  menu: {
    list: (restaurantId: string) => request<unknown[]>(`/menu/restaurants/${restaurantId}/menu`),
    create: (restaurantId: string, data: { name: string; category: string; costPrice: number; salePrice: number }) =>
      request<unknown>(`/menu/restaurants/${restaurantId}/menu`, { method: "POST", body: JSON.stringify(data) }),
    update: (restaurantId: string, itemId: string, data: Partial<{ name: string; category: string; costPrice: number; salePrice: number }>) =>
      request<unknown>(`/menu/restaurants/${restaurantId}/menu/${itemId}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (restaurantId: string, itemId: string) =>
      request<void>(`/menu/restaurants/${restaurantId}/menu/${itemId}`, { method: "DELETE" }),
    simulate: (restaurantId: string, itemId: string, newPrice: number) =>
      request<{
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
      }>(`/menu/restaurants/${restaurantId}/menu/${itemId}/simulate?newPrice=${newPrice}`),
  },
  sales: {
    list: (branchId: string) => request<unknown[]>(`/sales/branches/${branchId}/sales`),
    create: (branchId: string, data: { menuItemId?: string; quantity: number; unitPrice: number; saleDate?: string }) =>
      request<unknown>(`/sales/branches/${branchId}/sales`, { method: "POST", body: JSON.stringify(data) }),
    bulk: (branchId: string, data: Array<{ menuItemId?: string; quantity: number; unitPrice: number; saleDate?: string }>) =>
      request<unknown[]>(`/sales/branches/${branchId}/sales/bulk`, { method: "POST", body: JSON.stringify(data) }),
  },
  analytics: {
    kpis: (params: { restaurantId: string; from?: string; to?: string; branchId?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>)
      return request<unknown>(`/analytics/kpis?${q}`)
    },
    revenueChart: (params: { restaurantId: string; from?: string; to?: string; branchId?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>)
      return request<unknown[]>(`/analytics/revenue-chart?${q}`)
    },
    topItems: (params: { restaurantId: string; from?: string; to?: string; branchId?: string; limit?: number }) => {
      const { limit, ...rest } = params
      const q = new URLSearchParams(rest as Record<string, string>)
      if (limit !== undefined) q.set("limit", String(limit))
      return request<unknown[]>(`/analytics/top-items?${q}`)
    },
  },
  chat: {
    send: (data: { restaurantId: string; messages: Array<{ role: "user" | "assistant"; content: string }> }) =>
      request<{ response: string }>("/chat", { method: "POST", body: JSON.stringify(data) }),
  },
  alerts: {
    list: (restaurantId: string) => request<unknown[]>(`/alerts/restaurants/${restaurantId}`),
    resolve: (restaurantId: string, alertId: string) =>
      request<{ success: boolean; message: string }>(`/alerts/restaurants/${restaurantId}/${alertId}/resolve`, { method: "PUT" }),
  },
  inventory: {
    list: (restaurantId: string) =>
      request<unknown[]>(`/inventory/restaurants/${restaurantId}/inventory`),
    create: (
      restaurantId: string,
      data: { ingredient: string; theoreticalCost: number; realCost: number; date?: string }
    ) =>
      request<unknown>(`/inventory/restaurants/${restaurantId}/inventory`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (restaurantId: string, id: string) =>
      request<void>(`/inventory/restaurants/${restaurantId}/inventory/${id}`, { method: "DELETE" }),
  },
}

export const importApi = {
  sales: (data: { branchId: string; rows: Array<{ date: string; itemName?: string; quantity: number; unitPrice: number }> }) =>
    request<{ inserted: number; matched: number; unmatched: number }>("/import/sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export { ApiError }
