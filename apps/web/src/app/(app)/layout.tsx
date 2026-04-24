"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { useAuthStore } from "@/store/auth"
import { useRestaurantStore } from "@/store/restaurant"
import { api } from "@/lib/api"
import { Toaster } from "sonner"
import type { Restaurant } from "@ganancia/shared"

const DEMO_TOKEN = "demo-token"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const { restaurants, setRestaurants, setActiveRestaurant, activeRestaurant } = useRestaurantStore()
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const isDemo = token === DEMO_TOKEN

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }

    // Demo mode: skip API check, restaurant already set from login
    if (isDemo) {
      setChecking(false)
      return
    }

    async function checkRestaurants() {
      try {
        const data = await api.restaurants.list() as Restaurant[]
        setRestaurants(data)
        if (data.length === 0) {
          setNeedsOnboarding(true)
        } else {
          if (!activeRestaurant) setActiveRestaurant(data[0])
          setNeedsOnboarding(false)
        }
      } catch {
        router.push("/login")
      } finally {
        setChecking(false)
      }
    }

    checkRestaurants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token || checking) return null

  if (needsOnboarding) {
    return (
      <>
        <OnboardingWizard onComplete={() => setNeedsOnboarding(false)} />
        <Toaster richColors position="top-right" />
      </>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
