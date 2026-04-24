"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { importApi, ApiError } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Branch } from "@ganancia/shared"

interface ParsedRow {
  date: string
  itemName?: string
  quantity: number
  unitPrice: number
  _raw: string
  _error?: string
}

// Try to detect column positions from header row
function detectColumns(headers: string[]): { date: number; itemName: number; quantity: number; unitPrice: number } | null {
  const h = headers.map((s) => s.toLowerCase().trim())
  const find = (...keys: string[]) => h.findIndex((col) => keys.some((k) => col.includes(k)))

  const date = find("fecha", "date", "día", "dia")
  const itemName = find("plato", "item", "producto", "descripcion", "descripción", "nombre")
  const quantity = find("cantidad", "qty", "quantity", "cant")
  const unitPrice = find("precio", "price", "importe", "valor", "unit")

  if (date === -1 || quantity === -1 || unitPrice === -1) return null
  return { date, itemName, quantity, unitPrice }
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const sep = lines[0].includes(";") ? ";" : ","
  const headers = lines[0].split(sep)
  const cols = detectColumns(headers)

  if (!cols) return []

  return lines.slice(1).map((line) => {
    const cells = line.split(sep)
    const dateRaw = cells[cols.date]?.trim() ?? ""
    const itemName = cols.itemName >= 0 ? cells[cols.itemName]?.trim() : undefined
    const quantityRaw = cells[cols.quantity]?.trim().replace(",", ".") ?? "0"
    const priceRaw = cells[cols.unitPrice]?.trim().replace(",", ".").replace(/[^0-9.]/g, "") ?? "0"

    const quantity = parseInt(quantityRaw, 10)
    const unitPrice = parseFloat(priceRaw)

    const errors: string[] = []
    if (!dateRaw) errors.push("fecha vacía")
    if (isNaN(quantity) || quantity <= 0) errors.push("cantidad inválida")
    if (isNaN(unitPrice) || unitPrice <= 0) errors.push("precio inválido")

    // Normalize date to YYYY-MM-DD
    let date = dateRaw
    const ddmm = dateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (ddmm) {
      const [, d, m, y] = ddmm
      const year = y.length === 2 ? `20${y}` : y
      date = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    }

    return {
      date,
      itemName: itemName || undefined,
      quantity: isNaN(quantity) ? 0 : quantity,
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      _raw: line,
      _error: errors.length > 0 ? errors.join(", ") : undefined,
    }
  })
}

interface Props {
  branches: Branch[]
  onSuccess: () => void
}

export function CsvImport({ branches, onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? "")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ inserted: number; matched: number; unmatched: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validRows = rows.filter((r) => !r._error)
  const errorRows = rows.filter((r) => r._error)

  function processFile(file: File) {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Solo se aceptan archivos CSV o TXT")
      return
    }
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        toast.error("No se pudieron detectar columnas. Verificá que el CSV tenga encabezados: fecha, cantidad, precio")
        return
      }
      setRows(parsed)
    }
    reader.readAsText(file, "UTF-8")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    if (!selectedBranch || validRows.length === 0) return
    setImporting(true)
    try {
      const res = await importApi.sales({
        branchId: selectedBranch,
        rows: validRows.map((r) => ({
          date: r.date,
          itemName: r.itemName,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
        })),
      })
      setResult(res)
      toast.success(`${res.inserted} ventas importadas`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al importar")
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setRows([])
    setFileName("")
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      {/* Branch selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal destino</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/30"
        >
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors",
              dragging ? "border-bosque bg-menta/20" : "border-gray-200 hover:border-bosque/40 hover:bg-gray-50"
            )}
          >
            <Upload size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Arrastrá tu CSV aquí o hacé click</p>
            <p className="text-xs text-gray-400 mt-1">Columnas requeridas: <code className="bg-gray-100 px-1 rounded">fecha</code> <code className="bg-gray-100 px-1 rounded">cantidad</code> <code className="bg-gray-100 px-1 rounded">precio</code></p>
            <p className="text-xs text-gray-400 mt-0.5">Opcional: <code className="bg-gray-100 px-1 rounded">plato</code> para cruzar con tu menú</p>
          </div>
          <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />

          {/* Template download hint */}
          <p className="text-xs text-gray-400 text-center">
            Formato esperado: separador coma o punto y coma, primera fila con encabezados
          </p>
        </>
      )}

      {/* Preview */}
      {rows.length > 0 && !result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-bosque" />
              <span className="text-sm font-medium text-carbon">{fileName}</span>
              <span className="text-xs text-gray-400">{rows.length} filas</span>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          {errorRows.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">
                <strong>{errorRows.length} fila(s) con errores</strong> serán ignoradas en la importación.
              </p>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Fecha</span><span>Plato</span><span className="text-right">Cant.</span><span className="text-right">Precio</span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {rows.slice(0, 100).map((row, i) => (
                <div key={i} className={cn(
                  "grid grid-cols-4 gap-2 px-4 py-2 text-xs border-t border-gray-50",
                  row._error ? "bg-red-50 text-red-400" : "text-gray-600"
                )}>
                  <span>{row.date}</span>
                  <span className="truncate">{row.itemName ?? <span className="text-gray-300">—</span>}</span>
                  <span className="text-right">{row.quantity}</span>
                  <span className="text-right">${row.unitPrice}</span>
                </div>
              ))}
              {rows.length > 100 && (
                <p className="text-xs text-gray-400 text-center py-2">… y {rows.length - 100} filas más</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="flex-1 bg-bosque text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-bosque/90 disabled:opacity-50"
            >
              {importing ? "Importando..." : `Importar ${validRows.length} ventas`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-menta/30 border border-bosque/20 rounded-2xl p-6 text-center">
          <CheckCircle2 size={28} className="text-bosque mx-auto mb-3" />
          <p className="font-semibold text-carbon">{result.inserted} ventas importadas</p>
          <p className="text-sm text-gray-500 mt-1">
            {result.matched} cruzadas con platos del menú · {result.unmatched} sin cruzar
          </p>
          <button onClick={reset} className="mt-4 text-xs text-bosque hover:underline">
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
