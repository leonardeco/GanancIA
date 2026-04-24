"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Trash2 } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { api } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { toast } from "sonner"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const STORAGE_KEY = (restaurantId: string) => `ganancia-chat-${restaurantId}`
const MAX_STORED = 40 // maximo de mensajes a persistir

function loadHistory(restaurantId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(restaurantId))
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

function saveHistory(restaurantId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY(restaurantId), JSON.stringify(messages.slice(-MAX_STORED)))
  } catch { /* storage lleno — ignorar */ }
}

export function ChatWindow() {
  const { activeRestaurant } = useRestaurantStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Cargar historial cuando cambia el restaurante activo
  useEffect(() => {
    if (!activeRestaurant) return
    if (initialized.current === activeRestaurant.id) return
    initialized.current = activeRestaurant.id

    const history = loadHistory(activeRestaurant.id)
    if (history.length > 0) {
      setMessages(history)
    } else {
      setMessages([{
        role: "assistant",
        content: `¡Hola! Soy Gana, tu asistente de inteligencia artificial para ${activeRestaurant.name}. Analizo tus ventas y costos para darte recomendaciones de rentabilidad. ¿En qué te puedo ayudar hoy?`,
      }])
    }
  }, [activeRestaurant])

  const clearHistory = useCallback(() => {
    if (!activeRestaurant) return
    localStorage.removeItem(STORAGE_KEY(activeRestaurant.id))
    initialized.current = null
    setMessages([{
      role: "assistant",
      content: `Historial borrado. ¡Empecemos de nuevo! ¿En qué te puedo ayudar con ${activeRestaurant.name}?`,
    }])
  }, [activeRestaurant])

  async function handleSend() {
    if (!input.trim() || !activeRestaurant || isLoading) return

    const userMsg: ChatMessage = { role: "user", content: input.trim() }
    const newHistory = [...messages, userMsg]

    setMessages(newHistory)
    setInput("")
    setIsLoading(true)

    try {
      const { response } = await api.chat.send({
        restaurantId: activeRestaurant.id,
        messages: newHistory,
      })
      const updated = [...newHistory, { role: "assistant" as const, content: response }]
      setMessages(updated)
      saveHistory(activeRestaurant.id, updated)
    } catch (error) {
      console.error(error)
      toast.error("Hubo un problema al conectar con Gana.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden relative">
      {/* Header con boton de limpiar */}
      {activeRestaurant && messages.length > 1 && (
        <div className="flex items-center justify-end px-5 py-2 border-b border-gray-100 bg-white">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} /> Borrar historial
          </button>
        </div>
      )}
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {!activeRestaurant ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Seleccioná un restaurante para chatear con Gana.
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            
            {isLoading && (
              <div className="flex gap-4 w-full mb-6 justify-start">
                <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3.5 shadow-sm">
                  <p className="text-sm text-gray-400">Analizando datos...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !activeRestaurant}
            placeholder="Preguntale a Gana sobre tus ventas, costos o platos estrella..."
            className="w-full bg-gray-50 border border-gray-200 text-carbon text-sm rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-bosque/30 focus:border-bosque/50 disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !activeRestaurant}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-bosque text-white rounded-lg disabled:opacity-50 disabled:hover:bg-bosque hover:bg-bosque/90 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Gana puede cometer errores. Verifica la información financiera importante.
        </p>
      </div>
    </div>
  )
}
