'use client'

import { motion } from 'framer-motion'
import { Users, Check, X } from 'lucide-react'
import { toastManager } from './Toast'

interface DrawOfferProps {
  gameId: string
  drawOfferBy: string | null
  currentUserId: string
  onDrawAccepted: () => void
}

export default function DrawOffer({ gameId, drawOfferBy, currentUserId, onDrawAccepted }: DrawOfferProps) {
  if (!drawOfferBy) return null

  const isMyOffer = String(drawOfferBy) === String(currentUserId)

  const handleAccept = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })
      const data = await res.json()
      if (res.ok) {
        toastManager.success('Ничья принята!')
        onDrawAccepted()
      } else {
        toastManager.error(data.error || 'Ошибка принятия ничьей')
      }
    } catch (error) {
      toastManager.error('Ошибка принятия ничьей')
    }
  }

  const handleDecline = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      })
      const data = await res.json()
      if (res.ok) {
        toastManager.info('Предложение ничьей отклонено')
      } else {
        toastManager.error(data.error || 'Ошибка отклонения ничьей')
      }
    } catch (error) {
      toastManager.error('Ошибка отклонения ничьей')
    }
  }

  if (isMyOffer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-xl p-3 border-2 border-yellow-500/50"
      >
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <Users className="w-4 h-4" />
          <span>Вы предложили ничью. Ожидание ответа...</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-dark rounded-xl p-4 border-2 border-blue-500/50 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-3">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold text-sm">
          Предложение ничьей
        </h3>
      </div>
      <p className="text-gray-300 text-xs mb-3">
        Соперник предлагает ничью
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-semibold"
        >
          <Check className="w-4 h-4" />
          Принять
        </button>
        <button
          onClick={handleDecline}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-semibold"
        >
          <X className="w-4 h-4" />
          Отклонить
        </button>
      </div>
    </motion.div>
  )
}

