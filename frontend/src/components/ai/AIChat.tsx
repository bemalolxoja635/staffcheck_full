import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, MessageSquare, Loader2 } from 'lucide-react'
import api from '@/api/client'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'ai'
  text: string
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Assalomu alaykum! Men StaffCheck AI yordamchisiman. Sizga qanday yordam bera olaman?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsLoading(true)

    try {
      const res = await api.post('/api/ai/assistant/', { prompt: userMsg })
      setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Kechirasiz, xatolik yuz berdi. Iltimos, qayta urining.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-card border shadow-2xl rounded-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">StaffCheck AI</h3>
                <p className="text-[10px] text-white/70">Onlayn • Gemini 1.5</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-md">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  m.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    m.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none border">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-muted/30">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Savolingizni yozing..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-background border rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-1.5 bg-primary text-white rounded-full disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
