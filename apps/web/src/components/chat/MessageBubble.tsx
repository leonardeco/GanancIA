import { ChefHat, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === "assistant"

  return (
    <div className={cn("flex gap-4 w-full mb-6", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0">
          <ChefHat size={16} className="text-white" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
        isAssistant 
          ? "bg-white border border-gray-100 text-carbon rounded-tl-none shadow-sm"
          : "bg-bosque text-white rounded-tr-none"
      )}>
        {/* Usamos pre-wrap para que se respeten los saltos de línea de la IA */}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-carbon flex items-center justify-center shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  )
}
