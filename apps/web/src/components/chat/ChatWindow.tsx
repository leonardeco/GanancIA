"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { api } from "@/lib/api"
import { useRestaurantStore } from "@/store/restaurant"
import { toast } from "sonner"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function ChatWindow() {
  const { activeRestaurant } = useRestaurantStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && activeRestaurant) {
      setMessages([
        {
          role: "assistant",
          content: `¡Hola! Soy Gana, tu asistente de inteligencia artificial para ${activeRestaurant.name}. Analizo tus ventas y costos para darte recomendaciones de rentabilidad. ¿En qué te puedo ayudar hoy?`
        }
      ])
    }
  }, [activeRestaurant, messages.length])

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
        messages: newHistory
      })

      setMessages([...newHistory, { role: "assistant", content: response }])
    } catch (error) {
      console.error(error)
      toast.error("Hubo un problema al conectar con Gana.")
      // Remove the user message if it failed, or add an error message.
      // We'll just leave the user message and let them try again.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden relative">
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
