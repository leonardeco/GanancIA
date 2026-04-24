"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, DollarSign, Users, Percent, ArrowUp, ArrowDown, Minus } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useRestaurantStore } from "@/store/restaurant"
import { DateRangePicker, presetToRange } from "@/components/date-range-picker"
import { DEMO_KPIS, DEMO_CHART, DEMO_TOP_ITEMS } from "@/lib/mock-data"
import type { KPIs, RevenueDataPoint, TopItem } from "@ganancia/shared"
import type { Preset, DateRange } from "@/components/date-range-picker"
import { cn } from "@/lib/utils"

const DEMO_TOKEN = "demo-token"

function fmt(n: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

function DeltaBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null
  const positive = value >= 0
  const Icon = positive ? ArrowUp : ArrowDown
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium",
      positive ? "text-emerald-500" : "text-red-400"
    )}>
      <Icon size={10} />
      {Math.abs(value)}%
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  delta,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  delta?: number | null
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-carbon">{value}</p>
      <div className="flex items-center gap-2 mt-1 h-4">
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
        <DeltaBadge value={delta} />
      </div>
    </div>
  )
}

function MarginBadge({ pct }: { pct: number }) {
  if (pct >= 60) return <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium"><ArrowUp size={11} />{pct}%</span>
  if (pct >= 40) return <span className="flex items-center gap-0.5 text-xs text-yellow-500 font-medium"><Minus size={11} />{pct}%</span>
  return <span className="flex items-center gap-0.5 text-xs text-red-400 font-medium"><ArrowDown size={11} />{pct}%</span>
}

export default function DashboardPage() {
  const { activeRestaurant } = useRestaurantStore()
  const token = useAuthStore((s) => s.token)
  const isDemo = token === DEMO_TOKEN

  const [preset, setPreset] = useState<Preset>("month")
  const [range, setRange] = useState<DateRange>(presetToRange("month"))
  const [kpis, setKpis] = useState<KPIs | null>(isDemo ? DEMO_KPIS : null)
  const [chart, setChart] = useState<RevenueDataPoint[]>(isDemo ? DEMO_CHART : [])
  const [topItems, setTopItems] = useState<TopItem[]>(isDemo ? DEMO_TOP_ITEMS : [])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!activeRestaurant || isDemo) return
    setLoading(true)
    try {
      const params = { restaurantId: activeRestaurant.id, from: range.from, to: range.to }
      const [kpisData, chartData, topData] = await Promise.all([
        api.analytics.kpis(params),
        api.analytics.revenueChart(params),
        api.analytics.topItems({ ...params, limit: 5 }),
      ])
      setKpis(kpisData as KPIs)
      setChart(chartData as RevenueDataPoint[])
      setTopItems(topData as TopItem[])
    } catch {
      // empty state shown
    } finally {
      setLoading(false)
    }
  }, [activeRestaurant, range, isDemo])

  useEffect(() => { load() }, [load])

  function handleRangeChange(p: Preset, r: DateRange) {
    setPreset(p)
    setRange(r)
  }

  const currency = activeRestaurant?.currency ?? "USD"
  const d = kpis?.deltas

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-carbon">Dashboard</h2>
          {activeRestaurant && <p className="text-gray-400 text-sm mt-0.5">{activeRestaurant.name}</p>}
        </div>
        {activeRestaurant && (
          <DateRangePicker value={preset} custom={range} onChange={handleRangeChange} />
        )}
      </div>

      {!activeRestaurant && (
        <div className="bg-menta/40 border border-bosque/20 rounded-2xl p-8 text-center">
          <p className="text-bosque font-medium">Seleccioná un restaurante para ver los datos</p>
        </div>
      )}

      {activeRestaurant && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Ingresos"
              value={loading ? "—" : fmt(kpis?.revenue ?? 0, currency)}
              sub={loading ? undefined : `Costo: ${fmt(kpis?.cost ?? 0, currency)}`}
              icon={DollarSign}
              color="bg-bosque"
              delta={loading ? undefined : d?.revenue}
            />
            <KpiCard
              label="Margen bruto"
              value={loading ? "—" : `${kpis?.grossMarginPct ?? 0}%`}
              sub={loading ? undefined : fmt(kpis?.grossMargin ?? 0, currency)}
              icon={Percent}
              color="bg-teal-500"
              delta={loading ? undefined : d?.grossMarginPct}
            />
            <KpiCard
              label="Ticket promedio"
              value={loading ? "—" : fmt(kpis?.ticketAverage ?? 0, currency)}
              icon={TrendingUp}
              color="bg-indigo-500"
              delta={loading ? undefined : d?.ticketAverage}
            />
            <KpiCard
              label="Cubiertos"
              value={loading ? "—" : String(kpis?.covers ?? 0)}
              icon={Users}
              color="bg-orange-400"
              delta={loading ? undefined : d?.covers}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-carbon">Ingresos diarios</h3>
                {d?.revenue !== null && d?.revenue !== undefined && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    (d.revenue ?? 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400"
                  )}>
                    {(d.revenue ?? 0) >= 0 ? "+" : ""}{d.revenue}% vs período anterior
                  </span>
                )}
              </div>
              {loading ? (
                <div className="h-52 flex items-center justify-center text-gray-200 text-sm animate-pulse">Cargando...</div>
              ) : chart.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-gray-300 text-sm">
                  Sin datos para el período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }}
                      formatter={(v: number) => [fmt(v, currency), "Ingresos"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0F6E56" strokeWidth={2} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-carbon mb-4">Top platos</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : topItems.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-300 text-sm text-center">
                  Sin ventas con platos asociados en este período
                </div>
              ) : (
                <div className="space-y-1">
                  {topItems.map((item, idx) => {
                    const maxRevenue = topItems[0].revenue
                    const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                    return (
                      <div key={item.menuItemId} className="py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("text-xs font-bold w-4 shrink-0", idx === 0 ? "text-bosque" : "text-gray-300")}>
                              {idx + 1}
                            </span>
                            <span className="text-sm text-carbon truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <MarginBadge pct={item.margin} />
                            <span className="text-xs text-gray-400">{item.unitsSold} uds.</span>
                          </div>
                        </div>
                        <div className="ml-6 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", idx === 0 ? "bg-bosque" : "bg-gray-200")} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="ml-6 text-xs text-gray-400 mt-0.5">{fmt(item.revenue, currency)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
