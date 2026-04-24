"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, UtensilsCrossed, TrendingUp, LogOut, ChefHat, Sparkles, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { RestaurantSelector } from "./restaurant-selector"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/ventas", label: "Ventas", icon: TrendingUp },
  { href: "/fugas", label: "Fugas", icon: AlertTriangle },
  { href: "/chat", label: "Gana IA", icon: Sparkles },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <aside className="w-56 shrink-0 h-screen bg-carbon flex flex-col border-r border-white/5">
      <div className="px-5 py-6">
        <span className="font-display font-black text-2xl text-white">
          Gananc<span className="text-teal">IA</span>
        </span>
      </div>

      <RestaurantSelector />

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-white/10 text-white font-medium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center">
            <ChefHat size={14} className="text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-white/40 text-xs truncate">{user?.plan}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </aside>
  )
}
