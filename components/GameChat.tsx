'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send } from 'lucide-react'

interface Message {
  id: string
  message: string
  createdAt: string
  user: {
    id: string
    username: string
  }
}

interface GameChatProps {
  gameId: string
  currentUserId: string
}

export default function GameChat({ gameId, currentUserId }: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}/chat`, { cache: 'no-store' })
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      // Silently fail
    }
  }

  useEffect(() => {
    if (!gameId) return

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)

    return () => clearInterval(interval)
  }, [gameId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const res = await fetch(`/api/game/${gameId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages()
        inputRef.current?.focus()
      }
    } catch (error) {
      // Silently fail
    }
  }

  if (!isExpanded) {
    return (
      <motion.button
        onClick={() => setIsExpanded(true)}
        className="glass-dark rounded-xl p-3 border-2 border-blue-500/50 hover:border-blue-400 transition-all"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <span className="text-white text-sm font-semibold">Чат</span>
          {messages.length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {messages.length}
            </span>
          )}
        </div>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-2xl p-4 sm:p-6 flex flex-col h-64 sm:h-80"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Чат
        </h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Свернуть
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            Нет сообщений. Начните общение!
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = String(msg.user.id) === String(currentUserId)
            return (
              <div
                key={msg.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    isMyMessage
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-gray-700/50 text-gray-300'
                  }`}
                >
                  {!isMyMessage && (
                    <div className="text-xs font-semibold mb-1 text-blue-400">
                      {msg.user.username}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          maxLength={500}
          className="flex-1 px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  )
}

