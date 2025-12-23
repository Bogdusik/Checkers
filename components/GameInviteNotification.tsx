'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, X, Check, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameInvite {
  id: string
  fromUser: {
    id: string
    username: string
    email: string
  }
  createdAt: string
  expiresAt: string
}

interface GameInviteNotificationProps {
  userId: string
}

export default function GameInviteNotification({ userId }: GameInviteNotificationProps) {
  const [invites, setInvites] = useState<GameInvite[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!userId) return

    const fetchInvites = async () => {
      try {
        const res = await fetch('/api/game/invite/list', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const data = await res.json()
        if (data.invites) {
          setInvites(data.invites)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error fetching invites:', error)
      }
    }

    fetchInvites()
    // Poll every 2 seconds for new invites
    const interval = setInterval(fetchInvites, 2000)

    return () => clearInterval(interval)
  }, [userId])

  const handleAccept = async (inviteId: string) => {
    try {
      const res = await fetch('/api/game/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId })
      })
      const data = await res.json()
      if (data.game) {
        // Remove accepted invite
        setInvites(prev => prev.filter(inv => inv.id !== inviteId))
        // Navigate to game
        router.push(`/game?id=${data.game.id}`)
      } else {
        alert(data.error || 'Ошибка принятия приглашения')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error accepting invite:', error)
      alert('Ошибка принятия приглашения')
    }
  }

  const handleDecline = async (inviteId: string) => {
    try {
      await fetch('/api/game/invite/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId })
      })
      // Remove declined invite
      setInvites(prev => prev.filter(inv => inv.id !== inviteId))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error declining invite:', error)
    }
  }

  if (invites.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {invites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="glass-dark rounded-xl p-4 border-2 border-blue-500/50 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm mb-1">
                  Приглашение в игру
                </h3>
                <p className="text-gray-300 text-xs mb-3">
                  {invite.fromUser.username} приглашает вас сыграть
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-semibold"
                  >
                    <Check className="w-4 h-4" />
                    Принять
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    Отклонить
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDecline(invite.id)}
                className="p-1 hover:bg-black/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

