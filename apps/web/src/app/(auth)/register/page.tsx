"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, ApiError } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import type { User } from "@ganancia/shared"

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.auth.register(form) as { user: User; token: string }
      setAuth(res.user, res.token)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="font-display font-black text-3xl text-carbon mb-1">
          Gananc<span className="text-bosque">IA</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8">Creá tu cuenta gratuita</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/40"
              placeholder="Juan García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/40"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/40"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bosque text-white rounded-lg py-2 text-sm font-semibold hover:bg-bosque/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-bosque font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
