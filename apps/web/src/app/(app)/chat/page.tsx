import { ChatWindow } from "@/components/chat/ChatWindow"
import { Sparkles } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full p-4 lg:p-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
          <Sparkles size={20} className="text-teal" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-carbon">Gana IA</h2>
          <p className="text-gray-400 text-sm mt-0.5">Tu asistente de rentabilidad gastronómica</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  )
}
