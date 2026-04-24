"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

export type Preset = "today" | "week" | "month" | "quarter" | "custom"

export interface DateRange {
  from: string
  to: string
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "quarter", label: "Este trimestre" },
  { id: "custom", label: "Personalizado" },
]

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function presetToRange(preset: Preset, custom?: DateRange): DateRange {
  const now = new Date()
  const today = toISO(now)

  if (preset === "today") return { from: today, to: today }

  if (preset === "week") {
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((day + 6) % 7))
    return { from: toISO(monday), to: today }
  }

  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toISO(first), to: today }
  }

  if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3)
    const first = new Date(now.getFullYear(), q * 3, 1)
    return { from: toISO(first), to: today }
  }

  return custom ?? { from: today, to: today }
}

interface Props {
  value: Preset
  custom: DateRange
  onChange: (preset: Preset, range: DateRange) => void
}

export function DateRangePicker({ value, custom, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [draft, setDraft] = useState(custom)

  function selectPreset(preset: Preset) {
    if (preset === "custom") {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onChange(preset, presetToRange(preset))
  }

  function applyCustom() {
    setShowCustom(false)
    onChange("custom", draft)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p.id)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              value === p.id
                ? "bg-white text-carbon shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {(value === "custom" || showCustom) && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
          <CalendarDays size={13} className="text-gray-400" />
          <input
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className="text-xs border-none outline-none text-carbon w-28"
          />
          <span className="text-gray-300">—</span>
          <input
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            className="text-xs border-none outline-none text-carbon w-28"
          />
          <button
            onClick={applyCustom}
            className="ml-1 text-xs bg-bosque text-white px-2 py-0.5 rounded-lg hover:bg-bosque/90"
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
